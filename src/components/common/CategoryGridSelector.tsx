import React from 'react';
import { LineItem, ProductItem } from '../../types';
import { getCategoryInfo } from '../../data/mockData';
import { soundService } from '../../services/sound';
import { Check, Layers, ChevronDown, ChevronUp, Plus, Sparkles } from 'lucide-react';

export interface CategoryGroup {
  name: string;
  nameEn: string;
  imageUrl: string;
  items: LineItem[];
  count: number;
  totalQty: number;
  subtotal: number;
}

interface CategoryGridSelectorProps {
  items: LineItem[];
  products: ProductItem[];
  activeCategory: string | null;
  onSelectCategory: (categoryName: string | null) => void;
  language: 'ar' | 'en';
  isDark: boolean;
  onOpenAddModal?: (categoryHint?: string) => void;
}

export const CategoryGridSelector: React.FC<CategoryGridSelectorProps> = ({
  items,
  products,
  activeCategory,
  onSelectCategory,
  language,
  isDark,
  onOpenAddModal
}) => {
  // Group items by category
  const categoryGroups = React.useMemo(() => {
    const map = new Map<string, LineItem[]>();

    items.forEach((item) => {
      let cat = item.category?.trim();
      if (!cat) {
        const prod = products.find((p) => p.id === item.productId || p.code === item.code);
        cat = prod?.category?.trim() || 'مواد غذائية معبأة';
      }
      if (!map.has(cat)) {
        map.set(cat, []);
      }
      map.get(cat)!.push(item);
    });

    const groups: CategoryGroup[] = [];
    map.forEach((catItems, catName) => {
      const info = getCategoryInfo(catName);
      const totalQty = catItems.reduce((sum, it) => sum + it.enteredQty, 0);
      const subtotal = catItems.reduce((sum, it) => sum + it.lineTotal, 0);
      groups.push({
        name: catName,
        nameEn: info.nameEn,
        imageUrl: info.imageUrl,
        items: catItems,
        count: catItems.length,
        totalQty,
        subtotal
      });
    });

    // Sort order: prioritize 'شيبسي ومقرمشات', 'زيوت شل ومحركات', 'عصائر ومشروبات'
    const priorityOrder = ['شيبسي ومقرمشات', 'زيوت شل ومحركات', 'عصائر ومشروبات'];
    groups.sort((a, b) => {
      const aIdx = priorityOrder.indexOf(a.name);
      const bIdx = priorityOrder.indexOf(b.name);
      if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
      if (aIdx !== -1) return -1;
      if (bIdx !== -1) return 1;
      return b.count - a.count;
    });

    return groups;
  }, [items, products]);

  if (categoryGroups.length === 0) {
    return null;
  }

  return (
    <div id="category-grid-container" className="space-y-2.5">
      {/* Header bar with total categories and View All toggle */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <div
            className={`w-6 h-6 rounded-lg flex items-center justify-center ${
              isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-50 text-blue-600'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
          </div>
          <div>
            <h4 className={`text-xs font-bold ${isDark ? 'text-[#F5F6F7]' : 'text-gray-900'}`}>
              {language === 'ar' ? 'فئات الأصناف (شبكة 3 صور بالصف)' : 'Item Categories (3 in Row Grid)'}
            </h4>
            <p className={`text-[10px] ${isDark ? 'text-[#9AA1AC]' : 'text-gray-500'}`}>
              {language === 'ar'
                ? 'اضغط على أي فئة لاستعراض كافة أصنافها المضافة'
                : 'Click any photo to open all items of this category'}
            </p>
          </div>
        </div>

        {/* View All Button */}
        <button
          type="button"
          id="btn-show-all-categories"
          onClick={() => {
            soundService.playClick();
            onSelectCategory(null);
          }}
          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all border ${
            activeCategory === null
              ? isDark
                ? 'bg-blue-600 border-blue-500 text-white shadow-sm'
                : 'bg-blue-600 border-blue-600 text-white shadow-sm'
              : isDark
              ? 'bg-[#262A31] border-[#333842] text-[#9AA1AC] hover:text-white'
              : 'bg-gray-100 border-gray-200 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {language === 'ar' ? `عرض الكل (${items.length})` : `Show All (${items.length})`}
        </button>
      </div>

      {/* 3 Photos in a Row Grid (grid-cols-3) */}
      <div
        id="category-photo-grid"
        className="grid grid-cols-3 gap-2 sm:gap-3"
      >
        {categoryGroups.map((cat) => {
          const isActive = activeCategory === cat.name;

          return (
            <div
              key={cat.name}
              id={`category-card-${cat.name.replace(/\s+/g, '-')}`}
              role="button"
              tabIndex={0}
              onClick={() => {
                soundService.playClick();
                if (isActive) {
                  // Clicking active category collapses it
                  onSelectCategory(null);
                } else {
                  // Clicking category expands to show all items within it
                  onSelectCategory(cat.name);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  if (isActive) {
                    onSelectCategory(null);
                  } else {
                    onSelectCategory(cat.name);
                  }
                }
              }}
              className={`relative overflow-hidden rounded-2xl border-2 transition-all duration-200 cursor-pointer select-none group active:scale-95 flex flex-col justify-end ${
                isActive
                  ? 'border-blue-500 ring-2 ring-blue-500/30 shadow-md bg-blue-500/10'
                  : isDark
                  ? 'border-[#333842] hover:border-gray-500 bg-[#1C1F24]'
                  : 'border-gray-200 hover:border-gray-300 bg-white shadow-sm'
              }`}
            >
              {/* Photo Container */}
              <div className="relative w-full aspect-square sm:h-28 overflow-hidden bg-gray-900">
                <img
                  src={cat.imageUrl}
                  alt={cat.name}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  onError={(e) => {
                    // Fallback image if network blocked
                    (e.target as HTMLImageElement).src =
                      'https://images.unsplash.com/photo-1542838132-92c53300491e?w=300&auto=format&fit=crop&q=80';
                  }}
                />

                {/* Dark gradient overlay for text readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent" />

                {/* Top Badge: Item Count */}
                <div
                  className={`absolute top-1.5 ${
                    language === 'ar' ? 'left-1.5' : 'right-1.5'
                  } px-2 py-0.5 rounded-full text-[10px] font-bold font-mono shadow-md backdrop-blur-md transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'bg-black/75 text-gray-200 border border-white/20'
                  }`}
                >
                  {cat.count} {language === 'ar' ? 'صنف' : 'items'}
                </div>

                {/* Top-Start Check Indicator if Active */}
                {isActive && (
                  <div
                    className={`absolute top-1.5 ${
                      language === 'ar' ? 'right-1.5' : 'left-1.5'
                    } w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center shadow-md animate-scale-in`}
                    title={language === 'ar' ? 'الفئة المفتوحة حالياً' : 'Active Category'}
                  >
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                )}

                {/* Bottom Overlay Info */}
                <div className="absolute bottom-0 inset-x-0 p-2 sm:p-2.5 text-right rtl:text-right ltr:text-left z-10">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <p className="text-[11px] sm:text-xs font-bold text-white truncate drop-shadow-sm leading-tight">
                      {language === 'ar' ? cat.name : cat.nameEn || cat.name}
                    </p>
                  </div>
                  <div className="flex items-center justify-between text-[9px] sm:text-[10px] font-mono text-gray-300">
                    <span className="truncate">{cat.totalQty} {language === 'ar' ? 'قطعة' : 'pcs'}</span>
                    <span className="font-bold text-emerald-400">{cat.subtotal.toFixed(0)} {language === 'ar' ? 'ج.م' : 'EGP'}</span>
                  </div>
                </div>
              </div>

              {/* Status bar underneath photo */}
              <div
                className={`py-1 px-1.5 text-center text-[10px] font-bold transition-colors flex items-center justify-center gap-1 ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : isDark
                    ? 'bg-[#262A31] text-[#9AA1AC] group-hover:text-white'
                    : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200'
                }`}
              >
                {isActive ? (
                  <>
                    <ChevronUp className="w-3 h-3 shrink-0" />
                    <span>{language === 'ar' ? 'موسعة (اضغط للطي)' : 'Expanded (Collapse)'}</span>
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3 h-3 shrink-0" />
                    <span>{language === 'ar' ? 'اضغط لتوسيع الأصناف' : 'Click to expand'}</span>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Active Category Header Bar if a category is filtered */}
      {activeCategory && (
        <div
          id="active-category-banner"
          className={`p-2.5 sm:p-3 rounded-xl border flex items-center justify-between gap-2 transition-all ${
            isDark
              ? 'bg-[#1C1F24] border-blue-500/40 text-[#F5F6F7]'
              : 'bg-blue-50/60 border-blue-200 text-gray-900'
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Category thumbnail */}
            <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 border border-blue-500/30">
              <img
                src={getCategoryInfo(activeCategory).imageUrl}
                alt={activeCategory}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold truncate">
                  {language === 'ar'
                    ? `أصناف فئة: ${activeCategory}`
                    : `Category: ${getCategoryInfo(activeCategory).nameEn || activeCategory}`}
                </span>
                <span
                  className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-bold ${
                    isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-700'
                  }`}
                >
                  {categoryGroups.find((g) => g.name === activeCategory)?.count || 0} {language === 'ar' ? 'صنف' : 'items'}
                </span>
              </div>
              <p className={`text-[10px] truncate ${isDark ? 'text-[#9AA1AC]' : 'text-gray-500'}`}>
                {language === 'ar'
                  ? `إجمالي قيمة أصناف هذه الفئة: ${
                      categoryGroups.find((g) => g.name === activeCategory)?.subtotal.toFixed(2) || '0.00'
                    } ج.م`
                  : `Category Subtotal: ${
                      categoryGroups.find((g) => g.name === activeCategory)?.subtotal.toFixed(2) || '0.00'
                    } EGP`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {onOpenAddModal && (
              <button
                type="button"
                id="btn-add-to-category"
                onClick={() => onOpenAddModal(activeCategory)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors ${
                  isDark
                    ? 'bg-blue-600 hover:bg-blue-500 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
                title={language === 'ar' ? 'إضافة صنف جديد لهذه الفئة' : 'Add item to this category'}
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{language === 'ar' ? 'إضافة صنف' : 'Add Item'}</span>
              </button>
            )}

            <button
              type="button"
              id="btn-close-category-filter"
              onClick={() => {
                soundService.playClick();
                onSelectCategory(null);
              }}
              className={`px-2 py-1.5 rounded-lg text-xs font-bold transition-colors border ${
                isDark
                  ? 'bg-[#262A31] border-[#333842] text-gray-300 hover:text-white'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-100'
              }`}
            >
              {language === 'ar' ? 'عرض الكل' : 'All'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
