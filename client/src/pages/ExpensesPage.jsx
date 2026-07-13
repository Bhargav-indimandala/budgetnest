import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Plus, Search, Filter, Trash2, Copy, Download, FileText,
  ChevronDown, X, CheckSquare, Square,
} from 'lucide-react';
import api from '../services/api';
import { formatCurrency, formatDate } from '../utils/formatters';
import { CATEGORIES, PAYMENT_METHODS, CATEGORY_ICONS } from '../utils/constants';
import Modal from '../components/common/Modal';
import ExpenseForm from '../components/expenses/ExpenseForm';
import ConfirmDialog from '../components/common/ConfirmDialog';
import EmptyState from '../components/common/EmptyState';
import Pagination from '../components/common/Pagination';
import { PageLoader } from '../components/common/LoadingSpinner';
import toast from 'react-hot-toast';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import Papa from 'papaparse';

const ExpensesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [expenses, setExpenses] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(searchParams.get('add') === 'true');
  const [editExpense, setEditExpense] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    category: '',
    paymentMethod: '',
    startDate: '',
    endDate: '',
    sort: '-date',
  });

  const fetchExpenses = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 10, sort: filters.sort };
      if (filters.search) params.search = filters.search;
      if (filters.category) params.category = filters.category;
      if (filters.paymentMethod) params.paymentMethod = filters.paymentMethod;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;

      const { data } = await api.get('/expenses', { params });
      setExpenses(data.expenses || []);
      setPagination(data.pagination || { total: 0, page: 1, pages: 1 });
    } catch (error) {
      toast.error('Failed to load expenses');
    }
    setLoading(false);
  }, [filters]);

  useEffect(() => {
    fetchExpenses(1);
  }, [fetchExpenses]);

  const handleCreate = async (formData) => {
    setFormLoading(true);
    try {
      await api.post('/expenses', formData);
      toast.success('Expense added!');
      setShowForm(false);
      setSearchParams({});
      fetchExpenses(1);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add expense');
    }
    setFormLoading(false);
  };

  const handleUpdate = async (formData) => {
    setFormLoading(true);
    try {
      await api.put(`/expenses/${editExpense._id}`, formData);
      toast.success('Expense updated!');
      setEditExpense(null);
      fetchExpenses(pagination.page);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update');
    }
    setFormLoading(false);
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/expenses/${deleteTarget._id}`);
      toast.success('Expense deleted');
      setDeleteTarget(null);
      fetchExpenses(pagination.page);
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const handleDuplicate = async (expense) => {
    try {
      await api.post(`/expenses/${expense._id}/duplicate`);
      toast.success('Expense duplicated');
      fetchExpenses(pagination.page);
    } catch (error) {
      toast.error('Failed to duplicate');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    try {
      await api.post('/expenses/bulk-delete', { ids: selectedIds });
      toast.success(`${selectedIds.length} expenses deleted`);
      setSelectedIds([]);
      fetchExpenses(1);
    } catch (error) {
      toast.error('Bulk delete failed');
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === expenses.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(expenses.map((e) => e._id));
    }
  };

  const exportCSV = async () => {
    try {
      const { data } = await api.get('/expenses/export/csv', {
        params: {
          startDate: filters.startDate || undefined,
          endDate: filters.endDate || undefined,
          category: filters.category || undefined,
        },
      });
      const csv = Papa.unparse(data.data);
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `budgetnest-expenses-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('CSV exported!');
    } catch {
      toast.error('Export failed');
    }
  };

  const exportPDF = async () => {
    try {
      const { data } = await api.get('/expenses/export/pdf', {
        params: {
          startDate: filters.startDate || undefined,
          endDate: filters.endDate || undefined,
          category: filters.category || undefined,
        },
      });
      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.text('BudgetNest — Expense Report', 14, 22);
      doc.setFontSize(10);
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 30);
      doc.text(`Total: Rs. ${data.data.total.toLocaleString()} | Count: ${data.data.count}`, 14, 36);

      autoTable(doc, {
        startY: 42,
        head: [['Title', 'Amount', 'Category', 'Payment', 'Date']],
        body: data.data.expenses.map((e) => [
          e.title, `Rs. ${e.amount}`, e.category, e.paymentMethod, e.date,
        ]),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [99, 102, 241] },
      });

      doc.save(`budgetnest-expenses-${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('PDF exported!');
    } catch {
      toast.error('Export failed');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-header">Expenses</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {pagination.total} total expense{pagination.total !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportCSV} className="btn-secondary flex items-center gap-2 text-sm">
            <Download size={14} /> CSV
          </button>
          <button onClick={exportPDF} className="btn-secondary flex items-center gap-2 text-sm">
            <FileText size={14} /> PDF
          </button>
          <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> Add Expense
          </button>
        </div>
      </div>

      {/* Search + Filter Bar */}
      <div className="glass-card !p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              placeholder="Search expenses..."
              className="input-field pl-10"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`btn-secondary flex items-center gap-2 text-sm ${showFilters ? 'bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400' : ''}`}
          >
            <Filter size={14} />
            Filters
            <ChevronDown size={14} className={`transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Expandable Filters */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="grid grid-cols-1 sm:grid-cols-4 gap-3 mt-3 pt-3 border-t border-gray-100 dark:border-white/5"
          >
            <select
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              className="input-field text-sm"
            >
              <option value="">All Categories</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <select
              value={filters.paymentMethod}
              onChange={(e) => setFilters({ ...filters, paymentMethod: e.target.value })}
              className="input-field text-sm"
            >
              <option value="">All Methods</option>
              {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              className="input-field text-sm"
              placeholder="Start date"
            />
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              className="input-field text-sm"
              placeholder="End date"
            />
          </motion.div>
        )}
      </div>

      {/* Bulk Actions */}
      {selectedIds.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card !p-3 flex items-center justify-between"
        >
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {selectedIds.length} selected
          </span>
          <button
            onClick={handleBulkDelete}
            className="btn-danger text-sm flex items-center gap-2 !py-2 !px-4"
          >
            <Trash2 size={14} /> Delete Selected
          </button>
        </motion.div>
      )}

      {/* Expense List */}
      {loading ? (
        <PageLoader />
      ) : expenses.length === 0 ? (
        <EmptyState
          title="No expenses found"
          description="Start tracking your spending by adding your first expense."
          action={() => setShowForm(true)}
          actionLabel="Add Expense"
        />
      ) : (
        <div className="glass-card !p-0 overflow-hidden">
          {/* Table Header */}
          <div className="hidden md:grid grid-cols-[40px_1fr_120px_120px_100px_100px_80px] gap-2 px-4 py-3 border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.02]">
            <div className="flex items-center">
              <button onClick={toggleSelectAll}>
                {selectedIds.length === expenses.length ? (
                  <CheckSquare size={16} className="text-primary-500" />
                ) : (
                  <Square size={16} className="text-gray-400" />
                )}
              </button>
            </div>
            <span className="table-header !px-0">Title</span>
            <span className="table-header !px-0">Category</span>
            <span className="table-header !px-0">Amount</span>
            <span className="table-header !px-0">Method</span>
            <span className="table-header !px-0">Date</span>
            <span className="table-header !px-0 text-right">Actions</span>
          </div>

          {/* Rows */}
          {expenses.map((expense, idx) => (
            <motion.div
              key={expense._id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: idx * 0.03 }}
              className="grid grid-cols-1 md:grid-cols-[40px_1fr_120px_120px_100px_100px_80px] gap-2 items-center px-4 py-3.5 border-b border-gray-50 dark:border-white/[0.03] hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors"
            >
              {/* Select */}
              <div className="hidden md:flex items-center">
                <button onClick={() => toggleSelect(expense._id)}>
                  {selectedIds.includes(expense._id) ? (
                    <CheckSquare size={16} className="text-primary-500" />
                  ) : (
                    <Square size={16} className="text-gray-400" />
                  )}
                </button>
              </div>

              {/* Title */}
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-white/5 flex items-center justify-center text-base">
                  {CATEGORY_ICONS[expense.category] || '📦'}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{expense.title}</p>
                  {expense.notes && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{expense.notes}</p>
                  )}
                </div>
              </div>

              {/* Category */}
              <div>
                <span className="badge-primary text-xs">{expense.category}</span>
              </div>

              {/* Amount */}
              <p className="text-sm font-semibold text-gray-800 dark:text-white">
                {formatCurrency(expense.amount)}
              </p>

              {/* Method */}
              <span className="text-xs text-gray-500 dark:text-gray-400">{expense.paymentMethod}</span>

              {/* Date */}
              <span className="text-xs text-gray-500 dark:text-gray-400">{formatDate(expense.date)}</span>

              {/* Actions */}
              <div className="flex items-center gap-1 justify-end">
                <button
                  onClick={() => setEditExpense(expense)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-500/10 transition-all"
                  title="Edit"
                >
                  <Filter size={14} />
                </button>
                <button
                  onClick={() => handleDuplicate(expense)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-all"
                  title="Duplicate"
                >
                  <Copy size={14} />
                </button>
                <button
                  onClick={() => setDeleteTarget(expense)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all"
                  title="Delete"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Pagination */}
      <Pagination
        currentPage={pagination.page}
        totalPages={pagination.pages}
        onPageChange={(page) => fetchExpenses(page)}
      />

      {/* Add Expense Modal */}
      <Modal isOpen={showForm} onClose={() => { setShowForm(false); setSearchParams({}); }} title="Add Expense" size="lg">
        <ExpenseForm onSubmit={handleCreate} onCancel={() => { setShowForm(false); setSearchParams({}); }} loading={formLoading} />
      </Modal>

      {/* Edit Expense Modal */}
      <Modal isOpen={!!editExpense} onClose={() => setEditExpense(null)} title="Edit Expense" size="lg">
        {editExpense && (
          <ExpenseForm onSubmit={handleUpdate} onCancel={() => setEditExpense(null)} initialData={editExpense} loading={formLoading} />
        )}
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Expense"
        message={`Delete "${deleteTarget?.title}"? This action cannot be undone.`}
      />
    </div>
  );
};

export default ExpensesPage;
