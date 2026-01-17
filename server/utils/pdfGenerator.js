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
        .text(`Report For: ${user.username}`, 200, 65, { align: 'right' })
        .text(`Generated: ${new Date().toLocaleDateString()}`, 200, 80, { align: 'right' })
        .moveDown();

    // Context Info
    doc.fontSize(12).text('Report Details', 50, 105);

    // Date Range
    let dateRangeText = 'All Time';
    if (filters.startDate && filters.endDate) dateRangeText = `${filters.startDate} to ${filters.endDate}`;
    else if (filters.startDate) dateRangeText = `From ${filters.startDate}`;
    else if (filters.endDate) dateRangeText = `Until ${filters.endDate}`;

    doc.fontSize(10)
        .font('Helvetica-Bold').text('Date Range:', 50, 125)
        .font('Helvetica').text(dateRangeText, 120, 125);

    // Filters
    doc.font('Helvetica-Bold').text('Filters:', 50, 140);
    doc.font('Helvetica');

    let filterText = [];
    if (filters.category) filterText.push(`Category: ${filters.category}`);
    if (filters.minAmount) filterText.push(`Min Amount: $${filters.minAmount}`);
    if (filters.maxAmount) filterText.push(`Max Amount: $${filters.maxAmount}`);

    if (filterText.length === 0) {
        doc.text('None', 120, 140);
    } else {
        doc.text(filterText.join(', '), 120, 140);
    }

    // Table Header
    const tableTop = 170;
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
