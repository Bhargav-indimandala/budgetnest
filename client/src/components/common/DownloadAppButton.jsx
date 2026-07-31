import { CheckCircle2, Smartphone, Download } from 'lucide-react';
import { isRunningInNativeApp } from '../../hooks/useNativeApp';

// Reusable "Download App" prompt for the .apk. Shown anywhere the person
// might be browsing in a regular browser (logged in or not) — but hides
// itself (and shows a confirmation instead) when viewed from inside the
// actual installed native app, since there's nothing useful to offer there.
const DownloadAppButton = ({ variant = 'button', className = '' }) => {
  if (isRunningInNativeApp()) {
    if (variant === 'compact') return null;
    return (
      <div className={`flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 ${className}`}>
        <CheckCircle2 size={14} /> App already installed on your mobile
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <a
        href="/downloads/BudgetNest.apk"
        download
        className={`flex items-center gap-1.5 text-xs font-medium text-primary-600 dark:text-primary-400 hover:underline ${className}`}
      >
        <Smartphone size={13} /> Get the App
      </a>
    );
  }

  return (
    <a
      href="/downloads/BudgetNest.apk"
      download
      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-primary-500 text-white hover:bg-primary-600 transition-all ${className}`}
    >
      <Download size={16} /> Download Android App
    </a>
  );
};

export default DownloadAppButton;
