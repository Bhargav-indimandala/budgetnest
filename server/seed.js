const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');
const Expense = require('./models/Expense');
const Budget = require('./models/Budget');
const Asset = require('./models/Asset');
const Grocery = require('./models/Grocery');
const RecurringExpense = require('./models/RecurringExpense');
const Notification = require('./models/Notification');

const connectDB = require('./config/db');

const seed = async () => {
  await connectDB();

  console.log('🗑️  Clearing existing data...');
  await Promise.all([
    User.deleteMany({}),
    Expense.deleteMany({}),
    Budget.deleteMany({}),
    Asset.deleteMany({}),
    Grocery.deleteMany({}),
    RecurringExpense.deleteMany({}),
    Notification.deleteMany({}),
  ]);

  console.log('👤 Creating demo user...');
  const user = await User.create({
    name: 'Rahul Sharma',
    email: 'rahul@demo.com',
    password: 'password123',
    monthlyIncome: 15000,
    monthlyBudget: 12000,
    currency: 'INR',
    theme: 'dark',
  });

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  console.log('💰 Creating expenses...');
  const expenseData = [
    { title: 'Monthly Rent', amount: 4500, category: 'Rent', paymentMethod: 'UPI', date: new Date(year, month, 1), notes: 'Hostel room rent' },
    { title: 'Rice 5kg', amount: 350, category: 'Rice', paymentMethod: 'Cash', date: new Date(year, month, 2) },
    { title: 'Cooking Oil 1L', amount: 180, category: 'Oil', paymentMethod: 'UPI', date: new Date(year, month, 2) },
    { title: 'Milk Weekly', amount: 280, category: 'Milk', paymentMethod: 'Cash', date: new Date(year, month, 3) },
    { title: 'Vegetables', amount: 220, category: 'Vegetables', paymentMethod: 'Cash', date: new Date(year, month, 3) },
    { title: 'Eggs 1 dozen', amount: 90, category: 'Eggs', paymentMethod: 'Cash', date: new Date(year, month, 4) },
    { title: 'Curd 500g', amount: 45, category: 'Curd', paymentMethod: 'Cash', date: new Date(year, month, 4) },
    { title: 'Bus Pass', amount: 500, category: 'Transport', paymentMethod: 'UPI', date: new Date(year, month, 5) },
    { title: 'Internet Bill', amount: 599, category: 'Internet', paymentMethod: 'Online', date: new Date(year, month, 5) },
    { title: 'Electricity Bill', amount: 350, category: 'Electricity', paymentMethod: 'UPI', date: new Date(year, month, 6) },
    { title: 'Mobile Recharge', amount: 299, category: 'Mobile Recharge', paymentMethod: 'UPI', date: new Date(year, month, 7) },
    { title: 'Auto to College', amount: 30, category: 'Auto', paymentMethod: 'Cash', date: new Date(year, month, 7) },
    { title: 'Chicken 500g', amount: 220, category: 'Chicken', paymentMethod: 'Cash', date: new Date(year, month, 8) },
    { title: 'Paracetamol', amount: 35, category: 'Medicine', paymentMethod: 'Cash', date: new Date(year, month, 9) },
    { title: 'Movie Ticket', amount: 150, category: 'Entertainment', paymentMethod: 'UPI', date: new Date(year, month, 10) },
    { title: 'Notebook & Pens', amount: 120, category: 'Shopping', paymentMethod: 'Cash', date: new Date(year, month, 11) },
    { title: 'Water Can 20L', amount: 40, category: 'Water', paymentMethod: 'Cash', date: new Date(year, month, 12) },
    { title: 'Lunch Outside', amount: 180, category: 'Food', paymentMethod: 'UPI', date: new Date(year, month, 13) },
    { title: 'Auto Ride', amount: 50, category: 'Auto', paymentMethod: 'Cash', date: new Date(year, month, 14) },
    { title: 'Snacks', amount: 75, category: 'Food', paymentMethod: 'Cash', date: new Date(year, month, 15) },
    { title: 'Emergency Fund', amount: 200, category: 'Emergency', paymentMethod: 'UPI', date: new Date(year, month, 16), notes: 'Lab fee extra payment' },
    { title: 'Vegetables Weekly', amount: 190, category: 'Vegetables', paymentMethod: 'Cash', date: new Date(year, month, 17) },
    { title: 'Milk Weekly', amount: 280, category: 'Milk', paymentMethod: 'Cash', date: new Date(year, month, 17) },
    { title: 'Dinner with Friends', amount: 350, category: 'Food', paymentMethod: 'UPI', date: new Date(year, month, 18), tags: ['social'] },
    { title: 'Haircut', amount: 100, category: 'Other', paymentMethod: 'Cash', date: new Date(year, month, 19) },
  ];

  await Expense.insertMany(expenseData.map((e) => ({ ...e, userId: user._id })));

  // Previous month expenses for comparison
  const prevMonth = month === 0 ? 11 : month - 1;
  const prevYear = month === 0 ? year - 1 : year;
  const prevExpenses = [
    { title: 'Rent', amount: 4500, category: 'Rent', paymentMethod: 'UPI', date: new Date(prevYear, prevMonth, 1) },
    { title: 'Food & Groceries', amount: 2800, category: 'Food', paymentMethod: 'Cash', date: new Date(prevYear, prevMonth, 5) },
    { title: 'Transport', amount: 650, category: 'Transport', paymentMethod: 'UPI', date: new Date(prevYear, prevMonth, 5) },
    { title: 'Internet', amount: 599, category: 'Internet', paymentMethod: 'Online', date: new Date(prevYear, prevMonth, 7) },
    { title: 'Electricity', amount: 400, category: 'Electricity', paymentMethod: 'UPI', date: new Date(prevYear, prevMonth, 8) },
    { title: 'Entertainment', amount: 500, category: 'Entertainment', paymentMethod: 'UPI', date: new Date(prevYear, prevMonth, 15) },
    { title: 'Medicine', amount: 150, category: 'Medicine', paymentMethod: 'Cash', date: new Date(prevYear, prevMonth, 20) },
  ];
  await Expense.insertMany(prevExpenses.map((e) => ({ ...e, userId: user._id })));

  console.log('📊 Creating budgets...');
  await Budget.create({
    userId: user._id,
    month: month + 1,
    year,
    totalBudget: 12000,
    categoryBudgets: [
      { category: 'Rent', limit: 5000 },
      { category: 'Food', limit: 2500 },
      { category: 'Transport', limit: 800 },
      { category: 'Internet', limit: 600 },
      { category: 'Electricity', limit: 500 },
      { category: 'Entertainment', limit: 500 },
      { category: 'Shopping', limit: 300 },
    ],
  });

  await Budget.create({
    userId: user._id,
    month: prevMonth + 1,
    year: prevYear,
    totalBudget: 12000,
  });

  console.log('🏠 Creating assets...');
  await Asset.insertMany([
    { userId: user._id, name: 'Study Table', purchasePrice: 2500, purchaseDate: new Date(2025, 5, 15), expectedLifetime: '3 years', status: 'Active', category: 'Furniture' },
    { userId: user._id, name: 'Mattress', purchasePrice: 1800, purchaseDate: new Date(2025, 5, 15), expectedLifetime: '2 years', status: 'Active', category: 'Bedding' },
    { userId: user._id, name: 'Induction Stove', purchasePrice: 1200, purchaseDate: new Date(2025, 6, 1), expectedLifetime: '3 years', status: 'Active', category: 'Kitchen' },
    { userId: user._id, name: 'Bucket & Mug', purchasePrice: 250, purchaseDate: new Date(2025, 5, 16), expectedLifetime: '2 years', status: 'Active', category: 'Bathroom' },
    { userId: user._id, name: 'Table Fan', purchasePrice: 900, purchaseDate: new Date(2025, 5, 20), expectedLifetime: '4 years', status: 'Active', category: 'Electronics' },
    { userId: user._id, name: 'Utensils Set', purchasePrice: 800, purchaseDate: new Date(2025, 6, 2), expectedLifetime: '5 years', status: 'Active', category: 'Kitchen' },
  ]);

  console.log('🥬 Creating groceries...');
  await Grocery.insertMany([
    { userId: user._id, name: 'Rice', quantity: 5, unit: 'kg', purchaseDate: new Date(year, month, 2), price: 350, estimatedRemainingQty: 3, category: 'Grains' },
    { userId: user._id, name: 'Cooking Oil', quantity: 1, unit: 'L', purchaseDate: new Date(year, month, 2), price: 180, estimatedRemainingQty: 0.6, category: 'Oil' },
    { userId: user._id, name: 'Milk', quantity: 2, unit: 'L', purchaseDate: new Date(year, month, 17), price: 280, estimatedRemainingQty: 0.5, category: 'Dairy' },
    { userId: user._id, name: 'Curd', quantity: 500, unit: 'g', purchaseDate: new Date(year, month, 4), price: 45, estimatedRemainingQty: 0, category: 'Dairy' },
    { userId: user._id, name: 'Eggs', quantity: 1, unit: 'dozen', purchaseDate: new Date(year, month, 4), price: 90, estimatedRemainingQty: 0.3, category: 'Dairy' },
    { userId: user._id, name: 'Sugar', quantity: 1, unit: 'kg', purchaseDate: new Date(year, month, 3), price: 50, estimatedRemainingQty: 0.7, category: 'General' },
    { userId: user._id, name: 'Salt', quantity: 1, unit: 'kg', purchaseDate: new Date(year, month, 3), price: 25, estimatedRemainingQty: 0.9, category: 'General' },
    { userId: user._id, name: 'Wheat Flour', quantity: 2, unit: 'kg', purchaseDate: new Date(year, month, 5), price: 80, estimatedRemainingQty: 1.2, category: 'Grains' },
  ]);

  console.log('🔄 Creating recurring expenses...');
  const nextMonth = month === 11 ? 0 : month + 1;
  const nextMonthYear = month === 11 ? year + 1 : year;
  await RecurringExpense.insertMany([
    { userId: user._id, title: 'Hostel Rent', amount: 4500, category: 'Rent', frequency: 'monthly', nextDueDate: new Date(nextMonthYear, nextMonth, 1) },
    { userId: user._id, title: 'Internet Bill', amount: 599, category: 'Internet', frequency: 'monthly', nextDueDate: new Date(nextMonthYear, nextMonth, 5) },
    { userId: user._id, title: 'Mobile Recharge', amount: 299, category: 'Mobile Recharge', frequency: 'monthly', nextDueDate: new Date(nextMonthYear, nextMonth, 7) },
  ]);

  console.log('🔔 Creating notifications...');
  await Notification.insertMany([
    { userId: user._id, type: 'info', title: 'Welcome to BudgetNest! 🎉', message: 'Start tracking your expenses to manage your budget better.', isRead: false },
    { userId: user._id, type: 'rent_reminder', title: 'Rent Due Soon 🏠', message: 'Your hostel rent of ₹4,500 is due on the 1st.', isRead: false },
    { userId: user._id, type: 'budget_exceeded', title: 'Food Budget Alert ⚠️', message: 'You\'ve used 85% of your food budget this month.', isRead: true },
  ]);

  console.log('✅ Seed data created successfully!');
  console.log('📧 Demo login: rahul@demo.com / password123');
  process.exit(0);
};

seed().catch((err) => {
  console.error('❌ Seed error:', err);
  process.exit(1);
});
