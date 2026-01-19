const express = require("express");
const router = express.Router();
const BudgetHistory = require("../database/models/BudgetHistory");
const authenticateToken = require("../middleware/auth");

/**
 * GET /api/budget-history
 * Get user's budget history
 */
router.get("/", authenticateToken, async (req, res) => {
    try {
        const { limit = 12 } = req.query;
        const history = await BudgetHistory.getHistory(req.user.id, parseInt(limit));
        res.json(history);
    } catch (error) {
        console.error("Error fetching budget history:", error);
        res.status(500).json({ message: "Failed to fetch budget history" });
    }
});

/**
 * GET /api/budget-history/trend
 * Get budget trend over last N months
 */
router.get("/trend", authenticateToken, async (req, res) => {
    try {
        const { months = 6 } = req.query;
        const trend = await BudgetHistory.getTrend(req.user.id, parseInt(months));

        // Calculate average
        const total = trend.reduce((sum, record) => sum + record.amount, 0);
        const average = trend.length > 0 ? total / trend.length : 0;

        res.json({
            trend,
            average: parseFloat(average.toFixed(2)),
            count: trend.length,
        });
    } catch (error) {
        console.error("Error fetching budget trend:", error);
        res.status(500).json({ message: "Failed to fetch budget trend" });
    }
});

/**
 * GET /api/budget-history/at-date
 * Get budget effective on a specific date
 */
router.get("/on-date", authenticateToken, async (req, res) => {
    try {
        const { date } = req.query;

        if (!date) {
            return res.status(400).json({ message: "Date parameter required" });
        }

        const budget = await BudgetHistory.getBudgetAtDate(req.user.id, date);
        res.json(budget);
    } catch (error) {
        console.error("Error fetching budget at date:", error);
        res.status(500).json({ message: "Failed to fetch budget" });
    }
});

/**
 * POST /api/budget-history
 * Manually add a budget history record (e.g., backdated entry)
 */
router.post("/", authenticateToken, async (req, res) => {
    try {
        const { amount, effectiveDate, reason } = req.body;

        if (!amount || !effectiveDate) {
            return res.status(400).json({ message: "Amount and effectiveDate required" });
        }

        const record = await BudgetHistory.recordChange(
            req.user.id,
            amount,
            effectiveDate,
            reason
        );

        res.status(201).json(record);
    } catch (error) {
        console.error("Error creating budget history:", error);
        res.status(500).json({ message: "Failed to create budget history" });
    }
});

/**
 * PUT /api/budget-history/:id
 * Update a budget history record
 */
router.put("/:id", authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { amount, effectiveDate, reason } = req.body;

        const updates = {};
        if (amount !== undefined) updates.amount = amount;
        if (effectiveDate !== undefined) updates.effectiveDate = effectiveDate;
        if (reason !== undefined) updates.reason = reason;

        const updated = await BudgetHistory.update(parseInt(id), updates);
        res.json(updated);
    } catch (error) {
        console.error("Error updating budget history:", error);
        res.status(500).json({ message: "Failed to update budget history" });
    }
});

/**
 * DELETE /api/budget-history/:id
 * Delete a budget history record
 */
router.delete("/:id", authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        await BudgetHistory.delete(parseInt(id));
        res.json({ message: "Budget history deleted" });
    } catch (error) {
        console.error("Error deleting budget history:", error);
        res.status(500).json({ message: "Failed to delete budget history" });
    }
});

module.exports = router;
