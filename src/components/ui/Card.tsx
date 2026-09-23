import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
  selected?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  interactive = false,
  selected = false,
  padding = 'md',
  children,
  className = '',
  ...props
}) => {
  const paddingClasses = {
    none: 'p-0',
    sm: 'p-2 sm:p-2.5',
    md: 'p-3 sm:p-4',
    lg: 'p-4 sm:p-6',
  }[padding];

  return (
    <div
      className={`
        relative w-full rounded-2xl border transition-all duration-200 overflow-hidden
        ${
          selected
            ? 'border-blue-500 bg-blue-50/30 dark:bg-blue-950/20 dark:border-blue-500/60 shadow-xs'
            : 'border-gray-200/90 dark:border-[#2D333F] bg-white dark:bg-[#16181D] shadow-xs'
        }
        ${
          interactive
            ? 'cursor-pointer hover:border-gray-300 dark:hover:border-[#3B4252] hover:shadow-sm active:scale-[0.995]'
            : ''
        }
        ${paddingClasses}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className = '',
  children,
  ...props
}) => (
  <div className={`flex items-center justify-between gap-3 mb-3 ${className}`} {...props}>
    {children}
  </div>
);

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  className = '',
  children,
  ...props
}) => (
  <h3
    className={`font-bold text-sm sm:text-base leading-snug text-gray-900 dark:text-gray-100 truncate ${className}`}
    {...props}
  >
    {children}
  </h3>
);

export const CardBody: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className = '',
  children,
  ...props
}) => (
  <div className={`w-full min-w-0 ${className}`} {...props}>
    {children}
  </div>
);

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className = '',
  children,
  ...props
}) => (
  <div
    className={`flex items-center justify-between gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-[#2D333F]/70 ${className}`}
    {...props}
  >
    {children}
  </div>
);
