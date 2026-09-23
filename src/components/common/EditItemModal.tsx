import React, { useState, useEffect } from 'react';
import { LineItem } from '../../types';
import { ItemThumbnail } from './ItemThumbnail';
import { soundService } from '../../services/sound';
import { calculateLineTotal, calculateLineVat, DEFAULT_VAT_RATE } from '../../utils/pricing';
import {
  X,
  Plus,
  Minus,
  AlertCircle,
  Check,
  Tag,
  Warehouse,
  Percent,
  Coins
} from 'lucide-react';

interface EditItemModalProps {
  isOpen: boolean;
  item: LineItem | null;
  language: 'ar' | 'en';
  isDark: boolean;
  isReturnMode?: boolean;
  onClose: () => void;
  onSave: (updatedItem: LineItem) => void;
}

export const EditItemModal: React.FC<EditItemModalProps> = ({
  isOpen,
  item,
  language,
  isDark,
  isReturnMode = false,
  onClose,
  onSave
}) => {
  const [qty, setQty] = useState<number>(1);
  const [price, setPrice] = useState<number>(0);
  const [discount, setDiscount] = useState<number>(0);
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('fixed');

  useEffect(() => {
    if (item) {
      setQty(item.enteredQty || 1);
      setPrice(item.unitPrice || 0);
      setDiscount(item.discount || 0);
      setDiscountType(item.discountType || 'fixed');
    }
  }, [item]);

  if (!isOpen || !item) return null;

  // Calculate live financial figures
  const gross = qty * price;
  const lineTotal = calculateLineTotal(qty, price, discount, discountType);
  const discountVal = discountType === 'percentage' ? (gross * discount) / 100 : discount;
  const vatAmount = calculateLineVat(lineTotal);

  const isStockExceeded = !isReturnMode && qty > item.availableQty;
  const isOutOfStock = !isReturnMode && item.availableQty <= 0;

  const handleSave = () => {
    if (qty <= 0) return;
    soundService.playSuccess();
    onSave({
      ...item,
      enteredQty: qty,
      unitPrice: price,
      discount,
      discountType,
      lineTotal
    });
    onClose();
  };

  return (
    <div
      id="edit-item-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="edit-item-modal"
        className={`w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[92vh] ${
          isDark ? 'bg-[#1C1F24] border-[#333842] text-[#F5F6F7]' : 'bg-white border-gray-200 text-gray-900'
        }`}
      >
        {/* Header */}
        <div
          className={`p-4 border-b flex items-center justify-between ${
            isDark ? 'border-[#333842] bg-[#16181D]' : 'border-gray-200 bg-white'
          }`}
        >
          <div className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold ${
                isDark ? 'bg-blue-600/20 text-blue-400' : 'bg-gray-100 text-gray-700'
              }`}
            >
              <Tag className="w-4 h-4" />
            </div>
            <div>
              <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-[#111827]'}`}>
                {language === 'ar' ? 'تعديل بيانات الصنف' : 'Edit Item Details'}
              </h3>
              <p className="text-[10px] text-gray-400 font-mono">
                #{item.code}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
              isDark
                ? 'text-gray-400 hover:text-white hover:bg-white/10'
                : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Item Banner: Photo + Name + Shelf + Stock */}
          <div
            className={`p-3 rounded-xl border flex items-center gap-3 ${
              isDark ? 'border-[#333842] bg-[#121417]' : 'border-gray-200 bg-gray-50'
            }`}
          >
            <ItemThumbnail
              src={item.imageUrl}
              name={item.name}
              size="lg"
            />
            <div className="min-w-0 flex-1">
              <h4 className={`font-bold text-sm truncate ${isDark ? 'text-white' : 'text-[#111827]'}`}>
                {language === 'ar' ? item.name : item.nameEn || item.name}
              </h4>
              <div className="flex items-center gap-2 text-xs text-gray-500 mt-1 flex-wrap">
                <span className="flex items-center gap-1">
                  <Warehouse className={`w-3.5 h-3.5 ${isDark ? 'text-blue-400' : 'text-gray-600'}`} />
                  <span>{language === 'ar' ? `الرف: ${item.shelfNumber}` : `Shelf: ${item.shelfNumber}`}</span>
                </span>
                <span>•</span>
                <span>{language === 'ar' ? item.unit : item.unitEn || item.unit}</span>
              </div>
              <div className="mt-1 flex items-center gap-2">
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                    isOutOfStock
                      ? 'bg-red-500/20 text-red-500'
                      : isDark
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-emerald-50 text-[#059669]'
                  }`}
                >
                  {language === 'ar'
                    ? `المتوفر بالمخزن: ${item.availableQty}`
                    : `Stock: ${item.availableQty}`}
                </span>
              </div>
            </div>
          </div>

          {/* Stock Warning */}
          {isStockExceeded && (
            <div className="p-2.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-500 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>
                {language === 'ar'
                  ? `تنبيه: الكمية المطلوبة (${qty}) تتجاوز الرصيد المتوفر بالمخزن (${item.availableQty})`
                  : `Warning: Requested qty (${qty}) exceeds available stock (${item.availableQty})`}
              </span>
            </div>
          )}

          {/* Quantity Stepper & Manual Entry */}
          <div className="space-y-1.5">
            <label className={`text-xs font-bold flex items-center justify-between ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              <span>{isReturnMode ? (language === 'ar' ? 'كمية الإرجاع' : 'Return Quantity') : (language === 'ar' ? 'الكمية المطلوبة' : 'Requested Quantity')}</span>
              <span className="text-[11px] text-gray-400 font-normal">
                {language === 'ar' ? item.unit : item.unitEn || item.unit}
              </span>
            </label>
            <div
              className={`flex items-center h-12 rounded-xl border overflow-hidden ${
                isDark ? 'border-[#333842] bg-[#121417]' : 'border-gray-200 bg-gray-50'
              }`}
            >
              <button
                type="button"
                onClick={() => {
                  soundService.playClick();
                  setQty((prev) => Math.max(1, prev - 1));
                }}
                disabled={qty <= 1}
                className={`w-14 h-full flex items-center justify-center disabled:opacity-30 transition-colors active:scale-95 ${
                  isDark ? 'text-gray-300 hover:text-white hover:bg-gray-800' : 'text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Minus className="w-5 h-5" />
              </button>
              <input
                type="number"
                min="1"
                max={isReturnMode ? item.maxReturnQty : undefined}
                value={qty}
                onChange={(e) => setQty(Math.max(1, parseFloat(e.target.value) || 1))}
                className={`w-full text-center font-mono font-bold text-base bg-transparent outline-none ${
                  isDark ? 'text-white' : 'text-[#111827]'
                }`}
              />
              <button
                type="button"
                onClick={() => {
                  soundService.playClick();
                  setQty((prev) => prev + 1);
                }}
                className={`w-14 h-full flex items-center justify-center transition-colors active:scale-95 ${
                  isDark ? 'text-gray-300 hover:text-white hover:bg-gray-800' : 'text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Plus className={`w-5 h-5 ${isDark ? 'text-blue-400' : 'text-[#111827]'}`} />
              </button>
            </div>
          </div>

          {/* Unit Price */}
          <div className="space-y-1.5">
            <label className={`text-xs font-bold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              {language === 'ar' ? 'سعر الوحدة (ر.س)' : 'Unit Price (SAR)'}
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => setPrice(Math.max(0, parseFloat(e.target.value) || 0))}
                className={`w-full h-12 px-3 pl-12 rounded-xl border font-mono text-sm outline-none transition-colors ${
                  isDark
                    ? 'border-[#333842] bg-[#121417] text-white focus:border-blue-500'
                    : 'border-gray-200 bg-gray-50 text-[#111827] focus:bg-white focus:border-[#252B37]'
                }`}
              />
              <div className="absolute left-3 top-3 text-xs text-gray-400 font-mono">
                SAR
              </div>
            </div>
          </div>

          {/* Discount Section */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className={`text-xs font-bold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                {language === 'ar' ? 'الخصم المطبق' : 'Applied Discount'}
              </label>
              {/* Type Switcher */}
              <div
                className={`flex items-center rounded-lg border p-0.5 ${
                  isDark ? 'border-[#333842] bg-[#121417]' : 'border-gray-200 bg-gray-100'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setDiscountType('fixed')}
                  className={`px-2 py-0.5 text-[10px] font-bold rounded flex items-center gap-1 transition-colors ${
                    discountType === 'fixed'
                      ? isDark
                        ? 'bg-blue-600 text-white shadow'
                        : 'bg-[#252B37] text-white shadow'
                      : isDark
                      ? 'text-gray-400 hover:text-white'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  <Coins className="w-3 h-3" />
                  <span>ر.س</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDiscountType('percentage')}
                  className={`px-2 py-0.5 text-[10px] font-bold rounded flex items-center gap-1 transition-colors ${
                    discountType === 'percentage'
                      ? isDark
                        ? 'bg-blue-600 text-white shadow'
                        : 'bg-[#252B37] text-white shadow'
                      : isDark
                      ? 'text-gray-400 hover:text-white'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  <Percent className="w-3 h-3" />
                  <span>%</span>
                </button>
              </div>
            </div>

            <div className="relative">
              <input
                type="number"
                step="0.01"
                min="0"
                max={discountType === 'percentage' ? 100 : undefined}
                value={discount}
                onChange={(e) => setDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
                className={`w-full h-12 px-3 pl-12 rounded-xl border font-mono text-sm outline-none transition-colors ${
                  isDark
                    ? 'border-[#333842] bg-[#121417] text-white focus:border-blue-500'
                    : 'border-gray-200 bg-gray-50 text-[#111827] focus:bg-white focus:border-[#252B37]'
                }`}
              />
              <div className="absolute left-3 top-3 text-xs text-gray-400 font-mono">
                {discountType === 'percentage' ? '%' : 'SAR'}
              </div>
            </div>
          </div>

          {/* Real-time Calculation Summary */}
          <div
            className={`p-3 rounded-xl border space-y-2 text-xs ${
              isDark ? 'border-[#333842] bg-[#16181D]' : 'border-gray-200 bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-between text-gray-500">
              <span>{language === 'ar' ? 'الإجمالي قبل الخصم' : 'Gross Total'}:</span>
              <span className={`font-mono ${isDark ? 'text-gray-300' : 'text-gray-800'}`}>{gross.toFixed(2)} ر.س</span>
            </div>
            {discountVal > 0 && (
              <div className="flex items-center justify-between text-amber-600 font-medium">
                <span>{language === 'ar' ? 'قيمة الخصم' : 'Discount Value'}:</span>
                <span className="font-mono">-{discountVal.toFixed(2)} ر.س</span>
              </div>
            )}
            <div className="flex items-center justify-between text-gray-500">
              <span>{language === 'ar' ? `ضريبة القيمة المضافة (${Math.round(DEFAULT_VAT_RATE * 100)}% تقديرية)` : `VAT (${Math.round(DEFAULT_VAT_RATE * 100)}% est)`}:</span>
              <span className={`font-mono ${isDark ? 'text-gray-300' : 'text-gray-800'}`}>{vatAmount.toFixed(2)} ر.س</span>
            </div>
            <div
              className={`pt-2 border-t flex items-center justify-between font-bold text-sm ${
                isDark ? 'border-[#333842]' : 'border-gray-200'
              }`}
            >
              <span className={isDark ? 'text-white' : 'text-[#111827]'}>
                {language === 'ar' ? 'صافي إجمالي السطر' : 'Net Line Total'}:
              </span>
              <span className={`font-mono text-base ${isDark ? 'text-blue-400' : 'text-[#111827]'}`}>
                {lineTotal.toFixed(2)} ر.س
              </span>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div
          className={`p-3 border-t flex items-center gap-2 ${
            isDark ? 'border-[#333842] bg-[#16181D]' : 'border-gray-200 bg-white'
          }`}
        >
          <button
            type="button"
            onClick={onClose}
            className={`flex-1 h-11 rounded-xl border font-bold text-xs transition-colors ${
              isDark
                ? 'border-[#333842] bg-[#262A31] hover:bg-[#323640] text-gray-300 hover:text-white'
                : 'border-gray-200 bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            {language === 'ar' ? 'إلغاء' : 'Cancel'}
          </button>
          <button
            type="button"
            id="save-item-modal-button"
            onClick={handleSave}
            className={`flex-1 h-11 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-colors active:scale-98 ${
              isDark
                ? 'bg-blue-600 hover:bg-blue-500 text-white'
                : 'bg-[#252B37] hover:bg-[#1E232D] text-white'
            }`}
          >
            <Check className="w-4 h-4" />
            <span>{language === 'ar' ? 'حفظ التعديلات' : 'Save Changes'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
