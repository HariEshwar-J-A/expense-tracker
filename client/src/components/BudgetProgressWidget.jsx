
import { Paper, Typography, Box, LinearProgress, Button } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";

const BudgetProgressWidget = ({ budgets, categorySpend, onEdit, period = "monthly", totalBudget = 0, totalSpent = 0 }) => {
    // Check if any budgets are set
    const hasBudgets = Object.keys(budgets).length > 0;

    // Calculate totals and savings
    const monthlyBudgetLimits = Object.values(budgets).reduce((sum, limit) => sum + parseFloat(limit || 0), 0);
    const displayBudget = period === 'yearly' ? totalBudget * 12 : totalBudget;
    const displayLimits = period === 'yearly' ? monthlyBudgetLimits * 12 : monthlyBudgetLimits;

    const expectedSavings = displayBudget - displayLimits;
    const actualSavings = displayBudget - totalSpent;

    if (!hasBudgets) {
        return (
            <Paper sx={{ p: 2, height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
                <Typography variant="h6" gutterBottom>
                    Smart Budgets 📉
                </Typography>
                <Typography variant="body2" color="textSecondary" align="center" paragraph>
                    Set monthly limits for categories (e.g., Food: $200) to track your spending habits.
                </Typography>
                <Button variant="outlined" startIcon={<EditIcon />} onClick={onEdit}>
                    Set Category Limits
                </Button>
            </Paper>
        );
    }

    // Calculate usage with period-based scaling
    const progressItems = Object.entries(budgets).map(([category, monthlyLimit]) => {
        // Scale limit based on period (monthly limits are stored, multiply by 12 for yearly)
        const displayLimit = period === 'yearly' ? monthlyLimit * 12 : monthlyLimit;

        // Spending data is already aggregated by period from backend
        const spent = categorySpend[category] || 0;

        const percentage = Math.min((spent / displayLimit) * 100, 100);
        const isOver = spent > displayLimit;

        // Determine color
        let color = "success";
        if (percentage > 80) color = "warning";
        if (percentage >= 100) color = "error";

        return { category, limit: displayLimit, spent, percentage, color, isOver };
    });

    return (
        <Paper sx={{ p: 2, height: "100%", overflowY: "auto" }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">Category Limits</Typography>
                <Button size="small" startIcon={<EditIcon />} onClick={onEdit}>
                    Edit
                </Button>
            </Box>

            <Box display="flex" flexDirection="column" gap={2}>
                {progressItems.map((item) => (
                    <Box key={item.category}>
                        <Box display="flex" justifyContent="space-between" mb={0.5}>
                            <Typography variant="body2" fontWeight="bold">
                                {item.category}
                            </Typography>
                            <Typography
                                variant="body2"
                                color={item.isOver ? "error.main" : "text.secondary"}
                            >
                                {`$${item.spent.toFixed(0)} / $${item.limit}`}
                            </Typography>
                        </Box>
                        <LinearProgress
                            variant="determinate"
                            value={item.percentage}
                            color={item.color}
                            sx={{ height: 8, borderRadius: 4 }}
                        />
                    </Box>
                ))}
            </Box>

            {/* Savings Display */}
            {totalBudget > 0 && (
                <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="caption" color="text.secondary" display="block" mb={1.5}>
                        SAVINGS OVERVIEW
                    </Typography>

                    <Box display="flex" gap={2}>
                        {/* Expected Savings */}
                        <Box flex={1} sx={{
                            p: 1.5,
                            borderRadius: 2,
                            bgcolor: 'action.hover',
                            border: '1px solid',
                            borderColor: expectedSavings >= 0 ? 'success.main' : 'error.main'
                        }}>
                            <Typography variant="caption" color="text.secondary" display="block">
                                Expected Savings
                            </Typography>
                            <Typography
                                variant="h6"
                                fontWeight="bold"
                                color={expectedSavings >= 0 ? 'success.main' : 'error.main'}
                            >
                                ${expectedSavings.toFixed(0)}
                            </Typography>
                        </Box>

                        {/* Actual Savings */}
                        <Box flex={1} sx={{
                            p: 1.5,
                            borderRadius: 2,
                            bgcolor: 'action.hover',
                            border: '1px solid',
                            borderColor: actualSavings >= 0
                                ? (actualSavings < displayBudget * 0.1 ? 'warning.main' : 'success.main')
                                : 'error.main'
                        }}>
                            <Typography variant="caption" color="text.secondary" display="block">
                                Actual Savings
                            </Typography>
                            <Typography
                                variant="h6"
                                fontWeight="bold"
                                color={actualSavings >= 0
                                    ? (actualSavings < displayBudget * 0.1 ? 'warning.main' : 'success.main')
                                    : 'error.main'}
                            >
                                ${actualSavings.toFixed(0)}
                            </Typography>
                        </Box>
                    </Box>
                </Box>
            )}
        </Paper>
    );
};

export default BudgetProgressWidget;
