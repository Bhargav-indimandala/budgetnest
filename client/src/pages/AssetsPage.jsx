import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Plus, Trash2, Edit2, Package, IndianRupee, CheckCircle,
  AlertTriangle, XCircle, Filter,
} from 'lucide-react';
import api from '../services/api';
import { formatCurrency, formatDate } from '../utils/formatters';
import { ASSET_STATUSES } from '../utils/constants';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import EmptyState from '../components/common/EmptyState';
import StatCard from '../components/common/StatCard';
import { PageLoader } from '../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

const ASSET_CATEGORIES = [
  'Kitchen', 'Bedroom', 'Electronics', 'Furniture', 'Cleaning', 'Study', 'Other',
];

const STATUS_CONFIG = {
  Active: {
    icon: CheckCircle,
    badge: 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
    dot: 'bg-emerald-500',
  },
  Disposed: {
    icon: XCircle,
    badge: 'bg-gray-100 dark:bg-gray-500/15 text-gray-600 dark:text-gray-400',
    dot: 'bg-gray-500',
  },
  Damaged: {
    icon: AlertTriangle,
    badge: 'bg-red-100 dark:bg-red-500/15 text-red-700 dark:text-red-400',
    dot: 'bg-red-500',
  },
};

const AssetsPage = () => {
  const [assets, setAssets] = useState([]);
  const [totalValue, setTotalValue] = useState(0);
  const [activeCount, setActiveCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    purchasePrice: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    expectedLifetime: '',
    status: 'Active',
    category: 'Other',
    notes: '',
  });

  useEffect(() => {
    fetchAssets();
  }, [statusFilter]);

  const fetchAssets = async () => {
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      const { data } = await api.get('/assets', { params });
      setAssets(data.assets || []);
      setTotalValue(data.totalValue || 0);
      setActiveCount(data.activeCount || 0);
    } catch (error) {
      console.error('Assets fetch error:', error);
    }
    setLoading(false);
  };

  const openForm = (item = null) => {
    if (item) {
      setEditItem(item);
      setFormData({
        name: item.name,
        purchasePrice: item.purchasePrice,
        purchaseDate: item.purchaseDate?.split('T')[0] || new Date().toISOString().split('T')[0],
        expectedLifetime: item.expectedLifetime || '',
        status: item.status || 'Active',
        category: item.category || 'Other',
        notes: item.notes || '',
      });
    } else {
      setEditItem(null);
      setFormData({
        name: '',
        purchasePrice: '',
        purchaseDate: new Date().toISOString().split('T')[0],
        expectedLifetime: '',
        status: 'Active',
        category: 'Other',
        notes: '',
      });
    }
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.purchasePrice) {
      toast.error('Please fill name and purchase price');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...formData,
        purchasePrice: parseFloat(formData.purchasePrice),
      };
      if (editItem) {
        await api.put(`/assets/${editItem._id}`, payload);
        toast.success('Asset updated');
      } else {
        await api.post('/assets', payload);
        toast.success('Asset added');
      }
      setShowForm(false);
      fetchAssets();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save');
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/assets/${deleteTarget._id}`);
      toast.success('Asset deleted');
      setDeleteTarget(null);
      fetchAssets();
    } catch {
      toast.error('Failed to delete');
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-header">Assets</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Track your one-time purchases and belongings
          </p>
        </div>
        <button onClick={() => openForm()} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Add Asset
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={Package} label="Total Assets" value={assets.length} color="primary" delay={0} />
        <StatCard icon={CheckCircle} label="Active" value={activeCount} color="accent" delay={1} />
        <StatCard icon={IndianRupee} label="Total Value" value={formatCurrency(totalValue)} color="warning" delay={2} />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setStatusFilter('')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all
            ${!statusFilter ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25' : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10'}`}
        >
          All
        </button>
        {ASSET_STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all
              ${statusFilter === s ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25' : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10'}`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Asset Grid */}
      {assets.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No assets found"
          description="Track your one-time purchases like bucket, mattress, fan, utensils, etc."
          action={() => openForm()}
          actionLabel="Add Asset"
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {assets.map((asset, i) => {
            const statusCfg = STATUS_CONFIG[asset.status] || STATUS_CONFIG.Active;
            return (
              <motion.div
                key={asset._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass-card group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-500/15 flex items-center justify-center">
                      <Package size={18} className="text-primary-600 dark:text-primary-400" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-gray-800 dark:text-white">{asset.name}</h4>
                      <p className="text-xs text-gray-400 dark:text-gray-500">{asset.category}</p>
                    </div>
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusCfg.badge}`}>
                    {asset.status}
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 dark:text-gray-400">Purchase Price</span>
                    <span className="text-sm font-semibold text-gray-800 dark:text-white">
                      {formatCurrency(asset.purchasePrice)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 dark:text-gray-400">Purchase Date</span>
                    <span className="text-xs text-gray-600 dark:text-gray-300">
                      {formatDate(asset.purchaseDate)}
                    </span>
                  </div>
                  {asset.expectedLifetime && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500 dark:text-gray-400">Expected Lifetime</span>
                      <span className="text-xs text-gray-600 dark:text-gray-300">{asset.expectedLifetime}</span>
                    </div>
                  )}
                </div>

                {asset.notes && (
                  <p className="text-xs text-gray-400 dark:text-gray-500 mb-3 line-clamp-2">{asset.notes}</p>
                )}

                <div className="flex gap-1 pt-2 border-t border-gray-100 dark:border-white/5">
                  <button
                    onClick={() => openForm(asset)}
                    className="flex-1 p-2 rounded-lg text-gray-400 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-500/10 transition-all text-xs font-medium flex items-center justify-center gap-1"
                  >
                    <Edit2 size={13} /> Edit
                  </button>
                  <button
                    onClick={() => setDeleteTarget(asset)}
                    className="flex-1 p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all text-xs font-medium flex items-center justify-center gap-1"
                  >
                    <Trash2 size={13} /> Delete
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Form Modal */}
      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title={editItem ? 'Edit Asset' : 'Add Asset'} size="lg">
        <div className="space-y-4">
          <div>
            <label className="label">Asset Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Induction Stove"
              className="input-field"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Purchase Price (₹)</label>
              <input
                type="number"
                value={formData.purchasePrice}
                onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
                placeholder="0"
                className="input-field"
              />
            </div>
            <div>
              <label className="label">Purchase Date</label>
              <input
                type="date"
                value={formData.purchaseDate}
                onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                className="input-field"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="input-field"
              >
                {ASSET_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="input-field"
              >
                {ASSET_STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="label">Expected Lifetime</label>
            <input
              type="text"
              value={formData.expectedLifetime}
              onChange={(e) => setFormData({ ...formData, expectedLifetime: e.target.value })}
              placeholder="e.g. 3 years"
              className="input-field"
            />
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
              {saving ? 'Saving...' : editItem ? 'Update' : 'Add Asset'}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Asset"
        message={`Delete "${deleteTarget?.name}"? This action cannot be undone.`}
      />
    </div>
  );
};

export default AssetsPage;
