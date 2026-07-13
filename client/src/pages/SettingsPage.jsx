import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  User, Wallet, Bell, Palette, Lock, Save, Sun, Moon, Star,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../services/api';
import { CURRENCIES, CATEGORIES } from '../utils/constants';
import toast from 'react-hot-toast';

const TABS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'budget', label: 'Budget & Currency', icon: Wallet },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'security', label: 'Security', icon: Lock },
];

const SettingsPage = () => {
  const { user, updateUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('profile');
  const [saving, setSaving] = useState(false);

  const [profile, setProfile] = useState({
    name: user?.name || '',
    monthlyIncome: user?.monthlyIncome || 0,
  });

  const [budget, setBudget] = useState({
    monthlyBudget: user?.monthlyBudget || 0,
    currency: user?.currency || 'INR',
    favoriteCategories: user?.favoriteCategories || [],
  });

  const [notifPrefs, setNotifPrefs] = useState(
    user?.notificationPrefs || {
      rentReminder: true,
      budgetExceeded: true,
      dailyReminder: false,
      recurringReminder: true,
    }
  );
  const [reminderTime, setReminderTime] = useState(user?.reminderTime || '20:00');

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const saveProfile = async () => {
    setSaving(true);
    try {
      const { data } = await api.put('/auth/profile', profile);
      updateUser(data.user);
      toast.success('Profile updated');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    }
    setSaving(false);
  };

  const saveBudgetSettings = async () => {
    setSaving(true);
    try {
      const { data } = await api.put('/auth/profile', budget);
      updateUser(data.user);
      toast.success('Budget settings updated');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update settings');
    }
    setSaving(false);
  };

  const saveNotifSettings = async () => {
    setSaving(true);
    try {
      const { data } = await api.put('/auth/profile', {
        notificationPrefs: notifPrefs,
        reminderTime,
      });
      updateUser(data.user);
      toast.success('Notification preferences updated');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update preferences');
    }
    setSaving(false);
  };

  const toggleFavoriteCategory = (cat) => {
    setBudget((prev) => {
      const has = prev.favoriteCategories.includes(cat);
      return {
        ...prev,
        favoriteCategories: has
          ? prev.favoriteCategories.filter((c) => c !== cat)
          : [...prev.favoriteCategories, cat],
      };
    });
  };

  const changePassword = async () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      toast.error('Please fill all password fields');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }
    setSaving(true);
    try {
      await api.put('/auth/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      toast.success('Password changed successfully');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to change password');
    }
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-header">Settings</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Manage your profile, budget defaults, and preferences
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Tabs */}
        <div className="lg:col-span-1">
          <div className="glass-card p-2 flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all
                  ${activeTab === id
                    ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5'}`}
              >
                <Icon size={16} /> {label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-3 glass-card space-y-5"
        >
          {activeTab === 'profile' && (
            <>
              <h3 className="text-sm font-semibold text-gray-800 dark:text-white">Profile Details</h3>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-400 to-accent-400 flex items-center justify-center text-white text-xl font-bold">
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800 dark:text-white">{user?.name}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">{user?.email}</p>
                </div>
              </div>
              <div>
                <label className="label">Full Name</label>
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="label">Email</label>
                <input type="email" value={user?.email || ''} disabled className="input-field opacity-60 cursor-not-allowed" />
              </div>
              <div>
                <label className="label">Monthly Income (₹)</label>
                <input
                  type="number"
                  value={profile.monthlyIncome}
                  onChange={(e) => setProfile({ ...profile, monthlyIncome: parseFloat(e.target.value) || 0 })}
                  className="input-field"
                />
              </div>
              <button onClick={saveProfile} disabled={saving} className="btn-primary flex items-center gap-2">
                <Save size={16} /> {saving ? 'Saving...' : 'Save Profile'}
              </button>
            </>
          )}

          {activeTab === 'budget' && (
            <>
              <h3 className="text-sm font-semibold text-gray-800 dark:text-white">Budget & Currency</h3>
              <div>
                <label className="label">Default Monthly Budget (₹)</label>
                <input
                  type="number"
                  value={budget.monthlyBudget}
                  onChange={(e) => setBudget({ ...budget, monthlyBudget: parseFloat(e.target.value) || 0 })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="label">Currency</label>
                <select
                  value={budget.currency}
                  onChange={(e) => setBudget({ ...budget, currency: e.target.value })}
                  className="input-field"
                >
                  {Object.entries(CURRENCIES).map(([code, c]) => (
                    <option key={code} value={code}>{c.symbol} {c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Favorite Categories</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {CATEGORIES.map((cat) => {
                    const active = budget.favoriteCategories.includes(cat);
                    return (
                      <button
                        key={cat}
                        onClick={() => toggleFavoriteCategory(cat)}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all
                          ${active
                            ? 'bg-primary-500 text-white shadow-md shadow-primary-500/25'
                            : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10'}`}
                      >
                        {active && <Star size={11} fill="currentColor" />} {cat}
                      </button>
                    );
                  })}
                </div>
              </div>
              <button onClick={saveBudgetSettings} disabled={saving} className="btn-primary flex items-center gap-2">
                <Save size={16} /> {saving ? 'Saving...' : 'Save Settings'}
              </button>
            </>
          )}

          {activeTab === 'notifications' && (
            <>
              <h3 className="text-sm font-semibold text-gray-800 dark:text-white">Notification Preferences</h3>
              {[
                { key: 'rentReminder', label: 'Upcoming Rent Reminder', desc: 'Get notified before rent is due' },
                { key: 'budgetExceeded', label: 'Budget Exceeded Alerts', desc: 'Alert when you exceed your monthly budget' },
                { key: 'dailyReminder', label: 'No Expense Added Reminder', desc: "Remind me if I haven't logged an expense today" },
                { key: 'recurringReminder', label: 'Recurring Expense Reminder', desc: 'Notify when a recurring expense is auto-added' },
              ].map(({ key, label, desc }) => (
                <div key={key} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-white/5 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{label}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">{desc}</p>
                  </div>
                  <button
                    onClick={() => setNotifPrefs({ ...notifPrefs, [key]: !notifPrefs[key] })}
                    className={`w-11 h-6 rounded-full relative transition-all flex-shrink-0 ${notifPrefs[key] ? 'bg-primary-500' : 'bg-gray-300 dark:bg-gray-600'}`}
                  >
                    <span
                      className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${notifPrefs[key] ? 'left-5' : 'left-0.5'}`}
                    />
                  </button>
                </div>
              ))}
              <div>
                <label className="label">Daily Reminder Time</label>
                <input
                  type="time"
                  value={reminderTime}
                  onChange={(e) => setReminderTime(e.target.value)}
                  className="input-field !w-auto"
                />
              </div>
              <button onClick={saveNotifSettings} disabled={saving} className="btn-primary flex items-center gap-2">
                <Save size={16} /> {saving ? 'Saving...' : 'Save Preferences'}
              </button>
            </>
          )}

          {activeTab === 'appearance' && (
            <>
              <h3 className="text-sm font-semibold text-gray-800 dark:text-white">Appearance</h3>
              <p className="text-xs text-gray-400 dark:text-gray-500 -mt-3">
                Choose how BudgetNest looks on this device
              </p>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => theme !== 'light' && toggleTheme()}
                  className={`p-5 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all
                    ${theme === 'light' ? 'border-primary-500 bg-primary-50 dark:bg-primary-500/10' : 'border-gray-200 dark:border-white/10'}`}
                >
                  <Sun size={24} className="text-amber-500" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Light Mode</span>
                </button>
                <button
                  onClick={() => theme !== 'dark' && toggleTheme()}
                  className={`p-5 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all
                    ${theme === 'dark' ? 'border-primary-500 bg-primary-50 dark:bg-primary-500/10' : 'border-gray-200 dark:border-white/10'}`}
                >
                  <Moon size={24} className="text-indigo-400" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Dark Mode</span>
                </button>
              </div>
            </>
          )}

          {activeTab === 'security' && (
            <>
              <h3 className="text-sm font-semibold text-gray-800 dark:text-white">Change Password</h3>
              <div>
                <label className="label">Current Password</label>
                <input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="label">New Password</label>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="label">Confirm New Password</label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  className="input-field"
                />
              </div>
              <button onClick={changePassword} disabled={saving} className="btn-primary flex items-center gap-2">
                <Lock size={16} /> {saving ? 'Updating...' : 'Change Password'}
              </button>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default SettingsPage;
