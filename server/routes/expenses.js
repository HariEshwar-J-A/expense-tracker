const express = require('express');
const router = express.Router();
const { expenses } = require('../data');
const auth = require('../middleware/auth');
const { generateExpenseReport } = require('../utils/pdfGenerator');

// GET /api/expenses/export
router.get('/export', auth, (req, res) => {
    try {
        const { category, startDate, endDate, minAmount, maxAmount, sortBy = 'date', order = 'desc' } = req.query;
        let userId = req.user.id;

        let filtered = expenses.filter(expense => expense.userId === userId);

        if (category) filtered = filtered.filter(e => e.category === category);
        if (startDate) filtered = filtered.filter(e => e.date >= startDate);
        if (endDate) filtered = filtered.filter(e => e.date <= endDate);
        if (minAmount) filtered = filtered.filter(e => Number(e.amount) >= Number(minAmount));
        if (maxAmount) filtered = filtered.filter(e => Number(e.amount) <= Number(maxAmount));

        // Sort
        filtered.sort((a, b) => {
            let valA = a[sortBy];
            let valB = b[sortBy];
            if (sortBy === 'amount') {
                valA = Number(valA);
                valB = Number(valB);
            } else if (sortBy === 'date') {
                valA = new Date(valA);
                valB = new Date(valB);
            } else {
                valA = valA.toString().toLowerCase();
                valB = valB.toString().toLowerCase();
            }
            if (valA < valB) return order === 'asc' ? -1 : 1;
            if (valA > valB) return order === 'asc' ? 1 : -1;
            return 0;
        });

        generateExpenseReport(filtered, { category, startDate, endDate }, req.user, res);
    } catch (error) {
        console.error('PDF Export Error:', error);
        res.status(500).json({ message: 'Error generating report' });
    }
});

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

        // Daily Totals (Last 30 days - or all available for simplicity in demo)
        const dailyStats = userExpenses.reduce((acc, curr) => {
            const date = curr.date.split('T')[0];
            acc[date] = (acc[date] || 0) + Number(curr.amount);
            return acc;
        }, {});

        // New KPIs
        const totalSpend = userExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
        const avgTransaction = userExpenses.length > 0 ? totalSpend / userExpenses.length : 0;

        let topCategory = { name: 'N/A', amount: 0 };
        for (const [cat, amount] of Object.entries(categoryStats)) {
            if (amount > topCategory.amount) topCategory = { name: cat, amount };
        }

        const vendorStats = userExpenses.reduce((acc, curr) => {
            acc[curr.vendor] = (acc[curr.vendor] || 0) + Number(curr.amount);
            return acc;
        }, {});

        let topVendor = { name: 'N/A', amount: 0 };
        for (const [ven, amount] of Object.entries(vendorStats)) {
            if (amount > topVendor.amount) topVendor = { name: ven, amount };
        }

        res.json({
            categoryStats,
            dailyStats,
            kpis: {
                totalSpend,
                avgTransaction,
                topCategory,
                topVendor
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /api/expenses
router.get('/', auth, (req, res) => {
    try {
        const { category, startDate, endDate, minAmount, maxAmount, sortBy = 'date', order = 'desc', page = 1, limit = 10 } = req.query;
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

        // Filter by Amount Range
        if (minAmount) {
            filtered = filtered.filter(e => Number(e.amount) >= Number(minAmount));
        }
        if (maxAmount) {
            filtered = filtered.filter(e => Number(e.amount) <= Number(maxAmount));
        }

        // Sorting
        filtered.sort((a, b) => {
            let valA = a[sortBy];
            let valB = b[sortBy];

            // Numeric handling for amount
            if (sortBy === 'amount') {
                valA = Number(valA);
                valB = Number(valB);
            }
            // Date handling
            if (sortBy === 'date') {
                valA = new Date(valA);
                valB = new Date(valB);
            }

            if (valA < valB) return order === 'asc' ? -1 : 1;
            if (valA > valB) return order === 'asc' ? 1 : -1;
            return 0;
        });

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
