const express = require('express');
const router = express.Router();
const { expenses } = require('../data');
const auth = require('../middleware/auth');

// GET /api/expenses/stats (Must be before /:id)
router.get('/stats', auth, (req, res) => {
    try {
        const userId = req.user.id;
        const userExpenses = expenses.filter(e => e.userId === userId);

        // Category Totals
        const categoryStats = userExpenses.reduce((acc, curr) => {
            acc[curr.category] = (acc[curr.category] || 0) + Number(curr.amount);
            return acc;
        }, {});

        // Daily Totals (Last 30 days)
        const dailyStats = userExpenses.reduce((acc, curr) => {
            const date = curr.date.split('T')[0];
            acc[date] = (acc[date] || 0) + Number(curr.amount);
            return acc;
        }, {});

        res.json({ categoryStats, dailyStats });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /api/expenses
router.get('/', auth, (req, res) => {
    try {
        const { category, startDate, endDate, page = 1, limit = 10 } = req.query;
        const userId = req.user.id;

        let filtered = expenses.filter(e => e.userId === userId);

        // Filter by Category
        if (category) {
            filtered = filtered.filter(e => e.category === category);
        }

        // Filter by Date Range
        if (startDate) {
            filtered = filtered.filter(e => new Date(e.date) >= new Date(startDate));
        }
        if (endDate) {
            filtered = filtered.filter(e => new Date(e.date) <= new Date(endDate));
        }

        // Sort by Date (Desc)
        filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

        // Totals Calculation (before pagination)
        const totalAmount = filtered.reduce((sum, e) => sum + Number(e.amount), 0);

        // Pagination
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const startIndex = (pageNum - 1) * limitNum;
        const endIndex = startIndex + limitNum;

        const paginatedResults = filtered.slice(startIndex, endIndex);

        res.json({
            data: paginatedResults,
            meta: {
                total: filtered.length,
                totalAmount,
                page: pageNum,
                limit: limitNum,
                totalPages: Math.ceil(filtered.length / limitNum)
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// POST /api/expenses
router.post('/', auth, (req, res) => {
    try {
        const { amount, date, vendor, category } = req.body;

        if (!amount || !date || !vendor || !category) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const newExpense = {
            id: Date.now().toString(),
            userId: req.user.id,
            amount: Number(amount),
            date,
            vendor,
            category
        };

        expenses.unshift(newExpense); // Add to top

        res.status(201).json(newExpense);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// PUT /api/expenses/:id
router.put('/:id', auth, (req, res) => {
    try {
        const { id } = req.params;
        const index = expenses.findIndex(e => e.id === id && e.userId === req.user.id);

        if (index === -1) {
            return res.status(404).json({ message: 'Expense not found' });
        }

        const updatedExpense = {
            ...expenses[index],
            ...req.body,
            id, // Prevent ID change
            userId: req.user.id // Prevent User change
        };

        expenses[index] = updatedExpense;
        res.json(updatedExpense);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// DELETE /api/expenses/:id
router.delete('/:id', auth, (req, res) => {
    try {
        const { id } = req.params;
        const index = expenses.findIndex(e => e.id === id && e.userId === req.user.id);

        if (index === -1) {
            return res.status(404).json({ message: 'Expense not found' });
        }

        expenses.splice(index, 1);
        res.json({ message: 'Expense deleted' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
