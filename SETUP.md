# 🚀 Expense Tracker - Setup Guide

Complete guide for setting up and running the Expense Tracker application in development and production environments.

---

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start Commands](#quick-start-commands)
- [Detailed Setup Guide](#detailed-setup-guide)
- [Environment Configuration](#environment-configuration)
- [Database Setup](#database-setup)
- [Running the Application](#running-the-application)
- [Demo Data & Testing](#demo-data--testing)
- [Production Deployment](#production-deployment)
- [Troubleshooting](#troubleshooting)

---

## ✅ Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: v16.0.0 or higher ([Download](https://nodejs.org/))
- **npm**: v7.0.0 or higher (comes with Node.js)
- **Git**: For cloning the repository ([Download](https://git-scm.com/))

**Optional:**
- **OCR.space API Key**: For scanning paper/image receipts ([Get Free Key](https://ocr.space/ocrapi))

---

## ⚡ Quick Start Commands

### 🎯 Single-Command Setup

Choose one based on your needs:

```bash
# 1. DEVELOPMENT with DEMO DATA (recommended for testing)
npm run setup:demo && npm run dev:fresh

# 2. DEVELOPMENT (clean database)
npm run setup && npm run dev

# 3. PRODUCTION with DEMO DATA
npm run setup:demo && npm run build && npm run start

# 4. PRODUCTION (clean database)
npm run setup && npm run start:fresh
```

**What Each Command Does:**

| Command | Install | Migrate | Seed | Build | Start | Use Case |
|---------|---------|---------|------|-------|-------|----------|
| `setup:demo` | ✅ | ✅ | ✅ | ❌ | ❌ | Testing with sample data |
| `setup` | ✅ | ✅ | ❌ | ❌ | ❌ | Fresh production setup |
| `dev:fresh` | ❌ | ✅ | ✅ | ❌ | ✅ Dev | Reset & run dev mode |
| `start:fresh` | ❌ | ✅ | ❌ | ✅ | ✅ Prod | Build & run production |

---

## 📖 Detailed Setup Guide

### Step 1: Clone the Repository

```bash
git clone https://github.com/HariEshwar-J-A/expense-tracker.git
cd expense-tracker
```

### Step 2: Install Dependencies

**Option A: Automatic (Recommended)**
```bash
npm install
```
This automatically installs dependencies for:
- Root project (concurrently)
- Client (React app)
- Server (Express API)

**Option B: Manual**
```bash
# Root
npm install

# Client
cd client
npm install
cd ..

# Server
cd server
npm install
cd ..
```

### Step 3: Configure Environment **[REQUIRED]**

> **⚠️ CRITICAL:** This step is REQUIRED before running any commands. The application will not work without proper `.env` configuration!

Create `server/.env` file:

```bash
cd server
cp .env.example .env
```

**Edit `server/.env` with your settings:**

```env
# Database Configuration (SQLite by default - no changes needed)
DB_TYPE=sqlite
DB_PATH=./data/expense_tracker.db

# JWT Configuration (REQUIRED - MUST CHANGE THIS!)
JWT_SECRET=your-secure-random-secret-key-here

# OCR Configuration (OPTIONAL - for receipt scanning)
OCR_SPACE_API_KEY=your-ocr-api-key-here
```

> **🔐 SECURITY WARNING:** 
> - **NEVER** use the default `JWT_SECRET` value!
> - **NEVER** commit your `.env` file to version control!
> - **ALWAYS** generate a strong, random JWT secret for production!

**Generate a secure JWT secret:**
```bash
# Using Node.js (recommended)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Output example:
# 4f3d8b7a9c2e1f6d4a8b3c7e9f1a2b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a

# Or use an online generator (for development only)
# https://randomkeygen.com/
```

### Step 4: Database Setup

The database will be automatically set up when you run the application, but you can also set it up manually:

```bash
# From project root
cd server

# Run migrations (creates tables)
npm run migrate:latest

# Optional: Seed demo data for testing
npm run seed
```

**What Gets Created:**
- ✅ `users` table (authentication)
- ✅ `expenses` table (expense tracking)
- ✅ Test user: `test@example.com` / `password123` (if seeded)
- ✅ ~315 sample expense entries (if seeded)

---

## 🔧 Environment Configuration

### Database Options

**SQLite (Default - Recommended)**
```env
DB_TYPE=sqlite
DB_PATH=./data/expense_tracker.db
```
- ✅ Fully tested and production-ready
- ✅ Zero configuration required
- ✅ Perfect for single-user deployments

**PostgreSQL (Available - Not Fully Tested)**
```env
DB_TYPE=postgres
DB_HOST=localhost
DB_PORT=5432
DB_NAME=expense_tracker
DB_USER=your_username
DB_PASSWORD=your_password
```

> **⚠️ PostgreSQL Status:**
> - Implemented via adapter pattern for future scalability
> - **Not fully tested** in production environments
> - Subject to validation and testing in future releases
> - Use SQLite for current deployments unless you're willing to test PostgreSQL yourself

### OCR API Setup (Optional)

For scanning physical/image receipts:

1. Visit [OCR.space](https://ocr.space/ocrapi)
2. Register for a free account (25,000 requests/month)
3. Copy your API key
4. Add to `server/.env`:
   ```env
   OCR_SPACE_API_KEY=K12345678901234
   ```

> **Note:** The app works fine without OCR for PDF receipts with embedded text.

---

## 💾 Database Setup

### Understanding Database Scripts

| Script | Command | What It Does |
|--------|---------|--------------|
| **Setup** | `npm run db:setup` | Run all migrations (production) |
| **Reset** | `npm run db:reset` | Rollback + Migrate + Seed (dev/testing) |
| **Migrate** | `npm run migrate:latest` | Apply pending migrations |
| **Rollback** | `npm run migrate:rollback` | Undo last migration |
| **Seed** | `npm run seed` | Load demo data |

### When to Use Each

**Fresh Start (Development):**
```bash
cd server
npm run db:reset
```

**Fresh Start (Production):**
```bash
cd server
npm run db:setup
```

**Add Sample Data:**
```bash
cd server
npm run seed
```

**Reset Everything:**
```bash
cd server
npm run db:reset
```

---

## 🎮 Running the Application

### Development Mode

**With Auto-Restart (Recommended):**
```bash
# From project root
npm run dev
```

This starts:
- 🟢 **Client**: [http://localhost:5173](http://localhost:5173) (React dev server)
- 🟢 **Server**: [http://localhost:5000](http://localhost:5000) (Express API)

**Fresh Start with Demo Data:**
```bash
npm run dev:fresh
```
Resets database, seeds demo data, and starts both servers.

**Manual Start (Separate Terminals):**
```bash
# Terminal 1 - Server
cd server
npm run dev

# Terminal 2 - Client
cd client
npm run dev
```

### Production Mode

**Build and Start:**
```bash
# Build client
npm run build

# Start server (serves built client)
npm start
```

**Fresh Production Setup:**
```bash
npm run start:fresh
```
Runs migrations, builds client, and starts production server.

**Access:**
- Application: [http://localhost:5000](http://localhost:5000)

---

## 🧪 Demo Data & Testing

### Using Demo Data

The app includes seed data for testing:

**Test Account:**
- Email: `test@example.com`
- Password: `password123`

**Sample Data:**
- ~300 expenses over the past year
- Multiple categories (Food, Transport, Utilities, etc.)
- Monthly budget: $3,000
- Various vendors and amounts

### Loading Demo Data

```bash
# One-time setup with demo data
npm run setup:demo

# OR manually
cd server
npm run seed
```

### Testing Receipt Parsing

1. **Create Test Receipt:**
   - Visit [Make Receipt](https://makereceipt.com/receipt-templates/sales/sales-receipt/)
   - Fill in details (Store, Date, Amount)
   - Download as PDF

2. **Upload to App:**
   - Login to your account
   - Click "New Expense"
   - Click "Scan Receipt"
   - Upload the PDF
   - Review auto-filled data
   - Save!

---

## 🌐 Production Deployment

### Pre-Deployment Checklist

- [ ] Change `JWT_SECRET` in `.env`
- [ ] Set `DB_TYPE=postgres` if using PostgreSQL
- [ ] Configure database credentials
- [ ] Set `NODE_ENV=production`
- [ ] Build client: `npm run build`
- [ ] Test production build locally

### Deployment Steps

**1. Prepare Environment**
```bash
# On your production server
git clone https://github.com/HariEshwar-J-A/expense-tracker.git
cd expense-tracker
```

**2. Configure**
```bash
cd server
cp .env.example .env
# Edit .env with production values
```

**3. Setup**
```bash
cd ..
npm run setup
```

**4. Build**
```bash
npm run build
```

**5. Start**
```bash
npm start
```

### Using Process Managers

**PM2 (Recommended):**
```bash
npm install -g pm2

# Start
pm2 start server/index.js --name expense-tracker

# View logs
pm2 logs expense-tracker

# Restart
pm2 restart expense-tracker

# Stop
pm2 stop expense-tracker
```

**Docker (Coming Soon):**
```bash
# Will be added in future release
docker-compose up -d
```

---

## 🔍 Troubleshooting

### Common Issues

**❌ "Cannot find module"**
```bash
# Solution: Reinstall dependencies
npm install
npm run postinstall
```

**❌ "Port 5000 already in use"**
```bash
# Solution 1: Kill the process
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:5000 | xargs kill -9

# Solution 2: Change port in server/index.js
```

**❌ "Database not found"**
```bash
# Solution: Run migrations
cd server
npm run migrate:latest
```

**❌ "OCR not working"**
```bash
# Check:
1. Is OCR_SPACE_API_KEY in .env?
2. Is the key valid?
3. Check server console for error messages
4. Try with text-based PDF first (OCR not needed)
```

**❌ "Budget not showing / User name missing"**
```bash
# This was a known bug, fixed in latest version
# Solution: Pull latest changes
git pull origin main
npm install
npm run dev
```

### Viewing Logs

**Development:**
- Server logs appear in terminal running `npm run dev`
- Client logs appear in browser console (F12)

**Production:**
```bash
# With PM2
pm2 logs expense-tracker

# Or check server output
tail -f logs/server.log
```

### Reset Everything

```bash
# Complete fresh start
rm -rf node_modules client/node_modules server/node_modules
rm -rf server/data/*.db
npm install
npm run setup:demo
npm run dev:fresh
```

---

## 📚 Additional Resources

- **[README.md](./README.md)**: Project overview and features
- **[API Documentation](./docs/api.md)**: REST API endpoints (coming soon)
- **[Contributing Guide](./CONTRIBUTING.md)**: How to contribute (coming soon)

---

## 🆘 Getting Help

**Issues or Questions?**

1. Check this guide and [README.md](./README.md)
2. Check server console for detailed logs
3. Check browser console for frontend errors
4. [Open an issue](https://github.com/HariEshwar-J-A/expense-tracker/issues)

---

## 📝 Quick Reference

### Essential Commands

```bash
# Setup
npm run setup:demo          # Install + migrate + seed
npm run setup               # Install + migrate only

# Development
npm run dev                 # Start development mode
npm run dev:fresh           # Reset DB and start dev

# Production
npm run build               # Build client
npm start                   # Start production server
npm run start:fresh         # Setup DB, build, and start

# Database
cd server
npm run migrate:latest      # Run migrations
npm run seed                # Load demo data
npm run db:reset            # Reset + seed 
npm run db:setup            # Production DB setup
```

---

**Built with ❤️ by Harieshwar Jagan Abirami**

*For the complete feature list and advanced usage, see [README.md](./README.md)*
