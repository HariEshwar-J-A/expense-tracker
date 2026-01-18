# Expense Tracker with AI Receipt Parsing

A full-stack expense tracking application with **intelligent PDF receipt parsing** powered by OCR.space API.

## ✨ Features

### 📄 Smart Receipt Parsing
- **Automatic data extraction** from PDF receipts
- **Two-tier intelligence**:
  - Fast extraction for text-based PDFs (pdf-parse)
  - OCR fallback for scanned receipts (OCR.space API)
- Extracts: **Vendor**, **Date**, **Amount**, **Category**
- Smart pattern matching for TOTAL/AMOUNT keywords

### 💰 Expense Management
- Add, edit, delete expenses
- Category-based organization
- Date range filtering
- Statistics dashboard
- Pagination & sorting

### 🔐 Authentication
- JWT-based secure authentication
- User registration & login
- Protected routes

---

## ▶️ HOW TO RUN APP

### 🖥️ Backend (Server)

1. **Navigate to server directory**
   ```bash
   cd server
   ```

2. **Install dependencies** (first time only)
   ```bash
   npm install
   ```

3. **Configure environment** (first time only)
   
   Create `server/.env` file:
   ```env
   JWT_SECRET=your-secret-key-change-this
   OCR_SPACE_API_KEY=your-ocr-api-key-here
   ```
   
   Get free OCR key: https://ocr.space/ocrapi

4. **Start the server**
   ```bash
   npm run dev
   ```
   
   ✅ Server running at: `http://localhost:5000`

### 🎨 Frontend (Client)

1. **Navigate to client directory**
   ```bash
   cd client
   ```

2. **Install dependencies** (first time only)
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```
   
   ✅ App running at: `http://localhost:5173`

### 🔄 Running Both Together

**Option 1: Two Terminals**
```bash
# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Frontend  
cd client
npm run dev
```

**Option 2: Using concurrently** (if installed)
```bash
npm run dev:all
```

Once both are running, open your browser to `http://localhost:5173` and start tracking expenses!

---

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ 
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/HariEshwar-J-A/expense-tracker.git
   cd expense-tracker
   ```

2. **Install dependencies**
   ```bash
   # Server
   cd server
   npm install

   # Client
   cd ../client
   npm install
   ```

3. **Configure environment variables**
   
   Create `server/.env`:
   ```env
   JWT_SECRET=your-secret-key-change-this
   OCR_SPACE_API_KEY=your-ocr-api-key-here
   ```

   **Get your free OCR API key**:
   - Visit https://ocr.space/ocrapi
   - Register for free (25,000 requests/month)
   - Copy your API key to `.env`

4. **Run the application**
   ```bash
   # Terminal 1 - Server (port 5000)
   cd server
   npm run dev

   # Terminal 2 - Client (port 5173)
   cd client
   npm run dev
   ```

5. **Open your browser**
   
   Navigate to `http://localhost:5173`

---

## 🧪 Testing Receipt Parsing

### Step 1: Generate Test Receipts

Use **[Make Receipt](https://makereceipt.com/receipt-templates/sales/sales-receipt/)** to create realistic test PDFs:

1. Go to https://makereceipt.com/receipt-templates/sales/sales-receipt/
2. Fill in the receipt details:
   - **Store Name** → Extracted as Vendor
   - **Date** → Extracted as Date
   - **Total** → Extracted as Amount
3. Click "Download as PDF"

### Step 2: Upload & Test

1. **Register/Login** to your expense tracker
2. Click **"New Expense"**
3. Click **"Scan Receipt"** button
4. Upload the PDF you created
5. Watch the magic happen! ✨

### What You'll See:

**Alert Message:**
```
📄 Receipt scanned!

Extracted:
✓ Vendor: "ABC Store"
✓ Amount: $123.45
✓ Date: 2024-01-15

Please review and save!
```

**Server Console:**
```
=== PDF PARSING STARTED ===
Buffer size: 95108 bytes (92.88 KB)

📄 Attempting text extraction with pdf-parse...
✓ PDF text extracted
  - Total text length: 450 characters

✓ Date matches found: 1
  - Raw date: 01/15/2024
  - Normalized date: 2024-01-15

💰 Searching for amount...
  Strategy 1: Looking for TOTAL/AMOUNT keywords...
    Found: "TOTAL $123.45" → 123.45
  ✓ Selected (max): $123.45

✓ Vendor found: "ABC Store"

=== PARSING COMPLETE ===
```

### Step 3: Review & Save

The form will auto-fill with extracted data:
- ✅ Amount field populated
- ✅ Vendor field populated  
- ✅ Date picker populated
- ✅ Category defaults to "Other"

Review the data and click **"Save"**!

---

## 🔍 How It Works

### Intelligent Two-Tier Parsing

```
PDF Upload
    ↓
┌─────────────────────┐
│  1. pdf-parse       │ ← Fast, for PDFs with embedded text
│     (Local)         │
└─────────────────────┘
         ↓
    Text found?
    ┌───┴───┐
   YES     NO
    ↓       ↓
   DONE   ┌─────────────────────┐
          │  2. OCR.space API   │ ← For scanned receipts
          │     (Cloud OCR)     │
          └─────────────────────┘
                   ↓
              Parse text
                   ↓
        Extract: Vendor, Date, Amount
```

### Pattern Matching Strategies

**Date Extraction:**
- Matches: `YYYY-MM-DD`, `MM/DD/YYYY`, `DD-MMM-YYYY`
- Normalizes to `YYYY-MM-DD` for HTML date inputs

**Amount Extraction** (3 strategies):
1. **Keyword search** → TOTAL, AMOUNT, BALANCE, SUM
2. **Currency symbols** → $, €, £
3. **Loose pattern** → Any decimal number

**Vendor Extraction:**
- First non-date, non-amount line
- Skips "page", "invoice" artifacts

---

## 📊 API Limits

### Free Tier (OCR.space)
- ✅ **25,000 requests/month** (~833/day)
- ✅ **1 MB file size limit**
- ✅ **3 pages per PDF**
- ✅ Fast processing

> **Note**: Most receipts use pdf-parse (free, unlimited), OCR is only for scanned images

---

## 🛠️ Tech Stack

**Frontend:**
- React 18
- Material-UI
- React Router
- Axios
- Recharts (for statistics)

**Backend:**
- Node.js + Express
- JWT Authentication
- Multer (file uploads)
- pdf-parse (text extraction)
- OCR.space API (OCR fallback)

**Data Storage:**
- In-memory (for demo purposes)
- Can be extended to MongoDB/PostgreSQL

---

## 📁 Project Structure

```
expense-tracker/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # UI components
│   │   ├── pages/         # Route pages
│   │   ├── utils/         # Helper functions
│   │   └── App.jsx        # Main app
│   └── package.json
│
├── server/                # Express backend
│   ├── routes/           # API routes
│   ├── utils/            # Utilities
│   │   └── receiptParser.js  # PDF parsing logic
│   ├── middleware/       # Auth middleware
│   ├── .env              # Environment variables
│   └── package.json
│
└── README.md
```

---

## 🐛 Troubleshooting

### Receipt not parsing correctly?

**Check server console** for detailed logs:

```bash
# You should see:
=== PDF PARSING STARTED ===
Buffer size: X bytes
✓ PDF text extracted successfully
```

**If you see** `⚠️ Insufficient text extracted`:
- The PDF is scanned/image-based
- OCR.space API will be used (requires API key)

**If you see** `❌ OCR.space API key not configured`:
- Add your API key to `server/.env`
- Restart the server

### Date not populating?

- Check server console for: `Normalized date: YYYY-MM-DD`
- Check browser console for: `Date conversion: { original: ..., normalized: ... }`
- The backend now auto-converts all date formats to YYYY-MM-DD

### Amount not found?

The parser tries 3 strategies (check server logs):
1. Keywords: TOTAL, AMOUNT, SUM, BALANCE
2. Currency: $, €, £
3. Loose: any XX.XX pattern

Make sure your receipt has a clear total amount!

---

## 🎯 Tips for Best Results

### Creating Test Receipts

✅ **DO:**
- Include clear "TOTAL" or "AMOUNT" label
- Use standard date formats (MM/DD/YYYY or YYYY-MM-DD)
- Keep file size under 1MB
- Use clear, readable fonts

❌ **AVOID:**
- Handwritten receipts
- Very low quality scans
- Complex multi-column layouts
- Receipts with heavy graphics/logos obscuring text

### Recommended Test Tool

🔗 **[Make Receipt](https://makereceipt.com/receipt-templates/sales/sales-receipt/)** - Perfect for testing!
- Clean, professional templates
- Easy to customize
- Generates text-based PDFs (fast parsing)
- Free to use

---

## 🔐 Security Notes

- `.env` file is gitignored (never commit API keys!)
- JWT tokens expire after login session
- API keys are server-side only
- File uploads are validated (PDF only)

---

## 🚧 Future Enhancements

- [ ] Database integration (MongoDB/PostgreSQL)
- [ ] Receipt image uploads (JPG, PNG)
- [ ] Multi-currency support
- [ ] Export to CSV/Excel
- [ ] Receipt storage & history
- [ ] Mobile app

---

## 📄 License

MIT License - feel free to use for learning and projects!

---

## 🤝 Contributing

Contributions welcome! Feel free to:
- Report bugs
- Suggest features
- Submit pull requests

---

## 💡 Support

Having issues? Check:
1. Server console logs (detailed parsing info)
2. Browser console (API responses)
3. [OCR.space documentation](https://ocr.space/ocrapi)

---

**Built with ❤️ using React, Node.js, and OCR.space**
