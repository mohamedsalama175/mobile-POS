import React, { useState, useMemo } from 'react';
import { ProductItem, LineItem } from '../../types';
import { ItemThumbnail } from './ItemThumbnail';
import { soundService } from '../../services/sound';
import {
  X,
  Plus,
  Minus,
  AlertCircle,
  Check,
  Search,
  Scan,
  Package,
  Warehouse,
  Percent,
  Coins,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';

interface AddItemModalProps {
  isOpen: boolean;
  products: ProductItem[];
  language: 'ar' | 'en';
  isDark: boolean;
  isReturnMode?: boolean;
  categoryHint?: string;
  onClose: () => void;
  onAdd: (newItem: LineItem) => void;
  onOpenScanner?: (onScan: (code: string) => void) => void;
}

export const AddItemModal: React.FC<AddItemModalProps> = ({
  isOpen,
  products,
  language,
  isDark,
  isReturnMode = false,
  categoryHint,
  onClose,
  onAdd,
  onOpenScanner
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryTab, setSelectedCategoryTab] = useState<string>('all');
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null);
  const [qty, setQty] = useState<number>(1);
  const [price, setPrice] = useState<number>(0);
  const [discount, setDiscount] = useState<number>(0);
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('fixed');

  // Synchronize categoryHint when opened
  React.useEffect(() => {
    if (isOpen && categoryHint) {
      setSelectedCategoryTab(categoryHint);
    } else if (isOpen) {
      setSelectedCategoryTab('all');
    }
  }, [isOpen, categoryHint]);

  // Unique categories list
  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [products]);

  // Filter products by query and selected category tab
  const filteredProducts = useMemo(() => {
    let result = products;

    if (selectedCategoryTab !== 'all') {
      result = result.filter((p) => p.category === selectedCategoryTab);
    }

    const q = searchQuery.toLowerCase().trim();
    if (!q) return result;
    return result.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.nameEn && p.nameEn.toLowerCase().includes(q)) ||
        p.code.includes(q) ||
        p.barcode.includes(q) ||
        (p.category && p.category.toLowerCase().includes(q))
    );
  }, [products, searchQuery, selectedCategoryTab]);

  if (!isOpen) return null;

  const handleSelectProduct = (prod: ProductItem) => {
    soundService.playClick();
    setSelectedProduct(prod);
    setQty(1);
    setPrice(prod.unitPrice);
    setDiscount(prod.defaultDiscount || 0);
    setDiscountType('fixed');
  };

  const handleScanCode = (scannedCode: string) => {
    const trimmed = scannedCode.trim();
    if (!trimmed) return;
    const found = products.find((p) => p.code === trimmed || p.barcode === trimmed);
    if (found) {
      soundService.playScanSuccess();
      handleSelectProduct(found);
    } else {
      soundService.playError();
    }
  };

  // Calculations
  const gross = qty * price;
  const discountVal = discountType === 'percentage' ? (gross * discount) / 100 : discount;
  const netBeforeTax = Math.max(0, gross - discountVal);
  const vatAmount = Number((netBeforeTax * 0.15).toFixed(2));
  const lineTotal = Math.max(0, Number(netBeforeTax.toFixed(2)));

  const isStockExceeded = selectedProduct && !isReturnMode && qty > selectedProduct.availableQty;
  const isOutOfStock = selectedProduct && !isReturnMode && selectedProduct.availableQty <= 0;

  const handleConfirmAdd = () => {
    if (!selectedProduct || qty <= 0) return;
    soundService.playSuccess();

    const newItem: LineItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      productId: selectedProduct.id,
      code: selectedProduct.code,
      name: selectedProduct.name,
      nameEn: selectedProduct.nameEn,
      shelfNumber: selectedProduct.shelfNumber,
      unit: selectedProduct.unit,
      unitEn: selectedProduct.unitEn,
      availableQty: selectedProduct.availableQty,
      enteredQty: qty,
      unitPrice: price,
      discount,
      discountType,
      lineTotal,
      imageUrl: selectedProduct.imageUrl,
      category: selectedProduct.category
    };

    onAdd(newItem);
    handleResetAndClose();
  };

  const handleResetAndClose = () => {
    setSelectedProduct(null);
    setSearchQuery('');
    setQty(1);
    setPrice(0);
    setDiscount(0);
    onClose();
  };

  return (
    <div
      id="add-item-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleResetAndClose();
      }}
    >
      <div
        id="add-item-modal"
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
              className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold shadow-sm ${
                isDark ? 'bg-blue-600 text-white' : 'bg-[#252B37] text-white'
              }`}
            >
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-[#111827]'}`}>
                {language === 'ar' ? 'إضافة صنف جديد للطلب' : 'Add New Line Item'}
              </h3>
              <p className="text-[10px] text-gray-400">
                {selectedProduct
                  ? (language === 'ar' ? 'قم بتعبئة بيانات الكمية والسعر' : 'Fill quantity and price details')
                  : (language === 'ar' ? 'اختر الصنف من الدليل أو امسح الباركود' : 'Select item from catalog or scan')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleResetAndClose}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
              isDark
                ? 'text-gray-400 hover:text-white hover:bg-white/10'
                : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {!selectedProduct ? (
            /* STEP 1: Search & Product Selection */
            <div className="space-y-3">
              {/* Search + Scan Input */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={
                      language === 'ar'
                        ? 'ابحث بالاسم، الكود، أو الباركود...'
                        : 'Search by name, code, barcode...'
                    }
                    className={`w-full h-11 pr-10 pl-4 text-xs rounded-xl border outline-none transition-colors ${
                      isDark
                        ? 'border-[#333842] bg-[#121417] text-white focus:border-blue-500'
                        : 'border-gray-200 bg-gray-50 text-[#111827] focus:bg-white focus:border-[#252B37]'
                    }`}
                    autoFocus
                  />
                  <Search className={`w-4 h-4 absolute ${language === 'ar' ? 'right-3' : 'left-3'} top-3.5 text-gray-400`} />
                </div>

                {onOpenScanner && (
                  <button
                    type="button"
                    onClick={() => onOpenScanner(handleScanCode)}
                    className={`h-11 px-3.5 rounded-xl border flex items-center justify-center gap-1.5 text-xs font-bold transition-colors ${
                      isDark
                        ? 'bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border-blue-500/30'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-200'
                    }`}
                    title={language === 'ar' ? 'مسح الباركود بالكاميرا' : 'Scan barcode'}
                  >
                    <Scan className="w-4 h-4" />
                    <span>{language === 'ar' ? 'مسح' : 'Scan'}</span>
                  </button>
                )}
              </div>

              {/* Category Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                <button
                  type="button"
                  onClick={() => setSelectedCategoryTab('all')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold shrink-0 transition-colors ${
                    selectedCategoryTab === 'all'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : isDark
                      ? 'bg-[#1C1F24] border border-[#333842] text-[#9AA1AC] hover:text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {language === 'ar' ? 'الكل' : 'All'} ({products.length})
                </button>
                {availableCategories.map((cat) => {
                  const countInCat = products.filter((p) => p.category === cat).length;
                  const isSelected = selectedCategoryTab === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategoryTab(cat)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold shrink-0 transition-colors flex items-center gap-1 ${
                        isSelected
                          ? 'bg-blue-600 text-white shadow-sm'
                          : isDark
                          ? 'bg-[#1C1F24] border border-[#333842] text-[#9AA1AC] hover:text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <span>{cat}</span>
                      <span className="text-[10px] opacity-75 font-mono">({countInCat})</span>
                    </button>
                  );
                })}
              </div>

              {/* Products Catalog List */}
              <div className="space-y-2 max-h-[58vh] overflow-y-auto pr-1">
                {filteredProducts.length === 0 ? (
                  <div className="p-8 text-center text-gray-400 text-xs">
                    <Package className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                    <p>{language === 'ar' ? 'لم يتم العثور على أي صنف مطابق' : 'No matching items found'}</p>
                  </div>
                ) : (
                  filteredProducts.map((prod) => (
                    <button
                      key={prod.id}
                      type="button"
                      onClick={() => handleSelectProduct(prod)}
                      className={`w-full p-2.5 rounded-xl border flex items-center gap-3 text-left transition-all active:scale-98 group ${
                        isDark
                          ? 'border-[#333842] bg-[#121417] hover:bg-[#252932] hover:border-blue-500/50'
                          : 'border-gray-200 bg-white hover:bg-gray-50 shadow-sm'
                      }`}
                    >
                      <ItemThumbnail
                        src={prod.imageUrl}
                        name={prod.name}
                        size="md"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <span
                            className={`font-bold text-xs truncate transition-colors ${
                              isDark ? 'text-white group-hover:text-blue-400' : 'text-[#111827]'
                            }`}
                          >
                            {language === 'ar' ? prod.name : prod.nameEn || prod.name}
                          </span>
                          <span
                            className={`font-mono font-bold text-xs shrink-0 ${
                              isDark ? 'text-blue-400' : 'text-[#111827]'
                            }`}
                          >
                            {prod.unitPrice} ر.س
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-gray-500 mt-0.5">
                          <span className={`font-mono font-bold ${isDark ? 'text-blue-300' : 'text-gray-600'}`}>
                            #{prod.code}
                          </span>
                          <span>•</span>
                          <span>{language === 'ar' ? `الرف: ${prod.shelfNumber}` : `Shelf: ${prod.shelfNumber}`}</span>
                          <span>•</span>
                          <span
                            className={
                              prod.availableQty <= 0
                                ? 'text-red-500 font-bold'
                                : isDark
                                ? 'text-emerald-400'
                                : 'text-[#059669] font-medium'
                            }
                          >
                            {language === 'ar' ? `المتوفر: ${prod.availableQty}` : `Stock: ${prod.availableQty}`}
                          </span>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          ) : (
            /* STEP 2: Fill All Data for Selected Product */
            <div className="space-y-4">
              {/* Selected Product Banner with "Change" button */}
              <div
                className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                  isDark
                    ? 'border-blue-500/40 bg-blue-500/10'
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <ItemThumbnail
                    src={selectedProduct.imageUrl}
                    name={selectedProduct.name}
                    size="lg"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
                          isDark ? 'bg-blue-500/20 text-blue-300' : 'bg-gray-200 text-gray-700'
                        }`}
                      >
                        #{selectedProduct.code}
                      </span>
                      <h4 className={`font-bold text-xs truncate ${isDark ? 'text-white' : 'text-[#111827]'}`}>
                        {language === 'ar' ? selectedProduct.name : selectedProduct.nameEn || selectedProduct.name}
                      </h4>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-gray-500 mt-1">
                      <span>{language === 'ar' ? `الرف: ${selectedProduct.shelfNumber}` : `Shelf: ${selectedProduct.shelfNumber}`}</span>
                      <span>•</span>
                      <span>{language === 'ar' ? selectedProduct.unit : selectedProduct.unitEn || selectedProduct.unit}</span>
                    </div>
                    <div
                      className={`text-[11px] font-bold mt-0.5 ${
                        isDark ? 'text-emerald-400' : 'text-[#059669]'
                      }`}
                    >
                      {language === 'ar'
                        ? `المتوفر بالمخزن: ${selectedProduct.availableQty}`
                        : `Stock: ${selectedProduct.availableQty}`}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedProduct(null)}
                  className={`px-2.5 py-1.5 rounded-lg border text-xs font-bold shrink-0 transition-colors ${
                    isDark
                      ? 'border-[#333842] bg-[#1C1F24] hover:bg-[#252932] text-gray-300'
                      : 'border-gray-200 bg-white hover:bg-gray-100 text-gray-700 shadow-sm'
                  }`}
                >
                  {language === 'ar' ? 'تغيير الصنف' : 'Change'}
                </button>
              </div>

              {/* Stock Warning */}
              {isStockExceeded && (
                <div className="p-2.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-500 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>
                    {language === 'ar'
                      ? `تنبيه: الكمية المطلوبة (${qty}) تتجاوز الرصيد المتوفر بالمخزن (${selectedProduct.availableQty})`
                      : `Warning: Requested qty (${qty}) exceeds available stock (${selectedProduct.availableQty})`}
                  </span>
                </div>
              )}

              {/* Quantity Stepper & Manual Entry */}
              <div className="space-y-1.5">
                <label className={`text-xs font-bold flex items-center justify-between ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  <span>{language === 'ar' ? 'الكمية المطلوبة *' : 'Requested Quantity *'}</span>
                  <span className="text-[11px] text-gray-400 font-normal">
                    {language === 'ar' ? selectedProduct.unit : selectedProduct.unitEn || selectedProduct.unit}
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
                  {language === 'ar' ? 'سعر الوحدة (ر.س) *' : 'Unit Price (SAR) *'}
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
                  <span>{language === 'ar' ? 'ضريبة القيمة المضافة (15% تقديرية)' : 'VAT (15% est)'}:</span>
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
          )}
        </div>

        {/* Modal Footer Actions */}
        <div
          className={`p-3 border-t flex items-center gap-2 ${
            isDark ? 'border-[#333842] bg-[#16181D]' : 'border-gray-200 bg-white'
          }`}
        >
          <button
            type="button"
            onClick={handleResetAndClose}
            className={`flex-1 h-11 rounded-xl border font-bold text-xs transition-colors ${
              isDark
                ? 'border-[#333842] bg-[#262A31] hover:bg-[#323640] text-gray-300 hover:text-white'
                : 'border-gray-200 bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            {language === 'ar' ? 'إلغاء' : 'Cancel'}
          </button>

          {selectedProduct && (
            <button
              type="button"
              id="confirm-add-item-modal-button"
              onClick={handleConfirmAdd}
              className={`flex-1 h-11 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-colors active:scale-98 ${
                isDark
                  ? 'bg-blue-600 hover:bg-blue-500 text-white'
                  : 'bg-[#252B37] hover:bg-[#1E232D] text-white'
              }`}
            >
              <Check className="w-4 h-4" />
              <span>{language === 'ar' ? 'إضافة الصنف للطلب' : 'Add Item to Order'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
