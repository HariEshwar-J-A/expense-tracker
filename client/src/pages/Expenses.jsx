import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, Button, Pagination, FormControl, InputLabel, Select, MenuItem, TextField, Collapse, TableSortLabel, InputAdornment } from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon, FilterList as FilterListIcon } from '@mui/icons-material';
import axios from 'axios';
import ExpenseForm from '../components/ExpenseForm';
import { format } from 'date-fns';
import { format } from 'date-fns';
import { formatDateForDisplay } from '../utils/dateHelpers';

import { useAuth } from '../context/AuthContext';

const Expenses = () => {
    const { user } = useAuth();
    const [expenses, setExpenses] = useState([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Filters & Sort State
    const [filters, setFilters] = useState({ category: '', startDate: '', endDate: '', minAmount: '', maxAmount: '' });
    const [sortConfig, setSortConfig] = useState({ sortBy: 'date', order: 'desc' });
    const [showFilters, setShowFilters] = useState(false);

    const [openForm, setOpenForm] = useState(false);
    const [editingExpense, setEditingExpense] = useState(null);

    const fetchExpenses = async () => {
        try {
            const params = {
                page,
                limit: 10,
                ...filters,
                ...sortConfig
            };
            const res = await axios.get('/api/expenses', { params });
            setExpenses(res.data.data);
            setTotalPages(res.data.meta.totalPages);
        } catch (error) {
            console.error('Failed to fetch expenses', error);
        }
    };

    useEffect(() => {
        fetchExpenses();
    }, [page, filters, sortConfig]);

    const handleSort = (property) => {
        const isAsc = sortConfig.sortBy === property && sortConfig.order === 'asc';
        setSortConfig({ sortBy: property, order: isAsc ? 'desc' : 'asc' });
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure?')) {
            await axios.delete(`/api/expenses/${id}`);
            fetchExpenses();
        }
    };

    const handleSave = async (data) => {
        try {
            if (editingExpense) {
                await axios.put(`/api/expenses/${editingExpense.id}`, data);
            } else {
                await axios.post('/api/expenses', data);
            }
            setOpenForm(false);
            setEditingExpense(null);
            fetchExpenses();
        } catch (error) {
            console.error('Error saving expense', error);
        }
    };

    const openEdit = (expense) => {
        setEditingExpense(expense);
        setOpenForm(true);
    };

    const clearFilters = () => {
        setFilters({ category: '', startDate: '', endDate: '', minAmount: '', maxAmount: '' });
    };

    const handleExportPDF = () => {
        const doc = new jsPDF();

        // Title
        doc.setFontSize(18);
        doc.text('Expense Report', 14, 22);

        // Date Range / Filter info
        doc.setFontSize(11);
        doc.text(`Generated on: ${formatDateForDisplay(new Date().toISOString())}`, 14, 30);

        let filterText = 'Filters: ';
        if (filters.category) filterText += `Category: ${filters.category}, `;
        if (filters.startDate) filterText += `Start: ${filters.startDate}, `;
        if (filters.endDate) filterText += `End: ${filters.endDate}`;
        if (filterText === 'Filters: ') filterText += 'None';

        doc.text(filterText, 14, 36);

        // Table
        const tableColumn = ["Date", "Vendor", "Category", "Amount (CAD)"];
        const tableRows = [];

        expenses.forEach(expense => {
            const expenseData = [
                formatDateForDisplay(expense.date),
                expense.vendor,
                expense.category,
                `$${Number(expense.amount).toFixed(2)}`
            ];
            tableRows.push(expenseData);
        });

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 42,
            theme: 'grid',
            styles: { fontSize: 10 },
            headStyles: { fillColor: [108, 99, 255] } // Matches our primary color
        });

        // Total
        const finalY = doc.lastAutoTable.finalY + 10;
        const totalAmount = expenses.reduce((sum, item) => sum + Number(item.amount), 0);
        doc.setFontSize(14);
        doc.text(`Total Spending: $${totalAmount.toFixed(2)}`, 14, finalY);

        // Generate Filename
        const dateStr = formatDateForDisplay(new Date().toISOString()).replace(/, /g, '_').replace(/ /g, '_');
        const username = user?.username || 'User';
        let filename = `${username}_Expenses_${dateStr}`;

        if (filters.category) filename += `_${filters.category}`;
        filename += '.pdf';

        doc.save(filename);
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" fontWeight="bold">Expenses</Typography>
                <Box>
                    <IconButton onClick={() => setShowFilters(!showFilters)} color={showFilters ? 'primary' : 'default'}>
                        <FilterListIcon />
                    </IconButton>
                    <Button variant="outlined" onClick={handleExportPDF} sx={{ ml: 2 }}>
                        Export PDF
                    </Button>
                    <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setEditingExpense(null); setOpenForm(true); }} sx={{ ml: 2 }}>
                        Add Expense
                    </Button>
                </Box>
            </Box>

            <Collapse in={showFilters}>
                <Paper sx={{ p: 2, mb: 3 }}>
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                        <FormControl size="small" sx={{ minWidth: 120 }}>
                            <InputLabel>Category</InputLabel>
                            <Select
                                value={filters.category}
                                label="Category"
                                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                            >
                                <MenuItem value="">All</MenuItem>
                                {['Food', 'Transport', 'Utilities', 'Entertainment', 'Health', 'Other'].map(c => (
                                    <MenuItem key={c} value={c}>{c}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <TextField
                            label="Start Date"
                            type="date"
                            size="small"
                            InputLabelProps={{ shrink: true }}
                            value={filters.startDate}
                            onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                        />
                        <TextField
                            label="End Date"
                            type="date"
                            size="small"
                            InputLabelProps={{ shrink: true }}
                            value={filters.endDate}
                            onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                        />
                        <TextField
                            label="Min Amount"
                            type="number"
                            size="small"
                            placeholder="0"
                            InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
                            value={filters.minAmount}
                            onChange={(e) => setFilters({ ...filters, minAmount: e.target.value })}
                            sx={{ width: 120 }}
                        />
                        <TextField
                            label="Max Amount"
                            type="number"
                            size="small"
                            placeholder="Max"
                            InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
                            value={filters.maxAmount}
                            onChange={(e) => setFilters({ ...filters, maxAmount: e.target.value })}
                            sx={{ width: 120 }}
                        />
                        <Button variant="text" onClick={clearFilters}>
                            Clear Filters
                        </Button>
                    </Box>
                </Paper>
            </Collapse>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>
                                <TableSortLabel
                                    active={sortConfig.sortBy === 'date'}
                                    direction={sortConfig.sortBy === 'date' ? sortConfig.order : 'asc'}
                                    onClick={() => handleSort('date')}
                                >
                                    Date
                                </TableSortLabel>
                            </TableCell>
                            <TableCell>
                                <TableSortLabel
                                    active={sortConfig.sortBy === 'vendor'}
                                    direction={sortConfig.sortBy === 'vendor' ? sortConfig.order : 'asc'}
                                    onClick={() => handleSort('vendor')}
                                >
                                    Vendor
                                </TableSortLabel>
                            </TableCell>
                            <TableCell>
                                <TableSortLabel
                                    active={sortConfig.sortBy === 'category'}
                                    direction={sortConfig.sortBy === 'category' ? sortConfig.order : 'asc'}
                                    onClick={() => handleSort('category')}
                                >
                                    Category
                                </TableSortLabel>
                            </TableCell>
                            <TableCell align="right">
                                <TableSortLabel
                                    active={sortConfig.sortBy === 'amount'}
                                    direction={sortConfig.sortBy === 'amount' ? sortConfig.order : 'asc'}
                                    onClick={() => handleSort('amount')}
                                >
                                    Amount (CAD)
                                </TableSortLabel>
                            </TableCell>
                            <TableCell align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {expenses.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} align="center">No expenses found</TableCell>
                            </TableRow>
                        ) : (
                            expenses.map((expense) => (
                                <TableRow key={expense.id} hover>
                                    <TableCell>
                                        {(() => {
                                            const dateStr = expense.date;
                                            // Fix timezone offset issue for YYYY-MM-DD strings by parsing as local time
                                            const dateObj = dateStr.includes('T')
                                                ? new Date(dateStr)
                                                : new Date(dateStr + 'T00:00:00');
                                            return format(dateObj, 'MMM dd, yyyy');
                                        })()}
                                    </TableCell>
                                    <TableCell>{expense.vendor}</TableCell>
                                    <TableCell>{expense.category}</TableCell>
                                    <TableCell align="right">${Number(expense.amount).toFixed(2)}</TableCell>
                                    <TableCell align="right">
                                        <IconButton size="small" onClick={() => openEdit(expense)} color="primary"><EditIcon /></IconButton>
                                        <IconButton size="small" onClick={() => handleDelete(expense.id)} color="error"><DeleteIcon /></IconButton>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                <Pagination count={totalPages} page={page} onChange={(e, p) => setPage(p)} color="primary" />
            </Box>

            <ExpenseForm
                open={openForm}
                handleClose={() => setOpenForm(false)}
                handleSubmit={handleSave}
                initialData={editingExpense}
            />
        </Box>
    );
};

export default Expenses;
