const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const cron = require('node-cron');
require('dotenv').config();

const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const { sanitizeInput } = require('./middleware/validate');
const { apiLimiter, authLimiter } = require('./middleware/rateLimiter');
const { runRecurringCheck, runBudgetCheck } = require('./services/cronJobs');

// Connect to database
connectDB();

const app = express();

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Sanitize all inputs
app.use(sanitizeInput);

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Rate limiting
app.use('/api/', apiLimiter);
app.use('/api/auth', authLimiter);

// Static files (uploads)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/expenses', require('./routes/expenseRoutes'));
app.use('/api/budgets', require('./routes/budgetRoutes'));
app.use('/api/assets', require('./routes/assetRoutes'));
app.use('/api/groceries', require('./routes/groceryRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/recurring', require('./routes/recurringRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));
app.use('/api/cron', require('./routes/cronRoutes'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'BudgetNest API is running', timestamp: new Date() });
});

// Error handler
app.use(errorHandler);

// Cron jobs
cron.schedule('0 0 * * *', async () => {
  console.log('[Cron] Processing recurring expenses...');
  await runRecurringCheck();
});

cron.schedule('0 21 * * *', async () => {
  console.log('[Cron] Checking budget alerts...');
  await runBudgetCheck();
});

// Create uploads directory
const fs = require('fs');
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 BudgetNest API running on port ${PORT}`);
});
