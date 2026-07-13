# BudgetNest API Documentation

Base URL (local): `http://localhost:5000/api`
Base URL (production): `https://<your-render-service>.onrender.com/api`

All protected routes require a header:
```
Authorization: Bearer <JWT_TOKEN>
```

Responses follow the shape `{ success: boolean, ...data }` on success, and
`{ success: false, message: string, errors?: [] }` on failure.

---

## Auth — `/api/auth`

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/register` | Public | Register a new user. Body: `name, email, password` |
| POST | `/login` | Public | Login. Body: `email, password` |
| GET | `/me` | Private | Get current logged-in user |
| PUT | `/profile` | Private | Update profile fields (name, avatar, monthlyIncome, monthlyBudget, currency, theme, notificationPrefs, defaultCategories, favoriteCategories, reminderTime) |
| PUT | `/change-password` | Private | Body: `currentPassword, newPassword` |

## Expenses — `/api/expenses`

| Method | Route | Description |
|---|---|---|
| GET | `/` | List expenses. Query: `page, limit, category, paymentMethod, startDate, endDate, sortBy, sortOrder` |
| GET | `/search?q=` | Search by title/category/notes/amount |
| GET | `/export/csv` | Returns JSON array ready for CSV conversion |
| GET | `/export/pdf` | Returns JSON array ready for PDF conversion |
| POST | `/` | Create expense (multipart/form-data if attaching a file). Fields: title, amount, category, paymentMethod, date, notes, isRecurring, tags, location, attachment |
| POST | `/bulk-delete` | Body: `{ ids: [] }` |
| GET / PUT / DELETE | `/:id` | Get, update, or delete a single expense |
| POST | `/:id/duplicate` | Duplicate an existing expense |

## Budgets — `/api/budgets`

| Method | Route | Description |
|---|---|---|
| GET | `/current` | Current month's budget + usage |
| POST | `/` | Create/update budget for a month. Body: `month, year, totalBudget, categoryBudgets` |
| GET | `/history` | Past budgets |
| GET | `/category/:category` | Category-specific budget usage |

## Assets — `/api/assets`

| Method | Route | Description |
|---|---|---|
| GET | `/` | List assets. Query: `status` |
| POST | `/` | Create asset: `name, purchasePrice, purchaseDate, expectedLifetime, status, category, notes` |
| PUT / DELETE | `/:id` | Update / delete asset |

## Groceries — `/api/groceries`

| Method | Route | Description |
|---|---|---|
| GET | `/` | List grocery entries |
| GET | `/inventory` | Aggregated inventory dashboard |
| POST | `/` | Create grocery entry: `item, category, quantity, unit, purchaseDate, price, estimatedRemainingQuantity` |
| PUT / DELETE | `/:id` | Update / delete entry |

## Recurring Expenses — `/api/recurring`

| Method | Route | Description |
|---|---|---|
| GET | `/` | List recurring expenses |
| POST | `/` | Create: `title, amount, category, frequency, nextDueDate, isActive, notes` |
| PUT / DELETE | `/:id` | Update / delete |

A daily cron job (midnight) auto-generates expenses for due recurring items and
sends a notification.

## Analytics — `/api/analytics`

| Method | Route | Description |
|---|---|---|
| GET | `/dashboard` | All dashboard widgets in one call |
| GET | `/monthly?months=6` | Monthly totals |
| GET | `/weekly?weeks=4` | Weekly totals |
| GET | `/daily-trend?days=30` | Daily spending trend |
| GET | `/insights` | Auto-generated natural-language insights |
| GET | `/category-breakdown` | Pie-chart ready category totals |
| GET | `/heatmap` | Expense heatmap data |

## Reports — `/api/reports`

| Method | Route | Description |
|---|---|---|
| GET | `/monthly/:year/:month` | Full monthly report (breakdowns, top category, most expensive day) |
| GET | `/weekly` | Current week report |
| GET | `/category/:category?months=6` | Category trend over N months |

## Notifications — `/api/notifications`

| Method | Route | Description |
|---|---|---|
| GET | `/` | List notifications + unread count |
| PUT | `/read-all` | Mark all as read |
| PUT | `/:id/read` | Mark one as read |

---

## Error Codes

| Status | Meaning |
|---|---|
| 400 | Validation error / bad request |
| 401 | Missing/invalid/expired token |
| 403 | Forbidden |
| 404 | Resource not found |
| 429 | Rate limit exceeded |
| 500 | Server error |

## Security

- JWT auth (30-day expiry by default)
- Passwords hashed with bcrypt (12 salt rounds)
- `helmet` for secure headers
- Rate limiting on all `/api` routes and stricter limiting on `/api/auth`
- Input sanitization to guard against NoSQL injection & XSS
- CORS restricted to `CLIENT_URL`
