const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const { User } = require("../database/models");
const BudgetHistory = require("../database/models/BudgetHistory");

const SECRET = process.env.JWT_SECRET || "fallback_secret";
const auth = require("../middleware/auth");

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production", // true in production
  sameSite: "strict",
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
};

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post("/register", async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;

    // Validate input
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    // Password strength check
    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
    }

    // Check if email already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // Create new user
    const user = await User.create({
      email,
      password,
      firstName: firstName || null,
      lastName: lastName || null,
    });

    // Generate JWT token
    const token = jwt.sign({ id: user.id, email: user.email }, SECRET, {
      expiresIn: "24h",
    });

    // Set cookie
    res.cookie("token", token, cookieOptions);

    res.status(201).json({
      message: "User registered successfully",
      user,
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Server error during registration" });
  }
});

/**
 * POST /api/auth/login
 * Login existing user
 */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    // Find user by email
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Verify password
    const isValid = await User.verifyPassword(password, user.password);
    if (!isValid) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Generate JWT token
    const token = jwt.sign({ id: user.id, email: user.email }, SECRET, {
      expiresIn: "24h",
    });

    // Set cookie
    res.cookie("token", token, cookieOptions);

    res.json({
      message: "Login successful",
      user: User.sanitize(user),
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error during login" });
  }
});

/**
 * POST /api/auth/logout
 * Clear auth cookie
 */
router.post("/logout", (req, res) => {
  res.clearCookie("token");
  res.json({ message: "Logged out successfully" });
});

/**
 * GET /api/auth/me
 * Get current user (session check)
 */
router.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({ user });
  } catch (error) {
    console.error("Session check error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * PUT /api/auth/profile
 * Update user profile (including budget)
 */
router.put("/profile", auth, async (req, res) => {
  try {
    const { firstName, lastName, monthlyBudget, budgetPeriod, budgetReason, budgetEffectiveDate } = req.body;
    const updates = {};

    if (firstName !== undefined) updates.firstName = firstName;
    if (lastName !== undefined) updates.lastName = lastName;
    if (monthlyBudget !== undefined) updates.monthlyBudget = parseFloat(monthlyBudget);
    if (budgetPeriod !== undefined) updates.budgetPeriod = budgetPeriod;

    // Check if budget is being changed
    const budgetChanged = monthlyBudget !== undefined;

    const updatedUser = await User.update(req.user.id, updates);

    // Auto-record budget history if budget changed
    if (budgetChanged) {
      const effectiveDate = budgetEffectiveDate || new Date();
      await BudgetHistory.recordChange(
        req.user.id,
        monthlyBudget,
        effectiveDate,
        budgetReason || null
      );
    }

    res.json({
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Profile update error:", error);
    res.status(500).json({ message: "Server error during update" });
  }
});

module.exports = router;
