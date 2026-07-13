import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Plus, Trash2, Edit2, Repeat, CalendarClock, ToggleLeft, ToggleRight, Power,
} from 'lucide-react';
import api from '../services/api';
import { formatCurrency, formatDate } from '../utils/formatters';
import { CATEGORIES } from '../utils/constants';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import EmptyState from '../components/common/EmptyState';
import StatCard from '../components/common/StatCard';
import { PageLoader } from '../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

const FREQUENCIES = ['monthly', 'weekly', 'yearly'];

const emptyForm = {
  title: '',
  amount: '',
  category: 'Rent',
  frequency: 'monthly',
  nextDueDate: new Date().toISOString().split('T')[0],
  isActive: true,
  notes: '',
};

const RecurringPage = () => {
  const [recurring, setRecurring] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState(emptyForm);

  useEffect(() => {
    fetchRecurring();
  }, []);

  const fetchRecurring = async () => {
    try {
      const { data } = await api.get('/recurring');
      setRecurring(data.recurring || []);
    } catch (error) {
      console.error('Recurring fetch error:', error);
    }
    setLoading(false);
  };

  const openForm = (item = null) => {
    if (item) {
      setEditItem(item);
      setFormData({
        title: item.title,
        amount: item.amount,
        category: item.category,
        frequency: item.frequency || 'monthly',
        nextDueDate: item.nextDueDate?.split('T')[0] || new Date().toISOString().split('T')[0],
        isActive: item.isActive,
        notes: item.notes || '',
      });
    } else {
      setEditItem(null);
      setFormData(emptyForm);
    }
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!formData.title || !formData.amount || !formData.nextDueDate) {
      toast.error('Please fill title, amount and due date');
      return;
    }
    setSaving(true);
    try {
      const payload = { ...formData, amount: parseFloat(formData.amount) };
      if (editItem) {
        await api.put(`/recurring/${editItem._id}`, payload);
        toast.success('Recurring expense updated');
      } else {
        await api.post('/recurring', payload);
        toast.success('Recurring expense added');
      }
      setShowForm(false);
      fetchRecurring();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save');
    }
    setSaving(false);
  };

  const handleToggleActive = async (item) => {
    try {
      await api.put(`/recurring/${item._id}`, { isActive: !item.isActive });
      setRecurring((prev) =>
        prev.map((r) => (r._id === item._id ? { ...r, isActive: !r.isActive } : r))
      );
      toast.success(item.isActive ? 'Paused' : 'Resumed');
    } catch {
      toast.error('Failed to update');
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/recurring/${deleteTarget._id}`);
      toast.success('Recurring expense deleted');
      setDeleteTarget(null);
      fetchRecurring();
    } catch {
      toast.error('Failed to delete');
    }
  };

  if (loading) return <PageLoader />;

  const activeCount = recurring.filter((r) => r.isActive).length;
  const monthlyTotal = recurring
    .filter((r) => r.isActive && r.frequency === 'monthly')
    .reduce((sum, r) => sum + r.amount, 0);
  const upcoming = [...recurring]
    .filter((r) => r.isActive)
    .sort((a, b) => new Date(a.nextDueDate) - new Date(b.nextDueDate))[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-header">Recurring Expenses</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Rent, internet, subscriptions — automated so you never forget
          </p>
        </div>
        <button onClick={() => openForm()} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Add Recurring
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={Repeat} label="Active Recurring" value={activeCount} color="primary" delay={0} />
        <StatCard icon={CalendarClock} label="Monthly Total" value={formatCurrency(monthlyTotal)} color="accent" delay={1} />
        <StatCard
          icon={Power}
          label="Next Due"
          value={upcoming ? `${upcoming.title} · ${formatDate(upcoming.nextDueDate)}` : '—'}
          color="warning"
          delay={2}
        />
      </div>

      {/* List */}
      {recurring.length === 0 ? (
        <EmptyState
          icon={Repeat}
          title="No recurring expenses"
          description="Add rent, internet, water, or subscriptions to auto-generate expenses and get reminders."
          action={() => openForm()}
          actionLabel="Add Recurring"
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {recurring.map((item, i) => (
            <motion.div
              key={item._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`glass-card group ${!item.isActive ? 'opacity-60' : ''}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-500/15 flex items-center justify-center">
                    <Repeat size={18} className="text-primary-600 dark:text-primary-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-800 dark:text-white">{item.title}</h4>
                    <p className="text-xs text-gray-400 dark:text-gray-500">{item.category}</p>
                  </div>
                </div>
                <button onClick={() => handleToggleActive(item)} title={item.isActive ? 'Pause' : 'Resume'}>
                  {item.isActive ? (
                    <ToggleRight size={26} className="text-primary-500" />
                  ) : (
                    <ToggleLeft size={26} className="text-gray-300 dark:text-gray-600" />
                  )}
                </button>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 dark:text-gray-400">Amount</span>
                  <span className="text-sm font-semibold text-gray-800 dark:text-white">
                    {formatCurrency(item.amount)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 dark:text-gray-400">Frequency</span>
                  <span className="text-xs text-gray-600 dark:text-gray-300 capitalize">{item.frequency}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 dark:text-gray-400">Next Due</span>
                  <span className="text-xs text-gray-600 dark:text-gray-300">{formatDate(item.nextDueDate)}</span>
                </div>
              </div>

              {item.notes && (
                <p className="text-xs text-gray-400 dark:text-gray-500 mb-3 line-clamp-2">{item.notes}</p>
              )}

              <div className="flex gap-1 pt-2 border-t border-gray-100 dark:border-white/5">
                <button
                  onClick={() => openForm(item)}
                  className="flex-1 p-2 rounded-lg text-gray-400 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-500/10 transition-all text-xs font-medium flex items-center justify-center gap-1"
                >
                  <Edit2 size={13} /> Edit
                </button>
                <button
                  onClick={() => setDeleteTarget(item)}
                  className="flex-1 p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all text-xs font-medium flex items-center justify-center gap-1"
                >
                  <Trash2 size={13} /> Delete
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Form Modal */}
      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title={editItem ? 'Edit Recurring Expense' : 'Add Recurring Expense'} size="lg">
        <div className="space-y-4">
          <div>
            <label className="label">Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Hostel Rent"
              className="input-field"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Amount (₹)</label>
              <input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="0"
                className="input-field"
              />
            </div>
            <div>
              <label className="label">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="input-field"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Frequency</label>
              <select
                value={formData.frequency}
                onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                className="input-field"
              >
                {FREQUENCIES.map((f) => (
                  <option key={f} value={f} className="capitalize">{f}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Next Due Date</label>
              <input
                type="date"
                value={formData.nextDueDate}
                onChange={(e) => setFormData({ ...formData, nextDueDate: e.target.value })}
                className="input-field"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="w-4 h-4 rounded accent-primary-500"
            />
            <label htmlFor="isActive" className="text-sm text-gray-600 dark:text-gray-300">Active</label>
          </div>

          <div>
            <label className="label">Notes (Optional)</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Any additional notes..."
              rows={2}
              className="input-field resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={() => setShowForm(false)} className="btn-secondary flex-1">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="btn-primary flex-1">
              {saving ? 'Saving...' : editItem ? 'Update' : 'Add Recurring'}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Recurring Expense"
        message={`Delete "${deleteTarget?.title}"? Future auto-generated expenses will stop.`}
      />
    </div>
  );
};

export default RecurringPage;
