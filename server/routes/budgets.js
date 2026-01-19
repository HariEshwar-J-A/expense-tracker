const express = require("express");
const router = express.Router();
const Budget = require("../database/models/Budget");
const authenticateToken = require("../middleware/auth");

/**
 * GET /api/budgets
 * Get all budget limits for the current user
 */
router.get("/", authenticateToken, async (req, res) => {
    try {
        const budgets = await Budget.findAllByUser(req.user.id);
        res.json(budgets);
    } catch (error) {
        console.error("Error fetching budgets:", error);
        res.status(500).json({ message: "Failed to fetch budgets" });
    }
});

/**
 * POST /api/budgets
 * Set (Upsert) a budget limit for a category
 * Body: { category: "Food", amount: 200 }
 */
router.post("/", authenticateToken, async (req, res) => {
    try {
        const { category, amount } = req.body;

        if (!category || amount === undefined) {
            return res.status(400).json({ message: "Category and amount required" });
        }

        const value = parseFloat(amount);
        if (isNaN(value) || value < 0) {
            return res.status(400).json({ message: "Invalid amount" });
        }

        await Budget.upsert(req.user.id, category, value);

        // Return updated list for convenience
        const allBudgets = await Budget.findAllByUser(req.user.id);
        res.json(allBudgets);
    } catch (error) {
        console.error("Error saving budget:", error);
        res.status(500).json({ message: "Failed to save budget" });
    }
});

/**
 * DELETE /api/budgets/:category
 * Remove a budget limit
 */
router.delete("/:category", authenticateToken, async (req, res) => {
    try {
        const { category } = req.params;
        await Budget.delete(req.user.id, category);
        res.json({ message: "Budget deleted" });
    } catch (error) {
        console.error("Error deleting budget:", error);
        res.status(500).json({ message: "Failed to delete budget" });
    }
});

/**
 * POST /api/budgets/reset-all
 * Reset all category budgets to 0 for the current user
 */
router.post("/reset-all", authenticateToken, async (req, res) => {
    try {
        const budgets = await Budget.findAllByUser(req.user.id);

        // Delete all budgets for this user
        for (const budget of budgets) {
            await Budget.delete(req.user.id, budget.category);
        }

        res.json({ message: "All category limits reset" });
    } catch (error) {
        console.error("Error resetting budgets:", error);
        res.status(500).json({ message: "Failed to reset budgets" });
    }
});

module.exports = router;
