import React, { useState, useEffect } from 'react';
import { PosSale, Customer, LineItem } from '../../types';
import { storageService } from '../../services/storage';
import { soundService } from '../../services/sound';
import { useApp } from '../../context/AppContext';
import { CustomerPicker } from '../common/CustomerPicker';
import { LineItemEditor } from '../common/LineItemEditor';
import { NumericKeypad, AuthGate, NetworkStatusBadge } from '../ui';
import { GET_SAMPLE_20_LINE_ITEMS } from '../../data/mockData';
import { calculateDocumentTotals, DEFAULT_VAT_RATE } from '../../utils/pricing';
import {
  ShoppingCart,
  Printer,
  CreditCard,
  Banknote,
  Receipt,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Filter,
  Trash2,
  Check,
  RotateCcw,
  Scan,
  Package,
  History,
  Store,
  X,
  Share2,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export const PosScreen: React.FC = () => {
  const { language, theme, currentUser, showToast, refreshPendingCount, pendingSyncCount, isOnline, openReceipt, openScanner, registerScannerHandler, setHideBottomNav, printerSettings } = useApp();
  const [view, setView] = useState<'terminal' | 'history'>('terminal');
  const [sales, setSales] = useState<PosSale[]>([]);
  const isDark = theme === 'dark';
  const isRtl = language === 'ar';

  // Filters state for History screen
  const [showFilters, setShowFilters] = useState(false);
  const [filterReceiptNo, setFilterReceiptNo] = useState('');
  const [filterPaymentMethod, setFilterPaymentMethod] = useState<string>('all');

  // Terminal state
  const [customer, setCustomer] = useState<Customer>(() => {
    const custs = storageService.getCustomers();
    return custs.find(c => c.id === 'cust-walkin') || custs[0];
  });
  const [showCustomerPicker, setShowCustomerPicker] = useState(false);
  const [items, setItems] = useState<LineItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('cash');
  const [amountPaid, setAmountPaid] = useState<number>(0);

  // Payment Bottom Sheet & AuthGate state
  const [isPaymentSheetOpen, setIsPaymentSheetOpen] = useState(false);
  const [isAuthGateOpen, setIsAuthGateOpen] = useState(false);

  useEffect(() => {
    setHideBottomNav(isPaymentSheetOpen);
    return () => setHideBottomNav(false);
  }, [isPaymentSheetOpen, setHideBottomNav]);

  // Selected Sale for detail view
  const [selectedSale, setSelectedSale] = useState<PosSale | null>(null);

  useEffect(() => {
    loadSales();
  }, []);

  const loadSales = () => {
    setSales(storageService.getPosSales());
    refreshPendingCount();
  };

  // Live totals calculation
  const {
    grossTotal,
    totalDiscount,
    totalAfterDiscount,
    totalTax,
    netDue
  } = calculateDocumentTotals(items, DEFAULT_VAT_RATE, false);

  // Change due computation
  const changeDue = Math.max(0, (amountPaid || 0) - netDue);

  // When opening payment sheet or switching to card, sync amountPaid
  const openPaymentSheet = () => {
    if (items.length === 0) {
      soundService.playError();
      showToast(isRtl ? 'سلة المشتريات فارغة!' : 'Cart is empty!', 'error');
      return;
    }
    soundService.playClick();
    if (paymentMethod === 'card' || amountPaid === 0) {
      setAmountPaid(netDue);
    }
    setIsPaymentSheetOpen(true);
  };

  // Pre-payment validation and AuthGate trigger
  const handleInitiatePayment = () => {
    if (paymentMethod === 'cash') {
      if (amountPaid < netDue) {
        soundService.playError();
        showToast(
          isRtl
            ? `المبلغ المدفوع (${amountPaid.toFixed(2)}) أقل من الإجمالي المستحق (${netDue.toFixed(2)})`
            : `Paid amount (${amountPaid.toFixed(2)}) is less than total due (${netDue.toFixed(2)})`,
          'error'
        );
        return;
      }

      // Open AuthGate for cash movements
      setIsAuthGateOpen(true);
      return;
    }

    // Direct commit for Card payments
    commitSale();
  };

  // Final Commit to Storage
  const commitSale = () => {
    const saved = storageService.savePosSale({
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      customerId: customer.id,
      customerName: customer.name,
      customerTaxNumber: customer.taxNumber,
      cashierName: currentUser.displayName,
      terminalId: 'EDA50-01',
      paymentMethod,
      items,
      grossTotal,
      totalDiscount,
      totalTax,
      netDue,
      amountPaid: paymentMethod === 'cash' ? amountPaid : netDue,
      changeDue: paymentMethod === 'cash' ? changeDue : 0,
      status: 'completed'
    });

    soundService.playScanSuccess();
    showToast(
      isRtl
        ? `تم إتمام عملية البيع بنجاح: ${saved.receiptNumber}`
        : `Sale completed: ${saved.receiptNumber}`,
      'success'
    );

    // Open ESC/POS receipt for printing
    openReceipt(saved, 'pos');

    // Reset terminal for next transaction
    setIsPaymentSheetOpen(false);
    resetTerminal();
    loadSales();
  };

  const resetTerminal = () => {
    const custs = storageService.getCustomers();
    setCustomer(custs.find(c => c.id === 'cust-walkin') || custs[0]);
    setItems([]);
    setAmountPaid(0);
    setPaymentMethod('cash');
  };

  // Load sample 35 items for quick testing
  const loadSampleItems = () => {
    setItems(GET_SAMPLE_20_LINE_ITEMS());
    soundService.playScanSuccess();
    showToast(
      isRtl
        ? 'تم تحميل أصناف تجريبية في سلة نقطة البيع'
        : 'Loaded sample items into POS cart',
      'success'
    );
  };

  // Fast barcode scan handler for Honeywell physical scanner and camera
  const handleProcessCode = (scannedCode: string) => {
    const trimmed = scannedCode.trim();
    if (!trimmed) return;
    const products = storageService.getProducts();
    const found = products.find(p => p.code === trimmed || p.barcode === trimmed);

    if (found) {
      setItems(prev => {
        const existingIdx = prev.findIndex(it => it.productId === found.id);
        if (existingIdx >= 0) {
          const updated = [...prev];
          const newQty = updated[existingIdx].enteredQty + 1;
          updated[existingIdx] = {
            ...updated[existingIdx],
            enteredQty: newQty,
            lineTotal: newQty * updated[existingIdx].unitPrice
          };
          return updated;
        } else {
          const newLineItem: LineItem = {
            id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            productId: found.id,
            code: found.code,
            name: found.name,
            nameEn: found.nameEn,
            unit: found.unit || 'حبة',
            unitEn: found.unitEn || 'pcs',
            shelfNumber: found.shelfNumber || 'A-01',
            availableQty: found.availableQty || 100,
            enteredQty: 1,
            unitPrice: found.unitPrice,
            discount: 0,
            discountType: 'percentage',
            lineTotal: found.unitPrice,
            imageUrl: found.imageUrl,
            category: found.category
          };
          return [...prev, newLineItem];
        }
      });
      soundService.playScanSuccess();
      showToast(isRtl ? `تمت إضافة: ${found.name}` : `Added: ${found.name}`, 'success');
    } else {
      soundService.playError();
      showToast(isRtl ? `الرمز ${trimmed} غير موجود بالمخزن` : `Item ${trimmed} not found`, 'error');
    }
  };

  useEffect(() => {
    return registerScannerHandler(handleProcessCode);
  });

  // Open Barcode Scanner with product matching callback
  const handleScanBarcode = () => {
    openScanner(handleProcessCode);
  };

  const filteredSales = sales.filter((s) => {
    if (filterReceiptNo && !s.receiptNumber.toLowerCase().includes(filterReceiptNo.toLowerCase())) return false;
    if (filterPaymentMethod !== 'all' && s.paymentMethod !== filterPaymentMethod) return false;
    return true;
  });

  return (
    <div
      id="pos-screen"
      className={`flex-1 flex flex-col min-h-0 ${
        isDark ? 'bg-[#121417] text-[#F5F6F7]' : 'bg-[#F9FAFB] text-gray-900'
      }`}
    >
      {/* Top Header: Network / Dedicated Offline Queue Badge & View Switcher */}
      <div
        className={`p-3 sm:px-6 border-b shrink-0 ${
          isDark ? 'border-[#333842] bg-[#1C1F24]' : 'border-gray-200 bg-white'
        }`}
      >
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Universal 3-state Offline Queue Badge */}
            <NetworkStatusBadge
              isOnline={isOnline}
              pendingCount={pendingSyncCount}
              language={language}
            />

            <span className={`text-xs sm:text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {view === 'terminal'
                ? (isRtl ? 'نقطة البيع السريع (POS)' : 'Quick POS Terminal')
                : (isRtl ? 'سجل عمليات البيع' : 'POS Sales History')}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {sales.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  soundService.playClick();
                  openReceipt(sales[0], 'pos');
                }}
                className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-colors min-h-[44px] ${
                  isDark
                    ? 'border-[#333842] bg-[#262A31] text-emerald-400 hover:text-emerald-300'
                    : 'border-gray-200 bg-gray-50 text-emerald-600 hover:bg-gray-100'
                }`}
                title={isRtl ? 'إعادة طباعة آخر إيصال' : 'Reprint Last Receipt'}
              >
                <Printer className="w-4 h-4" />
                <span className="hidden sm:inline">{isRtl ? 'آخر إيصال' : 'Last Receipt'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                soundService.playClick();
                setView(view === 'terminal' ? 'history' : 'terminal');
              }}
              className={`px-3.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-colors min-h-[44px] ${
                view === 'history'
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : isDark
                  ? 'border-[#333842] bg-[#262A31] text-gray-300 hover:text-white'
                  : 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100'
              }`}
            >
              {view === 'terminal' ? (
                <>
                  <History className="w-4 h-4" />
                  <span>{isRtl ? 'السجل' : 'History'}</span>
                </>
              ) : (
                <>
                  <Store className="w-4 h-4" />
                  <span>{isRtl ? 'نقطة البيع' : 'Terminal'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* TERMINAL VIEW */}
      {/* ========================================================= */}
      {view === 'terminal' ? (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
          <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
            {/* Main Cart & Scanner Section */}
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
              {/* Customer Selection Ribbon */}
              <div
                className={`px-3 sm:px-6 py-2 border-b flex items-center justify-between text-xs shrink-0 ${
                  isDark ? 'bg-[#181B20] border-[#333842]' : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`text-[11px] ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    {isRtl ? 'العميل:' : 'Customer:'}
                  </span>
                  <span className={`font-bold truncate text-xs ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {customer.name}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setShowCustomerPicker(!showCustomerPicker)}
                  className="text-blue-500 hover:underline text-[11px] font-bold min-h-[44px] flex items-center"
                >
                  {showCustomerPicker
                    ? (isRtl ? 'إغلاق' : 'Close')
                    : (isRtl ? 'تغيير العميل' : 'Change')}
                </button>
              </div>

              {/* Customer Picker Dropdown (Collapsible) */}
              {showCustomerPicker && (
                <div
                  className={`p-3 sm:px-6 border-b shadow-lg animate-in slide-in-from-top-2 duration-150 ${
                    isDark ? 'bg-[#1C1F24] border-[#333842]' : 'bg-white border-gray-200'
                  }`}
                >
                  <CustomerPicker
                    selectedCustomer={customer}
                    onSelectCustomer={(c) => {
                      setCustomer(c);
                      setShowCustomerPicker(false);
                      soundService.playClick();
                    }}
                  />
                </div>
              )}

              {/* Action Ribbon: Barcode Scanner & Sample Items */}
              <div
                className={`p-2.5 sm:px-6 border-b flex items-center justify-between gap-2 shrink-0 ${
                  isDark ? 'bg-[#1C1F24] border-[#333842]' : 'bg-white border-gray-200'
                }`}
              >
                <button
                  type="button"
                  onClick={handleScanBarcode}
                  className={`flex-1 h-11 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all min-h-[44px] ${
                    isDark
                      ? 'bg-blue-600 hover:bg-blue-500 text-white'
                      : 'bg-[#252B37] hover:bg-[#1E232D] text-white shadow-sm'
                  }`}
                >
                  <Scan className="w-4 h-4" />
                  <span>{isRtl ? 'فتح الماسح (الكاميرا)' : 'Scan Barcode'}</span>
                </button>

                <button
                  type="button"
                  onClick={loadSampleItems}
                  className={`px-3.5 h-11 rounded-xl border text-xs font-bold flex items-center gap-1 transition-colors min-h-[44px] ${
                    isDark
                      ? 'border-[#333842] bg-[#262A31] text-gray-300 hover:text-white'
                      : 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100'
                  }`}
                  title={isRtl ? 'تحميل أصناف للتجربة' : 'Load sample items'}
                >
                  <Package className="w-4 h-4" />
                  <span className="hidden sm:inline">{isRtl ? 'أصناف تجريبية' : 'Samples'}</span>
                </button>

                {items.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(isRtl ? 'تفريغ السلة؟' : 'Clear cart?')) {
                        setItems([]);
                        soundService.playClick();
                      }
                    }}
                    className={`p-2.5 rounded-xl border text-red-500 hover:bg-red-500/10 min-h-[44px] min-w-[44px] flex items-center justify-center ${
                      isDark ? 'border-red-500/30' : 'border-red-200'
                    }`}
                    title={isRtl ? 'تفريغ السلة' : 'Clear'}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Cart Items Area with Photo 2 Cards & Steppers */}
              <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-3 pb-28 lg:pb-6">
                <LineItemEditor
                  items={items}
                  onChangeItems={(newItems) => setItems(newItems)}
                />
              </div>
            </div>

            {/* Tablet & Desktop Side Checkout Panel (hidden on mobile, visible on lg:) */}
            <div
              className={`hidden lg:flex w-80 xl:w-96 border-s flex-col justify-between p-5 shrink-0 ${
                isDark ? 'bg-[#1C1F24] border-[#333842]' : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-inherit">
                  <span className={`font-bold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {isRtl ? 'ملخص نقطة البيع' : 'Order Summary'}
                  </span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-bold">
                    {items.length} {isRtl ? 'أصناف' : 'items'}
                  </span>
                </div>

                {/* Customer card */}
                <div className={`p-3 rounded-xl border text-xs space-y-1 ${
                  isDark ? 'bg-[#121417] border-[#333842]' : 'bg-white border-gray-200 shadow-xs'
                }`}>
                  <span className="text-[10px] text-gray-500 block">{isRtl ? 'العميل المحدد:' : 'Customer:'}</span>
                  <div className={`font-bold text-sm truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{customer.name}</div>
                  <div className="text-gray-400 text-[11px] font-mono">{customer.phone}</div>
                </div>

                {/* Financial Summary */}
                <div className="space-y-2 text-xs pt-2">
                  <div className="flex justify-between text-gray-400">
                    <span>{isRtl ? 'إجمالي الأصناف:' : 'Gross Total:'}</span>
                    <span className="font-mono">{grossTotal.toFixed(2)} {isRtl ? 'ج.م' : 'EGP'}</span>
                  </div>
                  {totalDiscount > 0 && (
                    <div className="flex justify-between text-emerald-400">
                      <span>{isRtl ? 'الخصم:' : 'Discount:'}</span>
                      <span className="font-mono">-{totalDiscount.toFixed(2)} {isRtl ? 'ج.م' : 'EGP'}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-gray-400">
                    <span>{isRtl ? 'ضريبة القيمة المضافة (14%):' : 'VAT (14%):'}</span>
                    <span className="font-mono">{totalTax.toFixed(2)} {isRtl ? 'ج.م' : 'EGP'}</span>
                  </div>
                  <div className="pt-3 border-t border-inherit flex justify-between items-baseline">
                    <span className={`font-bold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>{isRtl ? 'الصافي المستحق:' : 'Total Due:'}</span>
                    <span className="font-mono font-extrabold text-2xl text-blue-500">{netDue.toFixed(2)} {isRtl ? 'ج.م' : 'EGP'}</span>
                  </div>
                </div>
              </div>

              {/* Checkout Button */}
              <div className="pt-4">
                <button
                  type="button"
                  id="pos-complete-sale-desktop-btn"
                  onClick={openPaymentSheet}
                  disabled={items.length === 0}
                  className="w-full h-14 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-40 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg active:scale-98 min-h-[48px]"
                >
                  <Banknote className="w-5 h-5" />
                  <span>{isRtl ? 'دفع وتحصيل' : 'Checkout & Pay'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Sticky Checkout Bar for Mobile / Handheld (hidden on lg:) */}
          <div
            id="pos-terminal-checkout-bar"
            className={`lg:hidden sticky bottom-0 z-20 p-3 border-t shadow-2xl flex items-center justify-between gap-3 shrink-0 ${
              isDark ? 'bg-[#1C1F24] border-[#333842]' : 'bg-white border-gray-200'
            }`}
          >
            <div>
              <span className="text-[10px] uppercase tracking-wider text-gray-400 font-bold block">
                {isRtl ? `إجمالي السلة (${items.length} أصناف)` : `Cart Total (${items.length})`}
              </span>
              <div className="flex items-baseline gap-1">
                <span className={`text-2xl font-bold font-mono tabular-nums tracking-tight ${
                  isDark ? 'text-[#38BDF8]' : 'text-blue-600'
                }`}>
                  {netDue.toFixed(2)}
                </span>
                <span className="text-xs text-gray-400 font-bold">
                  {isRtl ? 'ج.م' : 'EGP'}
                </span>
              </div>
            </div>

            <button
              type="button"
              id="pos-complete-sale-btn"
              onClick={openPaymentSheet}
              disabled={items.length === 0}
              className="flex-1 h-14 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-40 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg active:scale-98 min-h-[48px]"
            >
              <Banknote className="w-5 h-5" />
              <span>
                {isRtl ? 'دفع وتحصيل' : 'Checkout & Pay'}
              </span>
            </button>
          </div>

          {/* ========================================================= */}
          {/* PAYMENT BOTTOM SHEET MODAL */}
          {/* ========================================================= */}
          {isPaymentSheetOpen && (
            <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm select-none animate-in fade-in duration-150">
              <div
                className={`w-full max-w-md rounded-t-3xl sm:rounded-2xl border shadow-2xl flex flex-col max-h-[90vh] overflow-hidden ${
                  isDark ? 'bg-[#1C1F24] border-[#333842] text-[#F5F6F7]' : 'bg-white border-gray-200 text-gray-900'
                }`}
              >
                {/* Modal Header */}
                <div
                  className={`p-3.5 border-b flex items-center justify-between ${
                    isDark ? 'border-[#333842] bg-[#262A31]' : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Banknote className="w-5 h-5 text-emerald-500" />
                    <span className="font-bold text-sm">
                      {isRtl ? 'طريقة السداد والتحصيل' : 'Payment & Checkout'}
                    </span>
                  </div>
                  <button
                    onClick={() => setIsPaymentSheetOpen(false)}
                    className={`p-1.5 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center ${
                      isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-black'
                    }`}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Modal Body */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
                  {/* Total Net Due Card */}
                  <div
                    className={`p-3 rounded-2xl border flex items-center justify-between font-mono ${
                      isDark ? 'bg-[#121417] border-[#333842]' : 'bg-blue-50 border-blue-200'
                    }`}
                  >
                    <span className="text-gray-500 font-sans font-bold">
                      {isRtl ? 'المبلغ المطلوب سداده:' : 'Total Due:'}
                    </span>
                    <span className="text-xl font-bold text-blue-500">
                      {netDue.toFixed(2)} {isRtl ? 'ج.م' : 'EGP'}
                    </span>
                  </div>

                  {/* Payment Mode Selector */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        soundService.playClick();
                        setPaymentMethod('cash');
                      }}
                      className={`h-12 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border transition-all min-h-[44px] ${
                        paymentMethod === 'cash'
                          ? 'bg-emerald-600 border-emerald-500 text-white shadow-md ring-2 ring-emerald-400 ring-offset-1'
                          : isDark
                          ? 'bg-[#121417] border-[#333842] text-gray-400'
                          : 'bg-gray-100 border-gray-200 text-gray-700'
                      }`}
                    >
                      <Banknote className="w-4 h-4" />
                      <span>{isRtl ? 'سداد نقدي (كاش)' : 'Cash Payment'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        soundService.playClick();
                        setPaymentMethod('card');
                        setAmountPaid(netDue);
                      }}
                      className={`h-12 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border transition-all min-h-[44px] ${
                        paymentMethod === 'card'
                          ? 'bg-blue-600 border-blue-500 text-white shadow-md ring-2 ring-blue-400 ring-offset-1'
                          : isDark
                          ? 'bg-[#121417] border-[#333842] text-gray-400'
                          : 'bg-gray-100 border-gray-200 text-gray-700'
                      }`}
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>{isRtl ? 'بطاقة / مدى' : 'Card Payment'}</span>
                    </button>
                  </div>

                  {/* Cash Numeric Keypad & Live Change Calculation */}
                  {paymentMethod === 'cash' && (
                    <div className="space-y-3 pt-1">
                      <div className="flex items-center justify-between">
                        <span className={`text-[11px] font-bold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          {isRtl ? 'المبلغ المستلم من العميل نقداً:' : 'Cash Received from Customer:'}
                        </span>
                        <button
                          type="button"
                          onClick={() => setAmountPaid(netDue)}
                          className="text-[11px] font-bold text-emerald-500 hover:underline min-h-[44px] flex items-center"
                        >
                          {isRtl ? 'المبلغ بالضبط' : 'Exact Amount'}
                        </button>
                      </div>

                      <NumericKeypad
                        value={amountPaid}
                        onChange={(val) => setAmountPaid(val)}
                        totalRequired={netDue}
                        mode="payment"
                        quickPresets={[50, 100, 200, 500]}
                        currency={isRtl ? 'ج.م' : 'EGP'}
                        language={language}
                      />
                    </div>
                  )}

                  {paymentMethod === 'card' && (
                    <div
                      className={`p-4 rounded-2xl border text-center space-y-2 ${
                        isDark ? 'bg-[#121417] border-[#333842]' : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <CreditCard className="w-8 h-8 mx-auto text-blue-500" />
                      <div className={`font-bold text-xs ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {isRtl ? 'الدفع عبر جهاز نقاط البيع / البطاقة' : 'Card Payment Terminal'}
                      </div>
                      <p className="text-[11px] text-gray-500">
                        {isRtl
                          ? 'قم بتمرير البطاقة أو إدخالها في جهاز الدفع المحمول ثم اضغط تأكيد.'
                          : 'Swipe or insert card on the mobile reader and press confirm.'}
                      </p>
                    </div>
                  )}
                </div>

                {/* Modal Footer CTA */}
                <div
                  className={`p-3.5 border-t grid grid-cols-2 gap-2 ${
                    isDark ? 'border-[#333842] bg-[#262A31]' : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setIsPaymentSheetOpen(false)}
                    className={`h-12 border rounded-xl font-bold text-xs transition-colors min-h-[44px] ${
                      isDark ? 'border-[#333842] text-gray-300 hover:bg-[#333842]' : 'border-gray-300 text-gray-700 bg-white'
                    }`}
                  >
                    {isRtl ? 'إلغاء' : 'Cancel'}
                  </button>

                  <button
                    type="button"
                    onClick={handleInitiatePayment}
                    className="h-12 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-98 min-h-[44px]"
                  >
                    <Check className="w-4 h-4" />
                    <span>{isRtl ? 'تأكيد البيع وطباعة' : 'Confirm & Print'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* AuthGate PIN Modal for Cash Movements */}
          <AuthGate
            isOpen={isAuthGateOpen}
            onClose={() => {
              setIsAuthGateOpen(false);
              showToast(isRtl ? 'تم إلغاء تأكيد العملية النقدية' : 'Cash transaction cancelled', 'info');
            }}
            onSuccess={() => {
              setIsAuthGateOpen(false);
              commitSale();
            }}
            amount={amountPaid}
            currency={isRtl ? 'ج.م' : 'EGP'}
            title={isRtl ? 'تأكيد عملية التحصيل النقدي' : 'Confirm Cash Collection'}
            description={
              isRtl
                ? `أدخل رمز PIN لتسجيل تحصيل مبلغ ${amountPaid.toLocaleString()} ج.م في عهدة نقطة البيع`
                : `Enter PIN to register ${amountPaid.toLocaleString()} EGP in POS custody`
            }
          />
        </div>
      ) : (
        /* ========================================================= */
        /* POS SALES HISTORY LIST */
        /* ========================================================= */
        <div className="flex-1 flex flex-col min-h-0 relative">
          {/* Action & Filter Bar */}
          <div
            className={`p-3 border-b flex items-center justify-between gap-2 shrink-0 ${
              isDark ? 'border-[#333842] bg-[#1C1F24]' : 'border-gray-200 bg-white'
            }`}
          >
            <div className="flex-1">
              <input
                type="text"
                value={filterReceiptNo}
                onChange={(e) => setFilterReceiptNo(e.target.value)}
                placeholder={isRtl ? 'ابحث برقم الإيصال (POS-...)' : 'Search receipt #...'}
                className={`w-full h-11 px-3 rounded-xl border text-xs outline-none font-mono ${
                  isDark ? 'border-[#333842] bg-[#121417] text-white' : 'border-gray-200 bg-gray-50 text-gray-900'
                }`}
              />
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`h-11 px-3 rounded-xl border flex items-center gap-1.5 text-xs font-semibold min-h-[44px] ${
                showFilters
                  ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                  : isDark
                  ? 'border-[#333842] bg-[#262A31] text-gray-300'
                  : 'border-gray-200 bg-white text-gray-700'
              }`}
            >
              <Filter className="w-4 h-4" />
              <span>{isRtl ? 'تصفية' : 'Filter'}</span>
            </button>
          </div>

          {/* Filter options */}
          {showFilters && (
            <div
              className={`p-3 border-b flex items-center gap-2 text-xs ${
                isDark ? 'bg-[#181B20] border-[#333842]' : 'bg-gray-50 border-gray-200'
              }`}
            >
              <span className="text-gray-400">{isRtl ? 'طريقة الدفع:' : 'Method:'}</span>
              {['all', 'cash', 'card'].map((m) => (
                <button
                  key={m}
                  onClick={() => setFilterPaymentMethod(m)}
                  className={`px-3 py-1 rounded-full text-[11px] font-bold transition-colors ${
                    filterPaymentMethod === m
                      ? 'bg-blue-600 text-white'
                      : isDark
                      ? 'bg-[#262A31] text-gray-400'
                      : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  {m === 'all' ? (isRtl ? 'الكل' : 'All') : m === 'cash' ? (isRtl ? 'نقدي' : 'Cash') : (isRtl ? 'بطاقة' : 'Card')}
                </button>
              ))}
            </div>
          )}

          {/* History List */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-5 pb-20">
            <div className="max-w-7xl mx-auto w-full">
              {filteredSales.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center text-gray-400 space-y-3">
                  <Receipt className="w-12 h-12 opacity-30 stroke-[1.5]" />
                  <div className="font-bold text-sm">
                    {isRtl ? 'لا توجد عمليات بيع مسجلة' : 'No POS sales recorded'}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                  {filteredSales.map((sale) => (
                    <div
                      key={sale.id}
                      onClick={() => {
                        soundService.playClick();
                        setSelectedSale(sale);
                      }}
                      className={`p-3.5 rounded-2xl border shadow-sm cursor-pointer select-none active:scale-[0.99] transition-all space-y-2 flex flex-col justify-between ${
                        isDark
                          ? 'bg-[#1C1F24] border-[#333842] hover:border-blue-500/50'
                          : 'bg-white border-gray-200 hover:border-blue-300 shadow-sm'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-xs text-blue-500">
                          {sale.receiptNumber}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            sale.paymentMethod === 'cash'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-blue-500/20 text-blue-400'
                          }`}
                        >
                          {sale.paymentMethod === 'cash' ? (isRtl ? 'نقدي' : 'Cash') : (isRtl ? 'بطاقة' : 'Card')}
                        </span>
                      </div>

                      <div className="text-xs">
                        <div className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{sale.customerName}</div>
                        <div className="text-[11px] text-gray-500 flex justify-between mt-0.5">
                          <span>{sale.items.length} {isRtl ? 'أصناف' : 'items'}</span>
                          <span className="font-mono">{sale.date} • {sale.time}</span>
                        </div>
                      </div>

                      <div className={`pt-2 border-t flex items-center justify-between ${isDark ? 'border-[#333842]/50' : 'border-gray-100'}`}>
                        <span className="text-[11px] text-gray-500">{isRtl ? 'الإجمالي:' : 'Total:'}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sm text-blue-500">
                            {sale.netDue.toFixed(2)} {isRtl ? 'ج.م' : 'EGP'}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              soundService.playClick();
                              openReceipt(sale, 'pos');
                            }}
                            className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 transition-colors"
                            title={isRtl ? 'طباعة الإيصال' : 'Print Receipt'}
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sale Detail / Reprint Modal */}
          {selectedSale && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm select-none">
              <div
                className={`w-full max-w-sm rounded-2xl border shadow-2xl flex flex-col max-h-[85vh] overflow-hidden ${
                  isDark ? 'bg-[#1C1F24] border-[#333842] text-[#F5F6F7]' : 'bg-white border-gray-200 text-gray-900'
                }`}
              >
                <div
                  className={`p-3 border-b flex items-center justify-between ${
                    isDark ? 'border-[#333842] bg-[#262A31]' : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-emerald-500" />
                    <span className="font-bold text-sm">{selectedSale.receiptNumber}</span>
                  </div>
                  <button
                    onClick={() => setSelectedSale(null)}
                    className={`p-1 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center ${
                      isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-black'
                    }`}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs">
                  <div className="flex justify-between items-center pb-2 border-b border-inherit">
                    <span className="text-gray-500">{isRtl ? 'طريقة السداد:' : 'Payment:'}</span>
                    <span className="font-bold text-emerald-500">
                      {selectedSale.paymentMethod === 'cash' ? (isRtl ? 'نقدي' : 'Cash') : (isRtl ? 'بطاقة' : 'Card')}
                    </span>
                  </div>

                  <div>
                    <span className="text-gray-500 block text-[10px]">{isRtl ? 'العميل:' : 'Customer:'}</span>
                    <span className={`font-bold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedSale.customerName}</span>
                  </div>

                  {/* Items List */}
                  <div>
                    <span className={`font-bold text-xs block mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      {isRtl ? 'أصناف الإيصال:' : 'Receipt Items:'}
                    </span>
                    <div className="space-y-1.5">
                      {selectedSale.items.map((it, idx) => (
                        <div
                          key={idx}
                          className={`p-2.5 rounded-xl border flex justify-between items-center ${
                            isDark ? 'bg-[#121417] border-[#333842]' : 'bg-gray-50 border-gray-200'
                          }`}
                        >
                          <div>
                            <div className={`font-bold truncate max-w-[180px] ${isDark ? 'text-white' : 'text-gray-900'}`}>{it.name}</div>
                            <div className="text-[10px] font-mono text-gray-500">
                              {it.enteredQty} × {it.unitPrice.toFixed(2)}
                            </div>
                          </div>
                          <div className="font-mono font-bold text-blue-500">
                            {it.lineTotal.toFixed(2)} {isRtl ? 'ج.م' : 'EGP'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Totals */}
                  <div
                    className={`p-3 rounded-xl border space-y-1 font-mono text-[11px] ${
                      isDark ? 'bg-[#262A31] border-[#333842]' : 'bg-gray-100 border-gray-200'
                    }`}
                  >
                    <div className="flex justify-between">
                      <span className="text-gray-500">{isRtl ? 'المجموع المستحق:' : 'Total:'}</span>
                      <span className="font-bold text-sm text-blue-500">{selectedSale.netDue.toFixed(2)} {isRtl ? 'ج.م' : 'EGP'}</span>
                    </div>
                    {selectedSale.paymentMethod === 'cash' && (
                      <>
                        <div className="flex justify-between text-gray-500">
                          <span>{isRtl ? 'المبلغ المدفوع:' : 'Paid:'}</span>
                          <span>{selectedSale.amountPaid.toFixed(2)} {isRtl ? 'ج.م' : 'EGP'}</span>
                        </div>
                        <div className="flex justify-between text-emerald-500 font-bold">
                          <span>{isRtl ? 'المتبقي (الفكة):' : 'Change Due:'}</span>
                          <span>{selectedSale.changeDue.toFixed(2)} {isRtl ? 'ج.م' : 'EGP'}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Footer Quick Print Action */}
                <div
                  className={`p-3 border-t grid grid-cols-2 gap-2 ${
                    isDark ? 'border-[#333842] bg-[#262A31]' : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      openReceipt(selectedSale, 'pos');
                      setSelectedSale(null);
                    }}
                    className="h-11 min-h-[44px] bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                  >
                    <Printer className="w-4 h-4" />
                    <span>{isRtl ? 'إعادة طباعة' : 'Reprint'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      showToast(isRtl ? 'تم تجهيز الإيصال للمشاركة عبر واتساب' : 'Receipt ready for WhatsApp', 'info');
                      setSelectedSale(null);
                    }}
                    className={`h-11 min-h-[44px] border rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                      isDark ? 'border-[#333842] hover:bg-[#333842] text-gray-300' : 'border-gray-300 hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    <Share2 className="w-4 h-4" />
                    <span>{isRtl ? 'مشاركة واتساب' : 'WhatsApp'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
