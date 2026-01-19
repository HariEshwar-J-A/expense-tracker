import { useState, useEffect } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Box,
    Typography,
    InputAdornment,
    IconButton,
    Alert,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import axios from "axios";

const CATEGORIES = [
    "Food",
    "Transport",
    "Utilities",
    "Entertainment",
    "Health",
    "Housing",
    "Education",
    "Shopping",
    "Other",
];

const BudgetManager = ({ open, onClose, onSave, totalBudget = 0 }) => {
    const [budgets, setBudgets] = useState({});
    const [loading, setLoading] = useState(false);

    // Calculate total allocated across all categories
    const totalAllocated = Object.values(budgets).reduce((sum, val) => {
        const amount = parseFloat(val) || 0;
        return sum + amount;
    }, 0);

    const isOverBudget = totalBudget > 0 && totalAllocated > totalBudget;
    const hasNoBudget = !totalBudget || totalBudget <= 0;

    // Load existing budgets when dialog opens
    useEffect(() => {
        if (open) {
            loadBudgets();
        }
    }, [open]);

    const loadBudgets = async () => {
        try {
            setLoading(true);
            const res = await axios.get("/api/budgets");
            // Transform array to object { Category: Amount }
            const budgetMap = {};
            res.data.forEach((b) => {
                budgetMap[b.category] = b.amount;
            });
            setBudgets(budgetMap);
        } catch (error) {
            console.error("Failed to load budgets", error);
        } finally {
            setLoading(false);
        }
    };

    const handleBudgetChange = (category, value) => {
        setBudgets((prev) => ({
            ...prev,
            [category]: value,
        }));
    };

    const saveBudget = async (category, amount) => {
        try {
            if (!amount || amount <= 0) return;
            await axios.post("/api/budgets", { category, amount });
        } catch (error) {
            console.error(`Failed to save budget for ${category}`, error);
        }
    };

    const deleteBudget = async (category) => {
        try {
            await axios.delete(`/api/budgets/${category}`);
            setBudgets((prev) => {
                const next = { ...prev };
                delete next[category];
                return next;
            });
        } catch (error) {
            console.error(`Failed to delete budget for ${category}`, error);
        }
    };

    const handleSaveAll = async () => {
        // Save all modified budgets
        // Note: ideally we'd have a bulk update endpoint, but concurrent calls work for intended scale
        const promises = Object.entries(budgets).map(([cat, amt]) => {
            if (amt && amt > 0) {
                return saveBudget(cat, amt);
            }
            return Promise.resolve();
        });

        await Promise.all(promises);
        onSave(); // Callback to refresh dashboard
        onClose();
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle>Monthly Category Limits 📉</DialogTitle>
            <DialogContent>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                    Set monthly spending limits for each category. Set to 0 to remove.
                </Typography>

                {/* Budget Allocation Summary */}
                <Box sx={{
                    mb: 3,
                    p: 2,
                    borderRadius: 2,
                    bgcolor: hasNoBudget ? 'action.hover' : (isOverBudget ? 'error.main' : 'success.main'),
                    color: hasNoBudget ? 'text.primary' : 'white',
                    opacity: hasNoBudget ? 0.6 : 1
                }}>
                    <Typography variant="overline" display="block" sx={{ opacity: 0.9 }}>
                        Budget Allocation
                    </Typography>
                    <Typography variant="h5" fontWeight="bold">
                        ${totalAllocated.toFixed(0)} / ${totalBudget.toFixed(0)}
                    </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.9 }}>
                        {hasNoBudget
                            ? 'No monthly budget set'
                            : isOverBudget
                                ? `Over budget by $${(totalAllocated - totalBudget).toFixed(0)}`
                                : `Remaining: $${(totalBudget - totalAllocated).toFixed(0)}`
                        }
                    </Typography>
                </Box>

                {/* Warning Alerts */}
                {hasNoBudget && (
                    <Alert severity="info" sx={{ mb: 2 }}>
                        Set your monthly budget first to track category limits effectively.
                    </Alert>
                )}

                {isOverBudget && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        <strong>Category limits exceed your budget!</strong>
                        <br />
                        Please reduce category limits or increase your monthly budget to continue.
                    </Alert>
                )}

                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    {CATEGORIES.map((cat) => (
                        <Box
                            key={cat}
                            sx={{ display: "flex", alignItems: "center", gap: 2 }}
                        >
                            <Typography sx={{ width: 120, fontWeight: "bold" }}>
                                {cat}
                            </Typography>
                            <TextField
                                type="number"
                                size="small"
                                fullWidth
                                placeholder="No Limit"
                                value={budgets[cat] || ""}
                                onChange={(e) => handleBudgetChange(cat, e.target.value)}
                                slotProps={{
                                    input: {
                                        startAdornment: (
                                            <InputAdornment position="start">$</InputAdornment>
                                        ),
                                    },
                                }}
                            />
                            {budgets[cat] && (
                                <IconButton
                                    color="error"
                                    onClick={() => deleteBudget(cat)}
                                    size="small"
                                >
                                    <DeleteIcon />
                                </IconButton>
                            )}
                        </Box>
                    ))}
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button
                    onClick={handleSaveAll}
                    variant="contained"
                    disabled={isOverBudget}
                >
                    Save Limits
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default BudgetManager;
