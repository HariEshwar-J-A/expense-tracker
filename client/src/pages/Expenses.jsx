import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, Button, Pagination, FormControl, InputLabel, Select, MenuItem, TextField, Collapse, TableSortLabel, InputAdornment } from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon, FilterList as FilterListIcon } from '@mui/icons-material';
import axios from 'axios';
import ExpenseForm from '../components/ExpenseForm';
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
            setTotalPages(res.data.pagination.pages); // Updated from meta.totalPages
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

    const handleExportPDF = async () => {
        try {
            const token = localStorage.getItem('token');
            const params = {
                ...filters,
                ...sortConfig,
                limit: 10000 // Get all records
            };

            const response = await axios.get('/api/expenses/export', {
                headers: { Authorization: `Bearer ${token}` },
                params,
                responseType: 'blob',
            });

            // Debugging logs
            console.log('Response Headers:', response.headers);
            // Explicitly define the PDF type so the browser recognizes it
            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;

            const contentDisposition = response.headers['content-disposition'];
            let filename = `Expenses_${new Date().toISOString().split('T')[0]}.pdf`;
            if (contentDisposition) {
                // Robust regex for both quoted and unquoted filenames
                const filenameMatch = contentDisposition.match(/filename="?([^";]+)"?/);
                if (filenameMatch && filenameMatch.length === 2) {
                    filename = filenameMatch[1];
                }
            }

            console.log('Final Filename:', filename);

            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);

            // IMPORTANT: Browsers need a small delay before the URL is revoked
            // otherwise the download might fail or lose the filename
            setTimeout(() => window.URL.revokeObjectURL(url), 100);

        } catch (error) {
            console.error('Export failed', error);
            alert('Failed to export PDF');
        }
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
                                        {formatDateForDisplay(expense.date)}
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
