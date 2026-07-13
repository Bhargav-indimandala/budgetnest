import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FileText, Download, FileSpreadsheet, TrendingUp, TrendingDown,
  Calendar, IndianRupee, Receipt, Award,
} from 'lucide-react';
import Papa from 'papaparse';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import api from '../services/api';
import { formatCurrency, formatDate } from '../utils/formatters';
import StatCard from '../components/common/StatCard';
import EmptyState from '../components/common/EmptyState';
import { PageLoader } from '../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const ReportsPage = () => {
  const now = new Date();
  const [reportType, setReportType] = useState('monthly');
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchReport();
  }, [reportType, year, month]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      if (reportType === 'monthly') {
        const { data } = await api.get(`/reports/monthly/${year}/${month}`);
        setReport(data.report);
      } else {
        const { data } = await api.get('/reports/weekly');
        setReport(data.report);
      }
    } catch (error) {
      console.error('Report fetch error:', error);
      toast.error('Failed to load report');
    }
    setLoading(false);
  };

  const exportCSV = async () => {
    setExporting(true);
    try {
      const { data } = await api.get('/expenses/export/csv');
      const csv = Papa.unparse(data.data || []);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `budgetnest-expenses-${Date.now()}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success('CSV exported');
    } catch {
      toast.error('Failed to export CSV');
    }
    setExporting(false);
  };

  const exportPDF = async () => {
    setExporting(true);
    try {
      const { data } = await api.get('/expenses/export/pdf');
      const expenses = data.data || [];

      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.text('BudgetNest — Expense Report', 14, 18);
      doc.setFontSize(10);
      doc.setTextColor(120);
      doc.text(`Generated on ${formatDate(new Date())}`, 14, 25);

      autoTable(doc, {
        startY: 32,
        head: [['Title', 'Category', 'Amount', 'Payment', 'Date']],
        body: expenses.map((e) => [
          e.title,
          e.category,
          formatCurrency(e.amount),
          e.paymentMethod,
          formatDate(e.date),
        ]),
        headStyles: { fillColor: [99, 102, 241] },
        styles: { fontSize: 9 },
      });

      doc.save(`budgetnest-expenses-${Date.now()}.pdf`);
      toast.success('PDF exported');
    } catch {
      toast.error('Failed to export PDF');
    }
    setExporting(false);
  };

  const exportReportPDF = () => {
    if (!report) return;
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('BudgetNest — Report Summary', 14, 18);
    doc.setFontSize(10);
    doc.setTextColor(120);
    const periodLabel =
      reportType === 'monthly'
        ? `${MONTH_NAMES[month - 1]} ${year}`
        : `${report.weekStart} to ${report.weekEnd}`;
    doc.text(periodLabel, 14, 25);

    autoTable(doc, {
      startY: 32,
      head: [['Metric', 'Value']],
      body: [
        ['Total Spent', formatCurrency(report.totalSpent)],
        ...(reportType === 'monthly'
          ? [
              ['Total Budget', formatCurrency(report.totalBudget)],
              ['Remaining', formatCurrency(report.remaining)],
            ]
          : []),
        ['Transactions', String(report.transactionCount)],
        ['Average Daily Spend', formatCurrency(report.avgDaily)],
      ],
      headStyles: { fillColor: [99, 102, 241] },
    });

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 10,
      head: [['Category', 'Amount']],
      body: Object.entries(report.categoryBreakdown || {}).map(([cat, amt]) => [
        cat,
        formatCurrency(amt),
      ]),
      headStyles: { fillColor: [16, 185, 129] },
    });

    doc.save(`budgetnest-${reportType}-report-${Date.now()}.pdf`);
    toast.success('Report PDF exported');
  };

  if (loading && !report) return <PageLoader />;

  const categoryEntries = report
    ? Object.entries(report.categoryBreakdown || {}).sort((a, b) => b[1] - a[1])
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-header">Reports</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Monthly and weekly summaries, ready to export
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={exportCSV} disabled={exporting} className="btn-secondary flex items-center gap-2">
            <FileSpreadsheet size={16} /> Export CSV
          </button>
          <button onClick={exportPDF} disabled={exporting} className="btn-secondary flex items-center gap-2">
            <FileText size={16} /> Export All PDF
          </button>
        </div>
      </div>

      {/* Report Type Toggle */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-2">
          {[{ label: 'Monthly', value: 'monthly' }, { label: 'Weekly', value: 'weekly' }].map((opt) => (
            <button
              key={opt.value}
              onClick={() => setReportType(opt.value)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all
                ${reportType === opt.value ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25' : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10'}`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {reportType === 'monthly' && (
          <div className="flex gap-2 ml-auto">
            <select
              value={month}
              onChange={(e) => setMonth(parseInt(e.target.value))}
              className="input-field !py-2 !w-auto"
            >
              {MONTH_NAMES.map((m, i) => (
                <option key={m} value={i + 1}>{m}</option>
              ))}
            </select>
            <select
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value))}
              className="input-field !py-2 !w-auto"
            >
              {[now.getFullYear(), now.getFullYear() - 1].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {!report || report.transactionCount === 0 ? (
        <EmptyState
          icon={FileText}
          title="No data for this period"
          description="Add some expenses to see a report here."
        />
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={IndianRupee} label="Total Spent" value={formatCurrency(report.totalSpent)} color="primary" delay={0} />
            <StatCard icon={Receipt} label="Transactions" value={report.transactionCount} color="accent" delay={1} />
            <StatCard icon={TrendingUp} label="Avg Daily Spend" value={formatCurrency(report.avgDaily)} color="warning" delay={2} />
            {reportType === 'monthly' ? (
              <StatCard
                icon={report.remaining >= 0 ? TrendingDown : TrendingUp}
                label="Budget Remaining"
                value={formatCurrency(report.remaining)}
                color={report.remaining >= 0 ? 'accent' : 'danger'}
                delay={3}
              />
            ) : (
              <StatCard icon={Calendar} label="Week Range" value={`${report.weekStart} → ${report.weekEnd}`} color="info" delay={3} />
            )}
          </div>

          {/* Category Breakdown + Top Info */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card lg:col-span-2"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-800 dark:text-white">Category Breakdown</h3>
                <button onClick={exportReportPDF} className="text-xs text-primary-500 hover:text-primary-600 font-medium flex items-center gap-1">
                  <Download size={13} /> Export This Report
                </button>
              </div>
              <div className="space-y-3">
                {categoryEntries.map(([cat, amt]) => {
                  const pct = report.totalSpent ? Math.round((amt / report.totalSpent) * 100) : 0;
                  return (
                    <div key={cat}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-gray-600 dark:text-gray-300 font-medium">{cat}</span>
                        <span className="text-gray-500 dark:text-gray-400">{formatCurrency(amt)} · {pct}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-gray-100 dark:bg-white/5 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-primary-500 to-accent-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass-card space-y-4"
            >
              <h3 className="text-sm font-semibold text-gray-800 dark:text-white mb-2">Highlights</h3>
              {report.topCategory && (
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary-100 dark:bg-primary-500/15 flex items-center justify-center">
                    <Award size={16} className="text-primary-600 dark:text-primary-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 dark:text-gray-500">Top Category</p>
                    <p className="text-sm font-medium text-gray-800 dark:text-white">
                      {report.topCategory.category} · {formatCurrency(report.topCategory.amount)}
                    </p>
                  </div>
                </div>
              )}
              {report.mostExpensiveDay && (
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-accent-100 dark:bg-accent-500/15 flex items-center justify-center">
                    <Calendar size={16} className="text-accent-600 dark:text-accent-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 dark:text-gray-500">Most Expensive Day</p>
                    <p className="text-sm font-medium text-gray-800 dark:text-white">
                      {formatDate(report.mostExpensiveDay.date)} · {formatCurrency(report.mostExpensiveDay.amount)}
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          </div>

          {/* Transactions Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="glass-card overflow-x-auto"
          >
            <h3 className="text-sm font-semibold text-gray-800 dark:text-white mb-4">Transactions</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-400 dark:text-gray-500 border-b border-gray-100 dark:border-white/5">
                  <th className="pb-2 font-medium">Title</th>
                  <th className="pb-2 font-medium">Category</th>
                  <th className="pb-2 font-medium">Date</th>
                  <th className="pb-2 font-medium text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {report.expenses.slice(0, 25).map((e, i) => (
                  <tr key={i} className="border-b border-gray-50 dark:border-white/[0.02]">
                    <td className="py-2.5 text-gray-800 dark:text-gray-200">{e.title}</td>
                    <td className="py-2.5 text-gray-500 dark:text-gray-400">{e.category}</td>
                    <td className="py-2.5 text-gray-500 dark:text-gray-400">{formatDate(e.date)}</td>
                    <td className="py-2.5 text-right font-medium text-gray-800 dark:text-white">
                      {formatCurrency(e.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {report.expenses.length > 25 && (
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-3 text-center">
                Showing 25 of {report.expenses.length} transactions — export PDF/CSV for the full list.
              </p>
            )}
          </motion.div>
        </>
      )}
    </div>
  );
};

export default ReportsPage;
