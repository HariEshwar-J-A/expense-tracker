import { useState, useEffect, useRef, useId } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  MenuItem,
  InputAdornment,
  Box,
  CircularProgress,
} from "@mui/material";
import { getTodayDateString } from "../utils/dateHelpers";
import { UploadFile as UploadFileIcon } from "@mui/icons-material";
import axios from "axios";

const CATEGORIES = [
  "Food",
  "Transport",
  "Utilities",
  "Entertainment",
  "Health",
  "Other",
];

const ExpenseForm = ({ open, handleClose, handleSubmit, initialData }) => {
  const [formData, setFormData] = useState({
    amount: "",
    date: getTodayDateString(),
    vendor: "",
    category: "Other",
  });
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const formId = useId();

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        date: initialData.date.split("T")[0],
      });
    } else {
      setFormData({
        amount: "",
        date: getTodayDateString(),
        vendor: "",
        category: "Other",
      });
    }
  }, [initialData, open]);

  const onSubmit = (e) => {
    e.preventDefault();
    handleSubmit(formData);
  };

  // Ref to hold the abort controller
  const abortControllerRef = useRef(null);

  // Cleanup on unmount or when dialog closes
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Abort previous request if any
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new controller
    abortControllerRef.current = new AbortController();

    setUploading(true);
    const uploadData = new FormData();
    uploadData.append("receipt", file);

    try {
      const res = await axios.post("/api/expenses/parse", uploadData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        signal: abortControllerRef.current.signal, // Connect signal
      });

      const { vendor, date, amount, category, isDuplicate } = res.data;

      // Check for duplicate
      if (isDuplicate) {
        const proceed = window.confirm(
          `⚠️ Potential Duplicate Found!\n\nA similar expense already exists:\nVendor: ${vendor}\nAmount: $${amount}\nDate: ${date}\n\nDo you want to proceed with this receipt?`,
        );

        if (!proceed) {
          setUploading(false);
          if (fileInputRef.current) fileInputRef.current.value = "";
          return;
        }
      }

      // Build feedback message
      const extracted = [];
      const missing = [];

      if (vendor) extracted.push(`✓ Vendor: "${vendor}"`);
      else missing.push("Vendor");

      if (amount) extracted.push(`✓ Amount: $${amount}`);
      else missing.push("Amount");

      if (date) extracted.push(`✓ Date: ${date}`);
      else missing.push("Date");

      setFormData((prev) => ({
        ...prev,
        vendor: vendor || prev.vendor,
        date: date || prev.date,
        amount: amount || prev.amount,
        category: category || prev.category,
      }));

      // Show detailed feedback
      let message = "📄 Receipt scanned!\n\n";
      if (extracted.length > 0) {
        message += "Extracted:\n" + extracted.join("\n") + "\n\n";
      }
      if (missing.length > 0) {
        message += "⚠️ Could not find: " + missing.join(", ") + "\n";
        message += "Please fill in manually.";
      } else {
        message += "Please review and save!";
      }

      alert(message);
    } catch (error) {
      if (axios.isCancel(error)) {
        console.log("Request canceled", error.message);
        return; // gracefully exit
      }

      console.error("❌ PDF parsing failed:", error);
      const errorMsg =
        error.response?.data?.message || error.message || "Unknown error";
      alert(
        `Failed to scan receipt:\n${errorMsg}\n\nPlease fill in the form manually.`,
      );
    } finally {
      // Only reset if not cancelled (conflict with unmount)
      if (!abortControllerRef.current?.signal.aborted) {
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="xs">
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          {initialData ? "Edit Expense" : "New Expense"}
          {!initialData && (
            <>
              <input
                type="file"
                accept="application/pdf,image/png,image/jpeg,image/jpg"
                hidden
                ref={fileInputRef}
                onChange={handleFileChange}
              />
              <Button
                startIcon={
                  uploading ? (
                    <CircularProgress size={20} />
                  ) : (
                    <UploadFileIcon />
                  )
                }
                variant="outlined"
                size="small"
                disabled={uploading}
                onClick={() => fileInputRef.current.click()}
              >
                {uploading ? "Scanning..." : "Scan Receipt"}
              </Button>
            </>
          )}
        </Box>
      </DialogTitle>
      <form onSubmit={onSubmit}>
        <DialogContent>
          <TextField
            id={`${formId}-amount`}
            name="amount"
            margin="dense"
            label="Amount"
            type="number"
            fullWidth
            required
            placeholder="0.00"
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">CAD $</InputAdornment>
                ),
              },
            }}
            value={formData.amount}
            onChange={(e) =>
              setFormData({ ...formData, amount: e.target.value })
            }
          />
          <TextField
            id={`${formId}-vendor`}
            name="vendor"
            margin="dense"
            label="Vendor"
            type="text"
            fullWidth
            required
            placeholder="e.g. Walmart, Uber"
            value={formData.vendor}
            onChange={(e) =>
              setFormData({ ...formData, vendor: e.target.value })
            }
          />
          <TextField
            id={`${formId}-category`}
            name="category"
            margin="dense"
            label="Category"
            select
            fullWidth
            required
            value={formData.category}
            onChange={(e) =>
              setFormData({ ...formData, category: e.target.value })
            }
          >
            {CATEGORIES.map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            id={`${formId}-date`}
            name="date"
            margin="dense"
            label="Date"
            type="date"
            fullWidth
            required
            slotProps={{ inputLabel: { shrink: true } }}
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button type="submit" variant="contained">
            Save
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default ExpenseForm;
