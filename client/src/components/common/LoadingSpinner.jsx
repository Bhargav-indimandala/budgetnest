import { motion } from 'framer-motion';

const LoadingSpinner = ({ size = 'md', text = 'Loading...' }) => {
  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12">
      <motion.div
        className={`${sizeClasses[size]} border-3 border-primary-200 dark:border-primary-800 
          border-t-primary-500 rounded-full`}
        animate={{ rotate: 360 }}
        transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
      />
      {text && (
        <p className="text-sm text-gray-500 dark:text-gray-400">{text}</p>
      )}
    </div>
  );
};

export const SkeletonCard = ({ className = '' }) => (
  <div className={`glass-card animate-pulse ${className}`}>
    <div className="h-4 bg-gray-200 dark:bg-white/10 rounded-lg w-1/3 mb-3" />
    <div className="h-8 bg-gray-200 dark:bg-white/10 rounded-lg w-2/3 mb-2" />
    <div className="h-3 bg-gray-200 dark:bg-white/10 rounded-lg w-1/2" />
  </div>
);

export const SkeletonRow = () => (
  <div className="flex items-center gap-4 py-4 px-4 animate-pulse">
    <div className="w-10 h-10 rounded-xl bg-gray-200 dark:bg-white/10" />
    <div className="flex-1 space-y-2">
      <div className="h-4 bg-gray-200 dark:bg-white/10 rounded-lg w-1/3" />
      <div className="h-3 bg-gray-200 dark:bg-white/10 rounded-lg w-1/4" />
    </div>
    <div className="h-5 bg-gray-200 dark:bg-white/10 rounded-lg w-16" />
  </div>
);

export const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <LoadingSpinner size="lg" text="Loading..." />
  </div>
);

export default LoadingSpinner;
