import React from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';

export interface WizardHeaderProps {
  currentStep: number;
  totalSteps: number;
  title: string;
  subtitle?: string;
  onBack?: () => void;
  language?: 'ar' | 'en';
}

export const WizardHeader: React.FC<WizardHeaderProps> = ({
  currentStep,
  totalSteps,
  title,
  subtitle,
  onBack,
  language = 'ar',
}) => {
  const isRtl = language === 'ar';

  return (
    <div className="w-full bg-white dark:bg-[#16181D] border-b border-gray-200/80 dark:border-[#2D333F] px-4 py-3 select-none shrink-0 shadow-xs">
      {/* Top Row: Back button, Title & Step Counter */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="min-w-[44px] min-h-[44px] -ms-2 flex items-center justify-center rounded-xl text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title={isRtl ? 'رجوع للخطوة السابقة' : 'Go back'}
            >
              {isRtl ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
            </button>
          )}

          <div className="min-w-0 flex-1">
            <h2 className="font-bold text-sm sm:text-base text-gray-900 dark:text-gray-100 truncate">
              {title}
            </h2>
            {subtitle && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Step Counter Badge */}
        <div className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200/80 dark:border-blue-800/40 shrink-0">
          {isRtl ? `خطوة ${currentStep} من ${totalSteps}` : `Step ${currentStep} of ${totalSteps}`}
        </div>
      </div>

      {/* Progress Dots */}
      <div className="flex items-center gap-1.5 mt-2.5">
        {Array.from({ length: totalSteps }).map((_, idx) => {
          const stepNum = idx + 1;
          const isCompleted = stepNum < currentStep;
          const isCurrent = stepNum === currentStep;

          return (
            <div
              key={idx}
              className={`h-1.5 rounded-full transition-all duration-200 ${
                isCurrent
                  ? 'flex-1 bg-blue-600 dark:bg-blue-500'
                  : isCompleted
                  ? 'w-6 bg-emerald-500'
                  : 'w-4 bg-gray-200 dark:bg-gray-700'
              }`}
            />
          );
        })}
      </div>
    </div>
  );
};
