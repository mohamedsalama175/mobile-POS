import React, { useState, useRef } from 'react';
import { LineItem } from '../../types';
import { ItemThumbnail } from './ItemThumbnail';
import { soundService } from '../../services/sound';
import {
  Trash2,
  Edit3,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Plus,
  Minus,
  Warehouse,
  Barcode,
  Sliders,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface SwipeableLineItemCardProps {
  item: LineItem;
  index: number;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onUpdateQty: (newQty: number) => void;
  language: 'ar' | 'en';
  isDark: boolean;
  isReturnMode?: boolean;
}

export const SwipeableLineItemCard: React.FC<SwipeableLineItemCardProps> = ({
  item,
  index,
  isExpanded,
  onToggleExpand,
  onEdit,
  onDelete,
  onUpdateQty,
  language,
  isDark,
  isReturnMode = false
}) => {
  const [isSwiped, setIsSwiped] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null);
  const hasMovedRef = useRef(false);

  const isStockExceeded = !isReturnMode && item.enteredQty > item.availableQty;
  const isOutOfStock = !isReturnMode && item.availableQty <= 0;

  // Unified Pointer/Touch swipe handling
  const handlePointerDown = (e: React.PointerEvent) => {
    // Ignore interactive controls inside card
    const target = e.target as HTMLElement;
    if (
      target.closest('button') ||
      target.closest('input') ||
      target.closest('select') ||
      target.closest('a')
    ) {
      return;
    }

    pointerStartRef.current = {
      x: e.clientX,
      y: e.clientY
    };
    hasMovedRef.current = false;
    setIsDragging(true);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!pointerStartRef.current || !isDragging) return;
    const deltaX = e.clientX - pointerStartRef.current.x;
    const deltaY = e.clientY - pointerStartRef.current.y;

    if (Math.abs(deltaX) > 6 || Math.abs(deltaY) > 6) {
      hasMovedRef.current = true;
    }

    // Prioritize horizontal swipe over vertical scroll
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      if (isSwiped) {
        // Swiping back to the right (closing)
        const newOffset = Math.min(0, Math.max(-140, -140 + deltaX));
        setDragOffset(newOffset);
      } else {
        // Swiping left to reveal actions
        if (deltaX < 0) {
          const newOffset = Math.max(-140, Math.min(0, deltaX));
          setDragOffset(newOffset);
        }
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    if (!pointerStartRef.current) return;

    const deltaX = e.clientX - pointerStartRef.current.x;
    const deltaY = e.clientY - pointerStartRef.current.y;
    pointerStartRef.current = null;

    // Detect if this was a simple click/tap without dragging
    if (!hasMovedRef.current || (Math.abs(deltaX) < 8 && Math.abs(deltaY) < 8)) {
      if (isSwiped) {
        // Close swipe
        setIsSwiped(false);
        setDragOffset(0);
      } else {
        // Tap triggers card expansion to reveal detailed information
        soundService.playClick();
        onToggleExpand();
      }
      return;
    }

    // Determine swipe threshold
    if (isSwiped) {
      if (deltaX > 35) {
        setIsSwiped(false);
        setDragOffset(0);
      } else {
        setIsSwiped(true);
        setDragOffset(-140);
      }
    } else {
      if (deltaX < -35) {
        soundService.playClick();
        setIsSwiped(true);
        setDragOffset(-140);
      } else {
        setIsSwiped(false);
        setDragOffset(0);
      }
    }
  };

  // Toggle slide manually (useful for desktop/button click)
  const toggleSlide = (e: React.MouseEvent) => {
    e.stopPropagation();
    soundService.playClick();
    if (isSwiped) {
      setIsSwiped(false);
      setDragOffset(0);
    } else {
      setIsSwiped(true);
      setDragOffset(-140);
    }
  };

  return (
    <div
      id={`line-item-card-${item.code}`}
      className={`relative rounded-2xl overflow-hidden border shadow-sm select-none transition-colors ${
        isDark ? 'border-[#333842] bg-[#16181D]' : 'border-gray-200 bg-gray-100'
      }`}
    >
      {/* Background Revealed Action Buttons (Revealed when sliding to left) */}
      <div
        className={`absolute inset-y-0 right-0 w-[140px] flex items-stretch z-0 ${
          isDark ? 'bg-[#0F1115]' : 'bg-gray-200'
        }`}
      >
        {/* Edit Button */}
        <button
          type="button"
          id={`swipe-edit-btn-${item.code}`}
          onClick={(e) => {
            e.stopPropagation();
            soundService.playClick();
            setIsSwiped(false);
            setDragOffset(0);
            onEdit();
          }}
          className={`flex-1 text-white flex flex-col items-center justify-center gap-1 font-bold text-[11px] transition-colors shadow-inner ${
            isDark
              ? 'bg-blue-600 hover:bg-blue-500 active:bg-blue-700'
              : 'bg-[#252B37] hover:bg-[#1E232D] active:bg-[#161B22]'
          }`}
          title={language === 'ar' ? 'تعديل الصنف' : 'Edit Item'}
        >
          <Edit3 className="w-5 h-5" />
          <span>{language === 'ar' ? 'تعديل' : 'Edit'}</span>
        </button>

        {/* Delete Button */}
        <button
          type="button"
          id={`swipe-delete-btn-${item.code}`}
          onClick={(e) => {
            e.stopPropagation();
            setIsSwiped(false);
            setDragOffset(0);
            onDelete();
          }}
          className="flex-1 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white flex flex-col items-center justify-center gap-1 font-bold text-[11px] transition-colors shadow-inner"
          title={language === 'ar' ? 'حذف الصنف' : 'Delete Item'}
        >
          <Trash2 className="w-5 h-5" />
          <span>{language === 'ar' ? 'حذف' : 'Delete'}</span>
        </button>
      </div>

      {/* Foreground Sliding Record Card */}
      <div
        style={{
          transform: `translateX(${dragOffset}px)`,
          transition: isDragging ? 'none' : 'transform 220ms cubic-bezier(0.2, 0.8, 0.2, 1)',
          touchAction: 'pan-y'
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className={`relative z-10 w-full border-b transition-colors cursor-pointer select-none ${
          isDark
            ? isExpanded
              ? 'bg-[#21252C] border-[#333842]/40'
              : 'bg-[#1C1F24] hover:bg-[#232730] border-[#333842]/40'
            : isExpanded
            ? 'bg-[#F9FAFB] border-gray-200'
            : 'bg-white hover:bg-gray-50/80 border-gray-100'
        }`}
      >
        {/* Main Record Header Row */}
        <div
          onClick={(e) => {
            // If dragging occurred, do not treat as simple header click
            if (hasMovedRef.current) return;
            if (isSwiped) {
              setIsSwiped(false);
              setDragOffset(0);
            } else {
              soundService.playClick();
              onToggleExpand();
            }
          }}
          className="p-3 flex items-center gap-3 cursor-pointer"
        >
          {/* Index Badge */}
          <div
            className={`w-5 h-5 rounded-md text-[10px] font-mono font-bold flex items-center justify-center shrink-0 border ${
              isDark
                ? 'bg-blue-600/20 text-blue-300 border-blue-500/30'
                : 'bg-gray-100 text-gray-700 border-gray-200'
            }`}
          >
            {index + 1}
          </div>

          {/* Photo Thumbnail */}
          <ItemThumbnail
            src={item.imageUrl}
            name={item.name}
            size="md"
          />

          {/* Record Info: Name, Code, Shelf, Stock */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span
                className={`font-bold text-xs truncate max-w-[190px] ${
                  isDark ? 'text-[#F5F6F7]' : 'text-[#111827]'
                }`}
              >
                {language === 'ar' ? item.name : item.nameEn || item.name}
              </span>
              <span
                className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-bold shrink-0 ${
                  isDark
                    ? 'bg-blue-500/15 text-blue-400'
                    : 'bg-gray-100 text-gray-600 border border-gray-200/80'
                }`}
              >
                #{item.code}
              </span>
            </div>

            <div
              className={`flex items-center gap-2 text-[11px] mt-1 ${
                isDark ? 'text-[#9AA1AC]' : 'text-[#6B7280]'
              }`}
            >
              <span>{language === 'ar' ? `الرف: ${item.shelfNumber}` : `Shelf: ${item.shelfNumber}`}</span>
              <span>•</span>
              <span
                className={
                  isOutOfStock
                    ? 'text-red-500 font-bold'
                    : isDark
                    ? 'text-emerald-400 font-semibold'
                    : 'text-[#059669] font-medium'
                }
              >
                {language === 'ar' ? `المتوفر: ${item.availableQty}` : `Stock: ${item.availableQty}`}
              </span>
            </div>
          </div>

          {/* Quantity & Total Price Pill */}
          <div className="text-right shrink-0">
            <div
              className={`font-mono font-bold text-xs ${
                isDark ? 'text-blue-400' : 'text-[#111827]'
              }`}
            >
              {item.lineTotal.toFixed(2)} ر.س
            </div>
            <div
              className={`text-[10px] font-mono px-2 py-0.5 rounded-md border mt-1 inline-block ${
                isDark
                  ? 'text-gray-300 bg-[#121417] border-[#333842]'
                  : 'text-gray-700 bg-gray-100 border-gray-200'
              }`}
            >
              {language === 'ar' ? `${item.enteredQty} × ${item.unit}` : `${item.enteredQty} × ${item.unitEn || item.unit}`}
            </div>
          </div>

          {/* Slide & Expand Indicators / Desktop Button */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Desktop Slide Reveal Trigger */}
            <button
              type="button"
              id={`slide-toggle-btn-${item.code}`}
              onClick={toggleSlide}
              title={language === 'ar' ? 'اسحب أو اضغط لإظهار أزرار الإجراءات' : 'Slide to reveal actions'}
              className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              {isSwiped ? (
                <ChevronRight className={`w-4 h-4 ${isDark ? 'text-blue-400' : 'text-[#111827]'}`} />
              ) : (
                <ChevronLeft className="w-4 h-4 text-gray-400" />
              )}
            </button>

            {/* Expand / Collapse Chevron */}
            <div className="text-gray-400">
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </div>
        </div>

        {/* Stock Warning Banner if exceeded */}
        {isStockExceeded && (
          <div className="mx-3 mb-2 p-1.5 rounded-lg bg-red-500/15 border border-red-500/30 text-red-500 text-[11px] flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>
              {language === 'ar'
                ? `الكمية المطلوبة (${item.enteredQty}) تتجاوز الرصيد المتوفر بالمخزن (${item.availableQty})`
                : `Entered qty (${item.enteredQty}) exceeds stock (${item.availableQty})`}
            </span>
          </div>
        )}

        {/* EXPANDABLE SECTION: ALL DATA OF THE ITEM */}
        {isExpanded && (
          <div
            id={`line-item-expanded-data-${item.code}`}
            className={`p-3 border-t space-y-3 animate-in fade-in slide-in-from-top-2 duration-150 ${
              isDark
                ? 'border-[#333842]/60 bg-[#14161B]'
                : 'border-gray-200 bg-[#F8F9FA]'
            }`}
          >
            {/* Detailed Data Table */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div
                className={`p-2 rounded-xl border ${
                  isDark ? 'border-[#333842] bg-[#1C1F24]' : 'border-gray-200 bg-white'
                }`}
              >
                <span className="text-[10px] text-gray-400 block">{language === 'ar' ? 'سعر الوحدة' : 'Unit Price'}</span>
                <span className={`font-mono font-bold text-xs ${isDark ? 'text-white' : 'text-[#111827]'}`}>
                  {item.unitPrice.toFixed(2)} ر.س
                </span>
              </div>

              <div
                className={`p-2 rounded-xl border ${
                  isDark ? 'border-[#333842] bg-[#1C1F24]' : 'border-gray-200 bg-white'
                }`}
              >
                <span className="text-[10px] text-gray-400 block">{language === 'ar' ? 'الخصم المطبق' : 'Discount'}</span>
                <span className="font-mono font-bold text-amber-600 text-xs">
                  {item.discount > 0 ? `-${item.discount} ${item.discountType === 'percentage' ? '%' : 'ر.س'}` : '0.00'}
                </span>
              </div>

              <div
                className={`p-2 rounded-xl border ${
                  isDark ? 'border-[#333842] bg-[#1C1F24]' : 'border-gray-200 bg-white'
                }`}
              >
                <span className="text-[10px] text-gray-400 block">{language === 'ar' ? 'الضريبة (15%)' : 'VAT (15%)'}</span>
                <span className={`font-mono font-bold text-xs ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  {(item.lineTotal * 0.15).toFixed(2)} ر.س
                </span>
              </div>

              <div
                className={`p-2 rounded-xl border ${
                  isDark
                    ? 'border-blue-500/30 bg-blue-500/10'
                    : 'border-[#252B37] bg-[#252B37] text-white'
                }`}
              >
                <span className={`text-[10px] block ${isDark ? 'text-blue-300' : 'text-gray-300'}`}>
                  {language === 'ar' ? 'إجمالي السطر' : 'Line Total'}
                </span>
                <span className={`font-mono font-bold text-xs ${isDark ? 'text-blue-400' : 'text-white'}`}>
                  {item.lineTotal.toFixed(2)} ر.س
                </span>
              </div>
            </div>

            {/* Shelf & Packaging metadata */}
            <div
              className={`flex items-center justify-between text-[11px] p-2 rounded-xl border ${
                isDark
                  ? 'text-gray-400 bg-[#1C1F24] border-[#333842]'
                  : 'text-gray-600 bg-white border-gray-200'
              }`}
            >
              <span className="flex items-center gap-1">
                <Warehouse className={`w-3.5 h-3.5 ${isDark ? 'text-blue-400' : 'text-gray-700'}`} />
                <span>{language === 'ar' ? `المستودع / الرف: ${item.shelfNumber}` : `Shelf: ${item.shelfNumber}`}</span>
              </span>
              <span>
                {language === 'ar' ? `الوحدة: ${item.unit}` : `Unit: ${item.unitEn || item.unit}`}
              </span>
            </div>

            {/* Inline Quick Quantity Stepper */}
            <div className="flex items-center justify-between gap-3 pt-1">
              <label className={`text-xs font-bold ${isDark ? 'text-gray-300' : 'text-gray-800'}`}>
                {language === 'ar' ? 'تعديل الكمية السريع:' : 'Quick Qty Stepper:'}
              </label>

              <div
                className={`flex items-center h-9 rounded-lg border overflow-hidden ${
                  isDark ? 'border-[#333842] bg-[#121417]' : 'border-gray-300 bg-white'
                }`}
              >
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    soundService.playClick();
                    onUpdateQty(Math.max(1, item.enteredQty - 1));
                  }}
                  disabled={item.enteredQty <= 1}
                  className={`w-8 h-full flex items-center justify-center disabled:opacity-30 ${
                    isDark ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <input
                  type="number"
                  min="1"
                  max={isReturnMode ? item.maxReturnQty : undefined}
                  value={item.enteredQty}
                  onChange={(e) => onUpdateQty(Math.max(1, parseFloat(e.target.value) || 1))}
                  onClick={(e) => e.stopPropagation()}
                  className={`w-14 text-center font-mono font-bold text-xs bg-transparent outline-none ${
                    isDark ? 'text-white' : 'text-[#111827]'
                  }`}
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    soundService.playClick();
                    onUpdateQty(item.enteredQty + 1);
                  }}
                  className={`w-8 h-full flex items-center justify-center ${
                    isDark ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Plus className={`w-3.5 h-3.5 ${isDark ? 'text-blue-400' : 'text-gray-900 font-bold'}`} />
                </button>
              </div>
            </div>

            {/* Quick Action Buttons inside Expanded View */}
            <div
              className={`flex items-center gap-2 pt-2 border-t ${
                isDark ? 'border-[#333842]/40' : 'border-gray-200'
              }`}
            >
              <button
                type="button"
                id={`expand-edit-btn-${item.code}`}
                onClick={(e) => {
                  e.stopPropagation();
                  soundService.playClick();
                  onEdit();
                }}
                className={`flex-1 h-9 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-sm ${
                  isDark
                    ? 'bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30'
                    : 'bg-[#252B37] hover:bg-[#1E232D] text-white'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>{language === 'ar' ? 'تعديل في نافذة منبثقة' : 'Edit in Modal'}</span>
              </button>

              <button
                type="button"
                id={`expand-delete-btn-${item.code}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className={`h-9 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${
                  isDark
                    ? 'bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30'
                    : 'bg-red-50 hover:bg-red-100 text-red-600 border border-red-200'
                }`}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{language === 'ar' ? 'حذف' : 'Delete'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
