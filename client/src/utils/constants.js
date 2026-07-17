export const CATEGORIES = [
  'Rent', 'Food', 'Vegetables', 'Milk', 'Curd', 'Eggs', 'Chicken',
  'Rice', 'Oil', 'Electricity', 'Water', 'Internet', 'Mobile Recharge',
  'Transport', 'Auto', 'Medicine', 'Entertainment', 'Shopping',
  'Emergency', 'Other',
];

export const PAYMENT_METHODS = ['Cash', 'UPI', 'Card', 'Online', 'Other'];

export const CURRENCIES = {
  INR: { symbol: '₹', name: 'Indian Rupee' },
  USD: { symbol: '$', name: 'US Dollar' },
  EUR: { symbol: '€', name: 'Euro' },
  GBP: { symbol: '£', name: 'British Pound' },
};

export const GROCERY_UNITS = ['kg', 'g', 'L', 'ml', 'pcs', 'dozen', 'packet'];

export const GROCERY_CATEGORIES = ['Grains', 'Dairy', 'Vegetables', 'Fruits', 'Spices', 'Oil', 'Snacks', 'Beverages', 'General'];

export const ASSET_STATUSES = ['Active', 'Disposed', 'Damaged'];

export const CATEGORY_COLORS = {
  Rent: '#6366f1', Food: '#f59e0b', Vegetables: '#22c55e', Milk: '#60a5fa',
  Curd: '#a78bfa', Eggs: '#fb923c', Chicken: '#ef4444', Rice: '#84cc16',
  Oil: '#eab308', Electricity: '#f97316', Water: '#06b6d4', Internet: '#8b5cf6',
  'Mobile Recharge': '#ec4899', Transport: '#14b8a6', Auto: '#f43f5e',
  Medicine: '#10b981', Entertainment: '#a855f7', Shopping: '#3b82f6',
  Emergency: '#dc2626', Other: '#6b7280',
};

// Extra distinct colors for custom/user-typed categories that aren't in the preset list above
const FALLBACK_PALETTE = [
  '#0ea5e9', '#d946ef', '#65a30d', '#ea580c', '#0891b2',
  '#7c3aed', '#be123c', '#059669', '#ca8a04', '#4f46e5',
  '#c026d3', '#0d9488', '#b91c1c', '#4d7c0f', '#9333ea',
];

// Returns a color for any category name — preset categories use their fixed
// color, and any custom category gets a consistent (same name -> same color)
// color from the fallback palette instead of a shared gray.
export const getCategoryColor = (category) => {
  if (CATEGORY_COLORS[category]) return CATEGORY_COLORS[category];
  let hash = 0;
  for (let i = 0; i < category.length; i++) {
    hash = (hash << 5) - hash + category.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % FALLBACK_PALETTE.length;
  return FALLBACK_PALETTE[index];
};

export const CATEGORY_ICONS = {
  Rent: '🏠', Food: '🍽️', Vegetables: '🥬', Milk: '🥛', Curd: '🫙', Eggs: '🥚',
  Chicken: '🍗', Rice: '🍚', Oil: '🫗', Electricity: '⚡', Water: '💧',
  Internet: '📶', 'Mobile Recharge': '📱', Transport: '🚌', Auto: '🛺',
  Medicine: '💊', Entertainment: '🎬', Shopping: '🛒', Emergency: '🚨', Other: '📦',
};
