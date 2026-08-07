import { useState } from 'react';
import { Plus, Trash2, Layers } from 'lucide-react';
import api from '../../services/api';
import { CATEGORIES, CATEGORY_ICONS } from '../../utils/constants';
import { formatDateInput } from '../../utils/formatters';
import toast from 'react-hot-toast';

const emptyRow = () => ({
  id: Math.random().toString(36).slice(2),
  title: '',
  amount: '',
  category: '',
  quantity: 1,
});

// Lets a person add several expenses in one sitting (e.g. right after a
// grocery run) instead of repeating the full Add Expense flow per item.
// Every row still keeps its own category, so each one shows up in Reports/
// Analytics exactly like any individually-added expense — nothing about
// how existing expenses are tracked or displayed changes.
const BulkAddExpenses = ({ onClose, onDone }) => {
  const [sharedDate, setSharedDate] = useState(formatDateInput(new Date()));
  const [rows, setRows] = useState([emptyRow(), emptyRow(), emptyRow()]);
  const [submitting, setSubmitting] = useState(false);

  const updateRow = (id, field, value) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  };

  const addRow = () => setRows((prev) => [...prev, emptyRow()]);

  const removeRow = (id) => {
    setRows((prev) => (prev.length > 1 ? prev.filter((r) => r.id !== id) : prev));
  };

  const handleSubmit = async () => {
    const filled = rows.filter((r) => r.title.trim() || r.amount || r.category);
    if (filled.length === 0) {
      toast.error('Add at least one item');
      return;
    }
    const incomplete = filled.find((r) => !r.title.trim() || !r.amount || !r.category);
    if (incomplete) {
      toast.error('Every item needs a title, amount, and category');
      return;
    }

    setSubmitting(true);
    try {
      const { data } = await api.post('/expenses/bulk-create', {
        date: sharedDate,
        items: filled.map((r) => ({
          title: r.title.trim(),
          amount: parseFloat(r.amount),
          category: r.category,
          quantity: r.quantity ? parseInt(r.quantity, 10) : 1,
        })),
      });

      if (data.createdCount > 0) {
        toast.success(`Added ${data.createdCount} expense${data.createdCount > 1 ? 's' : ''}`);
      }
      if (data.errors?.length > 0) {
        data.errors.forEach((e) => toast.error(`"${e.title}": ${e.message}`));
      }
      if (data.createdCount > 0) {
        onDone();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add expenses');
    }
    setSubmitting(false);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="label">Date for all items</label>
        <input
          type="date"
          value={sharedDate}
          max={formatDateInput(new Date())}
          onChange={(e) => setSharedDate(e.target.value)}
          className="input-field sm:w-auto"
        />
      </div>

      <div className="space-y-2 max-h-[45vh] overflow-y-auto pr-1">
        {rows.map((row, i) => (
          <div key={row.id} className="grid grid-cols-12 gap-2 items-start bg-gray-50 dark:bg-white/5 rounded-xl p-2.5">
            <input
              type="text"
              placeholder={`Item ${i + 1} name`}
              value={row.title}
              onChange={(e) => updateRow(row.id, 'title', e.target.value)}
              className="input-field !py-2 col-span-12 sm:col-span-4"
            />
            <input
              type="number"
              placeholder="₹"
              step="0.01"
              value={row.amount}
              onChange={(e) => updateRow(row.id, 'amount', e.target.value)}
              className="input-field !py-2 col-span-5 sm:col-span-2"
            />
            <select
              value={row.category}
              onChange={(e) => updateRow(row.id, 'category', e.target.value)}
              className="input-field !py-2 col-span-7 sm:col-span-4"
            >
              <option value="">Category</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{CATEGORY_ICONS[c] || '📦'} {c}</option>
              ))}
            </select>
            <input
              type="number"
              min="1"
              placeholder="Qty"
              value={row.quantity}
              onChange={(e) => updateRow(row.id, 'quantity', e.target.value)}
              className="input-field !py-2 col-span-8 sm:col-span-1"
            />
            <button
              type="button"
              onClick={() => removeRow(row.id)}
              className="col-span-4 sm:col-span-1 flex items-center justify-center p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addRow}
        className="flex items-center gap-1.5 text-sm text-primary-600 dark:text-primary-400 hover:underline font-medium"
      >
        <Plus size={15} /> Add another item
      </button>

      <div className="flex gap-3 pt-2 border-t border-gray-100 dark:border-white/5">
        <button type="button" onClick={onClose} className="btn-secondary flex-1">
          Cancel
        </button>
        <button type="button" onClick={handleSubmit} disabled={submitting} className="btn-primary flex-1 flex items-center justify-center gap-2">
          <Layers size={16} /> {submitting ? 'Adding...' : 'Add All Expenses'}
        </button>
      </div>
    </div>
  );
};

export default BulkAddExpenses;
