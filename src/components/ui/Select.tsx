import React, { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  helperText?: string;
  error?: string;
  options: SelectOption[];
  fullWidth?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      helperText,
      error,
      options,
      fullWidth = true,
      className = '',
      id,
      disabled,
      required,
      ...props
    },
    ref
  ) => {
    const selectId = id || (label ? `select-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

    return (
      <div className={`${fullWidth ? 'w-full' : 'inline-block'} flex flex-col gap-1.5`}>
        {label && (
          <label
            htmlFor={selectId}
            className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center justify-between"
          >
            <span>
              {label}
              {required && <span className="text-red-500 ms-1">*</span>}
            </span>
          </label>
        )}

        <div className="relative w-full flex items-center">
          <select
            ref={ref}
            id={selectId}
            disabled={disabled}
            required={required}
            aria-invalid={Boolean(error)}
            className={`
              w-full h-10 px-3.5 pe-9 text-sm rounded-xl border appearance-none transition-all duration-150 outline-none cursor-pointer
              bg-white dark:bg-[#16181D] text-gray-900 dark:text-gray-100
              ${
                error
                  ? 'border-red-500 focus:ring-2 focus:ring-red-500/20 dark:border-red-500/80'
                  : 'border-gray-300 dark:border-[#333842] focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:focus:border-blue-500'
              }
              disabled:opacity-50 disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed
              ${className}
            `}
            {...props}
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-white dark:bg-[#16181D] text-gray-900 dark:text-white">
                {opt.label}
              </option>
            ))}
          </select>

          <div className="absolute end-3 pointer-events-none text-gray-400 dark:text-gray-500 flex items-center justify-center">
            <ChevronDown className="w-4 h-4" />
          </div>
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

Select.displayName = 'Select';
