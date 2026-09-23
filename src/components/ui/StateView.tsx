import React from 'react';
import { AlertCircle, RotateCcw, PackageOpen, Inbox } from 'lucide-react';
import { Button } from './Button';

// 1. Loading State (Shimmer Skeleton Cards)
export interface LoadingStateProps {
  count?: number;
  layout?: 'list' | 'grid';
  className?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  count = 4,
  layout = 'list',
  className = '',
}) => {
  return (
    <div
      className={`w-full ${
        layout === 'grid'
          ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3'
          : 'space-y-2.5'
      } ${className}`}
    >
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="w-full p-3 sm:p-3.5 rounded-2xl border border-gray-200/80 dark:border-[#2D333F] bg-white dark:bg-[#16181D] flex items-center gap-3 animate-pulse shadow-xs"
        >
          {/* Skeleton Thumbnail */}
          <div className="w-12 h-12 rounded-xl bg-gray-200 dark:bg-gray-800 shrink-0" />

          {/* Skeleton Content */}
          <div className="flex-1 min-w-0 space-y-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded-md w-3/4" />
            <div className="h-3 bg-gray-200/70 dark:bg-gray-800/60 rounded-md w-1/2" />
          </div>

          {/* Skeleton Trailing */}
          <div className="shrink-0 space-y-2 flex flex-col items-end">
            <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded-md w-16" />
            <div className="h-3 bg-gray-200/70 dark:bg-gray-800/60 rounded-md w-10" />
          </div>
        </div>
      ))}
    </div>
  );
};

// 2. Empty State
export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionText,
  onAction,
  className = '',
}) => {
  return (
    <div
      className={`w-full p-8 sm:p-12 text-center rounded-2xl border border-dashed border-gray-300 dark:border-[#333842] bg-gray-50/50 dark:bg-[#16181D]/40 flex flex-col items-center justify-center select-none ${className}`}
    >
      <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-[#1C2028] text-gray-400 dark:text-gray-500 flex items-center justify-center mb-3.5 shadow-xs">
        {icon || <Inbox className="w-7 h-7" />}
      </div>
      <h3 className="font-bold text-base text-gray-900 dark:text-gray-100 mb-1">
        {title}
      </h3>
      {description && (
        <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto mb-4 leading-relaxed">
          {description}
        </p>
      )}
      {actionText && onAction && (
        <Button variant="primary" size="md" onClick={onAction}>
          {actionText}
        </Button>
      )}
    </div>
  );
};

// 3. Error State
export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryText?: string;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'حدث خطأ أثناء تحميل البيانات',
  message,
  onRetry,
  retryText = 'إعادة المحاولة',
  className = '',
}) => {
  return (
    <div
      className={`w-full p-6 sm:p-8 text-center rounded-2xl border border-red-500/20 bg-red-500/5 dark:bg-red-950/20 flex flex-col items-center justify-center select-none ${className}`}
    >
      <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center justify-center mb-3">
        <AlertCircle className="w-6 h-6" />
      </div>
      <h3 className="font-bold text-sm text-red-700 dark:text-red-300 mb-1">
        {title}
      </h3>
      {message && (
        <p className="text-xs text-red-600/80 dark:text-red-400/80 max-w-sm mx-auto mb-4">
          {message}
        </p>
      )}
      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
          className="border-red-300 dark:border-red-800 text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/40"
        >
          {retryText}
        </Button>
      )}
    </div>
  );
};
