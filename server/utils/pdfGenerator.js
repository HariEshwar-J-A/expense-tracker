const PDFDocument = require('pdfkit');

const generateExpenseReport = (expenses, filters, user, res) => {
    const doc = new PDFDocument({ margin: 50 });

    const filename = `${user.username}_Expenses_${new Date().toISOString().split('T')[0]}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    doc.pipe(res);

    // Header
    doc.fillColor('#444444')
        .fontSize(20)
        .text('Expense Report', 50, 57)
        .fontSize(10)
        .text(user.username, 200, 65, { align: 'right' })
        .text(`Generated: ${new Date().toLocaleDateString()}`, 200, 80, { align: 'right' })
        .moveDown();

    // Filters
    doc.fontSize(10).text('Filters Applied:', 50, 100);
    let filterY = 115;
    if (filters.category) doc.text(`Category: ${filters.category}`, 50, filterY);
    if (filters.startDate) doc.text(`Start Date: ${filters.startDate}`, 200, filterY);
    if (filters.endDate) doc.text(`End Date: ${filters.endDate}`, 350, filterY);

    // Table Header
    const tableTop = 150;
    doc.font('Helvetica-Bold');
    generateTableRow(doc, tableTop, 'Date', 'Vendor', 'Category', 'Amount');
    doc.font('Helvetica');
    generateHr(doc, tableTop + 20);

    // Table Body
    let i = 0;
    let position = 0;
    let totalAmount = 0;

    expenses.forEach(item => {
        position = tableTop + (i + 1) * 30;
        // Check page break
        if (position > 700) {
            doc.addPage();
            // Reset position for new page
            position = 50;
            i = 0;
            // Re-draw header? For simplicity, we just continue list.
        }

        generateTableRow(
            doc,
            position,
            item.date.split('T')[0], // items.date is ISO striing
            item.vendor,
            item.category,
            `$${Number(item.amount).toFixed(2)}`
        );
        generateHr(doc, position + 20);
        totalAmount += Number(item.amount);
        i++;
    });

    // Total
    const finalPosition = position + 40;
    doc.font('Helvetica-Bold')
        .text(`Total Spending: $${totalAmount.toFixed(2)}`, 350, finalPosition, { width: 100, align: 'right' });

    doc.end();
};

function generateTableRow(doc, y, date, vendor, category, amount) {
    doc.fontSize(10)
        .text(date, 50, y)
        .text(vendor, 150, y, { width: 100, align: 'left' })
        .text(category, 280, y, { width: 100, align: 'left' })
        .text(amount, 370, y, { width: 100, align: 'right' });
}

function generateHr(doc, y) {
    doc.strokeColor('#aaaaaa')
        .lineWidth(1)
        .moveTo(50, y)
        .lineTo(550, y)
        .stroke();
}

module.exports = { generateExpenseReport };
