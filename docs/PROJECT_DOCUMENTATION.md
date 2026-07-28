# BudgetNest — Project Documentation

A full-stack expense manager built for students/hostel life — tracks daily expenses, groceries, one-time asset purchases, and recurring bills, with automated reminders and yearly/monthly reporting.

**Live app:** https://budgetnest-six.vercel.app
**API base:** https://budgetnest-api-w3ww.onrender.com/api

---

## 1. Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React (Vite), Tailwind CSS, React Router v6, Axios, React Hook Form, Recharts, Framer Motion, lucide-react |
| Backend | Node.js, Express.js |
| Database | MongoDB (Atlas), Mongoose |
| Auth | JWT, bcryptjs |
| Validation/Security | express-validator, express-rate-limit, Helmet, CORS |
| Scheduled Jobs | node-cron (internal) + cron-job.org (external keep-alive/trigger) |
| File Handling | Multer (attachments), jsPDF + jspdf-autotable (PDF export), PapaParse (CSV export) |
| Hosting | Vercel (frontend), Render free tier (backend), MongoDB Atlas free M0 (database) |

---

## 2. Architecture Overview

```
Browser (React SPA on Vercel)
        │  HTTPS / JWT Bearer token
        ▼
Express API (Render, Node.js)
        │  Mongoose
        ▼
MongoDB Atlas
        ▲
        │  scheduled pings
cron-job.org (external scheduler)
```

- The frontend is a static Vite build served by Vercel; it talks to the backend purely over REST.
- The backend is a single Express app on Render's free tier, which **sleeps after ~15 minutes of inactivity**. An external scheduler (cron-job.org) pings it regularly to keep it warm and to trigger the scheduled background jobs (see §6), since Render's free tier can't be trusted to run `node-cron` schedules reliably while asleep.
- All dates/times that matter to the user (recurring due dates, budget-alert timing, reminders) are computed in **IST (Asia/Kolkata, UTC+5:30)**, not the server's native UTC clock — this was a recurring class of bug during development (see §8) and is now centralized in `server/utils/dateUtils.js`.

---

## 3. Features

### Authentication
- Register / Login / Logout, JWT-based sessions (30-day expiry by default)
- Password hashing via bcrypt
- **Token versioning**: changing your password or using "Log out of all other devices" (Settings → Security) invalidates every previously issued token instantly, even though JWTs can't normally be revoked before they expire
- Persistent login (token stored in localStorage)

### Dashboard
- Monthly Budget / Spent / Remaining / Safe Daily Spending
- Budget progress bar, today/this-week spend, days left in month
- Top spending categories (donut chart)
- Recent transactions
- Auto-generated natural-language insights (e.g. "You spent 28% more on food this month")
- **Planned Expenses Due widget** — see below

### Expenses
- Full CRUD, with category, payment method, date, notes, tags, optional location/attachment
- **Quantity field** — supports logging multiples of the same item in one entry
- **Duplicate detection** — adding an expense that matches an existing same-day entry (same title/category/amount) prompts you to merge instead of creating a duplicate
- **Retroactive merge** — a per-row action finds and offers to merge with an existing matching same-day entry after the fact
- **Bulk "Merge Selected"** — select 2+ expenses via checkboxes and merge them, but only if they share the same title, category, **and** calendar day (strict — prevents accidentally merging unrelated purchases)
- **Merge history** — every merge records exactly what was folded in (title, amount, quantity, date); tap the "merged (N)" badge to view it
- **Unmerge** — individually undo any item out of a merged entry, restoring it as its own standalone expense again
- **Planned/future expenses** — check "This is a planned/upcoming expense" to log something for a future date without it counting toward spend totals or budget until you later confirm it was actually spent
- Search, filter, sort, pagination
- Export to CSV and PDF

### Budgets
- Monthly budget + per-category budgets
- Automatic budget-exceeded / budget-warning (80%+) notifications
- Safe daily spending calculation
- Budget history

### Groceries
- Track item, quantity, unit, price, purchase date, estimated remaining quantity
- Inventory dashboard (low-stock indicators)
- **Every grocery purchase automatically creates a linked Expense** (mapped to a sensible category — e.g. Dairy → Milk) so it counts toward Monthly Spent/budget/analytics, while still being tracked separately here. Editing/deleting a grocery entry keeps its linked expense in sync.

### Assets
- One-time purchases (furniture, appliances, etc.) — price, purchase date, expected lifetime, status
- **Also auto-creates a linked Expense**, filed under a dedicated "Assets" category, for the same reason as groceries above

### Recurring Expenses
- Rent, internet, subscriptions, etc. — amount, category, frequency, next due date
- A daily cron job auto-generates the actual Expense entry when the due date arrives, and pushes the next due date forward
- **IST-aware due-date comparison** — critical fix, see §8

### Analytics
- Pie / bar / line charts, monthly & weekly comparisons, daily spending trend, category breakdown, spending heatmap
- Custom (user-typed, non-preset) categories get a consistent, distinct color instead of all collapsing into gray

### Reports
- **Monthly**, **Weekly**, and **Yearly** report tabs
- Yearly report: full Jan–Dec breakdown with per-month totals/transaction counts, a grand total row, highest month, and average-per-active-month stat
- Export any report as PDF (Rupee symbol rendered as "Rs." in PDFs specifically — jsPDF's default fonts can't render the ₹ glyph; the on-screen app still shows the real ₹ everywhere)
- Export raw expense data as CSV

### Notifications
In-app bell with unread badge. Backed by four automated checks (see §6):
1. **Budget exceeded/warning** — daily
2. **Recurring expense processed** — when a bill auto-generates
3. **"No expense logged today"** — reminds you at your configured time (Settings) if you haven't logged anything that day
4. **Planned expense due** — reminds you, by name, about a specific planned expense once its date arrives (today or overdue) — never a generic blast, and never touches your spending automatically. You confirm "Yes, I spent it" or leave it for later directly from the Dashboard widget.

### Settings
- Profile (name, monthly income/budget, currency, avatar)
- Notification preferences + reminder time
- Favorite/default categories
- Dark/light theme
- **Security**: change password, log out of all other devices

---

## 4. Database Collections

| Collection | Purpose |
|---|---|
| `users` | Account, profile, preferences, `tokenVersion` |
| `expenses` | All actual + planned expenses. Includes `isPlanned`, `quantity`, `mergeHistory[]` |
| `budgets` | Monthly budget + category budgets |
| `assets` | One-time purchases; `linkedExpenseId` points to its auto-created expense |
| `groceries` | Inventory items; `linkedExpenseId` points to its auto-created expense |
| `recurringexpenses` | Recurring bill templates + `nextDueDate` |
| `notifications` | In-app notifications (`type`, `relatedId`, `isRead`) |

---

## 5. API Reference (summary)

Base URL: `/api`. Protected routes require `Authorization: Bearer <token>`.

| Area | Routes |
|---|---|
| Auth | `POST /auth/register`, `POST /auth/login`, `GET /auth/me`, `PUT /auth/profile`, `PUT /auth/change-password`, `POST /auth/logout-all` |
| Expenses | `GET/POST /expenses`, `GET/PUT/DELETE /expenses/:id`, `GET /expenses/search`, `GET /expenses/check-duplicate`, `GET /expenses/planned-due`, `POST /expenses/merge`, `POST /expenses/:id/unmerge-item`, `POST /expenses/:id/duplicate`, `POST /expenses/bulk-delete`, `GET /expenses/export/csv`, `GET /expenses/export/pdf` |
| Budgets | `GET /budgets/current`, `POST /budgets`, `GET /budgets/history`, `GET /budgets/category/:category` |
| Assets | `GET/POST /assets`, `PUT/DELETE /assets/:id` |
| Groceries | `GET/POST /groceries`, `PUT/DELETE /groceries/:id`, `GET /groceries/inventory` |
| Recurring | `GET/POST /recurring`, `PUT/DELETE /recurring/:id` |
| Analytics | `GET /analytics/dashboard`, `/monthly`, `/weekly`, `/daily-trend`, `/insights`, `/category-breakdown`, `/heatmap` |
| Reports | `GET /reports/monthly/:year/:month`, `/weekly`, `/yearly/:year`, `/category/:category` |
| Notifications | `GET /notifications`, `PUT /notifications/read-all`, `PUT /notifications/:id/read` |
| Cron (secret-protected) | `GET/POST /cron/run-recurring`, `/run-budget-check`, `/run-daily-reminder`, `/run-planned-check`, `/run-all` (all require `?key=CRON_SECRET`) |

---

## 6. Automated Background Jobs

Runs via `node-cron` inside the Express app, all pinned to `Asia/Kolkata` timezone explicitly (see §8 for why this matters):

| Job | Schedule (IST) | What it does |
|---|---|---|
| Recurring processing | Midnight | Converts due recurring templates into real expenses |
| Budget check | 9:00 PM | Notifies if 80%+ / 100%+ of monthly budget used |
| Planned-expense check | 8:00 AM | Notifies about planned expenses due today/overdue |
| Daily reminder | Every hour (self-limits to once/day per user, after their configured time) | Reminds if nothing's been logged that day |

**These only fire reliably if the server is awake at the scheduled time.** Since Render's free tier sleeps, the app also exposes secret-protected HTTP endpoints (`/api/cron/*`, see §5) that run the same logic on demand — an external scheduler (cron-job.org) is configured to hit these regularly, which both wakes the server and runs the checks, making everything effectively fully automatic.

---

## 7. Environment Variables

**Server** (`server/.env`):
```
PORT=5000
NODE_ENV=production
MONGO_URI=<MongoDB Atlas connection string>
JWT_SECRET=<random string>
JWT_EXPIRE=30d
CLIENT_URL=<frontend URL, for CORS>
CRON_SECRET=<random string, protects /api/cron/* endpoints>
```

**Client** (`client/.env`):
```
VITE_API_URL=<backend URL + /api>
VITE_APP_NAME=BudgetNest
```

---

## 8. Notable Bugs Fixed During Development

Worth keeping a record of these since they were subtle and could easily resurface:

- **Timezone (IST vs UTC) mismatches** — appeared independently in three places: cron schedule times, the "future date" validator, and the recurring-expense due-date comparison. Root cause: `new Date()` on Render reflects the server's own (UTC) clock, not the user's (IST). Fixed by centralizing IST-aware date math in `server/utils/dateUtils.js` and using it everywhere date comparisons matter to the user.
- **MongoDB injection sanitizer breaking arrays** — the input-sanitizing middleware converted arrays into plain objects, silently breaking `isArray()` validation on fields like `tags`.
- **PUT (edit) endpoint skipping validation entirely** — editing an expense could bypass rules that only ran on create.
- **jsPDF can't render the ₹ glyph** — exported PDFs showed a garbled character; fixed by using a PDF-specific "Rs." formatter only inside PDF generation.
- **Vite's default build output folder (`assets/`) collided with the app's own `/assets` route** — refreshing directly on that page served raw JS instead of the app. Fixed by renaming Vite's output folder to `_assets`.
- **Render's `X-Forwarded-For` header vs Express `trust proxy`** — needed `app.set('trust proxy', 1)` for rate-limiting to correctly identify visitor IPs behind Render's proxy.

---

## 9. Known Limitations

- Uploaded expense attachments don't persist across Render redeploys (free tier has ephemeral disk storage).
- Recurring/budget/reminder checks depend on an external scheduler (cron-job.org) to run reliably, since Render's free tier sleeps.
- No per-user timezone setting — all "today"/date logic assumes IST.
- Editing or deleting an expense that was auto-created from a Grocery/Asset directly (rather than through the Grocery/Asset page) leaves that item's `linkedExpenseId` pointing to nothing; not actively guarded against.

---

## 10. Deployment

See `docs/DEPLOYMENT.md` for the original step-by-step guide (MongoDB Atlas → Render → Vercel setup). Summary of the ongoing workflow:

```bash
git add .
git commit -m "..."
git push
```
Render and Vercel both auto-deploy on push to `main`. Render's free tier requires the CRON_SECRET-protected endpoints + an external pinger (cron-job.org) to stay reliably awake and to run scheduled jobs on time.
