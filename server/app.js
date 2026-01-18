const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");

const app = express();

// Middleware
app.use(
  cors({
    origin: "http://localhost:5173", // Must be specific for credentials
    credentials: true,
    exposedHeaders: ["Content-Disposition"],
  }),
);
app.use(cookieParser());
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
