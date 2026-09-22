import React, { useState, useEffect, useRef } from 'react';
import { PosSale, Customer, LineItem } from '../../types';
import { storageService } from '../../services/storage';
import { soundService } from '../../services/sound';
import { useApp } from '../../context/AppContext';
import { GET_SAMPLE_20_LINE_ITEMS } from '../../data/mockData';
import { CustomerPicker } from '../common/CustomerPicker';
import { LineItemEditor } from '../common/LineItemEditor';
import {
  Plus,
  Filter,
  ShoppingCart,
  Printer,
  CreditCard,
  Banknote,
  Scan,
  Trash2,
  Minus,
  CheckCircle2,
  Clock,
  ArrowRight,
  ArrowLeft,
  Coins,
  Receipt,
  X,
  Sparkles
} from 'lucide-react';

export const PosScreen: React.FC = () => {
  const { language, theme, currentUser, showToast, refreshPendingCount, openReceipt, openScanner } = useApp();
  const [view, setView] = useState<'list' | 'terminal'>('terminal'); // Default straight to POS terminal for fast operations
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

  // Calculations (§3.6)
  const grossTotal = items.reduce((sum, item) => sum + (item.enteredQty * item.unitPrice), 0);
  const totalDiscount = items.reduce((sum, item) => sum + (item.discount || 0), 0);
  const totalAfterDiscount = Math.max(0, grossTotal - totalDiscount);
  const totalTax = Number((totalAfterDiscount * 0.14).toFixed(2));
  const totalAfterTax = Number((totalAfterDiscount + totalTax).toFixed(2));
  const withholdingTax = 0; // Retail POS does not apply withholding tax
  const netDue = totalAfterTax;

  // Change due computation
  const changeDue = Math.max(0, (amountPaid || 0) - netDue);

  // When netDue changes and payment is card, amountPaid is exact
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
    const newPaid = val;
    setAmountPaid(newPaid);
    setManualCashInput(newPaid.toString());
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
      <div id="pos-terminal-screen" className="flex-1 flex flex-col min-h-0 bg-[#121417] text-[#F5F6F7]">
        {/* Terminal Header */}
        <div className="p-2.5 border-b border-[#333842] bg-[#1C1F24] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              <ShoppingCart className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-white">
                {language === 'ar' ? 'نقطة البيع السريعة (POS)' : 'Rapid Retail POS'}
              </h2>
              <span className="text-[10px] text-gray-400 font-mono">
                كاشير: {currentUser.username.toUpperCase()} | منفذ: EDA50-01
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
              className="px-2.5 py-1.5 rounded-lg border border-blue-500/40 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 text-[11px] font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
              title={language === 'ar' ? 'تحميل 35 صنف مصنف لاختبار شبكة الفئات وسحب الكروت' : 'Load 35 categorized items demo'}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>{language === 'ar' ? '35 صنف مصنف' : '35 Items Demo'}</span>
            </button>

            {/* Switch to Sales History */}
            <button
              type="button"
              id="pos-history-btn"
              onClick={() => {
                soundService.playClick();
                setView('list');
              }}
              className="px-2.5 py-1.5 rounded-lg border border-[#333842] hover:bg-[#262A31] text-gray-300 text-[11px] font-semibold flex items-center gap-1"
            >
              <Receipt className="w-3.5 h-3.5 text-blue-400" />
              <span>{language === 'ar' ? 'سجل العمليات' : 'History'}</span>
            </button>
          </div>
        </div>

        {/* Walk-in Customer Header Pill (§8.2: Defaults to Walk-in with tax 0000000000) */}
        <div className="px-3 py-2 border-b border-[#333842] bg-[#181B20] flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-gray-400">{language === 'ar' ? 'العميل:' : 'Customer:'}</span>
            <span className="font-bold text-white">{customer.name}</span>
            <span className="text-[10px] font-mono text-gray-400">({customer.taxNumber})</span>
          </div>

          <button
            type="button"
            id="change-pos-customer-btn"
            onClick={() => setShowCustomerPicker(!showCustomerPicker)}
            className="text-[11px] font-semibold text-blue-400 hover:underline"
          >
            {showCustomerPicker
              ? (language === 'ar' ? 'إخفاء' : 'Hide')
              : (language === 'ar' ? 'تغيير العميل' : 'Change')}
          </button>
        </div>

        {/* Optional Customer Picker Dropdown */}
        {showCustomerPicker && (
          <div className="p-3 border-b border-[#333842] bg-[#1C1F24]">
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
          <div className="rounded-2xl border border-[#333842] bg-[#1C1F24] p-3">
            <LineItemEditor
              items={items}
              onChangeItems={(newItems) => setItems(newItems)}
            />
          </div>

          {/* Payment Method & Cash Tender Keypad (§8.2) */}
          {items.length > 0 && (
            <div className="rounded-2xl border border-[#333842] bg-[#1C1F24] p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-300">
                  {language === 'ar' ? 'طريقة التحصيل والدفع' : 'Payment Method'}
                </span>
                <span className="text-xs font-mono font-bold text-blue-400">
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
                  className={`h-12 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border transition-colors ${
                    paymentMethod === 'cash'
                      ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg'
                      : 'bg-[#121417] border-[#333842] text-gray-400 hover:text-white'
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
                  className={`h-12 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border transition-colors ${
                    paymentMethod === 'card'
                      ? 'bg-blue-600 border-blue-500 text-white shadow-lg'
                      : 'bg-[#121417] border-[#333842] text-gray-400 hover:text-white'
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  <span>{language === 'ar' ? 'شبكة / مدى / بطاقة' : 'Card / Mada'}</span>
                </button>
              </div>

              {/* Cash Keypad & Quick tender chips */}
              {paymentMethod === 'cash' && (
                <div className="space-y-2.5 pt-2 border-t border-[#333842]/50">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] text-gray-400 w-full mb-0.5">
                      {language === 'ar' ? 'مبالغ نقدية سريعة:' : 'Quick cash tenders:'}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleQuickCash(netDue)}
                      className="px-2.5 py-1.5 rounded-lg bg-[#262A31] border border-[#333842] hover:border-emerald-500 text-white font-mono text-xs font-bold"
                    >
                      {language === 'ar' ? 'المبلغ بالضبط' : 'Exact'} ({netDue.toFixed(2)})
                    </button>
                    {[50, 100, 200, 500].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => handleQuickCash(amt)}
                        className="px-2.5 py-1.5 rounded-lg bg-[#262A31] border border-[#333842] hover:border-emerald-500 text-white font-mono text-xs font-bold"
                      >
                        {amt} ر.س
                      </button>
                    ))}
                  </div>

                  {/* Cash Paid input & Live Change due */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="text-[10px] text-gray-400 block mb-1">
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
                        className="w-full h-11 px-3 rounded-xl border border-[#333842] bg-[#121417] text-white font-mono font-bold text-sm outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-gray-400 block mb-1">
                        {language === 'ar' ? 'المتبقي للعميل (الفكة)' : 'Change Due'}
                      </label>
                      <div className="w-full h-11 px-3 rounded-xl border border-emerald-500/40 bg-emerald-500/10 text-emerald-400 font-mono font-bold text-sm flex items-center justify-end">
                        {changeDue.toFixed(2)} ر.س
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Big Grand Total & Instant Checkout Bottom Bar (§8.2 & §4 display total 24-28px) */}
        <div
          id="pos-terminal-checkout-bar"
          className="p-3 bg-[#1C1F24] border-t border-[#333842] shadow-2xl flex items-center justify-between gap-3"
        >
          <div>
            <span className="text-[10px] uppercase tracking-wider text-gray-400 font-bold block">
              {language === 'ar' ? 'إجمالي السلة المستحق' : 'Cart Total'}
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold font-mono text-[#38BDF8] tabular-nums tracking-tight">
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
    <div id="pos-history-screen" className="flex-1 flex flex-col min-h-0 bg-[#121417] text-[#F5F6F7]">
      {/* Header */}
      <div className="p-3 border-b border-[#333842] bg-[#1C1F24] flex items-center justify-between">
        <button
          type="button"
          onClick={() => setView('terminal')}
          className="flex items-center gap-1 text-xs text-gray-300 hover:text-white"
        >
          {language === 'ar' ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
          <span>{language === 'ar' ? 'الرجوع لنقطة البيع' : 'Back to POS Terminal'}</span>
        </button>
        <span className="text-sm font-bold text-white">
          {language === 'ar' ? 'سجل عمليات الكاشير' : 'POS Sales History'}
        </span>
        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className="text-gray-300 hover:text-white"
        >
          <Filter className="w-4 h-4" />
        </button>
      </div>

      {/* Filter Drawer */}
      {showFilters && (
        <div className="p-3 border-b border-[#333842] bg-[#1E2228] space-y-2 text-xs">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-gray-400 block mb-1">رقم الإيصال</label>
              <input
                type="text"
                value={filterReceiptNo}
                onChange={(e) => setFilterReceiptNo(e.target.value)}
                placeholder="POS-..."
                className="w-full h-10 px-2 rounded-lg border border-[#333842] bg-[#121417] text-white font-mono text-xs outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] text-gray-400 block mb-1">طريقة الدفع</label>
              <select
                value={filterPaymentMethod}
                onChange={(e) => setFilterPaymentMethod(e.target.value)}
                className="w-full h-10 px-2 rounded-lg border border-[#333842] bg-[#121417] text-white text-xs outline-none"
              >
                <option value="all">الكل</option>
                <option value="cash">نقدي (كاش)</option>
                <option value="card">شبكة / بطاقة</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Sales List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {filteredSales.length === 0 ? (
          <div className="p-8 text-center rounded-2xl border border-dashed border-[#333842] my-6">
            <Receipt className="w-10 h-10 mx-auto text-gray-500 mb-2" />
            <h3 className="text-sm font-bold text-gray-300">
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
              className="p-3.5 rounded-2xl border border-[#333842] bg-[#1C1F24] shadow-sm relative space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-xs text-emerald-400">
                  {sale.receiptNumber}
                </span>
                <span
                  className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                    sale.paymentMethod === 'card'
                      ? 'bg-blue-500/20 text-blue-400'
                      : 'bg-emerald-500/20 text-emerald-400'
                  }`}
                >
                  {sale.paymentMethod === 'card' ? 'شبكة' : 'نقدي'}
                </span>
              </div>

              <div className="text-xs">
                <div className="font-bold text-white">{sale.customerName}</div>
                <div className="text-[11px] text-gray-400 flex items-center justify-between mt-0.5">
                  <span>كاشير: {sale.cashierName}</span>
                  <span className="font-mono">{sale.date} {sale.time}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-[#333842]/50 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => openReceipt(sale, 'pos')}
                  className="px-2.5 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-[11px] font-bold flex items-center gap-1"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>إعادة طباعة</span>
                </button>

                <div className="font-mono font-bold text-sm text-[#38BDF8]">
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
