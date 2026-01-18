import { useState, useEffect, useRef } from "react";
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

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const uploadData = new FormData();
    uploadData.append("receipt", file);
    const token = localStorage.getItem("token");

    try {
      const res = await axios.post("/api/expenses/parse", uploadData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });



      const { vendor, date, amount, category } = res.data;

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
      console.error("❌ PDF parsing failed:", error);
      const errorMsg =
        error.response?.data?.message || error.message || "Unknown error";
      alert(
        `Failed to scan receipt:\n${errorMsg}\n\nPlease fill in the form manually.`,
      );
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
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
                accept="application/pdf"
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
