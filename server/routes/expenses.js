const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const { Expense, User } = require("../database/models");
const multer = require("multer");
const { parseReceipt } = require("../utils/receiptParser");
const { sanitizeValue, filterExportFields } = require("../utils/sanitizer");

// Multer setup for memory storage
const upload = multer({ storage: multer.memoryStorage() });

/**
 * POST /api/expenses/parse
 * Parse PDF receipt to extract expense data
 */
router.post("/parse", auth, upload.single("receipt"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        const parsedData = await parseReceipt(req.file.buffer, req.file.mimetype);

        // Check for duplicates if we have valid data
        if (parsedData.amount && parsedData.date && parsedData.vendor) {
            const duplicate = await Expense.findDuplicate(req.user.id, {
                amount: parsedData.amount,
                date: parsedData.date,
                vendor: parsedData.vendor,
            });

            if (duplicate) {
                parsedData.isDuplicate = true;
                parsedData.duplicateId = duplicate.id;
            }
        }

        res.json(parsedData);
    } catch (error) {
        console.error("Parse Receipt Error:", error);
        res.status(500).json({ message: "Error parsing receipt" });
    }
});

/**
 * GET /api/expenses/stats
 * Get expense statistics for the authenticated user
 */
router.get("/stats", auth, async (req, res) => {
    try {
        const userId = req.user.id;
        const { period } = req.query; // 'monthly' or 'yearly'
        const stats = await Expense.getStats(userId, period);

        res.json(stats);
    } catch (error) {
        console.error("Stats error:", error);
        res.status(500).json({ message: "Error fetching statistics" });
    }
});

/**
 * GET /api/expenses
 * Get all expenses for authenticated user with pagination and filters
 */
router.get("/", auth, async (req, res) => {
    try {
        const userId = req.user.id;
        const {
            category,
            startDate,
            endDate,
            minAmount,
            maxAmount,
            sortBy,
            order,
            page,
            limit,
        } = req.query;

        const result = await Expense.findByUserId(userId, {
            category,
            startDate,
            endDate,
            minAmount,
            maxAmount,
            sortBy,
            order,
            page: parseInt(page) || 1,
            limit: parseInt(limit) || 10,
        });

        res.json(result);
    } catch (error) {
        console.error("Get expenses error:", error);
        res.status(500).json({ message: "Error fetching expenses" });
    }
});

const { generateExpenseReport } = require("../utils/pdfGenerator");

/**
 * GET /api/expenses/export
 * Export expenses as PDF, CSV, or JSON
 */
router.get("/export", auth, async (req, res) => {
    try {
        let fullUser = null;
        let username = req.user.username || (req.user.email ? req.user.email.split("@")[0] : "User");

        try {
            fullUser = await User.findById(req.user.id);
            if (fullUser && fullUser.firstName && fullUser.lastName) {
                username = `${fullUser.firstName}_${fullUser.lastName}`;
            }
        } catch (err) {
            console.warn("Could not fetch full user details for export, using fallback", err);
        }

        const safeUsername = username.replace(/[^a-zA-Z0-9_-]/g, "_");
        const now = new Date();
        const dateStr = now.toISOString().split("T")[0]; // YYYY-MM-DD
        const timeStr = now.toTimeString().split(" ")[0].replace(/:/g, "-"); // HH-mm-ss
        const baseFilename = `${safeUsername}_Expenses_${dateStr}_${timeStr}`;

        const {
            category,
            startDate,
            endDate,
            minAmount,
            maxAmount,
            sortBy,
            order,
            limit,
            format = "pdf", // Default to PDF
        } = req.query;

        // Fetch expenses with filters
        const result = await Expense.findByUserId(req.user.id, {
            category,
            startDate,
            endDate,
            minAmount,
            maxAmount,
            sortBy: sortBy || "date",
            order: order || "desc",
            page: 1,
            limit: parseInt(limit) || 100000,
        });

        const expenses = result.data;

        if (format === "json") {
            // Remove metadata
            const safeExpenses = expenses.map(e => filterExportFields(e));

            res.setHeader("Content-Type", "application/json");
            res.setHeader(
                "Content-Disposition",
                `attachment; filename="${baseFilename}.json"`
            );
            return res.json(safeExpenses);
        }

        if (format === "csv") {
            const csvHeaders = "Date,Vendor,Category,Amount\n";
            const csvRows = expenses
                .map((e) => {
                    // Escape quotes and handle commas
                    const vendor = `"${(e.vendor || "").replace(/"/g, '""')}"`;
                    const category = `"${(e.category || "").replace(/"/g, '""')}"`;
                    // Filtered row
                    return `${e.date},${vendor},${category},${e.amount}`;
                })
                .join("\n");

            res.setHeader("Content-Type", "text/csv");
            res.setHeader(
                "Content-Disposition",
                `attachment; filename="${baseFilename}.csv"`
            );
            return res.send(csvHeaders + csvRows);
        }

        // Default to PDF
        // Pass the standardized filename to the generator
        const userForReport = fullUser || {
            email: req.user.email || "User",
            username: username
        };
        generateExpenseReport(expenses, req.query, userForReport, res, `${baseFilename}.pdf`);
    } catch (error) {
        console.error("Export error:", error);
        if (!res.headersSent) {
            res.status(500).json({ message: "Error exporting expenses" });
        }
    }
});

/**
 * POST /api/expenses/import
 * Import expenses from CSV or JSON
 */
router.post("/import", auth, upload.single("file"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        const userId = req.user.id;
        const fileContent = req.file.buffer.toString("utf8");
        const mimetype = req.file.mimetype;

        let expensesToImport = [];

        // Detect format based on content or extension/mimetype
        let isJson = mimetype === "application/json" || req.file.originalname.endsWith(".json");
        let isCsv = mimetype === "text/csv" || req.file.originalname.endsWith(".csv");

        // Fallback: sniff content
        if (!isJson && !isCsv) {
            if (fileContent.trim().startsWith("[") || fileContent.trim().startsWith("{")) {
                isJson = true;
            } else {
                isCsv = true; // Assume CSV if not JSON
            }
        }

        if (isJson) {
            try {
                const parsed = JSON.parse(fileContent);
                let rawData = [];
                if (Array.isArray(parsed)) {
                    rawData = parsed;
                } else if (typeof parsed === 'object' && parsed !== null) {
                    rawData = Array.isArray(parsed.data) ? parsed.data : [parsed];
                }

                expensesToImport = rawData.map(item => ({
                    date: item.date,
                    amount: item.amount,
                    vendor: sanitizeValue(item.vendor || ""),
                    category: sanitizeValue(item.category || "Other")
                }));

            } catch (e) {
                return res.status(400).json({ message: "Invalid JSON format" });
            }
        } else if (isCsv) {
            const lines = fileContent.split(/\r?\n/).filter(line => line.trim() !== "");
            if (lines.length < 2) {
                return res.status(400).json({ message: "CSV file is empty or missing headers" });
            }

            // Helper to parse CSV line handling quotes
            const parseCSVLine = (text) => {
                const result = [];
                let cur = '';
                let inQuote = false;
                for (let j = 0; j < text.length; j++) {
                    const char = text[j];
                    if (char === '"') {
                        inQuote = !inQuote;
                    } else if (char === ',' && !inQuote) {
                        result.push(cur);
                        cur = '';
                    } else {
                        cur += char;
                    }
                }
                result.push(cur);
                return result.map(c => c.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));
            };

            // Detect headers to verify format
            const headers = lines[0].toLowerCase().split(",").map(h => h.trim().replace(/"/g, ""));
            // Map header indices
            const dateIdx = headers.indexOf("date");
            const vendorIdx = headers.indexOf("vendor");
            const categoryIdx = headers.indexOf("category");
            const amountIdx = headers.indexOf("amount");

            if (dateIdx === -1 || vendorIdx === -1 || categoryIdx === -1 || amountIdx === -1) {
                // Fallback if strictly enforcing headers, or we could just assume order if standard export
                // For safety/strictness let's require headers
                return res.status(400).json({ message: "Missing required CSV columns: Date, Vendor, Category, Amount" });
            }

            for (let i = 1; i < lines.length; i++) {
                const colsParsed = parseCSVLine(lines[i]);

                // Ensure we have enough columns for the mapped indices
                const maxIdx = Math.max(dateIdx, vendorIdx, categoryIdx, amountIdx);
                if (colsParsed.length > maxIdx) {
                    expensesToImport.push({
                        date: colsParsed[dateIdx],
                        vendor: sanitizeValue(colsParsed[vendorIdx] || "Unknown"),
                        category: sanitizeValue(colsParsed[categoryIdx] || "Other"),
                        amount: colsParsed[amountIdx]
                    });
                }
            }
        }

        // Validate and insert
        let successCount = 0;
        let failCount = 0;

        for (const exp of expensesToImport) {
            // Basic validation
            if (!exp.date || !exp.amount || !exp.vendor) {
                failCount++;
                continue;
            }

            // Normalize date
            let date = exp.date;
            // If format is wrong, db might reject. 
            // We assume ISO or YYYY-MM-DD from export.

            try {
                await Expense.create(userId, {
                    amount: parseFloat(exp.amount),
                    vendor: exp.vendor,
                    category: exp.category || "Other",
                    date: date,
                });
                successCount++;
            } catch (e) {
                console.error("Import row failed:", e.message);
                failCount++;
            }
        }

        res.json({
            message: `Import processed`,
            summary: {
                total: expensesToImport.length,
                success: successCount,
                failed: failCount
            }
        });

    } catch (error) {
        console.error("Import error:", error);
        res.status(500).json({ message: "Error importing expenses" });
    }
});

/**
 * GET /api/expenses/:id
 * Get a single expense by ID
 */
router.get("/:id", auth, async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const expense = await Expense.findById(id, userId);

        if (!expense) {
            return res.status(404).json({ message: "Expense not found" });
        }

        res.json(expense);
    } catch (error) {
        console.error("Get expense error:", error);
        res.status(500).json({ message: "Error fetching expense" });
    }
});

/**
 * POST /api/expenses
 * Create a new expense
 */
router.post("/", auth, async (req, res) => {
    try {
        const userId = req.user.id;
        const { amount, vendor, category, date, receiptUrl } = req.body;

        // Validation
        if (!amount || !vendor || !category || !date) {
            return res.status(400).json({
                message: "Missing required fields: amount, vendor, category, date",
            });
        }

        if (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
            return res
                .status(400)
                .json({ message: "Amount must be a positive number" });
        }

        const expense = await Expense.create(userId, {
            amount,
            vendor,
            category,
            date,
            receiptUrl,
        });

        res.status(201).json(expense);
    } catch (error) {
        console.error("Create expense error:", error);
        res.status(500).json({ message: "Error creating expense" });
    }
});

/**
 * PUT /api/expenses/:id
 * Update an existing expense
 */
router.put("/:id", auth, async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const { amount, vendor, category, date, receiptUrl } = req.body;

        // Validate amount if provided
        if (amount !== undefined) {
            if (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
                return res
                    .status(400)
                    .json({ message: "Amount must be a positive number" });
            }
        }

        const expense = await Expense.update(id, userId, {
            amount,
            vendor,
            category,
            date,
            receiptUrl,
        });

        res.json(expense);
    } catch (error) {
        if (error.message === "Expense not found") {
            return res.status(404).json({ message: "Expense not found" });
        }
        console.error("Update expense error:", error);
        res.status(500).json({ message: "Error updating expense" });
    }
});

/**
 * DELETE /api/expenses/:id
 * Delete an expense
 */
router.delete("/:id", auth, async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const deleted = await Expense.delete(id, userId);

        if (deleted === 0) {
            return res.status(404).json({ message: " not found" });
        }

        res.json({ message: "Expense deleted successfully" });
    } catch (error) {
        console.error("Delete expense error:", error);
        res.status(500).json({ message: "Error deleting expense" });
    }
});

module.exports = router;
