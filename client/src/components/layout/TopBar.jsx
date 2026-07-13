import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Menu, Bell, Plus, Search, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';
import { getRelativeTime } from '../../utils/formatters';

const pageTitles = {
  '/': 'Dashboard',
  '/expenses': 'Expenses',
  '/budgets': 'Budgets',
  '/analytics': 'Analytics',
  '/groceries': 'Groceries',
  '/assets': 'Assets',
  '/recurring': 'Recurring',
  '/reports': 'Reports',
  '/settings': 'Settings',
};

const TopBar = ({ onMenuToggle }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const notifRef = useRef(null);
  const searchRef = useRef(null);

  const pageTitle = pageTitles[location.pathname] || 'BudgetNest';

  useEffect(() => {
    fetchNotifications();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSearch(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    try {
      const { data } = await api.get('/notifications');
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch {
      // silently fail
    }
  };

  const markAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      // silently fail
    }
  };

  return (
    <header className="sticky top-0 z-30 h-16 flex items-center justify-between px-4 md:px-6 border-b border-gray-200/80 dark:border-white/5 bg-white/70 dark:bg-surface-800/70 backdrop-blur-xl">
      {/* Left: Menu + Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 md:hidden transition-all"
        >
          <Menu size={20} />
        </button>
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
          {pageTitle}
        </h2>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* Search */}
        <div className="relative" ref={searchRef}>
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="p-2.5 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 transition-all"
          >
            <Search size={18} />
          </button>
          <AnimatePresence>
            {showSearch && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.95 }}
                className="absolute right-0 top-12 w-72 bg-white dark:bg-surface-800 rounded-xl shadow-xl dark:shadow-black/40 border border-gray-200 dark:border-white/10 p-3"
              >
                <input
                  type="text"
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && searchQuery.trim()) {
                      navigate(`/expenses?search=${encodeURIComponent(searchQuery.trim())}`);
                      setShowSearch(false);
                      setSearchQuery('');
                    }
                  }}
                  placeholder="Search expenses..."
                  className="input-field text-sm"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              if (!showNotifications) fetchNotifications();
            }}
            className="relative p-2.5 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 transition-all"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse-slow">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.95 }}
                className="absolute right-0 top-12 w-80 bg-white dark:bg-surface-800 rounded-2xl shadow-xl dark:shadow-black/40 border border-gray-200 dark:border-white/10 overflow-hidden"
              >
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-white/5">
                  <h3 className="text-sm font-semibold text-gray-800 dark:text-white">Notifications</h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      className="text-xs text-primary-500 hover:text-primary-600 font-medium flex items-center gap-1"
                    >
                      <Check size={12} /> Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-72 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-8">
                      No notifications yet
                    </p>
                  ) : (
                    notifications.slice(0, 10).map((notif) => (
                      <div
                        key={notif._id}
                        className={`px-4 py-3 border-b border-gray-50 dark:border-white/[0.02] hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors
                          ${!notif.isRead ? 'bg-primary-50/30 dark:bg-primary-500/5' : ''}`}
                      >
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{notif.title}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{notif.message}</p>
                        <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">
                          {getRelativeTime(notif.createdAt)}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Quick Add */}
        <button
          onClick={() => navigate('/expenses?add=true')}
          className="flex items-center gap-2 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 
            text-white text-sm font-medium pl-3 pr-4 py-2 rounded-xl shadow-lg shadow-primary-500/25 
            hover:shadow-xl transition-all active:scale-[0.98]"
        >
          <Plus size={16} />
          <span className="hidden sm:inline">Add Expense</span>
        </button>
      </div>
    </header>
  );
};

export default TopBar;
