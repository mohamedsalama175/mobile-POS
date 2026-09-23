import React from 'react';

export interface ListItemProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  // Start Column
  start?: React.ReactNode;

  // Center Column
  title: React.ReactNode;
  subtitle?: React.ReactNode;

  // Trailing Column
  trailingTop?: React.ReactNode;
  trailingBottom?: React.ReactNode;
  trailingAction?: React.ReactNode;

  interactive?: boolean;
  selected?: boolean;
  children?: React.ReactNode;
}

export const ListItem: React.FC<ListItemProps> = ({
  start,
  title,
  subtitle,
  trailingTop,
  trailingBottom,
  trailingAction,
  interactive = true,
  selected = false,
  children,
  className = '',
  onClick,
  ...props
}) => {
  return (
    <div
      onClick={onClick}
      className={`
        group relative w-full flex items-center gap-3 p-3 sm:p-3.5 rounded-2xl border transition-all duration-150 select-none
        ${
          selected
            ? 'border-blue-500 bg-blue-50/20 dark:bg-blue-950/20 dark:border-blue-500/50 shadow-xs'
            : 'border-gray-200/90 dark:border-[#2D333F] bg-white dark:bg-[#16181D] hover:border-gray-300 dark:hover:border-[#3B4252] shadow-xs'
        }
        ${interactive ? 'cursor-pointer hover:bg-gray-50/80 dark:hover:bg-[#1C2028]' : ''}
        ${className}
      `}
      {...props}
    >
      {/* 1. Start Column (Thumbnail / Avatar / Icon container) */}
      {start && <div className="shrink-0 flex items-center justify-center">{start}</div>}

      {/* 2. Center Column (Title on line 1, Subtitle on line 2 - Photo 2 standard) */}
      <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5">
        <div className="font-bold text-sm leading-snug text-gray-900 dark:text-gray-100 truncate">
          {title}
        </div>
        {subtitle && (
          <div className="text-xs text-gray-500 dark:text-gray-400 truncate flex items-center gap-1.5 mt-0.5">
            {subtitle}
          </div>
        )}
        {children}
      </div>

      {/* 3. Trailing Column (Top price/status, Bottom code/ref + action - Photo 2 standard) */}
      {(trailingTop || trailingBottom || trailingAction) && (
        <div className="shrink-0 flex items-center gap-2">
          <div className="flex flex-col items-end justify-center text-end min-w-[70px]">
            {trailingTop && (
              <div className="font-mono font-bold text-sm leading-tight text-emerald-600 dark:text-emerald-400">
                {trailingTop}
              </div>
            )}
            {trailingBottom && (
              <div className="font-mono text-xs text-gray-400 dark:text-gray-500 mt-1 leading-tight">
                {trailingBottom}
              </div>
            )}
          </div>
          {trailingAction && <div className="shrink-0">{trailingAction}</div>}
        </div>
      )}
    </div>
  );
};
