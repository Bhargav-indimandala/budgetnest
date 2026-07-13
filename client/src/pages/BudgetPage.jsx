import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Wallet, Plus, X, TrendingUp } from 'lucide-react';
import api from '../services/api';
import { formatCurrency } from '../utils/formatters';
import { CATEGORIES, CATEGORY_ICONS, CATEGORY_COLORS } from '../utils/constants';
import Modal from '../components/common/Modal';
import { PageLoader } from '../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

const BudgetPage = () => {
  const [budget, setBudget] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ totalBudget: '', categoryBudgets: [] });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [budgetRes, historyRes] = await Promise.all([
        api.get('/budgets/current'),
        api.get('/budgets/history'),
      ]);
      setBudget(budgetRes.data.budget);
      setHistory(historyRes.data.history || []);
    } catch (error) {
      console.error('Budget fetch error:', error);
    }
    setLoading(false);
  };

  const openForm = () => {
    setFormData({
      totalBudget: budget?.totalBudget || '',
      categoryBudgets: budget?.categoryBudgets?.length > 0
        ? budget.categoryBudgets.map((cb) => ({ category: cb.category, limit: cb.limit }))
        : [],
    });
    setShowForm(true);
  };

  const addCategoryBudget = () => {
    setFormData({
      ...formData,
      categoryBudgets: [...formData.categoryBudgets, { category: '', limit: '' }],
    });
  };

  const removeCategoryBudget = (index) => {
    setFormData({
      ...formData,
      categoryBudgets: formData.categoryBudgets.filter((_, i) => i !== index),
    });
  };

  const updateCategoryBudget = (index, field, value) => {
    const updated = [...formData.categoryBudgets];
    updated[index][field] = field === 'limit' ? parseFloat(value) || '' : value;
    setFormData({ ...formData, categoryBudgets: updated });
  };

  const handleSave = async () => {
    if (!formData.totalBudget || parseFloat(formData.totalBudget) <= 0) {
      toast.error('Please enter a valid budget amount');
      return;
    }
    setSaving(true);
    try {
      const now = new Date();
      await api.post('/budgets', {
        month: now.getMonth() + 1,
        year: now.getFullYear(),
        totalBudget: parseFloat(formData.totalBudget),
        categoryBudgets: formData.categoryBudgets
          .filter((cb) => cb.category && cb.limit)
          .map((cb) => ({ category: cb.category, limit: parseFloat(cb.limit) })),
      });
      toast.success('Budget updated!');
      setShowForm(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save budget');
    }
    setSaving(false);
  };

  if (loading) return <PageLoader />;

  const b = budget;
  const percentUsed = b?.percentUsed || 0;
  const barColor = percentUsed > 100 ? 'bg-red-500' : percentUsed > 80 ? 'bg-amber-500' : 'bg-emerald-500';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-header">Budget</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage your monthly spending limits
          </p>
        </div>
        <button onClick={openForm} className="btn-primary flex items-center gap-2">
          <Wallet size={16} /> Set Budget
        </button>
      </div>

      {/* Current Budget Overview */}
      {b && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-gray-800 dark:text-white">
              {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h3>
            <span className={`text-2xl font-bold ${percentUsed > 100 ? 'text-red-500' : percentUsed > 80 ? 'text-amber-500' : 'text-emerald-500'}`}>
              {percentUsed}%
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-4 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden mb-5">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(percentUsed, 100)}%` }}
              transition={{ duration: 1 }}
              className={`h-full rounded-full ${barColor} shadow-lg`}
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center p-3 rounded-xl bg-gray-50 dark:bg-white/5">
              <p className="text-xs text-gray-500 dark:text-gray-400">Total Budget</p>
              <p className="text-lg font-bold text-gray-800 dark:text-white">{formatCurrency(b.totalBudget)}</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-gray-50 dark:bg-white/5">
              <p className="text-xs text-gray-500 dark:text-gray-400">Spent</p>
              <p className="text-lg font-bold text-gray-800 dark:text-white">{formatCurrency(b.spent)}</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-gray-50 dark:bg-white/5">
              <p className="text-xs text-gray-500 dark:text-gray-400">Remaining</p>
              <p className={`text-lg font-bold ${b.remaining >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                {formatCurrency(b.remaining)}
              </p>
            </div>
            <div className="text-center p-3 rounded-xl bg-gray-50 dark:bg-white/5">
              <p className="text-xs text-gray-500 dark:text-gray-400">Safe Daily</p>
              <p className="text-lg font-bold text-primary-500">{formatCurrency(b.safeDailySpending)}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Category Budgets */}
      {b?.categoryBudgets?.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card">
          <h3 className="text-base font-semibold text-gray-800 dark:text-white mb-4">Category Budgets</h3>
          <div className="space-y-4">
            {b.categoryBudgets.map((cb, i) => {
              const catPercent = cb.limit > 0 ? Math.round((cb.spent / cb.limit) * 100) : 0;
              const catBarColor = catPercent > 100 ? 'bg-red-500' : catPercent > 80 ? 'bg-amber-500' : 'bg-primary-500';
              return (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span>{CATEGORY_ICONS[cb.category] || '📦'}</span>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{cb.category}</span>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formatCurrency(cb.spent)} / {formatCurrency(cb.limit)}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${catBarColor} transition-all duration-500`}
                      style={{ width: `${Math.min(catPercent, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Budget History */}
      {history.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card">
          <h3 className="text-base font-semibold text-gray-800 dark:text-white mb-4">Budget History</h3>
          <div className="space-y-3">
            {history.map((h, i) => {
              const hPercent = h.percentUsed || 0;
              const hBarColor = hPercent > 100 ? 'bg-red-500' : hPercent > 80 ? 'bg-amber-500' : 'bg-emerald-500';
              const monthLabel = new Date(h.year, h.month - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
              return (
                <div key={i} className="p-3 rounded-xl bg-gray-50 dark:bg-white/5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{monthLabel}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formatCurrency(h.spent)} / {formatCurrency(h.totalBudget)} ({hPercent}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${hBarColor} transition-all`}
                      style={{ width: `${Math.min(hPercent, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Budget Form Modal */}
      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Set Monthly Budget" size="lg">
        <div className="space-y-5">
          <div>
            <label className="label">Total Monthly Budget (₹)</label>
            <input
              type="number"
              value={formData.totalBudget}
              onChange={(e) => setFormData({ ...formData, totalBudget: e.target.value })}
              placeholder="e.g. 15000"
              className="input-field text-lg font-semibold"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="label !mb-0">Category Budgets (Optional)</label>
              <button onClick={addCategoryBudget} className="text-xs text-primary-500 hover:text-primary-400 font-medium flex items-center gap-1">
                <Plus size={12} /> Add Category
              </button>
            </div>

            {formData.categoryBudgets.map((cb, i) => (
              <div key={i} className="flex items-center gap-3 mb-3">
                <select
                  value={cb.category}
                  onChange={(e) => updateCategoryBudget(i, 'category', e.target.value)}
                  className="input-field flex-1"
                >
                  <option value="">Select category</option>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <input
                  type="number"
                  value={cb.limit}
                  onChange={(e) => updateCategoryBudget(i, 'limit', e.target.value)}
                  placeholder="Limit"
                  className="input-field w-32"
                />
                <button onClick={() => removeCategoryBudget(i)} className="p-2 text-red-400 hover:text-red-500">
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={() => setShowForm(false)} className="btn-secondary flex-1">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="btn-primary flex-1">
              {saving ? 'Saving...' : 'Save Budget'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default BudgetPage;
