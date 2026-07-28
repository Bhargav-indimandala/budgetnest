# 🏠 BudgetNest — Smart Expense Manager for Students

A production-ready, full-stack expense manager built for college students living in hostels or rented rooms — track daily spending, groceries, one-time asset purchases, and recurring bills, with automated reminders and yearly/monthly reporting.

![Node](https://img.shields.io/badge/Node.js-20-339933?logo=node.js&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-blue)

---

## 🌐 Live Demo

- **App:** [budgetnest-six.vercel.app](https://budgetnest-six.vercel.app)
- **API health check:** [budgetnest-api-w3ww.onrender.com/api/health](https://budgetnest-api-w3ww.onrender.com/api/health)

> Backend runs on Render's free tier, which sleeps after ~15 minutes of inactivity. The first request after idling can take up to a minute to wake up — that's expected, not a bug.

---

## ✨ Features

- **Auth:** register/login/logout, JWT, bcrypt hashing, protected routes, persistent login, profile management, change password, and "log out of all other devices" (instant session revocation via token versioning)
- **Dashboard:** budget vs spent, remaining days, safe daily spend, today/weekly/monthly totals, recent transactions, top category, budget progress bar, month-over-month comparison, and a **planned-expenses-due widget** where you confirm whether you actually spent what you'd planned
- **Expenses:** full CRUD, 20+ categories, tags, quantity support, optional location/attachment, search/filter/sort/pagination, CSV & PDF export
  - **Smart duplicate detection** — offers to merge instead of creating duplicate same-day entries
  - **Bulk merge** — select multiple matching entries and combine them, with full merge history and the ability to unmerge individual items back out later
  - **Planned/future expenses** — log something for a future date without it counting toward your budget until you confirm it was actually spent
- **Budgets:** monthly + per-category budgets, automatic exceed/warning alerts, safe-daily-spend calculation, history
- **Groceries & Assets:** dedicated inventory/lifecycle tracking, with purchases **automatically counted in your monthly spend** (while still shown separately) — no manual double-entry needed
- **Recurring expenses:** rent/internet/subscriptions auto-convert into real expenses on their due date via a scheduled job
- **Analytics:** pie/bar/line charts, monthly & weekly comparisons, daily trend, category breakdown (with consistent colors even for custom categories), spending heatmap, auto-generated natural-language insights
- **Reports:** Monthly, Weekly, and **Yearly** (full 12-month breakdown with grand total) — export any of them as CSV or PDF
- **Notifications:** budget alerts, recurring-expense confirmations, "you haven't logged anything today" reminders, and planned-expense-due reminders — all fully automated via scheduled background jobs
- **Settings:** profile, monthly income/budget, currency, favorite categories, notification preferences & reminder time, dark/light theme, security controls

---

## 🧱 Tech Stack

**Frontend:** React (Vite), Tailwind CSS, React Router, Axios, React Hook Form, Recharts, Framer Motion
**Backend:** Node.js, Express.js
**Database:** MongoDB Atlas (Mongoose)
**Auth:** JWT + bcrypt
**Scheduling:** node-cron (internal) + [cron-job.org](https://cron-job.org) (external keep-alive/trigger, since Render's free tier sleeps)
**Deployment:** Vercel (frontend) · Render (backend) · MongoDB Atlas (database) — all free tiers

---

## 📁 Folder Structure

```
BudgetNest/
├── client/                 # React frontend
│   └── src/
│       ├── components/     # common/, layout/, expenses/
│       ├── context/        # AuthContext, ThemeContext
│       ├── pages/          # Dashboard, Expenses, Budget, Analytics, Grocery,
│       │                   # Assets, Recurring, Reports, Settings, Login, Register
│       ├── services/       # axios api instance
│       └── utils/          # constants, formatters
├── server/                 # Express backend
│   ├── controllers/
│   ├── models/             # User, Expense, Budget, Asset, Grocery,
│   │                       # Notification, RecurringExpense, Report
│   ├── middleware/         # auth, validation, rate limiting, upload, errors
│   ├── routes/
│   ├── services/           # cronJobs.js — scheduled background checks
│   ├── utils/               # dateUtils.js (IST-aware date logic)
│   └── seed.js              # demo data seeder
├── docs/
│   ├── API.md                    # API reference
│   ├── DEPLOYMENT.md             # step-by-step free deployment guide
│   └── PROJECT_DOCUMENTATION.md  # full architecture, features, and fixed-bugs history
└── render.yaml                # Render blueprint for one-click backend deploy
```

---

## 🚀 Quick Start (Local)

**Requirements:** Node.js 18+, a MongoDB connection (local or free Atlas cluster)

```bash
git clone <your-repo-url> BudgetNest
cd BudgetNest

# Install everything
npm run install:all

# Configure environment variables
cp server/.env.example server/.env
cp client/.env.example client/.env
# then edit server/.env with your MONGO_URI, JWT_SECRET, and CRON_SECRET

# (optional) seed demo data
npm run seed

# Run frontend + backend together
npm run dev
```

- Frontend: http://localhost:5173
- Backend health check: http://localhost:5000/api/health

---

## 🌍 Deploying for Free

Full walkthrough in [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md). Summary:

1. **MongoDB Atlas** — create a free M0 cluster, allow access from anywhere, copy the connection string.
2. **Render** — deploy `server/` as a free Web Service (uses `render.yaml`), set `MONGO_URI`, `JWT_SECRET`, `CLIENT_URL`, `CRON_SECRET`.
3. **Vercel** — deploy `client/` as a Vite project, set `VITE_API_URL` to your Render backend URL + `/api`.
4. **cron-job.org** (recommended) — schedule regular pings to `/api/cron/*` endpoints so scheduled jobs (recurring bills, budget alerts, reminders) run reliably even though Render's free tier sleeps. Details in `docs/PROJECT_DOCUMENTATION.md` §6.

---

## 📚 Documentation

- [`docs/API.md`](docs/API.md) — endpoint reference, request/response shapes, status codes
- [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) — step-by-step free deployment guide
- [`docs/PROJECT_DOCUMENTATION.md`](docs/PROJECT_DOCUMENTATION.md) — full architecture overview, complete feature list, database schema, automated job schedule, environment variables, and a record of notable bugs fixed during development (useful if similar issues resurface)

---

## 🔒 Security

JWT auth with instant multi-device revocation (token versioning) · bcrypt password hashing · Helmet secure headers · rate limiting · express-validator input validation · NoSQL-injection & XSS sanitization · CORS restricted to a configured client origin · secrets via environment variables only (never committed).

---

## 📝 License

MIT
