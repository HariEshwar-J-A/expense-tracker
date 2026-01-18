# Streaming PDF Export Implementation Plan

To support unlimited records (e.g., millions) without crashing server memory, we need to move from "Buffered" to "Streaming" generation.

## 1. Database Layer (Knex.js)

**Current:** `await query` fetches all rows into memory at once.
**Streaming:** Use `knex.stream()` to fetch rows one by one.

```javascript
// server/database/models/Expense.js

static async streamByUserId(userId, options, streamCallback) {
    const query = this.buildQuery(userId, options); // Extract query building logic
    
    // Create a read stream from the database
    const stream = query.stream();
    
    stream.on('data', (row) => {
        streamCallback(this.toApiFormat(row));
    });
    
    return new Promise((resolve, reject) => {
        stream.on('end', resolve);
        stream.on('error', reject);
    });
}
```

## 2. Server Route (Express)

**Current:** Fetches all data `const expenses = ...`, then passes array to generator.
**Streaming:** Pass the `res` iterator directly to the DB stream.

```javascript
// server/routes/expenses.js

router.get("/export/stream", auth, async (req, res) => {
    // 1. Set headers immediately
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; ...");

    // 2. Initialize PDF Document
    const doc = new PDFDocument();
    doc.pipe(res); // Pipe PDF output directly to HTTP response

    // 3. Setup PDF Headers (Table headers etc.)
    generateReportHeader(doc); 

    // 4. Stream Data
    await Expense.streamByUserId(req.user.id, req.query, (expense) => {
        // Write one row at a time
        // PDFKit will flush chunks to 'res' automatically
        generateTableRow(doc, expense); 
    });

    // 5. Finalize
    generateReportFooter(doc);
    doc.end();
});
```

## 3. PDF Generator (PDFKit)

**Challenge:** `bufferPages: true` (used for "Page X of Y" footer) requires keeping all pages in memory until the end.
**Streaming Fix:** Disable `bufferPages`. You must either:
1.  Remove "Page X of Y" footer (only show "Page X").
2.  Or use a "2-pass" approach (count query first, but that's not true streaming of content).

**Recommendation:** For massive reports, remove "Page X of Y" or simply put "Page X" at the bottom to allow memory-efficient streaming.

```javascript
// server/utils/pdfGenerator.js

const generateStreamingReport = (doc) => {
    // No "bufferPages: true"
    // Write headers
    // expose function to write a single row
    return {
        writeRow: (item) => { ... },
        end: () => { ... }
    };
};
```

## 4. Frontend Client

**Current:** Axios awaits the entire Blob.
**Streaming:** `fetch` API is better for handling streams, or libraries like `streamsaver.js` if you want to save bytes to disk *during* download (preventing browser OOM on massive files).

```javascript
// client/src/pages/Expenses.jsx

const handleExportStream = () => {
    // Use native browser Download
    window.location.href = `/api/expenses/export?token=${token}...`;
}
```
*Note: For security (JWT in headers), using `window.location` is tricky. Better to stick with Blob for "medium" size, or use Service Workers for auth-headers-with-download.*

## Summary of Changes

1.  **Refactor Model**: Create `streamByUserId` method.
2.  **Refactor Generator**: Split `generateExpenseReport` into `start`, `writeRow`, `end`.
3.  **Update Route**: Wire DB stream to PDF generator write function.
4.  **Trade-off**: Lose "Page Total" count in footer for memory safety.
