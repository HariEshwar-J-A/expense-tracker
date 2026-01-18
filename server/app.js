const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const app = express();

// Middleware
// Middleware
app.use(
  cors({
    exposedHeaders: ["Content-Disposition"],
  }),
);
app.use(express.json());
app.use(morgan("dev"));

const authRoutes = require("./routes/auth");
const expenseRoutes = require("./routes/expenses");

// Routes
app.get("/", (req, res) => {
  res.json({ message: "Expense Tracker API is running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/expenses", expenseRoutes);

module.exports = app;
