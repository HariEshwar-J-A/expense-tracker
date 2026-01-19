const PDFDocument = require("pdfkit");

const generateExpenseReport = (expenses, filters, user, res, filename) => {
    // 1. Calculate Statistics
    const totalAmount = expenses.reduce(
        (sum, item) => sum + Number(item.amount),
        0,
    );
    const count = expenses.length;
    const averageAmount = count > 0 ? totalAmount / count : 0;
    const amounts = expenses.map((e) => Number(e.amount));
    const maxAmount = count > 0 ? Math.max(...amounts) : 0;

    // ... (rest of logic)

    // Fallback filename generation if not provided (backward compatibility)
    if (!filename) {
        // Robust Timestamp for Filename (YYYY-MM-DD_HH-mm-ss)
        const now = new Date();
        const timestamp = now
            .toISOString()
            .replace(/T/, "_")
            .replace(/\..+/, "")
            .replace(/:/g, "-");
        const safeUsername = (user.username || user.email.split("@")[0]).replace(
            /[^a-zA-Z0-9_-]/g,
            "_",
        );
        filename = `${safeUsername}_Expenses_${timestamp}.pdf`;
    }

    // Set Headers
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    doc.pipe(res);

    // --- REPORT HEADER ---
    doc
        .fillColor("#444444")
        .fontSize(24)
        .font("Helvetica-Bold")
        .text("Expense Report", 50, 50);

    doc
        .fontSize(10)
        .font("Helvetica")
        .text("Generated for:", 50, 80)
        .font("Helvetica-Bold")
        .text(user.email, 120, 80);

    doc
        .font("Helvetica")
        .text("Generated on:", 50, 95)
        .text(now.toLocaleString(), 120, 95);

    // Filter Info (Right Aligned)
    doc.fontSize(10).font("Helvetica");
    let filterY = 50;
    const rightColX = 350;

    doc.text("Report Parameters:", rightColX, filterY);
    filterY += 15;

    if (filters.category || filters.startDate || filters.endDate) {
        if (filters.startDate) {
            doc.text(`Start Date: ${filters.startDate}`, rightColX, filterY);
            filterY += 15;
        }
        if (filters.endDate) {
            doc.text(`End Date: ${filters.endDate}`, rightColX, filterY);
            filterY += 15;
        }
        if (filters.category) {
            doc.text(`Category: ${filters.category}`, rightColX, filterY);
            filterY += 15;
        }
        filterY += 15;
    }

    // Sort Info
    const sortField = filters.sortBy || "Date";
    const sortOrder = filters.order === "asc" ? "Ascending" : "Descending";
    doc.text(`Sorted By: ${sortField} (${sortOrder})`, rightColX, filterY);
    filterY += 15;

    if (!filters.category && !filters.startDate && !filters.endDate) {
        doc.text("All Records Included", rightColX, filterY);
    }

    doc.moveDown(4); // Increased from 2 to 4 to push separator down
    generateHr(doc, doc.y);
    doc.moveDown();

    // --- EXECUTIVE SUMMARY ---
    const summaryTop = doc.y;
    doc
        .fontSize(14)
        .font("Helvetica-Bold")
        .text("Executive Summary", 50, summaryTop);
    doc.moveDown(0.5);

    // Summary Box
    const boxTop = doc.y;
    doc.rect(50, boxTop, 510, 60).fillAndStroke("#f5f5f5", "#e0e0e0");
    doc.fillColor("#444444");

    // Column 1: Total
    drawSummaryMetric(
        doc,
        "Total Expenses",
        `$${totalAmount.toFixed(2)}`,
        70,
        boxTop + 15,
    );
    // Column 2: Transactions
    drawSummaryMetric(doc, "Transactions", count.toString(), 200, boxTop + 15);
    // Column 3: Average
    drawSummaryMetric(
        doc,
        "Average",
        `$${averageAmount.toFixed(2)}`,
        330,
        boxTop + 15,
    );
    // Column 4: Max
    drawSummaryMetric(
        doc,
        "Largest",
        `$${maxAmount.toFixed(2)}`,
        460,
        boxTop + 15,
    );

    doc.moveDown(5); // Move past the box

    // --- CATEGORY BREAKDOWN ---
    if (Object.keys(categoryStats).length > 0) {
        // Check space for Title
        if (doc.y > 650) doc.addPage();

        doc
            .fontSize(14)
            .font("Helvetica-Bold")
            .text("Category Breakdown", 50, doc.y);
        doc.moveDown(0.5);

        let catY = doc.y;
        doc.fontSize(10).font("Helvetica");

        // Simple visual bars
        const maxCatTotal = Math.max(
            ...Object.values(categoryStats).map((c) => c.total),
        );

        Object.entries(categoryStats)
            .sort((a, b) => b[1].total - a[1].total)
            .forEach(([cat, stats]) => {
                // Check page break - safer threshold
                if (catY > 600) {
                    doc.addPage();
                    catY = 50;
                }

                // Label
                doc.text(cat, 50, catY, { width: 100 });

                // Bar
                const barWidth =
                    maxCatTotal > 0 ? (stats.total / maxCatTotal) * 250 : 0;
                doc.rect(160, catY - 2, barWidth, 10).fill("#3f51b5");
                doc.fillColor("#444444");

                // Value
                doc.text(`$${stats.total.toFixed(2)}`, 430, catY, {
                    width: 80,
                    align: "right",
                });
                doc.text(`(${stats.count})`, 520, catY, { align: "right" });

                catY += 20;
            });

        doc.y = catY + 20; // Update doc.y explicitly
    }

    doc.moveDown();

    // --- DETAILED TRANSACTIONS TABLE ---
    // Check if we have enough space for the header (needs ~50pts)
    if (doc.y > 600) {
        doc.addPage();
    }

    doc
        .fontSize(14)
        .font("Helvetica-Bold")
        .text("Detailed Transactions", 50, doc.y);
    doc.moveDown(0.5);

    const tableTop = doc.y; // Start table here
    let position = tableTop;

    // Draw Table Header
    drawTableHeader(doc, position);
    position += 30;

    doc.font("Helvetica");

    // Draw Table Rows
    expenses.forEach((item, i) => {
        // Check Page Break - reduced to 600 for max safety vs footer at 750
        if (position > 600) {
            doc.addPage();
            position = 50;
            drawTableHeader(doc, position);
            position += 30;
        }

        // Zebra Striping
        if (i % 2 === 0) {
            doc.rect(50, position - 5, 510, 20).fill("#f9f9f9");
            doc.fillColor("#444444"); // Reset text color after fill
        }

        generateTableRow(
            doc,
            position,
            item.date.split("T")[0],
            item.vendor,
            item.category,
            `$${Number(item.amount).toFixed(2)}`,
        );

        position += 20;
    });

    // Draw Footer Line
    generateHr(doc, position + 5);

    // --- PAGE NUMBERS ---
    // Since bufferPages: true, range.count is the TOTAL pages. range.start should be 0.
    const range = doc.bufferedPageRange();

    // Use range.start + range.count to cover all pages correctly
    for (let i = range.start; i < range.start + range.count; i++) {
        doc.switchToPage(i);
        // Writing at 750 (inside margin) triggers auto-add-page!
        // Move to 720 to be safely inside the printable body area (bottom limit ~742)
        doc
            .fontSize(8)
            .fillColor("#aaaaaa")
            .text(`Page ${i + 1} of ${range.count}`, 50, 720, {
                align: "center",
                width: 500,
            });
    }

    doc.end();
};

// --- HELPER FUNCTIONS ---

function drawSummaryMetric(doc, label, value, x, y) {
    doc.fontSize(10).font("Helvetica").fillColor("#666666").text(label, x, y);
    doc
        .fontSize(12)
        .font("Helvetica-Bold")
        .fillColor("#333333")
        .text(value, x, y + 15);
}

function drawTableHeader(doc, y) {
    doc.rect(50, y - 5, 510, 25).fill("#3f51b5"); // Header Background
    doc.fillColor("#ffffff").fontSize(10).font("Helvetica-Bold");

    doc.text("Date", 60, y);
    doc.text("Vendor", 160, y);
    doc.text("Category", 300, y);
    doc.text("Amount", 450, y, { width: 100, align: "right" });

    doc.fillColor("#444444"); // Reset for next content
}

function generateTableRow(doc, y, date, vendor, category, amount) {
    doc
        .fontSize(10)
        .text(date, 60, y)
        .text(vendor, 160, y, { width: 130, ellipsis: true })
        .text(category, 300, y, { width: 140, ellipsis: true })
        .text(amount, 450, y, { width: 100, align: "right" });
}

function generateHr(doc, y) {
    doc.strokeColor("#aaaaaa").lineWidth(1).moveTo(50, y).lineTo(560, y).stroke();
}

module.exports = { generateExpenseReport };
