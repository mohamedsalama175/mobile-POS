import React, { useState } from 'react';
import { Lock, Fingerprint, ShieldCheck, X } from 'lucide-react';
import { Button } from './Button';
import { soundService } from '../../services/sound';

export interface AuthGateProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  title?: string;
  description?: string;
  amount?: number;
  currency?: string;
  language?: 'ar' | 'en';
}

export const AuthGate: React.FC<AuthGateProps> = ({
  isOpen,
  onClose,
  onSuccess,
  title = 'تأكيد العملية النقدية',
  description = 'يرجى إدخال رمز الأمان (PIN) للمتابعة وتأكيد حركة النقد',
  amount,
  currency = 'ج.م',
  language = 'ar',
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const isRtl = language === 'ar';
  const CORRECT_PIN = '1234';

  if (!isOpen) return null;

  const handleDigit = (digit: string) => {
    soundService.playClick();
    if (pin.length < 4) {
      const nextPin = pin + digit;
      setPin(nextPin);
      setError(null);

      // Auto-validate on 4th digit
      if (nextPin.length === 4) {
        if (nextPin === CORRECT_PIN) {
          soundService.playSuccess();
          setTimeout(() => {
            setPin('');
            onSuccess();
          }, 150);
        } else {
          soundService.playError();
          setError(isRtl ? 'رمز PIN غير صحيح (الافتراضي: 1234)' : 'Incorrect PIN (Default: 1234)');
          setPin('');
        }
      }
    }
  };

  const handleBackspace = () => {
    soundService.playClick();
    setPin((prev) => prev.slice(0, -1));
    setError(null);
  };

  const handleBiometric = () => {
    soundService.playSuccess();
    onSuccess();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/75 backdrop-blur-xs transition-opacity animate-in fade-in"
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-xs rounded-3xl border border-gray-200 dark:border-[#333842] bg-white dark:bg-[#16181D] shadow-2xl p-5 text-center flex flex-col items-center animate-in zoom-in-95 duration-200 select-none">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 end-4 p-1.5 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Security Shield Icon */}
        <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-2.5 shadow-xs border border-blue-200/60 dark:border-blue-800/40">
          <ShieldCheck className="w-6 h-6" />
        </div>

        <h3 className="font-bold text-base text-gray-900 dark:text-gray-100 mb-1">
          {title}
        </h3>

        {amount !== undefined && (
          <div className="font-mono font-bold text-lg text-emerald-600 dark:text-emerald-400 mb-1">
            {amount.toFixed(2)} {currency}
          </div>
        )}

        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 leading-relaxed">
          {description}
        </p>

        {/* PIN Dots (4 positions) */}
        <div className="flex items-center justify-center gap-3.5 mb-3">
          {[0, 1, 2, 3].map((idx) => {
            const isFilled = pin.length > idx;
            return (
              <div
                key={idx}
                className={`w-3.5 h-3.5 rounded-full transition-all duration-150 ${
                  isFilled
                    ? 'bg-blue-600 scale-110'
                    : 'bg-gray-200 dark:bg-gray-700'
                }`}
              />
            );
          })}
        </div>

        {error && (
          <p className="text-xs text-red-500 font-bold mb-3 animate-in shake">
            {error}
          </p>
        )}

        {/* 4x3 Keypad (>= 44px buttons) */}
        <div className="grid grid-cols-3 gap-2 w-full mb-3">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => handleDigit(d)}
              className="min-h-[46px] rounded-2xl font-mono font-bold text-lg border border-gray-200 dark:border-[#2D333F] bg-gray-50 dark:bg-[#121417] hover:bg-gray-100 dark:hover:bg-[#1C2028] text-gray-900 dark:text-gray-100 active:scale-95 transition-all shadow-xs"
            >
              {d}
            </button>
          ))}

          {/* Quick Biometric Fingerprint Button */}
          <button
            type="button"
            onClick={handleBiometric}
            className="min-h-[46px] rounded-2xl border border-gray-200 dark:border-[#2D333F] bg-gray-50 dark:bg-[#121417] text-blue-600 dark:text-blue-400 flex items-center justify-center active:scale-95 transition-all shadow-xs"
            title={isRtl ? 'مصادقة بالبصمة' : 'Biometric fingerprint'}
          >
            <Fingerprint className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={() => handleDigit('0')}
            className="min-h-[46px] rounded-2xl font-mono font-bold text-lg border border-gray-200 dark:border-[#2D333F] bg-gray-50 dark:bg-[#121417] hover:bg-gray-100 dark:hover:bg-[#1C2028] text-gray-900 dark:text-gray-100 active:scale-95 transition-all shadow-xs"
          >
            0
          </button>

          <button
            type="button"
            onClick={handleBackspace}
            className="min-h-[46px] rounded-2xl border border-gray-200 dark:border-[#2D333F] bg-gray-50 dark:bg-[#121417] text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1C2028] flex items-center justify-center active:scale-95 transition-all shadow-xs text-xs font-bold"
          >
            {isRtl ? 'مسح' : 'DEL'}
          </button>
        </div>

        <p className="text-[10px] text-gray-400 dark:text-gray-500">
          {isRtl ? 'الرمز الافتراضي: 1234' : 'Default PIN: 1234'}
        </p>
      </div>
    </div>
  );
};
