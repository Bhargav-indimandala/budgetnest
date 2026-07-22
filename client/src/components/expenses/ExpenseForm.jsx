import { useForm } from 'react-hook-form';
import { X } from 'lucide-react';
import { CATEGORIES, PAYMENT_METHODS, CATEGORY_ICONS } from '../../utils/constants';
import { formatDateInput } from '../../utils/formatters';

const ExpenseForm = ({ onSubmit, onCancel, initialData = null, loading = false }) => {
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm({
    defaultValues: initialData ? {
      title: initialData.title || '',
      amount: initialData.amount || '',
      quantity: initialData.quantity || 1,
      category: initialData.category || '',
      paymentMethod: initialData.paymentMethod || 'Cash',
      date: formatDateInput(initialData.date) || formatDateInput(new Date()),
      notes: initialData.notes || '',
      tags: (initialData.tags || []).join(', '),
      location: initialData.location || '',
      isPlanned: initialData.isPlanned || false,
    } : {
      title: '',
      amount: '',
      quantity: 1,
      category: '',
      paymentMethod: 'Cash',
      date: formatDateInput(new Date()),
      notes: '',
      tags: '',
      location: '',
      isPlanned: false,
    },
  });

  const selectedCategory = watch('category');
  const isPlanned = watch('isPlanned');

  const processSubmit = (data) => {
    const processed = {
      ...data,
      amount: parseFloat(data.amount),
      quantity: data.quantity ? parseInt(data.quantity, 10) : 1,
      tags: data.tags ? data.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      isPlanned: !!data.isPlanned,
    };
    onSubmit(processed);
  };

  return (
    <form onSubmit={handleSubmit(processSubmit)} className="space-y-5">
      {/* Title */}
      <div>
        <label className="label">Title</label>
        <input
          type="text"
          {...register('title', { required: 'Title is required' })}
          placeholder="e.g. Lunch at canteen"
          className="input-field"
        />
        {errors.title && <p className="text-xs text-red-400 mt-1">{errors.title.message}</p>}
      </div>

      {/* Amount + Quantity + Date Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div>
          <label className="label">Amount (₹)</label>
          <input
            type="number"
            step="0.01"
            {...register('amount', {
              required: 'Amount is required',
              min: { value: 0.01, message: 'Must be greater than 0' },
            })}
            placeholder="0.00"
            className="input-field"
          />
          {errors.amount && <p className="text-xs text-red-400 mt-1">{errors.amount.message}</p>}
        </div>
        <div>
          <label className="label">Qty</label>
          <input
            type="number"
            min="1"
            step="1"
            {...register('quantity', { min: { value: 1, message: 'Min 1' } })}
            className="input-field"
          />
        </div>
        <div className="col-span-2 sm:col-span-1">
          <label className="label">Date</label>
          <input
            type="date"
            max={isPlanned ? undefined : formatDateInput(new Date())}
            {...register('date', { required: 'Date is required' })}
            className="input-field"
          />
          {errors.date && <p className="text-xs text-red-400 mt-1">{errors.date.message}</p>}
        </div>
      </div>

      {/* Planned expense toggle */}
      <div className="flex items-start gap-2 bg-gray-50 dark:bg-white/5 rounded-xl p-3">
        <input
          type="checkbox"
          id="isPlanned"
          {...register('isPlanned')}
          className="w-4 h-4 mt-0.5 rounded accent-primary-500 flex-shrink-0"
        />
        <label htmlFor="isPlanned" className="text-xs text-gray-600 dark:text-gray-300">
          <span className="font-medium text-gray-800 dark:text-gray-200 block">This is a planned/upcoming expense</span>
          Lets you pick a future date. Won't count toward your spent totals or budget until you edit it
          later and untick this, once you've actually paid it.
        </label>
      </div>

      {/* Category Quick Select */}
      <div>
        <label className="label">Category</label>
        <div className="flex flex-wrap gap-2 mb-2">
          {CATEGORIES.slice(0, 12).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setValue('category', cat)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                ${selectedCategory === cat
                  ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25'
                  : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10'
                }`}
            >
              <span>{CATEGORY_ICONS[cat] || '📦'}</span>
              <span>{cat}</span>
            </button>
          ))}
        </div>
        <input
          type="text"
          {...register('category', { required: 'Category is required' })}
          placeholder="Or type a category"
          className="input-field"
        />
        {errors.category && <p className="text-xs text-red-400 mt-1">{errors.category.message}</p>}
      </div>

      {/* Payment Method */}
      <div>
        <label className="label">Payment Method</label>
        <div className="flex gap-2">
          {PAYMENT_METHODS.map((method) => (
            <button
              key={method}
              type="button"
              onClick={() => setValue('paymentMethod', method)}
              className={`px-4 py-2 rounded-xl text-xs font-medium transition-all flex-1
                ${watch('paymentMethod') === method
                  ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25'
                  : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10'
                }`}
            >
              {method}
            </button>
          ))}
        </div>
        <input type="hidden" {...register('paymentMethod')} />
      </div>

      {/* Notes */}
      <div>
        <label className="label">Notes (Optional)</label>
        <textarea
          {...register('notes')}
          placeholder="Any additional notes..."
          rows={2}
          className="input-field resize-none"
        />
      </div>

      {/* Tags + Location Row */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Tags (comma separated)</label>
          <input
            type="text"
            {...register('tags')}
            placeholder="e.g. food, daily"
            className="input-field"
          />
        </div>
        <div>
          <label className="label">Location</label>
          <input
            type="text"
            {...register('location')}
            placeholder="e.g. Canteen"
            className="input-field"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        {onCancel && (
          <button type="button" onClick={onCancel} className="btn-secondary flex-1">
            Cancel
          </button>
        )}
        <button type="submit" disabled={loading} className="btn-primary flex-1">
          {loading ? 'Saving...' : initialData ? 'Update Expense' : 'Add Expense'}
        </button>
      </div>
    </form>
  );
};

export default ExpenseForm;
