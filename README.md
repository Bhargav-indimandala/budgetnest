# 🏠 BudgetNest — Smart Expense Manager for Students

A production-ready, full-stack expense manager built for college students
living in hostels or rented rooms — track daily spending, groceries,
one-time assets, recurring bills, and get automatic budget insights.

![Node](https://img.shields.io/badge/Node.js-20-339933?logo=node.js&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-blue)

---

## ✨ Features

- **Auth:** register/login/logout, JWT, bcrypt hashing, protected routes, persistent login, profile & password management
- **Dashboard:** budget vs spent, remaining days, safe daily spend, today/weekly/monthly totals, recent transactions, top category, budget progress bar, month-over-month savings
- **Expenses:** full CRUD, 20 preset categories, tags, recurring flag, optional location & attachment, search/filter/sort/pagination, CSV & PDF export, duplicate, bulk delete
- **Budgets:** monthly + per-category budgets, exceed alerts, safe-daily-spend calculation, history
- **Assets:** track one-time purchases (bucket, mattress, fan, stove, etc.) with price, purchase date, expected lifetime, and status
- **Groceries:** inventory tracker with quantity, unit, price, and estimated remaining stock
- **Analytics:** pie/bar/line charts, monthly & weekly comparisons, daily trend, top categories, averages, most expensive day/category
- **Insights:** auto-generated natural language spending insights
- **Recurring expenses:** rent/internet/water/subscriptions with a daily cron job that auto-creates expenses and reminders
- **Notifications:** in-app bell with unread badge, mark-as-read/all
- **Reports:** monthly & weekly report pages with CSV/PDF export
- **Settings:** profile, monthly income/budget, currency, favorite categories, notification preferences, reminder time, dark/light theme

---

## 🧱 Tech Stack

**Frontend:** React (Vite), Tailwind CSS, React Router, Axios, React Hook Form, Recharts, Framer Motion
**Backend:** Node.js, Express.js
**Database:** MongoDB Atlas (Mongoose)
**Auth:** JWT + bcrypt
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
│   └── seed.js             # demo data seeder
├── docs/
│   ├── API.md               # full API reference
│   └── DEPLOYMENT.md        # step-by-step free deployment guide
└── render.yaml               # Render blueprint for one-click backend deploy
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
# then edit server/.env with your MONGO_URI and a strong JWT_SECRET

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
2. **Render** — deploy `server/` as a free Web Service (uses `render.yaml`), set `MONGO_URI`, `JWT_SECRET`, `CLIENT_URL`.
3. **Vercel** — deploy `client/` as a Vite project, set `VITE_API_URL` to your Render backend URL + `/api`.

---

## 📚 API Reference

See [`docs/API.md`](docs/API.md) for the full list of endpoints, request bodies, and status codes.

---

## 🔒 Security

JWT auth · bcrypt password hashing · Helmet secure headers · rate limiting ·
express-validator input validation · NoSQL-injection & XSS sanitization ·
CORS restricted to a configured client origin · secrets via environment
variables only (never committed).

---

## 📝 License

MIT
