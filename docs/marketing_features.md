# Expense Tracker: Feature Showcase & Architecture Deep Dive

Welcome to the **Expense Tracker**, a state-of-the-art financial management application designed for speed, intelligence, and accessibility. This document outlines the comprehensive feature set, engineering decisions, and edge-case handling that make this application a robust solution for personal finance.

---

## 🌟 Core Value Proposition

An intelligent expense tracker that goes beyond simple data entry. By combining **OCR Receipt Scanning**, **Real-Time Analytics**, and **Accessibility-First Design**, we provide a premium experience that automates the tedium of tracking finances.

---

## 🚀 Key Features & Competitive Advantages

### 1. 🤖 Intelligent Receipt Scanning (OCR)
**Feature:** Upload a PDF receipt, and the system automatically extracts the Date, Vendor, and Total Amount.

*   **How It Works:**
    *   **Tier 1 (Fast):** Uses `pdf-parse` to instantly extract text from digital receipts.
    *   **Tier 2 (Smart Fallback):** If no text is found (e.g., scanned image), it automatically routes to the **OCR.space API** to read the image content.
*   **Advantages:**
    *   **Zero Auto-Entry:** Users don't type; they just verify.
    *   **Standardization:** All dates are converted to `YYYY-MM-DD` regardless of the input format (`Jan 12`, `12/01/2024`, etc.).
*   **Edge Case Handling:**
    *   **Duplicate Detection:** Before saving, the system hashes the potential expense (Date + Amount + Vendor). If a match exists, it warns the user: *"⚠️ Potential Duplicate Found! Do you want to proceed?"*.
    *   **Blurry/Low Quality:** If OCR fails, a clear error message guides the user to manual entry.
    *   **Keyword Heuristics:** The parser looks for 7+ variations of "Total" (e.g., "AMOUNT DUE", "BALANCE", "SUM", "GRAND TOTAL") to find the correct figure.

### 2. 📊 Dynamic Financial Dashboard
**Feature:** A real-time, interactive command center for your finances.

*   **Components:**
    *   **Safe-to-Spend Gauge:** Calculates `(Budget - Spent) / Days Remaining`. Tells you exactly how much you can spend *today* to stay on track.
    *   **Spending Velocity:** Visualizes how fast you are spending vs. the time elapsed in the month. "Trending High" means you need to slow down.
    *   **Interactive Charts:** D3.js Pie Charts (Category Breakdown) by Category and Bar Charts (Monthly Trends).
*   **Advantages:**
    *   **Actionable Insights:** Doesn't just show history; predicts future health.
    *   **Visual Consistency:** Charts are strictly sized (`height: 100%`) to align perfectly side-by-side on all screens.
*   **Edge Case Handling:**
    *   **Label Collision:** Pie chart labels use a smart vertical spacing algorithm to prevent text overlap, even with many small categories.
    *   **Responsiveness:** Controls (Edit Budget, Month/Year toggle) automatically wrap to a new line on mobile screens to prevent UI breakage.

### 3. 📅 Flexible Budgeting (Monthly & Yearly)
**Feature:** Toggle between Monthly and Yearly views to see short-term health or long-term trends.

*   **Advantages:**
    *   **Persistent Preferences:** The app remembers your last selection (Monthly vs. Yearly) even after refreshing the page.
    *   **Smart Math:** When switching to "Yearly", all metrics (Safe-to-Spend, Velocity) instantly re-calculate based on a 365-day scale.
*   **Edge Case Handling:**
    *   **Zero Budget:** If no budget is set, widgets display helpful "Set a Budget" prompts instead of breaking or showing "Infinity" errors.

### 4. 📄 Professional PDF Reporting
**Feature:** Generate tax-ready PDF reports with a single click.

*   **Capabilities:**
    *   **Executive Summary:** Total spent, average transaction count.
    *   **Category Breakdown:** Table showing spending per category.
    *   **Detailed Ledger:** Complete transaction history with zebra-striping for readability.
*   **Advantages:**
    *   **Client-Side Generation:** Fast and secure; generated instantly in the browser/backend.
    *   **Sorted Data:** Reports reflect your current dashboard filters (e.g., "Sorted by Date DESC").
*   **Edge Case Handling:**
    *   **Filename Sanitization:** Files are automatically named `Expense_Report_YYYY-MM-DD.pdf` to avoid file system errors.
    *   **Large Datasets:** The backend generation uses efficient streaming logic to handle thousands of rows without crashing the browser.

### 5. 🗄️ Scalable Data Management
**Feature:** Efficiently handles large volumes of transaction data.

*   **Capabilities:**
    *   **Server-Side Pagination:** Fetches data in chunks (e.g., 10 items per page) rather than loading the entire database at once.
    *   **Smart Filtering:** Filter 1,000+ expenses by Date Range, Vendor, or Category in milliseconds.
*   **Advantages:**
    *   **Performance:** Initial page load remains instant, regardless of whether you have 10 or 10,000 expenses.
    *   **Bandwidth Efficiency:** Minimizes API data transfer on mobile networks.

### 6. ♿ Accessibility-First (A11y)
**Feature:** A fully inclusive design that meets **WCAG 2.1 AA Standards**.

*   **Implementations:**
    *   **Focus Management:** Custom `:focus-visible` ring appears *only* when using keyboard navigation, preserving aesthetic for mouse users.
    *   **Skip Links:** "Skip to Main Content" link allows screen reader users to bypass navigation menus.
    *   **Semantic HTML:** Strict `h1` -> `h2` -> `h3` hierarchy for logical document flow.
    *   **ARIA Labels:** Every button, input, and icon has a descriptive label (e.g., "Select Indigo Color" instead of just a purple circle).
*   **Advantages:**
    *   **Legal Compliance:** Meets modern web accessibility standards.
    *   **Better UX:** Keyboard-friendly navigation improves speed for power users.

### 7. ⚡ Performance & Architecture
**Feature:** Optimized for speed and scalability.

*   **Technical Wins:**
    *   **Code Splitting:** Vendor libraries (React, MUI, D3) are split into separate chunks, reducing the initial load size by ~60%.
    *   **Specific Imports:** Switched from barrel files (`import { X } from Y`) to tree-shakeable imports (`import X from Y/X`) to minimize bundle size.
    *   **Database Plugins:** Built on **Knex.js**, allowing seamless switching between SQLite (Development) and PostgreSQL (Production).
*   **Advantages:**
    *   **Lighthouse Score:** Optimized to achieve 90-100 performance scores.
    *   **Scalable:** Ready for deployment on cloud platforms (AWS, Vercel, Heroku) with robust database support.

### 8. 🏗️ Technical Architecture
For a deep dive into our engineering choices (e.g., why we chose **Context over Redux** or **Knex over ORMs**), please refer to our dedicated **[Technical Architecture & ADR Document](./technical_architecture.md)**.

---

## 🛡️ Security Measures
*   **JWT Authentication:** Stateless, secure session management.
*   **Secure Cookies:** HttpOnly flags prevent XSS attacks.
*   **Input Validation:** Strict type checking on all API endpoints.

---

## 📱 Mobile Responsiveness
*   **Adaptive Grid:** Dashboard widgets resize from 4-columns (Desktop) to 1-column (Mobile) fluidly.
*   **Touch Targets:** All buttons are sized (min 48px) for easy tapping on touch screens.
