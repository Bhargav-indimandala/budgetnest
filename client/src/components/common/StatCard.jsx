import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';

const StatCard = ({ icon: Icon, label, value, trend, trendLabel, color = 'primary', delay = 0, className = '' }) => {
  const colorMap = {
    primary: {
      bg: 'bg-primary-100 dark:bg-primary-500/15',
      icon: 'text-primary-600 dark:text-primary-400',
      glow: 'shadow-primary-500/10',
    },
    accent: {
      bg: 'bg-emerald-100 dark:bg-emerald-500/15',
      icon: 'text-emerald-600 dark:text-emerald-400',
      glow: 'shadow-emerald-500/10',
    },
    warning: {
      bg: 'bg-amber-100 dark:bg-amber-500/15',
      icon: 'text-amber-600 dark:text-amber-400',
      glow: 'shadow-amber-500/10',
    },
    danger: {
      bg: 'bg-red-100 dark:bg-red-500/15',
      icon: 'text-red-600 dark:text-red-400',
      glow: 'shadow-red-500/10',
    },
    info: {
      bg: 'bg-blue-100 dark:bg-blue-500/15',
      icon: 'text-blue-600 dark:text-blue-400',
      glow: 'shadow-blue-500/10',
    },
  };

  const colors = colorMap[color] || colorMap.primary;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay * 0.1, duration: 0.4 }}
      className={`glass-card flex items-start justify-between ${className}`}
    >
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
          {label}
        </p>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">
          {value}
        </p>
        {(trend !== undefined && trend !== null) && (
          <div className="flex items-center gap-1 mt-2">
            {trend >= 0 ? (
              <TrendingUp size={14} className="text-emerald-500" />
            ) : (
              <TrendingDown size={14} className="text-red-500" />
            )}
            <span className={`text-xs font-medium ${trend >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
              {trend >= 0 ? '+' : ''}{trend}%
            </span>
            {trendLabel && (
              <span className="text-xs text-gray-400 dark:text-gray-500 ml-1">{trendLabel}</span>
            )}
          </div>
        )}
      </div>
      {Icon && (
        <div className={`w-12 h-12 rounded-xl ${colors.bg} flex items-center justify-center shadow-lg ${colors.glow}`}>
          <Icon size={22} className={colors.icon} />
        </div>
      )}
    </motion.div>
  );
};

export default StatCard;
