import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, Button, Pagination, FormControl, InputLabel, Select, MenuItem, TextField } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import axios from 'axios';
import ExpenseForm from '../components/ExpenseForm';
import { format } from 'date-fns';

const Expenses = () => {
    const [expenses, setExpenses] = useState([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [filters, setFilters] = useState({ category: '', startDate: '', endDate: '' });
    const [openForm, setOpenForm] = useState(false);
    const [editingExpense, setEditingExpense] = useState(null);

    const fetchExpenses = async () => {
        try {
            const params = { page, limit: 10, ...filters };
            const res = await axios.get('/api/expenses', { params });
            setExpenses(res.data.data);
            setTotalPages(res.data.meta.totalPages);
        } catch (error) {
            console.error('Failed to fetch expenses', error);
        }
    };

    useEffect(() => {
        fetchExpenses();
    }, [page, filters]);

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

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" fontWeight="bold">Expenses</Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setEditingExpense(null); setOpenForm(true); }}>
                    Add Expense
                </Button>
            </Box>

            <Paper sx={{ p: 2, mb: 3 }}>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
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
                    <Button variant="outlined" onClick={() => setFilters({ category: '', startDate: '', endDate: '' })}>
                        Clear
                    </Button>
                </Box>
            </Paper>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Date</TableCell>
                            <TableCell>Vendor</TableCell>
                            <TableCell>Category</TableCell>
                            <TableCell align="right">Amount</TableCell>
                            <TableCell align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {expenses.map((expense) => (
                            <TableRow key={expense.id}>
                                <TableCell>{format(new Date(expense.date), 'MMM dd, yyyy')}</TableCell>
                                <TableCell>{expense.vendor}</TableCell>
                                <TableCell>{expense.category}</TableCell>
                                <TableCell align="right">${Number(expense.amount).toFixed(2)}</TableCell>
                                <TableCell align="right">
                                    <IconButton size="small" onClick={() => openEdit(expense)} color="primary"><EditIcon /></IconButton>
                                    <IconButton size="small" onClick={() => handleDelete(expense.id)} color="error"><DeleteIcon /></IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
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
