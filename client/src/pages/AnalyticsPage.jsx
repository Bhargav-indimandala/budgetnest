import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import api from '../services/api';
import { formatCurrency } from '../utils/formatters';
import { getCategoryColor } from '../utils/constants';
import { PageLoader } from '../components/common/LoadingSpinner';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface-800/95 border border-white/10 rounded-xl px-4 py-3 shadow-xl">
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-sm font-medium text-white">
          {p.name}: {formatCurrency(p.value)}
        </p>
      ))}
    </div>
  );
};

const AnalyticsPage = () => {
  const [monthly, setMonthly] = useState([]);
  const [daily, setDaily] = useState([]);
  const [categories, setCategories] = useState([]);
  const [weekly, setWeekly] = useState([]);
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('6');

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const [monthlyRes, dailyRes, catRes, weeklyRes, insightRes] = await Promise.all([
        api.get('/analytics/monthly', { params: { months: period } }),
        api.get('/analytics/daily-trend', { params: { days: 30 } }),
        api.get('/analytics/category-breakdown'),
        api.get('/analytics/weekly', { params: { weeks: 4 } }),
        api.get('/analytics/insights'),
      ]);
      setMonthly(monthlyRes.data.data || []);
      setDaily(dailyRes.data.data || []);
      setCategories(catRes.data.categories || []);
      setWeekly(weeklyRes.data.data || []);
      setInsights(insightRes.data.insights || []);
    } catch (error) {
      console.error('Analytics error:', error);
    }
    setLoading(false);
  };

  if (loading) return <PageLoader />;

  const pieData = categories.map((c) => ({
    name: c.category,
    value: c.amount,
    color: getCategoryColor(c.category),
    percentage: c.percentage,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-header">Analytics</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Visualize your spending patterns
          </p>
        </div>
        <div className="flex gap-2">
          {[{ label: '3M', value: '3' }, { label: '6M', value: '6' }, { label: '12M', value: '12' }].map((opt) => (
            <button
              key={opt.value}
              onClick={() => setPeriod(opt.value)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all
                ${period === opt.value
                  ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25'
                  : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10'
                }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Monthly Spending Trend */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card">
        <h3 className="text-base font-semibold text-gray-800 dark:text-white mb-4">Monthly Spending Trend</h3>
        <div className="h-72">
          <ResponsiveContainer>
            <AreaChart data={monthly}>
              <defs>
                <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="total" stroke="#6366f1" fill="url(#colorSpend)" strokeWidth={2.5} name="Spent" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Daily Trend + Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Trend */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card">
          <h3 className="text-base font-semibold text-gray-800 dark:text-white mb-4">Daily Spending (Last 30 days)</h3>
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={daily}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="label" tick={{ fontSize: 9, fill: '#9ca3af' }} axisLine={false} tickLine={false} interval={4} />
                <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v}`} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="total" fill="#6366f1" radius={[4, 4, 0, 0]} name="Spent" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Category Breakdown */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card">
          <h3 className="text-base font-semibold text-gray-800 dark:text-white mb-4">Category Breakdown</h3>
          {pieData.length > 0 ? (
            <div className="flex flex-col items-center">
              <div className="w-48 h-48">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={pieData}
                      innerRadius={50}
                      outerRadius={80}
                      dataKey="value"
                      paddingAngle={2}
                      strokeWidth={0}
                    >
                      {pieData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => formatCurrency(value)}
                      contentStyle={{
                        background: 'rgba(15,23,42,0.95)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '12px',
                        color: '#fff',
                        fontSize: '12px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-full space-y-2 mt-4">
                {pieData.slice(0, 6).map((cat, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                      <span className="text-xs text-gray-600 dark:text-gray-400">{cat.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-medium text-gray-800 dark:text-gray-200">
                        {formatCurrency(cat.value)}
                      </span>
                      <span className="text-[10px] text-gray-400">{cat.percentage}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-10">No data yet</p>
          )}
        </motion.div>
      </div>

      {/* Weekly Comparison */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card">
        <h3 className="text-base font-semibold text-gray-800 dark:text-white mb-4">Weekly Comparison</h3>
        <div className="h-56">
          <ResponsiveContainer>
            <BarChart data={weekly}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis
                dataKey="weekStart"
                tick={{ fontSize: 10, fill: '#9ca3af' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              />
              <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v}`} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="total" fill="#10b981" radius={[6, 6, 0, 0]} name="Spent" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Insights */}
      {insights.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-card">
          <h3 className="text-base font-semibold text-gray-800 dark:text-white mb-4">💡 Spending Insights</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {insights.map((insight, i) => (
              <div
                key={i}
                className={`flex items-start gap-3 p-3 rounded-xl text-sm
                  ${insight.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-500/10' :
                    insight.type === 'warning' ? 'bg-amber-50 dark:bg-amber-500/10' :
                    insight.type === 'danger' ? 'bg-red-50 dark:bg-red-500/10' :
                    'bg-gray-50 dark:bg-white/5'}`}
              >
                <span className="text-lg shrink-0">{insight.icon}</span>
                <span className="text-gray-700 dark:text-gray-300">{insight.text}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default AnalyticsPage;
