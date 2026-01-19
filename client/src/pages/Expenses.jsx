import React, { useState, useEffect, useId } from "react";
import {
    Box,
    Typography,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    Button,
    Pagination,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    TextField,
    Collapse,
    TableSortLabel,
    InputAdornment,
    Menu,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import FilterListIcon from "@mui/icons-material/FilterList";
import axios from "axios";
import ExpenseForm from "../components/ExpenseForm";
import { formatDateForDisplay } from "../utils/dateHelpers";

import { useAuth } from "../context/AuthContext";

const Expenses = () => {
    const [expenses, setExpenses] = useState([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Filters & Sort State
    const [filters, setFilters] = useState({
        category: "",
        startDate: "",
        endDate: "",
        minAmount: "",
        maxAmount: "",
    });
    const [sortConfig, setSortConfig] = useState({
        sortBy: "date",
        order: "desc",
    });
    const [showFilters, setShowFilters] = useState(false);
    const filterId = useId();

    const [openForm, setOpenForm] = useState(false);
    const [editingExpense, setEditingExpense] = useState(null);

    const fetchExpenses = React.useCallback(async () => {
        try {
            const params = {
                page,
                limit: 10,
                ...filters,
                ...sortConfig,
            };
            const res = await axios.get("/api/expenses", { params });
            setExpenses(res.data.data);
            setTotalPages(res.data.pagination.pages); // Updated from meta.totalPages
        } catch (error) {
            console.error("Failed to fetch expenses", error);
        }
    }, [page, filters, sortConfig]);

    useEffect(() => {
        fetchExpenses();
    }, [fetchExpenses]);

    const handleSort = (property) => {
        const isAsc = sortConfig.sortBy === property && sortConfig.order === "asc";
        setSortConfig({ sortBy: property, order: isAsc ? "desc" : "asc" });
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure?")) {
            await axios.delete(`/api/expenses/${id}`);
            fetchExpenses();
        }
    };

    const handleSave = async (data) => {
        try {
            if (editingExpense) {
                await axios.put(`/api/expenses/${editingExpense.id}`, data);
            } else {
                await axios.post("/api/expenses", data);
            }
            setOpenForm(false);
            setEditingExpense(null);
            fetchExpenses();
        } catch (error) {
            console.error("Error saving expense", error);
        }
    };

    const openEdit = (expense) => {
        setEditingExpense(expense);
        setOpenForm(true);
    };

    const clearFilters = () => {
        setFilters({
            category: "",
            startDate: "",
            endDate: "",
            minAmount: "",
            maxAmount: "",
        });
    };

    const [exportAnchorEl, setExportAnchorEl] = useState(null);
    const exportOpen = Boolean(exportAnchorEl);

    // Import Template State
    const [importHelpAnchor, setImportHelpAnchor] = useState(null);

    const downloadTemplate = (type) => {
        setImportHelpAnchor(null);
        let content, filename, mime;

        if (type === 'csv') {
            content = `Date,Vendor,Category,Amount\n${new Date().toISOString().split('T')[0]},"Example Store","Food",25.50`;
            filename = 'expense_import_template.csv';
            mime = 'text/csv';
        } else {
            content = JSON.stringify([{
                date: new Date().toISOString().split('T')[0],
                vendor: "Example Store",
                category: "Food",
                amount: 25.50
            }], null, 2);
            filename = 'expense_import_template.json';
            mime = 'application/json';
        }

        const blob = new Blob([content], { type: mime });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    };

    const importInputRef = React.useRef(null);

    const handleExportClick = (event) => {
        setExportAnchorEl(event.currentTarget);
    };

    const handleExportClose = () => {
        setExportAnchorEl(null);
    };

    const handleExport = async (format) => {
        handleExportClose();
        try {
            const params = {
                ...filters,
                ...sortConfig,
                limit: 100000,
                format,
            };

            const response = await axios.get("/api/expenses/export", {
                params,
                responseType: "blob",
            });

            const mimeTypes = {
                pdf: "application/pdf",
                csv: "text/csv",
                json: "application/json",
            };

            const blob = new Blob([response.data], { type: mimeTypes[format] });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;

            const contentDisposition = response.headers["content-disposition"];
            let filename = `Expenses_${new Date().toISOString().split("T")[0]}.${format}`;
            if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename="?([^";]+)"?/);
                if (filenameMatch && filenameMatch.length === 2) {
                    filename = filenameMatch[1];
                }
            }

            link.setAttribute("download", filename);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);

            setTimeout(() => window.URL.revokeObjectURL(url), 100);
        } catch (error) {
            console.error("Export failed", error);
            alert(`Failed to export ${format.toUpperCase()}`);
        }
    };

    const handleImportClick = () => {
        importInputRef.current.click();
    };

    const handleImportFile = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await axios.post("/api/expenses/import", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });

            alert(`Import Successful!\nTotal: ${res.data.summary.total}\nSuccess: ${res.data.summary.success}\nFailed: ${res.data.summary.failed}`);
            fetchExpenses();
        } catch (error) {
            console.error("Import failed", error);
            const errorMsg = error.response?.data?.message || "Error importing file";
            alert(`Import Failed: ${errorMsg}`);
        } finally {
            event.target.value = ""; // Reset input
        }
    };

    return (
        <Box>
            <Box
                sx={{
                    display: "flex",
                    flexDirection: { xs: "column", sm: "row" }, // Stack on mobile
                    justifyContent: "space-between",
                    alignItems: { xs: "stretch", sm: "center" }, // Stretch buttons on mobile
                    gap: 2,
                    mb: 3,
                }}
            >
                <Typography variant="h1" fontSize="2.5rem" fontWeight="bold">
                    Expenses
                </Typography>
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                    <IconButton
                        onClick={() => setShowFilters(!showFilters)}
                        color={showFilters ? "primary" : "default"}
                        aria-label="Toggle filters"
                    >
                        <FilterListIcon />
                    </IconButton>

                    <Button
                        variant="outlined"
                        onClick={handleExportClick}
                    >
                        Export
                    </Button>
                    <Menu
                        anchorEl={exportAnchorEl}
                        open={exportOpen}
                        onClose={handleExportClose}
                    >
                        <MenuItem onClick={() => handleExport("pdf")}>Export as PDF</MenuItem>
                        <MenuItem onClick={() => handleExport("csv")}>Export as CSV</MenuItem>
                        <MenuItem onClick={() => handleExport("json")}>Export as JSON</MenuItem>
                    </Menu>

                    <input
                        type="file"
                        accept=".csv,application/json"
                        style={{ display: 'none' }}
                        ref={importInputRef}
                        onChange={handleImportFile}
                    />

                    {/* Import Menu Group */}
                    <Box sx={{ display: 'flex' }}>
                        <Button
                            variant="outlined"
                            onClick={handleImportClick}
                            sx={{ borderTopRightRadius: 0, borderBottomRightRadius: 0 }}
                        >
                            Import
                        </Button>
                        <Button
                            variant="outlined"
                            sx={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0, borderLeft: 'none', px: 1, minWidth: 'auto' }}
                            onClick={(e) => setImportHelpAnchor(e.currentTarget)}
                        >
                            ?
                        </Button>
                        <Menu
                            anchorEl={importHelpAnchor}
                            open={Boolean(importHelpAnchor)}
                            onClose={() => setImportHelpAnchor(null)}
                        >
                            <MenuItem disabled>
                                <Typography variant="caption" color="text.secondary">
                                    Download Import Template
                                </Typography>
                            </MenuItem>
                            <MenuItem onClick={() => downloadTemplate('csv')}>Download CSV Template</MenuItem>
                            <MenuItem onClick={() => downloadTemplate('json')}>Download JSON Template</MenuItem>
                        </Menu>
                    </Box>

                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => {
                            setEditingExpense(null);
                            setOpenForm(true);
                        }}
                    >
                        Add Expense
                    </Button>
                </Box>
            </Box>

            <Collapse in={showFilters}>
                <Paper sx={{ p: 2, mb: 3 }}>
                    <Box
                        sx={{
                            display: "flex",
                            gap: 2,
                            flexWrap: "wrap",
                            alignItems: "center",
                        }}
                    >
                        <FormControl size="small" sx={{ minWidth: 120 }}>
                            <InputLabel id={`${filterId}-category-label`}>Category</InputLabel>
                            <Select
                                labelId={`${filterId}-category-label`}
                                id={`${filterId}-category-select`}
                                value={filters.category}
                                label="Category"
                                onChange={(e) =>
                                    setFilters({ ...filters, category: e.target.value })
                                }
                            >
                                <MenuItem value="">All</MenuItem>
                                {[
                                    "Food",
                                    "Transport",
                                    "Utilities",
                                    "Entertainment",
                                    "Health",
                                    "Other",
                                ].map((c) => (
                                    <MenuItem key={c} value={c}>
                                        {c}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <TextField
                            id={`${filterId}-start-date`}
                            name="startDate"
                            label="Start Date"
                            type="date"
                            size="small"
                            slotProps={{ inputLabel: { shrink: true } }}
                            value={filters.startDate}
                            onChange={(e) =>
                                setFilters({ ...filters, startDate: e.target.value })
                            }
                        />
                        <TextField
                            id={`${filterId}-end-date`}
                            name="endDate"
                            label="End Date"
                            type="date"
                            size="small"
                            slotProps={{ inputLabel: { shrink: true } }}
                            value={filters.endDate}
                            onChange={(e) =>
                                setFilters({ ...filters, endDate: e.target.value })
                            }
                        />
                        <TextField
                            id={`${filterId}-min-amount`}
                            name="minAmount"
                            label="Min Amount"
                            type="number"
                            size="small"
                            placeholder="0"
                            slotProps={{
                                input: {
                                    startAdornment: (
                                        <InputAdornment position="start">$</InputAdornment>
                                    ),
                                },
                            }}
                            value={filters.minAmount}
                            onChange={(e) =>
                                setFilters({ ...filters, minAmount: e.target.value })
                            }
                            sx={{ width: 120 }}
                        />
                        <TextField
                            id={`${filterId}-max-amount`}
                            name="maxAmount"
                            label="Max Amount"
                            type="number"
                            size="small"
                            placeholder="Max"
                            slotProps={{
                                input: {
                                    startAdornment: (
                                        <InputAdornment position="start">$</InputAdornment>
                                    ),
                                },
                            }}
                            value={filters.maxAmount}
                            onChange={(e) =>
                                setFilters({ ...filters, maxAmount: e.target.value })
                            }
                            sx={{ width: 120 }}
                        />
                        <Button variant="text" onClick={clearFilters}>
                            Clear Filters
                        </Button>
                    </Box>
                </Paper>
            </Collapse>

            <TableContainer component={Paper} sx={{ overflowX: "auto" }}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>
                                <TableSortLabel
                                    active={sortConfig.sortBy === "date"}
                                    direction={
                                        sortConfig.sortBy === "date" ? sortConfig.order : "asc"
                                    }
                                    onClick={() => handleSort("date")}
                                >
                                    Date
                                </TableSortLabel>
                            </TableCell>
                            <TableCell>
                                <TableSortLabel
                                    active={sortConfig.sortBy === "vendor"}
                                    direction={
                                        sortConfig.sortBy === "vendor" ? sortConfig.order : "asc"
                                    }
                                    onClick={() => handleSort("vendor")}
                                >
                                    Vendor
                                </TableSortLabel>
                            </TableCell>
                            <TableCell>
                                <TableSortLabel
                                    active={sortConfig.sortBy === "category"}
                                    direction={
                                        sortConfig.sortBy === "category" ? sortConfig.order : "asc"
                                    }
                                    onClick={() => handleSort("category")}
                                >
                                    Category
                                </TableSortLabel>
                            </TableCell>
                            <TableCell align="right">
                                <TableSortLabel
                                    active={sortConfig.sortBy === "amount"}
                                    direction={
                                        sortConfig.sortBy === "amount" ? sortConfig.order : "asc"
                                    }
                                    onClick={() => handleSort("amount")}
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
                                <TableCell colSpan={5} align="center">
                                    No expenses found
                                </TableCell>
                            </TableRow>
                        ) : (
                            expenses.map((expense) => (
                                <TableRow key={expense.id} hover>
                                    <TableCell>{formatDateForDisplay(expense.date)}</TableCell>
                                    <TableCell>{expense.vendor}</TableCell>
                                    <TableCell>{expense.category}</TableCell>
                                    <TableCell align="right">
                                        ${Number(expense.amount).toFixed(2)}
                                    </TableCell>
                                    <TableCell align="right">
                                        <IconButton
                                            size="small"
                                            onClick={() => openEdit(expense)}
                                            color="primary"
                                            aria-label="Edit expense"
                                        >
                                            <EditIcon />
                                        </IconButton>
                                        <IconButton
                                            size="small"
                                            onClick={() => handleDelete(expense.id)}
                                            color="error"
                                            aria-label="Delete expense"
                                        >
                                            <DeleteIcon />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
                <Pagination
                    count={totalPages}
                    page={page}
                    onChange={(e, p) => setPage(p)}
                    color="primary"
                />
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
