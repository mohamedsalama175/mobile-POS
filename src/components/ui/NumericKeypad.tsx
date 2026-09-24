import React from 'react';
import { Delete, RotateCcw } from 'lucide-react';
import { soundService } from '../../services/sound';

export interface NumericKeypadProps {
  value: number | string;
  onChange: (val: number) => void;
  maxAmount?: number;
  totalRequired?: number;
  currency?: string;
  mode?: 'collection' | 'payment' | 'calculator'; // 'collection' shows remaining debt, 'payment' shows change due
  quickPresets?: number[];
  language?: 'ar' | 'en';
  className?: string;
}

export const NumericKeypad: React.FC<NumericKeypadProps> = ({
  value,
  onChange,
  maxAmount,
  totalRequired,
  currency = 'ج.م',
  mode = 'collection',
  quickPresets = [50, 100, 200, 500],
  language = 'ar',
  className = '',
}) => {
  const isRtl = language === 'ar';
  const numericValue = typeof value === 'number' ? value : parseFloat(value) || 0;
  const strValue = String(value);

  // Key press handlers
  const handleDigit = (digit: string) => {
    soundService.playClick();
    if (strValue === '0' || strValue === '') {
      onChange(parseFloat(digit) || 0);
    } else {
      const nextStr = strValue + digit;
      const nextNum = parseFloat(nextStr) || 0;
      if (maxAmount !== undefined && nextNum > maxAmount) return;
      onChange(nextNum);
    }
  };

  const handleDot = () => {
    soundService.playClick();
    if (!strValue.includes('.')) {
      const nextStr = (strValue || '0') + '.';
      // If dot is trailing, keep as number representation
      onChange(parseFloat(nextStr) || 0);
    }
  };

  const handleBackspace = () => {
    soundService.playClick();
    if (strValue.length <= 1) {
      onChange(0);
    } else {
      const nextStr = strValue.slice(0, -1);
      onChange(parseFloat(nextStr) || 0);
    }
  };

  const handleClear = () => {
    soundService.playClick();
    onChange(0);
  };

  const handlePreset = (preset: number) => {
    soundService.playClick();
    onChange(preset);
  };

  // Calculations
  const diff = totalRequired !== undefined ? totalRequired - numericValue : 0;
  const isExceeded = totalRequired !== undefined && numericValue > totalRequired && mode === 'collection';
  const changeDue = totalRequired !== undefined && numericValue > totalRequired && mode === 'payment' ? numericValue - totalRequired : 0;

  return (
    <div className={`w-full max-w-sm mx-auto space-y-3 select-none ${className}`}>
      {/* Live Calculation Display Box */}
      <div className="p-3.5 rounded-2xl border border-gray-200/90 dark:border-[#2D333F] bg-gray-50/80 dark:bg-[#121417] text-center shadow-xs">
        <div className="text-[11px] text-gray-500 dark:text-gray-400 mb-0.5">
          {mode === 'collection'
            ? isRtl
              ? 'المبلغ المحصل نقداً'
              : 'Collected Cash Amount'
            : isRtl
            ? 'المبلغ المدفوع'
            : 'Amount Paid'}
        </div>

        <div className="font-mono font-bold text-2xl text-gray-900 dark:text-gray-100 flex items-center justify-center gap-1.5">
          <span>{numericValue.toFixed(2)}</span>
          <span className="text-xs text-gray-500 dark:text-gray-400 font-sans font-medium">
            {currency}
          </span>
        </div>

        {/* Dynamic Calculation preview */}
        {totalRequired !== undefined && (
          <div className="mt-2 pt-2 border-t border-gray-200/60 dark:border-[#2D333F]/60 flex items-center justify-between text-xs">
            <span className="text-gray-500 dark:text-gray-400">
              {isRtl ? 'إجمالي الفاتورة:' : 'Total Due:'}{' '}
              <strong className="text-gray-700 dark:text-gray-300 font-mono">
                {totalRequired.toFixed(2)} {currency}
              </strong>
            </span>

            {mode === 'collection' ? (
              <span
                className={`font-bold font-mono ${
                  isExceeded
                    ? 'text-red-500'
                    : diff === 0
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-amber-600 dark:text-amber-400'
                }`}
              >
                {isExceeded
                  ? isRtl
                    ? '⚠️ يتجاوز الإجمالي'
                    : '⚠️ Exceeds Total'
                  : isRtl
                  ? `المتبقي: ${Math.max(0, diff).toFixed(2)} ${currency}`
                  : `Remaining: ${Math.max(0, diff).toFixed(2)} ${currency}`}
              </span>
            ) : (
              <span className="font-bold font-mono text-emerald-600 dark:text-emerald-400">
                {isRtl
                  ? `الباقي للعميل: ${changeDue.toFixed(2)} ${currency}`
                  : `Change: ${changeDue.toFixed(2)} ${currency}`}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Quick Preset Egyptian Pound Denominations Chips */}
      {quickPresets && quickPresets.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {quickPresets.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => handlePreset(preset)}
              className="min-h-[44px] rounded-xl text-xs font-mono font-bold border border-gray-200 dark:border-[#2D333F] bg-white dark:bg-[#16181D] hover:bg-gray-100 dark:hover:bg-[#1C2028] text-gray-800 dark:text-gray-200 transition-colors shadow-xs active:scale-95"
            >
              {preset} {currency}
            </button>
          ))}
        </div>
      )}

      {/* 4x3 Touch Keypad with >= 48px Touch Targets */}
      <div className="grid grid-cols-3 gap-2">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
          <button
            key={digit}
            type="button"
            onClick={() => handleDigit(digit)}
            className="min-h-[50px] rounded-2xl font-mono font-bold text-lg border border-gray-200/90 dark:border-[#2D333F] bg-white dark:bg-[#16181D] hover:bg-gray-100 dark:hover:bg-[#20242D] text-gray-900 dark:text-gray-100 shadow-xs transition-all active:scale-95 flex items-center justify-center"
          >
            {digit}
          </button>
        ))}

        {/* Bottom row: Clear, 0, Backspace */}
        <button
          type="button"
          onClick={handleClear}
          className="min-h-[50px] rounded-2xl font-bold text-xs border border-gray-200 dark:border-[#2D333F] bg-gray-100 dark:bg-[#1C2028] text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#242A35] transition-all active:scale-95 flex items-center justify-center gap-1"
          title={isRtl ? 'مسح الكل' : 'Clear all'}
        >
          <RotateCcw className="w-4 h-4" />
          <span>{isRtl ? 'مسح' : 'Clear'}</span>
        </button>

        <button
          type="button"
          onClick={() => handleDigit('0')}
          className="min-h-[50px] rounded-2xl font-mono font-bold text-lg border border-gray-200/90 dark:border-[#2D333F] bg-white dark:bg-[#16181D] hover:bg-gray-100 dark:hover:bg-[#20242D] text-gray-900 dark:text-gray-100 shadow-xs transition-all active:scale-95 flex items-center justify-center"
        >
          0
        </button>

        <button
          type="button"
          onClick={handleBackspace}
          className="min-h-[50px] rounded-2xl border border-gray-200 dark:border-[#2D333F] bg-gray-100 dark:bg-[#1C2028] text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-[#242A35] transition-all active:scale-95 flex items-center justify-center"
          title={isRtl ? 'حذف آخر رقم' : 'Backspace'}
        >
          <Delete className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
