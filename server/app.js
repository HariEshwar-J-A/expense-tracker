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

const path = require("path");

app.use("/api/auth", authRoutes);
app.use("/api/expenses", expenseRoutes);

// Serve static assets in production
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../client/dist")));

  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "../client/dist", "index.html"));
  });
} else {
  app.get("/", (req, res) => {
    res.json({ message: "Expense Tracker API is running (Dev Mode)" });
  });
}

module.exports = app;
