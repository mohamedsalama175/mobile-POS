import React, { forwardRef } from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      helperText,
      error,
      leftIcon,
      rightIcon,
      fullWidth = true,
      className = '',
      id,
      disabled,
      required,
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? `input-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

    return (
      <div className={`${fullWidth ? 'w-full' : 'inline-block'} flex flex-col gap-1.5`}>
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center justify-between"
          >
            <span>
              {label}
              {required && <span className="text-red-500 ms-1">*</span>}
            </span>
          </label>
        )}

        <div className="relative w-full flex items-center">
          {leftIcon && (
            <div className="absolute start-3 pointer-events-none text-gray-400 dark:text-gray-500 flex items-center justify-center">
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            required={required}
            aria-invalid={Boolean(error)}
            className={`
              w-full h-10 px-3.5 text-sm rounded-xl border transition-all duration-150 outline-none
              bg-white dark:bg-[#16181D] text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500
              ${leftIcon ? 'ps-10' : ''}
              ${rightIcon ? 'pe-10' : ''}
              ${
                error
                  ? 'border-red-500 focus:ring-2 focus:ring-red-500/20 dark:border-red-500/80'
                  : 'border-gray-300 dark:border-[#333842] focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:focus:border-blue-500'
              }
              disabled:opacity-50 disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed
              ${className}
            `}
            {...props}
          />

          {rightIcon && (
            <div className="absolute end-3 text-gray-400 dark:text-gray-500 flex items-center justify-center">
              {rightIcon}
            </div>
          )}
        </div>

        {error ? (
          <p className="text-[11px] text-red-500 font-medium">{error}</p>
        ) : helperText ? (
          <p className="text-[11px] text-gray-500 dark:text-gray-400">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
