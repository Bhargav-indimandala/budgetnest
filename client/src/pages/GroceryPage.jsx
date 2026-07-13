import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, Edit2, ShoppingCart, AlertTriangle, Package } from 'lucide-react';
import api from '../services/api';
import { formatCurrency, formatDate } from '../utils/formatters';
import { GROCERY_CATEGORIES, GROCERY_UNITS } from '../utils/constants';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import EmptyState from '../components/common/EmptyState';
import StatCard from '../components/common/StatCard';
import { PageLoader } from '../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

const GroceryPage = () => {
  const [groceries, setGroceries] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('list');
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [formData, setFormData] = useState({
    name: '', quantity: '', unit: 'kg', price: '', category: 'General', purchaseDate: new Date().toISOString().split('T')[0],
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchData(); }, [categoryFilter]);

  const fetchData = async () => {
    try {
      const params = categoryFilter ? { category: categoryFilter } : {};
      const [groceryRes, invRes] = await Promise.all([
        api.get('/groceries', { params }),
        api.get('/groceries/inventory'),
      ]);
      setGroceries(groceryRes.data.groceries || []);
      setInventory(invRes.data.inventory || []);
      setStats(invRes.data.stats || {});
    } catch (error) {
      console.error('Grocery error:', error);
    }
    setLoading(false);
  };

  const openForm = (item = null) => {
    if (item) {
      setEditItem(item);
      setFormData({
        name: item.name, quantity: item.quantity, unit: item.unit,
        price: item.price, category: item.category,
        purchaseDate: item.purchaseDate?.split('T')[0] || new Date().toISOString().split('T')[0],
      });
    } else {
      setEditItem(null);
      setFormData({
        name: '', quantity: '', unit: 'kg', price: '', category: 'General',
        purchaseDate: new Date().toISOString().split('T')[0],
      });
    }
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.quantity || !formData.price) {
      toast.error('Please fill required fields');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...formData,
        quantity: parseFloat(formData.quantity),
        price: parseFloat(formData.price),
      };
      if (editItem) {
        await api.put(`/groceries/${editItem._id}`, payload);
        toast.success('Grocery updated');
      } else {
        await api.post('/groceries', payload);
        toast.success('Grocery added');
      }
      setShowForm(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save');
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/groceries/${deleteTarget._id}`);
      toast.success('Deleted');
      setDeleteTarget(null);
      fetchData();
    } catch { toast.error('Failed to delete'); }
  };

  if (loading) return <PageLoader />;

  const statusColor = { good: 'text-emerald-500', moderate: 'text-blue-500', low: 'text-amber-500', critical: 'text-red-500' };
  const statusBg = { good: 'bg-emerald-100 dark:bg-emerald-500/15', moderate: 'bg-blue-100 dark:bg-blue-500/15', low: 'bg-amber-100 dark:bg-amber-500/15', critical: 'bg-red-100 dark:bg-red-500/15' };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-header">Groceries</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Track your grocery purchases and inventory</p>
        </div>
        <button onClick={() => openForm()} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Add Grocery
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={ShoppingCart} label="Total Items" value={stats.totalItems || 0} color="primary" delay={0} />
        <StatCard icon={AlertTriangle} label="Low Stock" value={stats.lowStockCount || 0} color="warning" delay={1} />
        <StatCard icon={Package} label="Total Spent" value={formatCurrency(stats.totalSpent || 0)} color="accent" delay={2} />
      </div>

      {/* View Toggle + Filters */}
      <div className="flex items-center gap-3">
        {['list', 'inventory'].map((v) => (
          <button key={v} onClick={() => setView(v)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all capitalize ${view === v ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25' : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400'}`}
          >{v}</button>
        ))}
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="input-field !w-auto text-sm ml-auto">
          <option value="">All Categories</option>
          {GROCERY_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* List View */}
      {view === 'list' && (
        groceries.length === 0 ? (
          <EmptyState title="No groceries" description="Add your first grocery purchase" action={() => openForm()} actionLabel="Add Grocery" />
        ) : (
          <div className="glass-card !p-0 overflow-hidden">
            {groceries.map((g, i) => (
              <motion.div key={g._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                className="flex items-center gap-4 px-4 py-3.5 border-b border-gray-50 dark:border-white/[0.03] hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-500/15 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <ShoppingCart size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{g.name}</p>
                  <p className="text-xs text-gray-400">{g.quantity} {g.unit} • {g.category} • {formatDate(g.purchaseDate)}</p>
                </div>
                <p className="text-sm font-semibold text-gray-800 dark:text-white">{formatCurrency(g.price)}</p>
                <div className="flex gap-1">
                  <button onClick={() => openForm(g)} className="p-1.5 rounded-lg text-gray-400 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-500/10"><Edit2 size={14} /></button>
                  <button onClick={() => setDeleteTarget(g)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"><Trash2 size={14} /></button>
                </div>
              </motion.div>
            ))}
          </div>
        )
      )}

      {/* Inventory View */}
      {view === 'inventory' && (
        inventory.length === 0 ? (
          <EmptyState title="No inventory data" description="Add groceries to see inventory status" />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {inventory.map((item, i) => (
              <motion.div key={item._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="glass-card"
              >
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-gray-800 dark:text-white">{item.name}</h4>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${statusBg[item.status]} ${statusColor[item.status]}`}>
                    {item.status}
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden mb-2">
                  <div className={`h-full rounded-full transition-all ${item.status === 'critical' ? 'bg-red-500' : item.status === 'low' ? 'bg-amber-500' : 'bg-emerald-500'}`}
                    style={{ width: `${item.percentRemaining}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {item.estimatedRemainingQty} / {item.quantity} {item.unit} remaining ({item.percentRemaining}%)
                </p>
              </motion.div>
            ))}
          </div>
        )
      )}

      {/* Form Modal */}
      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title={editItem ? 'Edit Grocery' : 'Add Grocery'}>
        <div className="space-y-4">
          <div>
            <label className="label">Name</label>
            <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Rice" className="input-field" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label">Quantity</label>
              <input type="number" value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: e.target.value })} className="input-field" />
            </div>
            <div>
              <label className="label">Unit</label>
              <select value={formData.unit} onChange={(e) => setFormData({ ...formData, unit: e.target.value })} className="input-field">
                {GROCERY_UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Price (₹)</label>
              <input type="number" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} className="input-field" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Category</label>
              <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="input-field">
                {GROCERY_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Purchase Date</label>
              <input type="date" value={formData.purchaseDate} onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })} className="input-field" />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setShowForm(false)} className="btn-secondary flex-1">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="btn-primary flex-1">{saving ? 'Saving...' : editItem ? 'Update' : 'Add'}</button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title="Delete Grocery" message={`Delete "${deleteTarget?.name}"?`} />
    </div>
  );
};

export default GroceryPage;
