import React, { useState, useRef } from 'react';
import { LineItem } from '../../types';
import { ItemThumbnail } from './ItemThumbnail';
import { soundService } from '../../services/sound';
import { calculateLineVat, DEFAULT_VAT_RATE } from '../../utils/pricing';
import {
  Trash2,
  Edit3,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Plus,
  Minus,
  Warehouse
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

  const isRtl = language === 'ar';
  const ACTION_WIDTH = 130;
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

    // Strict threshold: ignore vertical scrolling
    if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaX) < 15) {
      return;
    }

    if (Math.abs(deltaX) > 15) {
      hasMovedRef.current = true;
    }

    if (isRtl) {
      // In RTL Arabic: trailing actions are revealed at left-0 by sliding foreground to the right (positive X)
      if (isSwiped) {
        const newOffset = Math.max(0, Math.min(ACTION_WIDTH, ACTION_WIDTH + deltaX));
        setDragOffset(newOffset);
      } else {
        if (deltaX > 0) {
          const newOffset = Math.min(ACTION_WIDTH, Math.max(0, deltaX));
          setDragOffset(newOffset);
        }
      }
    } else {
      // In LTR English: trailing actions are revealed at right-0 by sliding foreground to the left (negative X)
      if (isSwiped) {
        const newOffset = Math.min(0, Math.max(-ACTION_WIDTH, -ACTION_WIDTH + deltaX));
        setDragOffset(newOffset);
      } else {
        if (deltaX < 0) {
          const newOffset = Math.max(-ACTION_WIDTH, Math.min(0, deltaX));
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
    if (!hasMovedRef.current || (Math.abs(deltaX) < 15 && Math.abs(deltaY) < 15)) {
      if (isSwiped) {
        setIsSwiped(false);
        setDragOffset(0);
      } else {
        soundService.playClick();
        onToggleExpand();
      }
      return;
    }

    const threshold = 35;
    if (isRtl) {
      if (isSwiped) {
        if (deltaX < -threshold) {
          setIsSwiped(false);
          setDragOffset(0);
        } else {
          setIsSwiped(true);
          setDragOffset(ACTION_WIDTH);
        }
      } else {
        if (deltaX > threshold) {
          soundService.playClick();
          setIsSwiped(true);
          setDragOffset(ACTION_WIDTH);
        } else {
          setIsSwiped(false);
          setDragOffset(0);
        }
      }
    } else {
      if (isSwiped) {
        if (deltaX > threshold) {
          setIsSwiped(false);
          setDragOffset(0);
        } else {
          setIsSwiped(true);
          setDragOffset(-ACTION_WIDTH);
        }
      } else {
        if (deltaX < -threshold) {
          soundService.playClick();
          setIsSwiped(true);
          setDragOffset(-ACTION_WIDTH);
        } else {
          setIsSwiped(false);
          setDragOffset(0);
        }
      }
    }
  };

  const closeSwipe = () => {
    setIsSwiped(false);
    setDragOffset(0);
  };

  return (
    <div
      id={`line-item-card-${item.code}`}
      className={`relative rounded-2xl overflow-hidden border shadow-xs select-none transition-all ${
        isDark
          ? isExpanded
            ? 'border-blue-500/40 bg-[#1A1D23]'
            : 'border-[#2D333F] bg-[#16181D] hover:border-[#3B4252]'
          : isExpanded
          ? 'border-blue-300 bg-blue-50/20'
          : 'border-gray-200/90 bg-white hover:border-gray-300'
      }`}
    >
      {/* Background Revealed Action Buttons (Positioned at trailing edge: left in RTL, right in LTR) */}
      <div
        className={`absolute inset-y-0 ${isRtl ? 'left-0' : 'right-0'} w-[130px] flex items-stretch z-0 transition-opacity duration-150 ${
          isDragging || isSwiped ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        } ${isDark ? 'bg-[#0F1115]' : 'bg-gray-100'}`}
      >
        {/* Edit Button */}
        <button
          type="button"
          id={`swipe-edit-btn-${item.code}`}
          onClick={(e) => {
            e.stopPropagation();
            soundService.playClick();
            closeSwipe();
            onEdit();
          }}
          className={`flex-1 text-white flex flex-col items-center justify-center gap-1 font-bold text-[11px] transition-colors shadow-inner ${
            isDark
              ? 'bg-blue-600 hover:bg-blue-500 active:bg-blue-700'
              : 'bg-[#252B37] hover:bg-[#1E232D] active:bg-[#161B22]'
          }`}
          title={isRtl ? 'تعديل الصنف' : 'Edit Item'}
        >
          <Edit3 className="w-4 h-4" />
          <span>{isRtl ? 'تعديل' : 'Edit'}</span>
        </button>

        {/* Delete Button */}
        <button
          type="button"
          id={`swipe-delete-btn-${item.code}`}
          onClick={(e) => {
            e.stopPropagation();
            closeSwipe();
            onDelete();
          }}
          className="flex-1 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white flex flex-col items-center justify-center gap-1 font-bold text-[11px] transition-colors shadow-inner"
          title={isRtl ? 'حذف الصنف' : 'Delete Item'}
        >
          <Trash2 className="w-4 h-4" />
          <span>{isRtl ? 'حذف' : 'Delete'}</span>
        </button>
      </div>

      {/* Foreground Sliding Record Card (Completely opaque to prevent any bleed-through) */}
      <div
        style={{
          transform: `translateX(${dragOffset}px)`,
          transition: isDragging ? 'none' : 'transform 200ms cubic-bezier(0.2, 0.8, 0.2, 1)',
          touchAction: 'pan-y'
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className={`relative z-10 w-full transition-colors cursor-pointer select-none ${
          isDark
            ? isExpanded
              ? 'bg-[#1C2028]'
              : 'bg-[#16181D] hover:bg-[#1C2028]'
            : isExpanded
            ? 'bg-[#FAFBFD]'
            : 'bg-white hover:bg-gray-50/90'
        }`}
      >
        {/* Main Record Row - Perfectly formatted to match Photo 2 */}
        <div
          onClick={() => {
            if (hasMovedRef.current) return;
            if (isSwiped) {
              closeSwipe();
            } else {
              soundService.playClick();
              onToggleExpand();
            }
          }}
          className="p-3 sm:p-3.5 flex items-center gap-3 cursor-pointer"
        >
          {/* Column 1: Rounded Thumbnail Container (Photo 2 reference) */}
          <ItemThumbnail
            src={item.imageUrl}
            name={item.name}
            size="md"
            className="shrink-0"
          />

          {/* Column 2: Center - Product Name & Subtitle Details (Photo 2 reference) */}
          <div className="flex-1 min-w-0 flex flex-col justify-center">
            {/* Line 1: Bold Item Name */}
            <h4
              className={`font-bold text-sm leading-snug truncate ${
                isDark ? 'text-gray-100' : 'text-gray-900'
              }`}
              title={isRtl ? item.name : item.nameEn || item.name}
            >
              {isRtl ? item.name : item.nameEn || item.name}
            </h4>

            {/* Line 2: Subtitle (Qty & Unit • Shelf Location) */}
            <div
              className={`text-xs mt-1 truncate flex items-center gap-1.5 ${
                isDark ? 'text-gray-400' : 'text-gray-500'
              }`}
            >
              <span className="font-medium text-gray-700 dark:text-gray-300">
                {item.enteredQty} {isRtl ? item.unit : item.unitEn || item.unit}
              </span>
              <span className="text-gray-300 dark:text-gray-600">•</span>
              <span>
                {isRtl ? `الرف: ${item.shelfNumber}` : `Shelf: ${item.shelfNumber}`}
              </span>
              {isOutOfStock ? (
                <>
                  <span className="text-gray-300 dark:text-gray-600">•</span>
                  <span className="text-red-500 font-bold">
                    {isRtl ? 'نفد الرصيد' : 'Out of Stock'}
                  </span>
                </>
              ) : (
                <>
                  <span className="text-gray-300 dark:text-gray-600">•</span>
                  <span className="text-gray-400 dark:text-gray-500">
                    {isRtl ? `متوفر: ${item.availableQty}` : `Stock: ${item.availableQty}`}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Column 3: Trailing - Total Price & Monospace Code (Photo 2 reference) */}
          <div className="shrink-0 flex flex-col items-end justify-center text-end min-w-[72px]">
            {/* Line 1: Emerald Green Line Total (matching 'Fulfilled' in Photo 2) */}
            <div
              className={`font-mono font-bold text-sm sm:text-base leading-tight ${
                isStockExceeded
                  ? 'text-red-500 dark:text-red-400'
                  : 'text-emerald-600 dark:text-emerald-400'
              }`}
            >
              {item.lineTotal.toFixed(2)} {isRtl ? 'ر.س' : 'SAR'}
            </div>

            {/* Line 2: Gray Monospace Code (matching '#TXN_10021' in Photo 2) */}
            <div className="font-mono text-xs text-gray-400 dark:text-gray-500 mt-1 leading-tight flex items-center gap-1">
              <span>#{item.code}</span>
              <div className="text-gray-400 dark:text-gray-500 ms-0.5">
                {isExpanded ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stock Warning Banner if exceeded */}
        {isStockExceeded && (
          <div className="mx-3 mb-2 p-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>
              {isRtl
                ? `الكمية المطلوبة (${item.enteredQty}) تتجاوز الرصيد المتوفر بالمخزن (${item.availableQty})`
                : `Entered qty (${item.enteredQty}) exceeds stock (${item.availableQty})`}
            </span>
          </div>
        )}

        {/* EXPANDABLE SECTION: FULL ITEM DETAILS & ACTIONS */}
        {isExpanded && (
          <div
            id={`line-item-expanded-data-${item.code}`}
            className={`p-3.5 border-t space-y-3 animate-in fade-in slide-in-from-top-2 duration-150 ${
              isDark
                ? 'border-[#2D333F]/70 bg-[#14161B]'
                : 'border-gray-200/90 bg-[#F9FAFC]'
            }`}
          >
            {/* Detailed Pricing Table */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div
                className={`p-2.5 rounded-xl border ${
                  isDark ? 'border-[#2D333F] bg-[#1C2028]' : 'border-gray-200 bg-white'
                }`}
              >
                <span className="text-[10px] text-gray-400 block mb-0.5">
                  {isRtl ? 'سعر الوحدة' : 'Unit Price'}
                </span>
                <span className={`font-mono font-bold text-xs ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {item.unitPrice.toFixed(2)} {isRtl ? 'ر.س' : 'SAR'}
                </span>
              </div>

              <div
                className={`p-2.5 rounded-xl border ${
                  isDark ? 'border-[#2D333F] bg-[#1C2028]' : 'border-gray-200 bg-white'
                }`}
              >
                <span className="text-[10px] text-gray-400 block mb-0.5">
                  {isRtl ? 'الخصم المطبق' : 'Discount'}
                </span>
                <span className="font-mono font-bold text-amber-600 text-xs">
                  {item.discount > 0
                    ? `-${item.discount} ${item.discountType === 'percentage' ? '%' : (isRtl ? 'ر.س' : 'SAR')}`
                    : '0.00'}
                </span>
              </div>

              <div
                className={`p-2.5 rounded-xl border ${
                  isDark ? 'border-[#2D333F] bg-[#1C2028]' : 'border-gray-200 bg-white'
                }`}
              >
                <span className="text-[10px] text-gray-400 block mb-0.5">
                  {isRtl
                    ? `الضريبة (${Math.round(DEFAULT_VAT_RATE * 100)}%)`
                    : `VAT (${Math.round(DEFAULT_VAT_RATE * 100)}%)`}
                </span>
                <span className={`font-mono font-bold text-xs ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  {calculateLineVat(item.lineTotal).toFixed(2)} {isRtl ? 'ر.س' : 'SAR'}
                </span>
              </div>

              <div
                className={`p-2.5 rounded-xl border ${
                  isDark
                    ? 'border-emerald-500/30 bg-emerald-500/10'
                    : 'border-emerald-600 bg-emerald-600 text-white'
                }`}
              >
                <span className={`text-[10px] block mb-0.5 ${isDark ? 'text-emerald-300' : 'text-emerald-100'}`}>
                  {isRtl ? 'إجمالي السطر' : 'Line Total'}
                </span>
                <span className={`font-mono font-bold text-xs ${isDark ? 'text-emerald-400' : 'text-white'}`}>
                  {item.lineTotal.toFixed(2)} {isRtl ? 'ر.س' : 'SAR'}
                </span>
              </div>
            </div>

            {/* Warehouse & Packaging Location */}
            <div
              className={`flex items-center justify-between text-xs p-2.5 rounded-xl border ${
                isDark
                  ? 'text-gray-400 bg-[#1C2028] border-[#2D333F]'
                  : 'text-gray-600 bg-white border-gray-200'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Warehouse className={`w-3.5 h-3.5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                <span>
                  {isRtl ? `المستودع / الرف: ${item.shelfNumber}` : `Shelf: ${item.shelfNumber}`}
                </span>
              </span>
              <span>
                {isRtl ? `الوحدة: ${item.unit}` : `Unit: ${item.unitEn || item.unit}`}
              </span>
            </div>

            {/* Inline Quick Quantity Stepper */}
            <div className="flex items-center justify-between gap-3 pt-1">
              <label className={`text-xs font-bold ${isDark ? 'text-gray-300' : 'text-gray-800'}`}>
                {isRtl ? 'تعديل الكمية السريع:' : 'Quick Qty Stepper:'}
              </label>

              <div
                className={`flex items-center h-9 rounded-xl border overflow-hidden shadow-xs ${
                  isDark ? 'border-[#2D333F] bg-[#121417]' : 'border-gray-300 bg-white'
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
                  className={`w-9 h-full flex items-center justify-center disabled:opacity-30 ${
                    isDark ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  title={isRtl ? 'تقليل الكمية' : 'Decrease Quantity'}
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
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    soundService.playClick();
                    onUpdateQty(item.enteredQty + 1);
                  }}
                  className={`w-9 h-full flex items-center justify-center ${
                    isDark ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  title={isRtl ? 'زيادة الكمية' : 'Increase Quantity'}
                >
                  <Plus className={`w-3.5 h-3.5 ${isDark ? 'text-blue-400' : 'text-blue-600 font-bold'}`} />
                </button>
              </div>
            </div>

            {/* Quick Action Buttons inside Expanded View */}
            <div
              className={`flex items-center gap-2 pt-2.5 border-t ${
                isDark ? 'border-[#2D333F]/70' : 'border-gray-200'
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
                className={`flex-1 h-9 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs ${
                  isDark
                    ? 'bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30'
                    : 'bg-[#252B37] hover:bg-[#1E232D] text-white'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>{isRtl ? 'تعديل الصنف' : 'Edit Item'}</span>
              </button>

              <button
                type="button"
                id={`expand-delete-btn-${item.code}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className={`h-9 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${
                  isDark
                    ? 'bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30'
                    : 'bg-red-50 hover:bg-red-100 text-red-600 border border-red-200'
                }`}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isRtl ? 'حذف' : 'Delete'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
