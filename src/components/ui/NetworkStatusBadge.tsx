import React from 'react';
import { Cloud, CloudOff, RefreshCw } from 'lucide-react';

export interface NetworkStatusBadgeProps {
  isOnline: boolean;
  isSyncing?: boolean;
  pendingCount?: number;
  language?: 'ar' | 'en';
  className?: string;
}

export const NetworkStatusBadge: React.FC<NetworkStatusBadgeProps> = ({
  isOnline,
  isSyncing = false,
  pendingCount = 0,
  language = 'ar',
  className = '',
}) => {
  const isRtl = language === 'ar';

  if (!isOnline) {
    return (
      <div
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-500/15 border border-red-500/30 text-red-600 dark:text-red-400 select-none shadow-xs ${className}`}
        title={isRtl ? 'يعمل دون اتصال' : 'Operating Offline'}
      >
        <CloudOff className="w-3.5 h-3.5 shrink-0 animate-pulse" />
        <span>{isRtl ? 'دون اتصال' : 'Offline'}</span>
        {pendingCount > 0 && (
          <span className="font-mono bg-red-600 text-white rounded-full px-1.5 py-0.2 text-[10px]">
            {pendingCount}
          </span>
        )}
      </div>
    );
  }

  if (isSyncing) {
    return (
      <div
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-500/15 border border-blue-500/30 text-blue-600 dark:text-blue-400 select-none shadow-xs ${className}`}
        title={isRtl ? 'جاري المزامنة مع السحابة' : 'Syncing with cloud'}
      >
        <RefreshCw className="w-3.5 h-3.5 shrink-0 animate-spin" />
        <span>{isRtl ? 'جاري المزامنة...' : 'Syncing...'}</span>
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 select-none ${className}`}
      title={isRtl ? 'متصل بالسحابة' : 'Online'}
    >
      <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
      <span>{isRtl ? 'متصل' : 'Online'}</span>
    </div>
  );
};
