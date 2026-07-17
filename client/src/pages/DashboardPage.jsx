import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Wallet, TrendingDown, Calendar, Shield, ArrowRight,
  IndianRupee, Target, PiggyBank,
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, formatDate, getRelativeTime } from '../utils/formatters';
import { getCategoryColor, CATEGORY_ICONS } from '../utils/constants';
import StatCard from '../components/common/StatCard';
import { PageLoader } from '../components/common/LoadingSpinner';

const DashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState(null);
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const [dashRes, insightRes] = await Promise.all([
        api.get('/analytics/dashboard'),
        api.get('/analytics/insights'),
      ]);
      setDashboard(dashRes.data.dashboard);
      setInsights(insightRes.data.insights || []);
    } catch (error) {
      console.error('Dashboard fetch error:', error);
    }
    setLoading(false);
  };

  if (loading) return <PageLoader />;
  if (!dashboard) return <PageLoader />;

  const d = dashboard;
  const pieData = d.topCategories?.map((cat) => ({
    name: cat.category,
    value: cat.amount,
    color: getCategoryColor(cat.category),
  })) || [];

  const budgetPercent = d.percentUsed || 0;
  const budgetColor = budgetPercent > 100 ? 'text-red-500' : budgetPercent > 80 ? 'text-amber-500' : 'text-emerald-500';
  const budgetBarColor = budgetPercent > 100 ? 'bg-red-500' : budgetPercent > 80 ? 'bg-amber-500' : 'bg-emerald-500';

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="page-header">
          Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'}, {user?.name?.split(' ')[0]}! 👋
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Here's your financial overview for this month
        </p>
      </motion.div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Wallet}
          label="Monthly Budget"
          value={formatCurrency(d.totalBudget)}
          color="primary"
          delay={0}
        />
        <StatCard
          icon={TrendingDown}
          label="Monthly Spent"
          value={formatCurrency(d.monthlySpent)}
          color="warning"
          delay={1}
        />
        <StatCard
          icon={PiggyBank}
          label="Remaining"
          value={formatCurrency(d.remaining)}
          color={d.remaining >= 0 ? 'accent' : 'danger'}
          delay={2}
        />
        <StatCard
          icon={Shield}
          label="Safe Daily Spending"
          value={formatCurrency(d.safeDailySpending)}
          color="info"
          delay={3}
        />
      </div>

      {/* Budget Progress + Pie Chart Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Budget Progress */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-gray-800 dark:text-white">Budget Progress</h3>
            <span className={`text-2xl font-bold ${budgetColor}`}>{budgetPercent}%</span>
          </div>

          <div className="w-full h-3 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden mb-4">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(budgetPercent, 100)}%` }}
              transition={{ duration: 1, delay: 0.5 }}
              className={`h-full rounded-full ${budgetBarColor} shadow-lg`}
            />
          </div>

          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Today</p>
              <p className="text-sm font-semibold text-gray-800 dark:text-white">{formatCurrency(d.todaySpent)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">This Week</p>
              <p className="text-sm font-semibold text-gray-800 dark:text-white">{formatCurrency(d.weeklySpent)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Days Left</p>
              <p className="text-sm font-semibold text-gray-800 dark:text-white">{d.remainingDays}</p>
            </div>
          </div>
        </motion.div>

        {/* Category Breakdown Pie */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-gray-800 dark:text-white">Top Categories</h3>
            <button
              onClick={() => navigate('/analytics')}
              className="text-xs text-primary-500 hover:text-primary-400 font-medium flex items-center gap-1"
            >
              View all <ArrowRight size={12} />
            </button>
          </div>

          {pieData.length > 0 ? (
            <div className="flex items-center gap-4">
              <div className="w-32 h-32">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={pieData}
                      innerRadius={35}
                      outerRadius={55}
                      dataKey="value"
                      paddingAngle={3}
                      strokeWidth={0}
                    >
                      {pieData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => formatCurrency(value)}
                      contentStyle={{
                        background: 'rgba(15,23,42,0.9)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '12px',
                        color: '#fff',
                        fontSize: '12px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-2">
                {pieData.map((cat, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        {CATEGORY_ICONS[cat.name] || '📦'} {cat.name}
                      </span>
                    </div>
                    <span className="text-xs font-medium text-gray-800 dark:text-gray-200">
                      {formatCurrency(cat.value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-8">No expenses this month</p>
          )}
        </motion.div>
      </div>

      {/* Insights + Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Insights */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card"
        >
          <h3 className="text-base font-semibold text-gray-800 dark:text-white mb-4">💡 Insights</h3>
          {insights.length > 0 ? (
            <div className="space-y-3">
              {insights.slice(0, 5).map((insight, i) => (
                <div
                  key={i}
                  className={`flex items-start gap-3 p-3 rounded-xl text-sm
                    ${insight.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-500/10' :
                      insight.type === 'warning' ? 'bg-amber-50 dark:bg-amber-500/10' :
                      insight.type === 'danger' ? 'bg-red-50 dark:bg-red-500/10' :
                      'bg-gray-50 dark:bg-white/5'}`}
                >
                  <span className="text-lg">{insight.icon}</span>
                  <span className="text-gray-700 dark:text-gray-300">{insight.text}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-8">
              Add some expenses to see insights
            </p>
          )}
        </motion.div>

        {/* Recent Transactions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-card"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-gray-800 dark:text-white">Recent Transactions</h3>
            <button
              onClick={() => navigate('/expenses')}
              className="text-xs text-primary-500 hover:text-primary-400 font-medium flex items-center gap-1"
            >
              View all <ArrowRight size={12} />
            </button>
          </div>

          {d.recentTransactions?.length > 0 ? (
            <div className="space-y-1">
              {d.recentTransactions.map((t) => (
                <div key={t._id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-white/5 flex items-center justify-center text-lg">
                    {CATEGORY_ICONS[t.category] || '📦'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{t.title}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">{t.category} • {getRelativeTime(t.date)}</p>
                  </div>
                  <p className="text-sm font-semibold text-gray-800 dark:text-white">
                    {formatCurrency(t.amount)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-8">No transactions yet</p>
          )}
        </motion.div>
      </div>

      {/* Savings Comparison */}
      {d.savings && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="glass-card"
        >
          <h3 className="text-base font-semibold text-gray-800 dark:text-white mb-4">💰 Savings Comparison</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="text-center p-4 rounded-xl bg-gray-50 dark:bg-white/5">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">This Month</p>
              <p className={`text-xl font-bold ${d.savings.thisMonth >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                {formatCurrency(d.savings.thisMonth)}
              </p>
            </div>
            <div className="text-center p-4 rounded-xl bg-gray-50 dark:bg-white/5">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Last Month</p>
              <p className={`text-xl font-bold ${d.savings.prevMonth >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                {formatCurrency(d.savings.prevMonth)}
              </p>
            </div>
            <div className="text-center p-4 rounded-xl bg-gray-50 dark:bg-white/5">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Change</p>
              <p className={`text-xl font-bold ${d.savings.change >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                {d.savings.change >= 0 ? '+' : ''}{formatCurrency(d.savings.change)}
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default DashboardPage;
