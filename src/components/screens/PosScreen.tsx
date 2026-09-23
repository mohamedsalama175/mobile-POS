import React, { useState, useEffect } from 'react';
import { PosSale, Customer, LineItem } from '../../types';
import { storageService } from '../../services/storage';
import { soundService } from '../../services/sound';
import { useApp } from '../../context/AppContext';
import { GET_SAMPLE_20_LINE_ITEMS } from '../../data/mockData';
import { CustomerPicker } from '../common/CustomerPicker';
import { LineItemEditor } from '../common/LineItemEditor';
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
  Delete,
  Check,
  RotateCcw
} from 'lucide-react';

export const PosScreen: React.FC = () => {
  const { language, theme, currentUser, showToast, refreshPendingCount, openReceipt } = useApp();
  const [view, setView] = useState<'terminal' | 'list'>('terminal'); // Default straight to POS terminal
  const [sales, setSales] = useState<PosSale[]>([]);
  const isDark = theme === 'dark';

  // Filters state for List screen
  const [showFilters, setShowFilters] = useState(false);
  const [filterReceiptNo, setFilterReceiptNo] = useState('');
  const [filterPaymentMethod, setFilterPaymentMethod] = useState<string>('all');

  // Terminal state (§8.2)
  const [customer, setCustomer] = useState<Customer>(() => {
    const custs = storageService.getCustomers();
    return custs.find(c => c.id === 'cust-walkin') || custs[0];
  });
  const [showCustomerPicker, setShowCustomerPicker] = useState(false);
  const [items, setItems] = useState<LineItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('cash');
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [manualCashInput, setManualCashInput] = useState<string>('');

  useEffect(() => {
    loadSales();
  }, []);

  const loadSales = () => {
    setSales(storageService.getPosSales());
    refreshPendingCount();
  };

  // Centralized calculations (§3.6 & pricing utility)
  const {
    grossTotal,
    totalDiscount,
    totalAfterDiscount,
    totalTax,
    netDue
  } = calculateDocumentTotals(items, DEFAULT_VAT_RATE, false);

  // Change due computation
  const changeDue = Math.max(0, (amountPaid || 0) - netDue);

  // When netDue changes and payment is card, amountPaid matches exactly
  useEffect(() => {
    if (paymentMethod === 'card') {
      setAmountPaid(netDue);
      setManualCashInput(netDue > 0 ? netDue.toFixed(2) : '');
    }
  }, [paymentMethod, netDue]);

  // Complete & Print Handler (§8.2)
  const handleCompleteSale = () => {
    if (items.length === 0) {
      soundService.playError();
      showToast(language === 'ar' ? 'سلة المشتريات فارغة!' : 'Cart is empty!', 'error');
      return;
    }

    if (paymentMethod === 'cash' && amountPaid < netDue) {
      soundService.playError();
      showToast(
        language === 'ar'
          ? `المبلغ المدفوع (${amountPaid.toFixed(2)}) أقل من الإجمالي المستحق (${netDue.toFixed(2)})`
          : `Paid amount (${amountPaid.toFixed(2)}) is less than total (${netDue.toFixed(2)})`,
        'error'
      );
      return;
    }

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
      language === 'ar'
        ? `تم إتمام عملية البيع: ${saved.receiptNumber}`
        : `Sale completed: ${saved.receiptNumber}`,
      'success'
    );

    // Open ESC/POS receipt for Bluetooth printing
    openReceipt(saved, 'pos');

    // Reset terminal for next customer in retail line
    resetTerminal();
    loadSales();
  };

  const resetTerminal = () => {
    const custs = storageService.getCustomers();
    setCustomer(custs.find(c => c.id === 'cust-walkin') || custs[0]);
    setItems([]);
    setAmountPaid(0);
    setManualCashInput('');
    setPaymentMethod('cash');
  };

  const handleQuickCash = (val: number) => {
    soundService.playClick();
    const newPaid = Number(val.toFixed(2));
    setAmountPaid(newPaid);
    setManualCashInput(newPaid.toString());
  };

  const handleKeypadPress = (val: string) => {
    soundService.playClick();
    if (val === 'C') {
      setManualCashInput('');
      setAmountPaid(0);
      return;
    }
    if (val === 'DEL') {
      const nextStr = manualCashInput.slice(0, -1);
      setManualCashInput(nextStr);
      setAmountPaid(parseFloat(nextStr) || 0);
      return;
    }
    if (val === '.' && manualCashInput.includes('.')) {
      return;
    }
    const nextStr = manualCashInput + val;
    setManualCashInput(nextStr);
    setAmountPaid(parseFloat(nextStr) || 0);
  };

  const filteredSales = sales.filter((s) => {
    if (filterReceiptNo && !s.receiptNumber.toLowerCase().includes(filterReceiptNo.toLowerCase())) return false;
    if (filterPaymentMethod !== 'all' && s.paymentMethod !== filterPaymentMethod) return false;
    return true;
  });

  // ==========================================
  // VIEW: POS TERMINAL REGISTER (§8.2)
  // ==========================================
  if (view === 'terminal') {
    return (
      <div
        id="pos-terminal-screen"
        className={`flex-1 flex flex-col min-h-0 transition-colors ${
          isDark ? 'bg-[#121417] text-[#F5F6F7]' : 'bg-[#F9FAFB] text-gray-900'
        }`}
      >
        {/* Terminal Header */}
        <div
          className={`p-2.5 border-b flex items-center justify-between shrink-0 transition-colors ${
            isDark ? 'border-[#333842] bg-[#1C1F24]' : 'border-gray-200 bg-white'
          }`}
        >
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold shrink-0">
              <ShoppingCart className="w-4 h-4" />
            </div>
            <div>
              <h2 className={`text-xs font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {language === 'ar' ? 'نقطة البيع السريعة (POS)' : 'Rapid Retail POS'}
              </h2>
              <span className="text-[10px] text-gray-400 font-mono">
                {language === 'ar' ? `كاشير: ${currentUser.username.toUpperCase()}` : `Cashier: ${currentUser.username.toUpperCase()}`} | EDA50-01
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Quick Demo 35 Items Cart for testing category grid & swipe */}
            <button
              type="button"
              id="pos-load-demo-cart"
              onClick={() => {
                soundService.playScanSuccess();
                setItems(GET_SAMPLE_20_LINE_ITEMS());
                showToast(
                  language === 'ar'
                    ? 'تم تحميل 35 صنفاً مصنفاً (10 شيبسي + 15 شل + 10 عصائر)'
                    : 'Loaded 35 categorized items (Chipsy, Shell, Juices)',
                  'success'
                );
              }}
              className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold flex items-center gap-1.5 transition-colors shadow-sm ${
                isDark
                  ? 'border-blue-500/40 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300'
                  : 'border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700'
              }`}
              title={language === 'ar' ? 'تحميل 35 صنف مصنف لاختبار شبكة الفئات وسحب الكروت' : 'Load 35 categorized items demo'}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>{language === 'ar' ? '35 صنف تجريبي' : '35 Demo Items'}</span>
            </button>

            {/* Clear Cart Button */}
            {items.length > 0 && (
              <button
                type="button"
                id="pos-clear-cart-btn"
                onClick={() => {
                  soundService.playClick();
                  if (confirm(language === 'ar' ? 'هل تريد إفراغ سلة المشتريات بالكامل؟' : 'Clear entire cart?')) {
                    setItems([]);
                    setAmountPaid(0);
                    setManualCashInput('');
                  }
                }}
                className={`p-1.5 rounded-lg border text-red-400 hover:text-red-300 transition-colors ${
                  isDark ? 'border-red-500/30 bg-red-500/10' : 'border-red-200 bg-red-50'
                }`}
                title={language === 'ar' ? 'إفراغ السلة' : 'Clear Cart'}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            {/* Switch to Sales History */}
            <button
              type="button"
              id="pos-history-btn"
              onClick={() => {
                soundService.playClick();
                setView('list');
              }}
              className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold flex items-center gap-1 transition-colors ${
                isDark
                  ? 'border-[#333842] hover:bg-[#262A31] text-gray-300'
                  : 'border-gray-200 hover:bg-gray-100 text-gray-700'
              }`}
            >
              <Receipt className="w-3.5 h-3.5 text-blue-500" />
              <span>{language === 'ar' ? 'سجل العمليات' : 'History'}</span>
            </button>
          </div>
        </div>

        {/* Walk-in Customer Header Pill */}
        <div
          className={`px-3 py-2 border-b flex items-center justify-between text-xs transition-colors shrink-0 ${
            isDark ? 'border-[#333842] bg-[#181B20]' : 'border-gray-200 bg-gray-50'
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-gray-400">{language === 'ar' ? 'العميل:' : 'Customer:'}</span>
            <span className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{customer.name}</span>
            <span className="text-[10px] font-mono text-gray-400">({customer.taxNumber})</span>
          </div>

          <button
            type="button"
            id="change-pos-customer-btn"
            onClick={() => setShowCustomerPicker(!showCustomerPicker)}
            className="text-[11px] font-semibold text-blue-500 hover:underline"
          >
            {showCustomerPicker
              ? (language === 'ar' ? 'إخفاء' : 'Hide')
              : (language === 'ar' ? 'تغيير العميل' : 'Change')}
          </button>
        </div>

        {/* Optional Customer Picker Dropdown */}
        {showCustomerPicker && (
          <div className={`p-3 border-b shrink-0 ${isDark ? 'border-[#333842] bg-[#1C1F24]' : 'border-gray-200 bg-white'}`}>
            <CustomerPicker
              selectedCustomer={customer}
              onSelectCustomer={(c) => {
                setCustomer(c);
                setShowCustomerPicker(false);
              }}
            />
          </div>
        )}

        {/* Terminal Main Content Area */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3 pb-4">
          {/* Barcode Scanner & Line Items (§8.2) */}
          <div
            className={`rounded-2xl border p-3 transition-colors ${
              isDark ? 'border-[#333842] bg-[#1C1F24]' : 'border-gray-200 bg-white shadow-sm'
            }`}
          >
            <LineItemEditor
              items={items}
              onChangeItems={(newItems) => setItems(newItems)}
            />
          </div>

          {/* Payment Method & Cash Tender Keypad (§8.2) */}
          {items.length > 0 && (
            <div
              className={`rounded-2xl border p-3.5 space-y-3 transition-colors ${
                isDark ? 'border-[#333842] bg-[#1C1F24]' : 'border-gray-200 bg-white shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-xs font-bold ${isDark ? 'text-gray-300' : 'text-gray-800'}`}>
                  {language === 'ar' ? 'طريقة التحصيل والدفع' : 'Payment Method'}
                </span>
                <span className="text-xs font-mono font-bold text-blue-500">
                  {netDue.toFixed(2)} ر.س
                </span>
              </div>

              {/* Payment toggle */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  id="pos-pay-cash-btn"
                  onClick={() => {
                    soundService.playClick();
                    setPaymentMethod('cash');
                  }}
                  className={`h-12 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border transition-all ${
                    paymentMethod === 'cash'
                      ? 'bg-emerald-600 border-emerald-500 text-white shadow-md'
                      : isDark
                      ? 'bg-[#121417] border-[#333842] text-gray-400 hover:text-white'
                      : 'bg-gray-100 border-gray-200 text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Banknote className="w-4 h-4" />
                  <span>{language === 'ar' ? 'كاش (نقدي)' : 'Cash'}</span>
                </button>

                <button
                  type="button"
                  id="pos-pay-card-btn"
                  onClick={() => {
                    soundService.playClick();
                    setPaymentMethod('card');
                  }}
                  className={`h-12 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border transition-all ${
                    paymentMethod === 'card'
                      ? 'bg-blue-600 border-blue-500 text-white shadow-md'
                      : isDark
                      ? 'bg-[#121417] border-[#333842] text-gray-400 hover:text-white'
                      : 'bg-gray-100 border-gray-200 text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  <span>{language === 'ar' ? 'شبكة / مدى / بطاقة' : 'Card / Mada'}</span>
                </button>
              </div>

              {/* Cash Keypad & Quick tender chips */}
              {paymentMethod === 'cash' && (
                <div className={`space-y-3 pt-2 border-t ${isDark ? 'border-[#333842]/50' : 'border-gray-200'}`}>
                  {/* Quick Denominations */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] text-gray-400 w-full mb-0.5">
                      {language === 'ar' ? 'مبالغ نقدية سريعة:' : 'Quick cash tenders:'}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleQuickCash(netDue)}
                      className={`px-2.5 py-1.5 rounded-lg border font-mono text-xs font-bold transition-colors ${
                        amountPaid === netDue
                          ? 'bg-emerald-600 border-emerald-500 text-white'
                          : isDark
                          ? 'bg-[#262A31] border-[#333842] hover:border-emerald-500 text-white'
                          : 'bg-gray-100 border-gray-200 hover:border-emerald-500 text-gray-800'
                      }`}
                    >
                      {language === 'ar' ? 'المبلغ بالضبط' : 'Exact'} ({netDue.toFixed(2)})
                    </button>
                    {[20, 50, 100, 200, 500].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => handleQuickCash(amt)}
                        className={`px-2.5 py-1.5 rounded-lg border font-mono text-xs font-bold transition-colors ${
                          amountPaid === amt
                            ? 'bg-emerald-600 border-emerald-500 text-white'
                            : isDark
                            ? 'bg-[#262A31] border-[#333842] hover:border-emerald-500 text-white'
                            : 'bg-gray-100 border-gray-200 hover:border-emerald-500 text-gray-800'
                        }`}
                      >
                        {amt} ر.س
                      </button>
                    ))}
                  </div>

                  {/* Cash Paid input & Live Change due */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="text-[10px] text-gray-400 block mb-1 font-semibold">
                        {language === 'ar' ? 'المبلغ المستلم من العميل' : 'Cash Received'}
                      </label>
                      <input
                        id="pos-cash-received-input"
                        type="number"
                        step="0.5"
                        value={manualCashInput}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          setManualCashInput(e.target.value);
                          setAmountPaid(val);
                        }}
                        placeholder="0.00"
                        className={`w-full h-11 px-3 rounded-xl border font-mono font-bold text-sm outline-none transition-colors ${
                          isDark
                            ? 'border-[#333842] bg-[#121417] text-white focus:border-blue-500'
                            : 'border-gray-300 bg-white text-gray-900 focus:border-blue-500'
                        }`}
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-gray-400 block mb-1 font-semibold">
                        {language === 'ar' ? 'المتبقي للعميل (الفكة)' : 'Change Due'}
                      </label>
                      <div className="w-full h-11 px-3 rounded-xl border border-emerald-500/40 bg-emerald-500/10 text-emerald-500 font-mono font-bold text-sm flex items-center justify-end">
                        {changeDue.toFixed(2)} ر.س
                      </div>
                    </div>
                  </div>

                  {/* Built-in On-Screen Keypad for rugged touch screen */}
                  <div className="pt-2">
                    <span className="text-[10px] text-gray-400 block mb-1 font-semibold">
                      {language === 'ar' ? 'لوحة أرقام اللمس السريعة:' : 'Quick Touch Keypad:'}
                    </span>
                    <div className="grid grid-cols-4 gap-1.5">
                      {['7', '8', '9', 'C'].map((k) => (
                        <button
                          key={k}
                          type="button"
                          onClick={() => handleKeypadPress(k)}
                          className={`h-10 rounded-lg border font-mono font-bold text-xs flex items-center justify-center transition-colors active:scale-95 ${
                            k === 'C'
                              ? 'bg-rose-500/20 border-rose-500/40 text-rose-400 hover:bg-rose-500/30'
                              : isDark
                              ? 'bg-[#181B20] border-[#333842] text-gray-200 hover:bg-[#252830]'
                              : 'bg-gray-100 border-gray-200 text-gray-800 hover:bg-gray-200'
                          }`}
                        >
                          {k}
                        </button>
                      ))}
                      {['4', '5', '6', 'DEL'].map((k) => (
                        <button
                          key={k}
                          type="button"
                          onClick={() => handleKeypadPress(k)}
                          className={`h-10 rounded-lg border font-mono font-bold text-xs flex items-center justify-center transition-colors active:scale-95 ${
                            k === 'DEL'
                              ? 'bg-amber-500/20 border-amber-500/40 text-amber-400 hover:bg-amber-500/30'
                              : isDark
                              ? 'bg-[#181B20] border-[#333842] text-gray-200 hover:bg-[#252830]'
                              : 'bg-gray-100 border-gray-200 text-gray-800 hover:bg-gray-200'
                          }`}
                        >
                          {k === 'DEL' ? '⌫' : k}
                        </button>
                      ))}
                      {['1', '2', '3', '.'].map((k) => (
                        <button
                          key={k}
                          type="button"
                          onClick={() => handleKeypadPress(k)}
                          className={`h-10 rounded-lg border font-mono font-bold text-xs flex items-center justify-center transition-colors active:scale-95 ${
                            isDark
                              ? 'bg-[#181B20] border-[#333842] text-gray-200 hover:bg-[#252830]'
                              : 'bg-gray-100 border-gray-200 text-gray-800 hover:bg-gray-200'
                          }`}
                        >
                          {k}
                        </button>
                      ))}
                      {['0', '00', 'Exact', 'OK'].map((k) => (
                        <button
                          key={k}
                          type="button"
                          onClick={() => {
                            if (k === 'Exact') handleQuickCash(netDue);
                            else if (k === 'OK') handleCompleteSale();
                            else handleKeypadPress(k);
                          }}
                          className={`h-10 rounded-lg border font-mono font-bold text-xs flex items-center justify-center transition-colors active:scale-95 ${
                            k === 'OK'
                              ? 'bg-emerald-600 border-emerald-500 text-white'
                              : k === 'Exact'
                              ? 'bg-blue-600/20 border-blue-500/30 text-blue-400'
                              : isDark
                              ? 'bg-[#181B20] border-[#333842] text-gray-200 hover:bg-[#252830]'
                              : 'bg-gray-100 border-gray-200 text-gray-800 hover:bg-gray-200'
                          }`}
                        >
                          {k}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Big Grand Total & Instant Checkout Bottom Bar */}
        <div
          id="pos-terminal-checkout-bar"
          className={`p-3 border-t shadow-2xl flex items-center justify-between gap-3 shrink-0 transition-colors ${
            isDark ? 'bg-[#1C1F24] border-[#333842]' : 'bg-white border-gray-200'
          }`}
        >
          <div>
            <span className="text-[10px] uppercase tracking-wider text-gray-400 font-bold block">
              {language === 'ar' ? 'إجمالي السلة المستحق' : 'Cart Total'}
            </span>
            <div className="flex items-baseline gap-1">
              <span className={`text-2xl font-bold font-mono tabular-nums tracking-tight ${
                isDark ? 'text-[#38BDF8]' : 'text-blue-600'
              }`}>
                {netDue.toFixed(2)}
              </span>
              <span className="text-xs text-gray-400 font-bold">
                {language === 'ar' ? 'ر.س' : 'SAR'}
              </span>
            </div>
          </div>

          <button
            type="button"
            id="pos-complete-sale-btn"
            onClick={handleCompleteSale}
            disabled={items.length === 0}
            className="flex-1 h-14 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-40 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg active:scale-98"
          >
            <Printer className="w-4 h-4" />
            <span>
              {language === 'ar' ? 'إتمام وطباعة الإيصال' : 'Complete & Print'}
            </span>
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW: POS SALES HISTORY LIST (§8.1)
  // ==========================================
  return (
    <div
      id="pos-history-screen"
      className={`flex-1 flex flex-col min-h-0 transition-colors ${
        isDark ? 'bg-[#121417] text-[#F5F6F7]' : 'bg-[#F9FAFB] text-gray-900'
      }`}
    >
      {/* Header */}
      <div
        className={`p-3 border-b flex items-center justify-between transition-colors ${
          isDark ? 'border-[#333842] bg-[#1C1F24]' : 'border-gray-200 bg-white'
        }`}
      >
        <button
          type="button"
          onClick={() => setView('terminal')}
          className={`flex items-center gap-1 text-xs font-semibold ${
            isDark ? 'text-gray-300 hover:text-white' : 'text-gray-700 hover:text-black'
          }`}
        >
          {language === 'ar' ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
          <span>{language === 'ar' ? 'الرجوع لنقطة البيع' : 'Back to POS Terminal'}</span>
        </button>
        <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {language === 'ar' ? 'سجل عمليات الكاشير' : 'POS Sales History'}
        </span>
        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className={`p-1.5 rounded-lg ${
            isDark ? 'text-gray-300 hover:text-white hover:bg-white/10' : 'text-gray-600 hover:text-black hover:bg-gray-100'
          }`}
        >
          <Filter className="w-4 h-4" />
        </button>
      </div>

      {/* Filter Drawer */}
      {showFilters && (
        <div
          className={`p-3 border-b space-y-2 text-xs transition-colors ${
            isDark ? 'border-[#333842] bg-[#1E2228]' : 'border-gray-200 bg-gray-50'
          }`}
        >
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-gray-400 block mb-1">
                {language === 'ar' ? 'رقم الإيصال' : 'Receipt No'}
              </label>
              <input
                type="text"
                value={filterReceiptNo}
                onChange={(e) => setFilterReceiptNo(e.target.value)}
                placeholder="POS-..."
                className={`w-full h-10 px-2 rounded-lg border font-mono text-xs outline-none ${
                  isDark
                    ? 'border-[#333842] bg-[#121417] text-white'
                    : 'border-gray-300 bg-white text-gray-900'
                }`}
              />
            </div>
            <div>
              <label className="text-[10px] text-gray-400 block mb-1">
                {language === 'ar' ? 'طريقة الدفع' : 'Payment'}
              </label>
              <select
                value={filterPaymentMethod}
                onChange={(e) => setFilterPaymentMethod(e.target.value)}
                className={`w-full h-10 px-2 rounded-lg border text-xs outline-none ${
                  isDark
                    ? 'border-[#333842] bg-[#121417] text-white'
                    : 'border-gray-300 bg-white text-gray-900'
                }`}
              >
                <option value="all">{language === 'ar' ? 'الكل' : 'All'}</option>
                <option value="cash">{language === 'ar' ? 'نقدي (كاش)' : 'Cash'}</option>
                <option value="card">{language === 'ar' ? 'شبكة / بطاقة' : 'Card'}</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Sales List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {filteredSales.length === 0 ? (
          <div
            className={`p-8 text-center rounded-2xl border border-dashed my-6 ${
              isDark ? 'border-[#333842]' : 'border-gray-300 bg-white'
            }`}
          >
            <Receipt className="w-10 h-10 mx-auto text-gray-400 mb-2" />
            <h3 className={`text-sm font-bold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              {language === 'ar' ? 'لا يوجد عمليات مسجلة' : 'No POS Receipts'}
            </h3>
            <button
              onClick={() => setView('terminal')}
              className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors inline-flex items-center gap-1.5"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>{language === 'ar' ? 'بدء أول عملية بيع' : 'Start First Sale'}</span>
            </button>
          </div>
        ) : (
          filteredSales.map((sale) => (
            <div
              key={sale.id}
              className={`p-3.5 rounded-2xl border shadow-sm relative space-y-1.5 transition-colors ${
                isDark ? 'border-[#333842] bg-[#1C1F24]' : 'border-gray-200 bg-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-xs text-emerald-500">
                  {sale.receiptNumber}
                </span>
                <span
                  className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                    sale.paymentMethod === 'card'
                      ? 'bg-blue-500/20 text-blue-500'
                      : 'bg-emerald-500/20 text-emerald-500'
                  }`}
                >
                  {sale.paymentMethod === 'card'
                    ? (language === 'ar' ? 'شبكة' : 'Card')
                    : (language === 'ar' ? 'نقدي' : 'Cash')}
                </span>
              </div>

              <div className="text-xs">
                <div className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{sale.customerName}</div>
                <div className="text-[11px] text-gray-400 flex items-center justify-between mt-0.5">
                  <span>{language === 'ar' ? `كاشير: ${sale.cashierName}` : `Cashier: ${sale.cashierName}`}</span>
                  <span className="font-mono">{sale.date} {sale.time}</span>
                </div>
              </div>

              <div className={`pt-2 border-t flex items-center justify-between ${isDark ? 'border-[#333842]/50' : 'border-gray-100'}`}>
                <button
                  type="button"
                  onClick={() => openReceipt(sale, 'pos')}
                  className="px-2.5 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 text-[11px] font-bold flex items-center gap-1 transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>{language === 'ar' ? 'إعادة طباعة' : 'Reprint'}</span>
                </button>

                <div className={`font-mono font-bold text-sm ${isDark ? 'text-[#38BDF8]' : 'text-blue-600'}`}>
                  {sale.netDue.toFixed(2)} ر.س
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
