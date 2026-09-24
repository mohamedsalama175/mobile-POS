import React from 'react';
import { Button } from './Button';

export interface StickyBottomBarProps {
  primaryText: string;
  onPrimary: () => void;
  primaryIcon?: React.ReactNode;
  isPrimaryLoading?: boolean;
  isPrimaryDisabled?: boolean;
  primaryVariant?: 'primary' | 'success' | 'danger';

  secondaryText?: string;
  onSecondary?: () => void;
  secondaryIcon?: React.ReactNode;

  summaryLabel?: string;
  summaryValue?: string | number;
  currency?: string;

  className?: string;
}

export const StickyBottomBar: React.FC<StickyBottomBarProps> = ({
  primaryText,
  onPrimary,
  primaryIcon,
  isPrimaryLoading = false,
  isPrimaryDisabled = false,
  primaryVariant = 'primary',

  secondaryText,
  onSecondary,
  secondaryIcon,

  summaryLabel,
  summaryValue,
  currency = 'ج.م',

  className = '',
}) => {
  return (
    <div
      className={`
        sticky bottom-0 z-20 w-full bg-white/95 dark:bg-[#16181D]/95 backdrop-blur-md
        border-t border-gray-200/90 dark:border-[#2D333F] p-3 sm:p-4 select-none shadow-lg
        ${className}
      `}
    >
      <div className="w-full max-w-screen-md mx-auto flex items-center justify-between gap-3">
        {/* Optional Financial / Items Summary */}
        {(summaryLabel || summaryValue !== undefined) && (
          <div className="flex flex-col min-w-0 justify-center pe-1">
            {summaryLabel && (
              <span className="text-[11px] text-gray-500 dark:text-gray-400 block truncate">
                {summaryLabel}
              </span>
            )}
            {summaryValue !== undefined && (
              <span className="font-mono font-bold text-sm sm:text-base text-gray-900 dark:text-gray-100 flex items-center gap-1">
                <span>
                  {typeof summaryValue === 'number'
                    ? summaryValue.toFixed(2)
                    : summaryValue}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 font-sans">
                  {currency}
                </span>
              </span>
            )}
          </div>
        )}

        {/* Action Buttons with enforced >= 44px touch targets */}
        <div className="flex items-center gap-2 flex-1 justify-end">
          {secondaryText && onSecondary && (
            <Button
              type="button"
              variant="outline"
              size="md"
              leftIcon={secondaryIcon}
              onClick={onSecondary}
              className="min-h-[44px] min-w-[44px] px-4 font-bold"
            >
              {secondaryText}
            </Button>
          )}

          <Button
            type="button"
            variant={primaryVariant}
            size="md"
            rightIcon={primaryIcon}
            isLoading={isPrimaryLoading}
            disabled={isPrimaryDisabled}
            onClick={onPrimary}
            className="min-h-[44px] min-w-[44px] px-6 font-bold flex-1 sm:flex-initial"
          >
            {primaryText}
          </Button>
        </div>
      </div>
    </div>
  );
};
