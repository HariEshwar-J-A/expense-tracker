const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const { Expense, User } = require("../database/models");
const multer = require("multer");
const { parseReceipt } = require("../utils/receiptParser");

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

    const parsedData = await parseReceipt(req.file.buffer);
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
    const stats = await Expense.getStats(userId);

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
 * Export expenses as PDF
 */
router.get("/export", auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const userEmail = req.user.email || "User";
    const user = { username: userEmail.split("@")[0], email: userEmail };

    const {
      category,
      startDate,
      endDate,
      minAmount,
      maxAmount,
      sortBy,
      order,
      limit,
    } = req.query;

    // Fetch expenses with filters
    const result = await Expense.findByUserId(userId, {
      category,
      startDate,
      endDate,
      minAmount,
      maxAmount,
      sortBy: sortBy || "date",
      order: order || "desc",
      page: 1,
      limit: parseInt(limit) || 10000, // Get all for export
    });

    const expenses = result.data;

    // Use the utility function to generate and pipe the PDF
    generateExpenseReport(expenses, req.query, user, res);
  } catch (error) {
    console.error("Export error:", error);
    if (!res.headersSent) {
      res.status(500).json({ message: "Error exporting expenses" });
    }
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
