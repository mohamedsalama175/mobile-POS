import React, { useState, useRef, useEffect } from 'react';
import { LineItem, ProductItem } from '../../types';
import { storageService } from '../../services/storage';
import { soundService } from '../../services/sound';
import { useApp } from '../../context/AppContext';
import { GET_SAMPLE_20_LINE_ITEMS } from '../../data/mockData';
import { SwipeableLineItemCard } from './SwipeableLineItemCard';
import { EditItemModal } from './EditItemModal';
import { AddItemModal } from './AddItemModal';
import { CategoryGridSelector } from './CategoryGridSelector';
import {
  Scan,
  Plus,
  Package,
  RotateCcw,
  Search,
  Sparkles,
  Layers,
  LayoutGrid,
  List,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface LineItemEditorProps {
  items: LineItem[];
  onChangeItems: (items: LineItem[]) => void;
  showReturnAllButton?: boolean;
  onReturnAll?: () => void;
  isReturnMode?: boolean; // Caps entered quantity to maxReturnQty
}

export const LineItemEditor: React.FC<LineItemEditorProps> = ({
  items,
  onChangeItems,
  showReturnAllButton = false,
  onReturnAll,
  isReturnMode = false
}) => {
  const { language, theme, openScanner, showToast } = useApp();
  const [codeInput, setCodeInput] = useState('');
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [layoutMode, setLayoutMode] = useState<'grid' | 'list'>('grid'); // Default to grid view layout for categorizing items
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [editModalItem, setEditModalItem] = useState<LineItem | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>('شيبسي ومقرمشات'); // Pre-expand first category in grid view
  const [categoryHintForAdd, setCategoryHintForAdd] = useState<string | undefined>(undefined);
  const codeInputRef = useRef<HTMLInputElement>(null);
  const isDark = theme === 'dark';

  useEffect(() => {
    setProducts(storageService.getProducts());
  }, []);

  // Filter items by active category if selected
  const displayedItems = React.useMemo(() => {
    if (!activeCategory) return items;
    return items.filter((item) => {
      let cat = item.category?.trim();
      if (!cat) {
        const prod = products.find((p) => p.id === item.productId || p.code === item.code);
        cat = prod?.category?.trim() || 'مواد غذائية معبأة';
      }
      return cat === activeCategory;
    });
  }, [items, activeCategory, products]);

  const calculateLineTotal = (
    qty: number,
    price: number,
    discount: number,
    discountType: 'percentage' | 'fixed' = 'fixed'
  ) => {
    const gross = qty * price;
    const discountVal = discountType === 'percentage' ? (gross * discount) / 100 : discount;
    const net = Math.max(0, gross - discountVal);
    return Number(net.toFixed(2));
  };

  // Fast barcode scan handler
  const handleProcessCode = (scannedCode: string) => {
    const trimmed = scannedCode.trim();
    if (!trimmed) return;

    const found = products.find(
      (p) => p.code === trimmed || p.barcode === trimmed
    );

    if (!found) {
      soundService.playError();
      showToast(
        language === 'ar'
          ? `الصنف غير موجود (${trimmed}) - تحقق من الرمز أو ابحث بالاسم`
          : `Item not found (${trimmed}) - check code or search by name`,
        'error'
      );
      return;
    }

    const existingIndex = items.findIndex((it) => it.productId === found.id);

    if (existingIndex >= 0) {
      const updated = [...items];
      const current = updated[existingIndex];
      const newQty = current.enteredQty + 1;

      if (!isReturnMode && newQty > found.availableQty) {
        soundService.playError();
        showToast(
          language === 'ar'
            ? `تحذير: الكمية (${newQty}) تتجاوز رصيد المخزن (${found.availableQty})`
            : `Warning: Qty (${newQty}) exceeds stock (${found.availableQty})`,
          'warning'
        );
      }

      const lineTotal = calculateLineTotal(newQty, current.unitPrice, current.discount, current.discountType);
      updated[existingIndex] = {
        ...current,
        enteredQty: newQty,
        lineTotal
      };

      onChangeItems(updated);
      soundService.playScanSuccess();
      showToast(
        language === 'ar'
          ? `تمت زيادة كمية "${found.name}" إلى ${newQty}`
          : `Increased "${found.nameEn || found.name}" to ${newQty}`,
        'success'
      );
    } else {
      if (!isReturnMode && found.availableQty <= 0) {
        soundService.playError();
        showToast(
          language === 'ar'
            ? `تنبيه: هذا الصنف غير متوفر بالمخزن حالياً (رصيد: 0)`
            : `Warning: Item out of stock (Stock: 0)`,
          'warning'
        );
      }

      const lineTotal = calculateLineTotal(1, found.unitPrice, found.defaultDiscount || 0, 'fixed');
      const newItem: LineItem = {
        id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        productId: found.id,
        code: found.code,
        name: found.name,
        nameEn: found.nameEn,
        shelfNumber: found.shelfNumber,
        unit: found.unit,
        unitEn: found.unitEn,
        availableQty: found.availableQty,
        enteredQty: 1,
        unitPrice: found.unitPrice,
        discount: found.defaultDiscount || 0,
        discountType: 'fixed',
        lineTotal,
        imageUrl: found.imageUrl
      };

      onChangeItems([...items, newItem]);
      soundService.playScanSuccess();
      showToast(
        language === 'ar'
          ? `تمت إضافة "${found.name}" بنجاح`
          : `Added "${found.nameEn || found.name}"`,
        'success'
      );
    }

    setCodeInput('');
    setTimeout(() => {
      codeInputRef.current?.focus();
    }, 50);
  };

  const handleUpdateItemQty = (index: number, newQty: number) => {
    if (newQty < 1) return;
    const updated = [...items];
    const item = updated[index];

    if (isReturnMode && item.maxReturnQty !== undefined && newQty > item.maxReturnQty) {
      showToast(
        language === 'ar'
          ? `لا يمكن إرجاع كمية (${newQty}) أكبر من الكمية الأصلية بالفاتورة (${item.maxReturnQty})`
          : `Cannot return qty (${newQty}) higher than invoiced qty (${item.maxReturnQty})`,
        'warning'
      );
      return;
    }

    item.enteredQty = newQty;
    item.lineTotal = calculateLineTotal(newQty, item.unitPrice, item.discount, item.discountType);
    onChangeItems(updated);
  };

  const handleSaveEdit = (updatedItem: LineItem) => {
    const idx = items.findIndex((it) => it.id === updatedItem.id);
    if (idx >= 0) {
      const updated = [...items];
      updated[idx] = updatedItem;
      onChangeItems(updated);
      showToast(
        language === 'ar'
          ? `تم حفظ تعديلات الصنف "${updatedItem.name}"`
          : `Saved changes for "${updatedItem.name}"`,
        'success'
      );
    }
  };

  const handleAddNewItem = (newItem: LineItem) => {
    // Check if item already exists in items
    const existingIdx = items.findIndex((it) => it.productId === newItem.productId);
    if (existingIdx >= 0) {
      const updated = [...items];
      const curr = updated[existingIdx];
      const mergedQty = curr.enteredQty + newItem.enteredQty;
      curr.enteredQty = mergedQty;
      curr.unitPrice = newItem.unitPrice;
      curr.discount = newItem.discount;
      curr.discountType = newItem.discountType;
      curr.lineTotal = calculateLineTotal(mergedQty, newItem.unitPrice, newItem.discount, newItem.discountType);
      onChangeItems(updated);
      showToast(
        language === 'ar'
          ? `تم تحديث كمية الصنف إلى ${mergedQty}`
          : `Updated item quantity to ${mergedQty}`,
        'success'
      );
    } else {
      onChangeItems([...items, newItem]);
      showToast(
        language === 'ar'
          ? `تمت إضافة الصنف "${newItem.name}" إلى الطلب`
          : `Added "${newItem.name}" to order`,
        'success'
      );
    }
  };

  const handleRemoveItem = (index: number) => {
    soundService.playClick();
    const removedItem = items[index];
    const updated = items.filter((_, i) => i !== index);
    onChangeItems(updated);
    if (expandedItemId === removedItem?.id) {
      setExpandedItemId(null);
    }
    showToast(
      language === 'ar'
        ? `تم حذف "${removedItem?.name}" من الطلب`
        : `Removed "${removedItem?.name}" from order`,
      'info'
    );
  };

  return (
    <div id="line-item-editor" className="space-y-3">
      {/* Top Action Bar: Add New Item Modal Trigger + Rapid Scan / Search */}
      <div className="space-y-2">
        {/* Primary Add New Item Button (Prominent & High Touch affordance) */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            id="open-add-item-modal-btn"
            onClick={() => {
              soundService.playClick();
              setIsAddModalOpen(true);
            }}
            className={`flex-1 h-12 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm active:scale-98 ${
              isDark ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-[#252B37] hover:bg-[#1E232D] text-white'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>{language === 'ar' ? 'إضافة صنف جديد (نافذة منبثقة)' : 'Add New Item (Modal)'}</span>
          </button>

          {showReturnAllButton && onReturnAll && (
            <button
              type="button"
              id="return-all-lines-button"
              onClick={onReturnAll}
              className={`px-3 h-12 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shrink-0 ${
                isDark
                  ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30'
                  : 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
              }`}
            >
              <RotateCcw className="w-4 h-4" />
              <span>{language === 'ar' ? 'إرجاع الكل' : 'Return All'}</span>
            </button>
          )}
        </div>

        {/* Rapid Scan or Quick Code Input */}
        <div className="flex items-center gap-1.5">
          <div className="relative flex-1">
            <input
              ref={codeInputRef}
              id="line-item-code-input"
              type="text"
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleProcessCode(codeInput);
                }
              }}
              placeholder={
                language === 'ar'
                  ? 'أدخل الكود أو امسح الباركود سريعاً...'
                  : 'Enter code or scan barcode...'
              }
              className={`w-full h-11 pl-10 pr-10 text-xs font-mono rounded-xl border outline-none transition-colors ${
                isDark
                  ? 'bg-[#1C1F24] border-[#333842] text-[#F5F6F7] focus:border-blue-500'
                  : 'bg-white border-gray-200 text-[#111827] focus:border-[#252B37]'
              }`}
            />

            {/* In-field camera scan trigger */}
            <button
              type="button"
              id="line-item-field-scan-button"
              onClick={() => openScanner(handleProcessCode)}
              className={`absolute ${language === 'ar' ? 'left-2' : 'right-2'} top-2 p-1.5 rounded-lg transition-colors ${
                isDark
                  ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              title={language === 'ar' ? 'فتح الماسح الضوئي' : 'Open Scanner'}
            >
              <Scan className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Add By Code Button */}
          <button
            type="button"
            id="line-item-quick-code-btn"
            onClick={() => handleProcessCode(codeInput)}
            className={`h-11 px-3 rounded-xl border text-xs font-bold flex items-center justify-center transition-colors shrink-0 ${
              isDark
                ? 'bg-[#262A31] hover:bg-[#323640] border-[#333842] text-white'
                : 'bg-gray-100 hover:bg-gray-200 border-gray-200 text-gray-800'
            }`}
            title={language === 'ar' ? 'إضافة بالكود' : 'Add by code'}
          >
            <Plus className="w-4 h-4" />
          </button>

          {/* Catalog Search Trigger */}
          <button
            type="button"
            id="line-item-catalog-picker-btn"
            onClick={() => {
              soundService.playClick();
              setIsAddModalOpen(true);
            }}
            className={`h-11 px-3 rounded-xl border flex items-center justify-center transition-colors shrink-0 ${
              isDark
                ? 'bg-[#262A31] border-[#333842] text-gray-300 hover:text-white'
                : 'bg-gray-100 border-gray-200 text-gray-700 hover:bg-gray-200'
            }`}
            title={language === 'ar' ? 'البحث بالدليل' : 'Search catalog'}
          >
            <Search className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* View Mode Selector: 3-Photos-Grid View vs List View */}
      {items.length > 0 && (
        <div
          id="line-item-view-mode-bar"
          className={`flex items-center justify-between gap-2 p-1 rounded-xl border ${
            isDark ? 'border-[#333842] bg-[#16181D]' : 'border-gray-200 bg-gray-50'
          }`}
        >
          <div className="flex items-center gap-1">
            <button
              type="button"
              id="view-mode-grid-btn"
              onClick={() => {
                soundService.playClick();
                setLayoutMode('grid');
                if (!activeCategory) setActiveCategory('شيبسي ومقرمشات');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                layoutMode === 'grid'
                  ? isDark
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-[#252B37] text-white shadow-sm'
                  : isDark
                  ? 'text-[#9AA1AC] hover:text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>{language === 'ar' ? 'شبكة الفئات (3 بالصف)' : 'Category Grid (3 in Row)'}</span>
            </button>

            <button
              type="button"
              id="view-mode-list-btn"
              onClick={() => {
                soundService.playClick();
                setLayoutMode('list');
                setActiveCategory(null);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                layoutMode === 'list'
                  ? isDark
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-[#252B37] text-white shadow-sm'
                  : isDark
                  ? 'text-[#9AA1AC] hover:text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>{language === 'ar' ? 'عرض القائمة' : 'Full List'}</span>
            </button>
          </div>

          <div className="text-[11px] font-mono px-2 text-gray-400">
            {items.length} {language === 'ar' ? 'صنف' : 'items'}
          </div>
        </div>
      )}

      {/* 3-Photos-in-a-Row Category Grid (Only in Grid Mode or when items exist) */}
      {items.length > 0 && layoutMode === 'grid' && (
        <CategoryGridSelector
          items={items}
          products={products}
          activeCategory={activeCategory}
          onSelectCategory={(cat) => setActiveCategory(cat)}
          language={language}
          isDark={isDark}
          onOpenAddModal={(catHint) => {
            setCategoryHintForAdd(catHint);
            setIsAddModalOpen(true);
          }}
        />
      )}

      {/* Swipe & Expand Hint Header */}
      {items.length > 0 && (
        <div className={`flex items-center justify-between px-1 text-[11px] ${isDark ? 'text-[#9AA1AC]' : 'text-gray-500'}`}>
          <span>
            {activeCategory && layoutMode === 'grid'
              ? language === 'ar'
                ? `معروض: ${displayedItems.length} من أصل ${items.length} صنف`
                : `Showing: ${displayedItems.length} of ${items.length} items`
              : language === 'ar'
              ? `إجمالي الأصناف: ${items.length} صنف`
              : `Total items: ${items.length}`}
          </span>
          <span className={`flex items-center gap-1 text-[10px] ${isDark ? 'text-blue-400' : 'text-gray-500'}`}>
            <span>{language === 'ar' ? 'اسحب لليسار للإجراءات • اضغط للتفاصيل' : 'Swipe left for actions • Tap to expand'}</span>
          </span>
        </div>
      )}

      {/* Line Items List (Rendered as Swipeable & Expandable Records) */}
      <div className="space-y-2">
        {items.length === 0 ? (
          <div
            id="empty-line-items"
            className={`p-6 text-center rounded-2xl border border-dashed ${
              isDark ? 'border-[#333842] bg-[#1C1F24]/50' : 'border-gray-300 bg-gray-50'
            }`}
          >
            <Package className="w-8 h-8 mx-auto text-gray-400 mb-2" />
            <p className="text-xs font-medium text-gray-500 mb-3">
              {language === 'ar'
                ? 'لا توجد أصناف مضافة حتى الآن. يمكنك إضافة صنف جديد أو تحميل 35 صنفاً مصنفاً للتجربة.'
                : 'No items added yet. Add a new item or load 35 categorized items for demo.'}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                id="btn-add-item-empty"
                onClick={() => {
                  setCategoryHintForAdd(undefined);
                  setIsAddModalOpen(true);
                }}
                className={`px-4 py-2 rounded-xl text-white text-xs font-bold inline-flex items-center gap-1.5 transition-colors shadow-sm ${
                  isDark ? 'bg-blue-600 hover:bg-blue-500' : 'bg-[#252B37] hover:bg-[#1E232D]'
                }`}
              >
                <Plus className="w-4 h-4" />
                <span>{language === 'ar' ? 'إضافة صنف الآن' : 'Add Item Now'}</span>
              </button>

              <button
                type="button"
                id="btn-load-sample-35-items"
                onClick={() => {
                  soundService.playScanSuccess();
                  onChangeItems(GET_SAMPLE_20_LINE_ITEMS());
                  setLayoutMode('grid');
                  setActiveCategory('شيبسي ومقرمشات');
                  showToast(
                    language === 'ar'
                      ? 'تم تحميل 35 صنفاً مصنفاً (10 شيبسي + 15 شل + 10 عصائر)'
                      : 'Loaded 35 categorized items (10 Chipsy + 15 Shell + 10 Juices)',
                    'success'
                  );
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition-colors border shadow-sm ${
                  isDark
                    ? 'border-blue-500/40 bg-blue-500/20 text-blue-300 hover:bg-blue-500/30'
                    : 'border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100'
                }`}
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>
                  {language === 'ar'
                    ? '⚡ تحميل 35 صنفاً مصنفاً (10 شيبسي + 15 شل + 10 عصائر)'
                    : '⚡ Load 35 Categorized Items'}
                </span>
              </button>
            </div>
          </div>
        ) : displayedItems.length === 0 ? (
          <div
            id="empty-filtered-category"
            className={`p-6 text-center rounded-2xl border border-dashed ${
              isDark ? 'border-[#333842] bg-[#1C1F24]/50' : 'border-gray-300 bg-gray-50'
            }`}
          >
            <Package className="w-8 h-8 mx-auto text-gray-400 mb-2" />
            <p className="text-xs font-medium text-gray-400 mb-2">
              {language === 'ar'
                ? `لا توجد أصناف متبقية في فئة "${activeCategory}".`
                : `No items remaining in "${activeCategory}".`}
            </p>
            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setCategoryHintForAdd(activeCategory || undefined);
                  setIsAddModalOpen(true);
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-600 text-white"
              >
                {language === 'ar' ? '+ إضافة صنف لهذه الفئة' : '+ Add Item to Category'}
              </button>
              <button
                type="button"
                onClick={() => setActiveCategory(null)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold border border-gray-600 text-gray-300"
              >
                {language === 'ar' ? 'عرض الكل' : 'View All'}
              </button>
            </div>
          </div>
        ) : (
          displayedItems.map((item) => {
            const masterIdx = items.findIndex((it) => it.id === item.id);
            const actualIdx = masterIdx >= 0 ? masterIdx : 0;
            return (
              <SwipeableLineItemCard
                key={item.id}
                item={item}
                index={actualIdx}
                isExpanded={expandedItemId === item.id}
                onToggleExpand={() => {
                  setExpandedItemId(expandedItemId === item.id ? null : item.id);
                }}
                onEdit={() => setEditModalItem(item)}
                onDelete={() => handleRemoveItem(actualIdx)}
                onUpdateQty={(newQty) => handleUpdateItemQty(actualIdx, newQty)}
                language={language}
                isDark={isDark}
                isReturnMode={isReturnMode}
              />
            );
          })
        )}
      </div>

      {/* Edit Item Modal */}
      <EditItemModal
        isOpen={Boolean(editModalItem)}
        item={editModalItem}
        language={language}
        isDark={isDark}
        isReturnMode={isReturnMode}
        onClose={() => setEditModalItem(null)}
        onSave={handleSaveEdit}
      />

      {/* Add New Item Modal */}
      <AddItemModal
        isOpen={isAddModalOpen}
        products={products}
        language={language}
        isDark={isDark}
        isReturnMode={isReturnMode}
        categoryHint={categoryHintForAdd}
        onClose={() => {
          setIsAddModalOpen(false);
          setCategoryHintForAdd(undefined);
        }}
        onAdd={handleAddNewItem}
        onOpenScanner={openScanner}
      />
    </div>
  );
};
