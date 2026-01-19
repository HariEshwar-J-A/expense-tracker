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

### 📊 Dashboard Analytics
- **Budget Period Toggle**: Switch between monthly and yearly budget views on the fly
- **Visual Insights**: Interactive charts using D3.js
  - Spending by Category (Pie Chart with smart label positioning)
  - Monthly Trends (Bar Chart with 6-month history)
- **Key Metrics**: Total Spend, Avg Transaction, Top Category, Top Vendor
- **Advanced Widgets**:
  - Safe-to-Spend Gauge (shows remaining budget visually)
  - Spending Velocity (tracks spending pace vs. time remaining)
- **Trend Analysis**: Daily and weekly spending aggregation
- **Category Breakdown**: Visual pie charts with collision-free labels

### 📝 Enhanced Reporting
- **Professional PDF Exports**: Executive summary, category breakdown, and detailed transaction tables
- **Smart Formatting**: Zebra striping, pagination, and total calculations
- **Secure Filenames**: Auto-generated timestamps and safe user identifiers

### 📱 Mobile Responsive Design
- **Adaptive Layout**: Optimized for phones, tablets, and desktops
- **Touch-friendly**: Large buttons and scrollable tables
- **Responsive Charts**: D3 visualizations scale to any screen size

### 💰 Smart Budget Planning
- **Flexible Budget Periods**: Toggle between monthly and yearly budget views
- **Safe-to-Spend Gauge**: Visual indicator showing remaining budget
- **Spending Velocity**: Track spending pace against budget timeline

### 📊 Comprehensive Expense Management
- **Advanced Filtering**:
  - Filter by date range (custom start and end dates)
  - Filter by category (Food, Transport, Utilities, etc.)
  - Filter by vendor name
  - Combine multiple filters simultaneously
- **Flexible Sorting**:
  - Sort by date (newest/oldest first)
  - Sort by amount (highest/lowest first)
  - Sort by vendor (A-Z or Z-A)
  - Sort by category
- **Pagination**: Navigate through large expense lists efficiently
- **CRUD Operations**: Create, Read, Update, and Delete expense entries

### 📤 Import/Export Capabilities
- **Multi-format Export**: 
  - **PDF**: Professional reports with executive summary, category breakdown, and detailed tables
  - **CSV**: Spreadsheet-compatible format for data analysis
  - **JSON**: Full data export for backup and migration
- **Multi-format Import**: 
  - **CSV**: Import expense data from spreadsheets
  - **JSON**: Restore from JSON backups
  - **PDF Receipts**: Single receipt parsing (not bulk import)

> **⚠️ IMPORT WARNING:**
> - CSV and JSON imports can create duplicate entries if used carelessly
> - **Use import only as a last resort** (e.g., migrating from another app, restoring backups)
> - Always review imported data before saving
> - PDF receipt uploads parse ONE receipt at a time with duplicate detection enabled
> - Bulk PDF imports are NOT supported to prevent accidental duplicates

### 💾 Robust Data Layer
- **Knex.js Integration**: Professional SQL query builder
- **Multi-DB Support**: 
  - **SQLite** (Default, fully tested, zero-config)
  - **PostgreSQL** (Available via adapter pattern, not fully tested - subject to future validation)
- **Data Persistence**: All Expenses and Users persisted to database

> **⚠️ Database Note:** PostgreSQL support is implemented via the adapter pattern but has not been fully tested in production. SQLite is recommended for current deployments. PostgreSQL validation is planned for future releases.

### 🔐 Authentication
- JWT-based secure authentication
- User registration & login
- Protected routes
- **Security Best Practices**: HttpOnly cookies & Secure headers

---

## ▶️ HOW TO RUN APP

> **📘 NEW:** For detailed setup instructions including single-command setup, environment configuration, and troubleshooting, see **[SETUP.md](./SETUP.md)**

### ⚠️ IMPORTANT: Configure Environment First!

**Before running any setup commands, you MUST create and configure your `.env` file:**

```bash
cd server
cp .env.example .env
```

**Edit `server/.env` and set these required values:**

```env
# REQUIRED - Change this to a secure random string!
JWT_SECRET=your-secure-random-secret-change-this-before-running

# Database (SQLite is default - no changes needed)
DB_TYPE=sqlite
DB_PATH=./data/expense_tracker.db

# OPTIONAL - Only needed for scanning scanned/image receipts
OCR_SPACE_API_KEY=your-ocr-api-key-here
```

> **🔐 Security Warning:** Never use the default `JWT_SECRET` in production! Generate a secure random key:
> ```bash
> node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
> ```

---

### ⚡ Quick Start

#### One-Command Setup (Recommended)

```bash
# Development with demo data
npm run setup:demo && npm run dev:fresh

# OR Production
npm run setup && npm run start:fresh
```

### 🚀 Manual Setup

1. **Install Dependencies** (Root, Client, Server)
   ```bash
   npm install && npm run postinstall
   ```

2. **Start Development (Both Client & Server)**
   ```bash
   npm run dev
   ```
   - Client: [http://localhost:5173](http://localhost:5173)
   - Server: [http://localhost:5000](http://localhost:5000)

### 📦 Production Build

1. **Build Client**
   ```bash
   npm run build
   ```

2. **Start Production Server**
   ```bash
   npm start
   ```
   - The app will be available at [http://localhost:5000](http://localhost:5000)

### � Manual Setup (Legacy)

If you prefer running them separately:

#### Backend
1. `cd server`
2. `npm install`
3. Configure `.env`
4. `npm run dev`

#### Frontend
1. `cd client`
2. `npm install`
3. `npm run dev`

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
- Material-UI (with latest SlotProps API)
- React Router
- Axios
- D3.js (for custom data visualization)

**Backend:**
- Node.js + Express
- JWT Authentication
- Multer (file uploads)
- pdf-parse (text extraction)
- OCR.space API (OCR fallback)
- Knex.js (SQL Query Builder)

**Data Storage:**
- SQLite (Default, Zero-config)
- PostgreSQL (Production ready)
- Extensible Adapter Pattern

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

> **🚀 Coming Soon:** Fully hosted app will be available soon for public (dev community) use, with more fun features.

- [x] Database integration (SQLite/PostgreSQL via Knex)
- [x] Receipt storage & history (Persisted in DB)
- [x] Advanced PDF Reporting
- [x] Export to CSV/JSON
- [x] Import from CSV/JSON
- [x] Receipt image uploads (JPG, PNG)
- [ ] Budget History Tracking (track income and budget changes over time with effective dates)
- [ ] Month-Specific Budgets (set different budgets for different months)
- [ ] Multi-currency support
- [ ] Bulk PDF receipt uploads with duplicate prevention
- [ ] Mobile app

---

## 📄 License

MIT License - Copyright (c) 2026 Harieshwar Jagan Abirami

---

## 👤 Author

**Harieshwar Jagan Abirami**
- Email: [harieshwarja.official@gmail.com](mailto:harieshwarja.official@gmail.com)
- GitHub: [@HariEshwar-J-A](https://github.com/HariEshwar-J-A)

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

## 📚 Documentation

- **[SETUP.md](./SETUP.md)**: **Complete setup guide** with single-command installations, environment configuration, and troubleshooting
- **[Feature Showcase](./docs/marketing_features.md)**: A comprehensive business-level overview of capabilities
- **[Technical Architecture & ADRs](./docs/technical_architecture.md)**: Deep dive into engineering decisions (Stack, Database, Parsing)
- **[Streaming Export Implementation](./docs/streaming_plan.md)**: Architectural plan for implementing unlimited CSV/PDF exports
- **[Money Saving Strategies & Roadmap](./docs/money_saving_strategies.md)**: Explore planned features like Smart Budgets, Subscription Detective, and AI Insights designed to help you reduce expenses and maximize savings

**Built with ❤️ using React, Node.js, and OCR.space**
