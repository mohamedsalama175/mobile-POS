import React from 'react';

export type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'primary';
export type BadgeSize = 'sm' | 'md';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  children: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  size = 'md',
  dot = false,
  children,
  className = '',
  ...props
}) => {
  const sizeClasses: Record<BadgeSize, string> = {
    sm: 'text-[10px] px-1.5 py-0.5 gap-1 font-semibold rounded-md',
    md: 'text-xs px-2.5 py-0.5 gap-1.5 font-bold rounded-lg',
  };

  const variantClasses: Record<BadgeVariant, string> = {
    success:
      'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20',
    warning:
      'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20',
    danger:
      'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20',
    info:
      'bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20',
    primary:
      'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20',
    neutral:
      'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border border-gray-200 dark:border-gray-700',
  };

  const dotColors: Record<BadgeVariant, string> = {
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger: 'bg-red-500',
    info: 'bg-sky-500',
    primary: 'bg-blue-500',
    neutral: 'bg-gray-400',
  };

  return (
    <span
      className={`inline-flex items-center select-none font-mono tracking-tight shrink-0 ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColors[variant]}`} />}
      <span>{children}</span>
    </span>
  );
};
