import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ChevronDown, ChevronUp, Calculator } from 'lucide-react';

interface TotalsSummaryProps {
  grossTotal: number;
  totalDiscount: number;
  totalAfterDiscount: number;
  totalTax: number;
  totalAfterTax: number;
  withholdingTax: number;
  netDue: number;
  compactByDefault?: boolean;
}

export const TotalsSummary: React.FC<TotalsSummaryProps> = ({
  grossTotal,
  totalDiscount,
  totalAfterDiscount,
  totalTax,
  totalAfterTax,
  withholdingTax,
  netDue,
  compactByDefault = false
}) => {
  const { language, theme } = useApp();
  const [expanded, setExpanded] = useState(!compactByDefault);
  const isDark = theme === 'dark';

  return (
    <div
      id="totals-summary-card"
      className={`rounded-2xl border transition-all ${
        isDark ? 'bg-[#1C1F24] border-[#333842]' : 'bg-white border-gray-200 shadow-sm'
      }`}
    >
      {/* Header bar / Click to expand */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className={`w-full p-3 flex items-center justify-between border-b ${
          isDark ? 'border-[#333842]/40' : 'border-gray-100'
        }`}
      >
        <div className="flex items-center gap-2">
          <Calculator className={`w-4 h-4 ${isDark ? 'text-blue-400' : 'text-gray-700'}`} />
          <span className={`text-xs font-bold ${isDark ? 'text-[#F5F6F7]' : 'text-gray-900'}`}>
            {language === 'ar' ? 'ملخص الإجمالي والضرائب' : 'Totals & Tax Summary'}
          </span>
        </div>
        <div className="flex items-center gap-1 text-[11px] text-gray-400">
          <span>{expanded ? (language === 'ar' ? 'طي' : 'Collapse') : (language === 'ar' ? 'تفاصيل' : 'Details')}</span>
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {/* Expanded breakdown (§3.6) */}
      {expanded && (
        <div
          className={`p-3 space-y-2 text-xs border-b ${
            isDark ? 'border-[#333842]/40' : 'border-gray-100'
          }`}
        >
          <div className={`flex justify-between items-center ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            <span>{language === 'ar' ? 'اجمالي القيمة' : 'Gross Total'}</span>
            <span className={`font-mono tabular-nums font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {grossTotal.toFixed(2)} ج.م
            </span>
          </div>

          <div className={`flex justify-between items-center ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            <span>{language === 'ar' ? 'اجمالي الخصم' : 'Total Discount'}</span>
            <span className={`font-mono tabular-nums font-bold ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
              - {totalDiscount.toFixed(2)} ج.م
            </span>
          </div>

          <div className={`flex justify-between items-center ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            <span>{language === 'ar' ? 'الاجمالي بعد الخصم' : 'Total After Discount'}</span>
            <span className={`font-mono tabular-nums font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {totalAfterDiscount.toFixed(2)} ج.م
            </span>
          </div>

          <div className={`flex justify-between items-center ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            <span>{language === 'ar' ? 'اجمالي الضريبة (14%)' : 'Total Tax (14%)'}</span>
            <span className={`font-mono tabular-nums font-semibold ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
              + {totalTax.toFixed(2)} ج.م
            </span>
          </div>

          <div className={`flex justify-between items-center ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            <span>{language === 'ar' ? 'الاجمالي بعد الضريبة' : 'Total After Tax'}</span>
            <span className={`font-mono tabular-nums font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {totalAfterTax.toFixed(2)} ج.م
            </span>
          </div>

          <div className={`flex justify-between items-center ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            <span>{language === 'ar' ? 'اجمالي ضريبة الخصم من المبيع (1%)' : 'Withholding Tax (1%)'}</span>
            <span className={`font-mono tabular-nums font-bold ${isDark ? 'text-rose-400' : 'text-rose-600'}`}>
              - {withholdingTax.toFixed(2)} ج.م
            </span>
          </div>
        </div>
      )}

      {/* Hero Grand Total Display (§2 & §4: 24-28px semibold tabular figures) */}
      <div
        className={`p-3.5 flex items-center justify-between ${
          isDark
            ? 'bg-gradient-to-r from-blue-950/20 via-transparent to-blue-900/10'
            : 'bg-gray-50/80 rounded-b-2xl'
        }`}
      >
        <div>
          <span className={`text-[11px] font-bold block uppercase tracking-wider ${isDark ? 'text-[#9AA1AC]' : 'text-gray-600'}`}>
            {language === 'ar' ? 'الاجمالي المستحق' : 'Net Amount Due'}
          </span>
          <span className="text-[10px] text-gray-400">
            {language === 'ar' ? 'شامل كافة الضرائب والخصومات' : 'Inclusive of all taxes & discounts'}
          </span>
        </div>

        <div className="text-right">
          <span className={`text-2xl sm:text-[26px] font-bold font-mono tabular-nums tracking-tight ${
            isDark ? 'text-[#38BDF8]' : 'text-[#111827]'
          }`}>
            {netDue.toFixed(2)}
          </span>
          <span className="text-xs text-gray-400 font-bold ml-1 mr-1">
            {language === 'ar' ? 'ج.م' : 'EGP'}
          </span>
        </div>
      </div>
    </div>
  );
};
