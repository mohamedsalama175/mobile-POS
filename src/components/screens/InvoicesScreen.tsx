import React, { useState, useEffect } from 'react';
import { SalesInvoice, SalesOrder, Customer, LineItem } from '../../types';
import { storageService } from '../../services/storage';
import { soundService } from '../../services/sound';
import { useApp } from '../../context/AppContext';
import { CustomerPicker } from '../common/CustomerPicker';
import { LineItemEditor } from '../common/LineItemEditor';
import { TotalsSummary } from '../common/TotalsSummary';
import { INITIAL_LOOKUP_DATA } from '../../data/mockData';
import { calculateDocumentTotals } from '../../utils/pricing';
import {
  Plus,
  Filter,
  Search,
  Receipt,
  Printer,
  Share2,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  FileCheck,
  CreditCard,
  Banknote,
  X
} from 'lucide-react';

export const InvoicesScreen: React.FC = () => {
  const { language, theme, currentUser, showToast, refreshPendingCount, openReceipt } = useApp();
  const [view, setView] = useState<'list' | 'create'>('list');
  const [invoices, setInvoices] = useState<SalesInvoice[]>([]);
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const isDark = theme === 'dark';

  // Filters state
  const [showFilters, setShowFilters] = useState(false);
  const [filterInvoiceNo, setFilterInvoiceNo] = useState('');
  const [filterOrderNo, setFilterOrderNo] = useState('');
  const [filterCustomer, setFilterCustomer] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Selected Invoice for preview / modal
  const [selectedInvoice, setSelectedInvoice] = useState<SalesInvoice | null>(null);

  // Form State for Create Screen
  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [invoiceType, setInvoiceType] = useState<'cash' | 'credit'>('credit');
  const [invoiceDate, setInvoiceDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [warehouse, setWarehouse] = useState(INITIAL_LOOKUP_DATA.warehouses[0]);
  const [subCompany, setSubCompany] = useState(INITIAL_LOOKUP_DATA.subCompanies[0]);
  const [items, setItems] = useState<LineItem[]>([]);

  // US-04: Cash payment option and collected amount
  const [isCashPayment, setIsCashPayment] = useState(false);
  const [paidAmountInput, setPaidAmountInput] = useState<string>('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setInvoices(storageService.getInvoices());
    setOrders(storageService.getOrders());
    refreshPendingCount();
  };

  // Convert an existing confirmed Sales Order into this Invoice
  const handleLinkOrder = (order: SalesOrder) => {
    soundService.playScanSuccess();
    setSelectedOrder(order);
    setSelectedCustomer({
      id: order.customerId,
      name: order.customerName,
      taxNumber: order.customerTaxNumber,
      phone: order.customerPhone,
      creditLimit: order.creditLimit,
      currentBalance: 0,
      branchName: order.customerBranch
    });
    setWarehouse(order.warehouse);
    setSubCompany(order.subCompany);
    setItems([...order.items]);
    showToast(
      language === 'ar'
        ? `تم استيراد ${order.items.length} أصناف من الطلب: ${order.orderNumber}`
        : `Imported ${order.items.length} items from order: ${order.orderNumber}`,
      'info'
    );
  };

  // Standardized document totals calculations
  const {
    grossTotal,
    totalDiscount,
    totalAfterDiscount,
    totalTax,
    totalAfterTax,
    withholdingTax,
    netDue
  } = calculateDocumentTotals(items);

  // US-04: Real-time collected & remaining calculation
  const numericPaidAmount = isCashPayment ? Math.min(Math.max(0, Number(paidAmountInput) || 0), netDue) : 0;
  const remainingAmount = isCashPayment ? Math.max(0, netDue - (Number(paidAmountInput) || 0)) : netDue;

  const handleSaveAndPrint = (shouldPrint: boolean) => {
    if (!selectedCustomer) {
      soundService.playError();
      showToast(language === 'ar' ? 'يرجى تحديد العميل' : 'Please select a customer', 'error');
      return;
    }
    if (items.length === 0) {
      soundService.playError();
      showToast(language === 'ar' ? 'أضف صنفاً واحداً على الأقل للفاتورة' : 'Add at least one line item', 'error');
      return;
    }

    // US-04 Validation
    if (isCashPayment) {
      const parsedPaid = Number(paidAmountInput);
      if (isNaN(parsedPaid) || parsedPaid <= 0) {
        soundService.playError();
        showToast(
          language === 'ar'
            ? 'يرجى إدخال مبلغ محصل أكبر من صفر أو إلغاء خيار السداد النقدي'
            : 'Please enter a collected amount greater than 0',
          'error'
        );
        return;
      }
      if (parsedPaid > netDue) {
        soundService.playError();
        showToast(
          language === 'ar'
            ? `المبلغ المحصل (${parsedPaid}) لا يمكن أن يتجاوز إجمالي الفاتورة (${netDue.toFixed(2)})`
            : `Collected amount cannot exceed invoice net due`,
          'error'
        );
        return;
      }
    }

    const saved = storageService.saveInvoice({
      linkedOrderNumber: selectedOrder?.orderNumber,
      date: invoiceDate,
      customerId: selectedCustomer.id,
      customerName: selectedCustomer.name,
      customerTaxNumber: selectedCustomer.taxNumber,
      customerPhone: selectedCustomer.phone,
      creditLimit: selectedCustomer.creditLimit,
      customerBranch: selectedCustomer.branchName || 'الفرع الرئيسي',
      invoiceType,
      subCompany,
      warehouse,
      salesRep: currentUser.displayName,
      items,
      grossTotal,
      totalDiscount,
      totalAfterDiscount,
      totalTax,
      totalAfterTax,
      withholdingTax,
      netDue,
      isCashPayment,
      paidAmount: isCashPayment ? Number(paidAmountInput) : 0,
      remainingBalance: isCashPayment ? Math.max(0, netDue - Number(paidAmountInput)) : netDue,
      cashReceiptDate: isCashPayment ? invoiceDate : undefined,
      settlementStatus: isCashPayment 
        ? (Number(paidAmountInput) >= netDue ? 'paid' : (Number(paidAmountInput) > 0 ? 'partial' : 'unpaid'))
        : 'unpaid',
      status: 'issued'
    });

    soundService.playScanSuccess();
    showToast(
      language === 'ar'
        ? `تم إصدار الفاتورة: ${saved.invoiceNumber}${isCashPayment ? ` (تحصيل: ${Number(paidAmountInput).toLocaleString()} ر.س)` : ''}`
        : `Invoice issued: ${saved.invoiceNumber}`,
      'success'
    );

    if (shouldPrint) {
      openReceipt(saved, 'invoice');
    }

    // Reset and return
    setSelectedOrder(null);
    setSelectedCustomer(null);
    setItems([]);
    setIsCashPayment(false);
    setPaidAmountInput('');
    loadData();
    setView('list');
  };

  const filteredInvoices = invoices.filter((inv) => {
    if (filterInvoiceNo && !inv.invoiceNumber.toLowerCase().includes(filterInvoiceNo.toLowerCase())) return false;
    if (filterOrderNo && !(inv.linkedOrderNumber || '').toLowerCase().includes(filterOrderNo.toLowerCase())) return false;
    if (filterCustomer) {
      const match =
        inv.customerName.toLowerCase().includes(filterCustomer.toLowerCase()) ||
        inv.customerTaxNumber.includes(filterCustomer);
      if (!match) return false;
    }
    if (filterType !== 'all' && inv.invoiceType !== filterType) return false;
    if (filterStatus !== 'all') {
      const currentSettlement = inv.settlementStatus || (inv.paidAmount && inv.paidAmount >= inv.netDue ? 'paid' : (inv.paidAmount ? 'partial' : 'unpaid'));
      if (currentSettlement !== filterStatus) return false;
    }
    return true;
  });

  // ==========================================
  // VIEW: CREATE INVOICE SCREEN (§6.2)
  // ==========================================
  if (view === 'create') {
    return (
      <div id="create-invoice-screen" className={`flex-1 flex flex-col min-h-0 ${isDark ? 'bg-[#121417] text-[#F5F6F7]' : 'bg-slate-50 text-slate-900'}`}>
        {/* Header */}
        <div className={`p-3 border-b flex items-center justify-between ${isDark ? 'border-[#333842] bg-[#1C1F24]' : 'border-slate-200 bg-white shadow-sm'}`}>
          <button
            id="create-invoice-back-button"
            type="button"
            onClick={() => {
              setView('list');
              setSelectedOrder(null);
              setSelectedCustomer(null);
              setItems([]);
            }}
            className={`flex items-center gap-1.5 text-xs font-semibold ${isDark ? 'text-gray-300 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}
          >
            {language === 'ar' ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
            <span>{language === 'ar' ? 'رجوع' : 'Back'}</span>
          </button>
          <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {language === 'ar' ? 'إنشاء وإصدار فاتورة بيع' : 'New Sales Invoice'}
          </span>
          <div className="w-12"></div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-3 pb-32">
          {/* Optional: Pull from Confirmed Sales Order (§6.2) */}
          <div className={`rounded-2xl border p-3 ${isDark ? 'border-[#333842] bg-[#1C1F24]' : 'border-slate-200 bg-white shadow-sm'}`}>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-blue-500">
                {language === 'ar' ? 'استيراد من طلب بيع مؤكد (اختياري)' : 'Import from Confirmed Order (Optional)'}
              </label>
              {selectedOrder && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedOrder(null);
                    setSelectedCustomer(null);
                    setItems([]);
                  }}
                  className="text-[10px] text-rose-500 font-bold hover:underline"
                >
                  {language === 'ar' ? 'إلغاء الربط' : 'Unlink'}
                </button>
              )}
            </div>
            <select
              value={selectedOrder?.id || ''}
              onChange={(e) => {
                const found = orders.find(o => o.id === e.target.value);
                if (found) handleLinkOrder(found);
              }}
              className={`w-full h-11 px-3 rounded-xl border text-xs outline-none ${
                isDark ? 'border-[#333842] bg-[#121417] text-white' : 'border-slate-300 bg-slate-50 text-slate-900'
              }`}
            >
              <option value="">{language === 'ar' ? '-- بدون ربط (إنشاء فاتورة مباشرة) --' : '-- Direct Invoice without Order --'}</option>
              {orders.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.orderNumber} - {o.customerName} ({o.netDue.toFixed(2)} ر.س)
                </option>
              ))}
            </select>
          </div>

          {/* Customer Selection */}
          <div className={`rounded-2xl border p-3 ${isDark ? 'border-[#333842] bg-[#1C1F24]' : 'border-slate-200 bg-white shadow-sm'}`}>
            <CustomerPicker
              selectedCustomer={selectedCustomer}
              onSelectCustomer={(c) => setSelectedCustomer(c)}
              isReadOnly={!!selectedOrder}
            />
          </div>

          {/* Invoice Type Toggle (آجل / كاش §6.1 & §6.2) */}
          <div className={`rounded-2xl border p-3 text-xs space-y-2 ${isDark ? 'border-[#333842] bg-[#1C1F24]' : 'border-slate-200 bg-white shadow-sm'}`}>
            <span className={`font-bold block mb-1 ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>
              {language === 'ar' ? 'نوع الفاتورة وشروط الدفع *' : 'Invoice Type & Payment Term *'}
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                id="invoice-type-credit"
                onClick={() => setInvoiceType('credit')}
                className={`h-11 rounded-xl font-bold flex items-center justify-center gap-2 border transition-colors ${
                  invoiceType === 'credit'
                    ? 'bg-blue-600 border-blue-500 text-white'
                    : isDark
                    ? 'bg-[#121417] border-[#333842] text-gray-400 hover:text-white'
                    : 'bg-slate-100 border-slate-300 text-slate-600 hover:text-slate-900'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span>{language === 'ar' ? 'آجل (على الحساب)' : 'Credit (Account)'}</span>
              </button>
              <button
                type="button"
                id="invoice-type-cash"
                onClick={() => setInvoiceType('cash')}
                className={`h-11 rounded-xl font-bold flex items-center justify-center gap-2 border transition-colors ${
                  invoiceType === 'cash'
                    ? 'bg-emerald-600 border-emerald-500 text-white'
                    : isDark
                    ? 'bg-[#121417] border-[#333842] text-gray-400 hover:text-white'
                    : 'bg-slate-100 border-slate-300 text-slate-600 hover:text-slate-900'
                }`}
              >
                <Banknote className="w-4 h-4" />
                <span>{language === 'ar' ? 'نقدي (كاش فوري)' : 'Cash'}</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <div>
                <label className={`text-[10px] block mb-1 ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                  {language === 'ar' ? 'تاريخ الفاتورة' : 'Invoice Date'}
                </label>
                <input
                  type="date"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  className={`w-full h-10 px-2 rounded-lg border font-mono text-xs outline-none ${
                    isDark ? 'border-[#333842] bg-[#121417] text-white' : 'border-slate-300 bg-slate-50 text-slate-900'
                  }`}
                />
              </div>
              <div>
                <label className={`text-[10px] block mb-1 ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                  {language === 'ar' ? 'المستودع' : 'Warehouse'}
                </label>
                <select
                  value={warehouse}
                  onChange={(e) => setWarehouse(e.target.value)}
                  className={`w-full h-10 px-2 rounded-lg border text-xs outline-none truncate ${
                    isDark ? 'border-[#333842] bg-[#121417] text-white' : 'border-slate-300 bg-slate-50 text-slate-900'
                  }`}
                >
                  {INITIAL_LOOKUP_DATA.warehouses.map((wh, i) => (
                    <option key={i} value={wh}>{wh}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Line Items Editor */}
          <div className={`rounded-2xl border p-3 ${isDark ? 'border-[#333842] bg-[#1C1F24]' : 'border-slate-200 bg-white shadow-sm'}`}>
            <LineItemEditor
              items={items}
              onChangeItems={(newItems) => setItems(newItems)}
            />
          </div>

          {/* Totals Summary Card */}
          <TotalsSummary
            grossTotal={grossTotal}
            totalDiscount={totalDiscount}
            totalAfterDiscount={totalAfterDiscount}
            totalTax={totalTax}
            totalAfterTax={totalAfterTax}
            withholdingTax={withholdingTax}
            netDue={netDue}
          />

          {/* US-04: Cash Payment Option & Live Balance Calculation (§US-04) */}
          <div className={`rounded-2xl border p-3.5 space-y-3 transition-all ${
            isDark 
              ? isCashPayment ? 'border-amber-500/50 bg-[#1C1F24]' : 'border-[#333842] bg-[#1C1F24]' 
              : isCashPayment ? 'border-amber-400 bg-amber-50/40 shadow-sm' : 'border-slate-200 bg-white shadow-sm'
          }`}>
            <div className="flex items-center justify-between">
              <label 
                htmlFor="cash-payment-checkbox"
                className="flex items-center gap-2 cursor-pointer select-none"
              >
                <input
                  id="cash-payment-checkbox"
                  type="checkbox"
                  checked={isCashPayment}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setIsCashPayment(checked);
                    if (checked && !paidAmountInput) {
                      setPaidAmountInput(netDue > 0 ? netDue.toString() : '');
                    }
                  }}
                  className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400 accent-amber-500 cursor-pointer"
                />
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <Banknote className="w-4 h-4 text-amber-500" />
                  <span className={isDark ? 'text-white' : 'text-slate-900'}>
                    {language === 'ar' ? 'سداد نقدي (Cash)' : 'Cash Payment (Collection)'}
                  </span>
                </div>
              </label>

              {isCashPayment && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-500 border border-amber-500/30">
                  {language === 'ar' ? 'تحديث رصيد العهدة' : 'Updates Rep Custody'}
                </span>
              )}
            </div>

            {isCashPayment && (
              <div className="space-y-2.5 pt-1 border-t border-dashed border-amber-500/30">
                <div className="grid grid-cols-2 gap-2.5">
                  {/* Collected Amount Input */}
                  <div>
                    <label className={`text-[11px] font-bold block mb-1 ${isDark ? 'text-amber-400' : 'text-amber-800'}`}>
                      {language === 'ar' ? 'المبلغ المحصَّل (ر.س) *' : 'Collected Amount (SAR) *'}
                    </label>
                    <input
                      id="collected-amount-input"
                      type="number"
                      step="0.01"
                      min="0"
                      max={netDue}
                      value={paidAmountInput}
                      onChange={(e) => setPaidAmountInput(e.target.value)}
                      placeholder={netDue > 0 ? netDue.toFixed(2) : '0.00'}
                      className={`w-full h-11 px-3 rounded-xl border font-mono text-sm font-bold outline-none transition-all ${
                        Number(paidAmountInput) > netDue
                          ? 'border-rose-500 bg-rose-500/10 text-rose-500 ring-1 ring-rose-500'
                          : isDark
                          ? 'border-amber-500/50 bg-[#121417] text-amber-400 focus:border-amber-400'
                          : 'border-amber-400 bg-white text-amber-900 focus:border-amber-500'
                      }`}
                    />
                  </div>

                  {/* Read-Only Remaining Balance Highlighted in Orange (US-04 Requirement) */}
                  <div>
                    <label className={`text-[11px] font-bold block mb-1 ${isDark ? 'text-orange-400' : 'text-orange-800'}`}>
                      {language === 'ar' ? 'المتبقي على العميل (ر.س)' : 'Remaining Balance'}
                    </label>
                    <div className={`w-full h-11 px-3 rounded-xl border flex items-center justify-between font-mono text-sm font-extrabold ${
                      isDark 
                        ? 'border-orange-500/60 bg-orange-950/30 text-orange-400 shadow-inner' 
                        : 'border-orange-400 bg-orange-100/70 text-orange-900'
                    }`}>
                      <span>{remainingAmount.toFixed(2)}</span>
                      <span className="text-[10px] font-sans font-normal opacity-80">ر.س</span>
                    </div>
                  </div>
                </div>

                {/* Quick 1-Click Settle Full Net Due Button */}
                {netDue > 0 && Number(paidAmountInput) !== netDue && (
                  <button
                    type="button"
                    onClick={() => setPaidAmountInput(netDue.toString())}
                    className={`w-full py-1.5 px-2 rounded-lg text-[11px] font-bold border transition-colors flex items-center justify-center gap-1.5 ${
                      isDark 
                        ? 'border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20' 
                        : 'border-amber-300 bg-amber-100/60 text-amber-800 hover:bg-amber-100'
                    }`}
                  >
                    <span>{language === 'ar' ? `تحصيل كامل المبلغ (${netDue.toFixed(2)} ر.س)` : `Collect Full Due (${netDue.toFixed(2)})`}</span>
                  </button>
                )}

                {/* Live Business Logic Notes & Alerts */}
                {Number(paidAmountInput) > netDue ? (
                  <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-500 text-[11px] flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{language === 'ar' ? 'تنبيه: المبلغ المحصَّل لا يمكن أن يتجاوز صافي الفاتورة' : 'Collected amount exceeds net due'}</span>
                  </div>
                ) : remainingAmount === 0 && Number(paidAmountInput) > 0 ? (
                  <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-[11px] flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{language === 'ar' ? 'سداد كامل: سيتم إيداع كامل القيمة بعهدة المندوب وتصفير رصيد الفاتورة' : 'Paid in full: 100% deposited to rep custody'}</span>
                  </div>
                ) : Number(paidAmountInput) > 0 ? (
                  <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-500 text-[11px] flex items-center gap-1.5">
                    <Clock className="w-4 h-4 shrink-0" />
                    <span>{language === 'ar' ? `سداد جزئي: تضاف ${Number(paidAmountInput).toFixed(2)} لعهدة المندوب، ويبقى ${remainingAmount.toFixed(2)} مديونية على العميل` : `Partial: Rep receives cash, remaining balance stays on customer`}</span>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>

        {/* Sticky Action Bar (§6.2: Save & Print) */}
        <div className={`sticky bottom-0 z-20 p-3 border-t flex items-center gap-2 shadow-2xl ${
          isDark ? 'bg-[#262A31] border-[#333842]' : 'bg-white border-slate-200'
        }`}>
          <button
            type="button"
            id="save-print-invoice-btn"
            onClick={() => handleSaveAndPrint(true)}
            className="flex-1 h-14 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg active:scale-98"
          >
            <Printer className="w-4 h-4" />
            <span>{language === 'ar' ? 'حفظ وطباعة الفاتورة' : 'Save & Print'}</span>
          </button>

          <button
            type="button"
            id="save-only-invoice-btn"
            onClick={() => handleSaveAndPrint(false)}
            className="h-14 px-4 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
          >
            <FileCheck className="w-4 h-4" />
            <span>{language === 'ar' ? 'حفظ فقط' : 'Save'}</span>
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW: LIST SCREEN (§6.1)
  // ==========================================
  return (
    <div id="invoices-list-screen" className={`flex-1 flex flex-col min-h-0 ${isDark ? 'bg-[#121417] text-[#F5F6F7]' : 'bg-slate-50 text-slate-900'}`}>
      {/* Top Action Bar */}
      <div className={`p-3 border-b flex items-center justify-between gap-2 ${isDark ? 'border-[#333842] bg-[#1C1F24]' : 'border-slate-200 bg-white shadow-sm'}`}>
        <button
          id="create-new-invoice-btn"
          onClick={() => {
            soundService.playClick();
            setView('create');
          }}
          className="flex-1 h-12 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-98"
        >
          <Plus className="w-4 h-4" />
          <span>{language === 'ar' ? 'إنشاء فاتورة جديدة' : 'New Invoice'}</span>
        </button>

        <button
          id="invoices-filter-toggle"
          onClick={() => setShowFilters(!showFilters)}
          className={`h-12 px-3 rounded-xl border flex items-center gap-1.5 text-xs font-semibold transition-colors ${
            showFilters
              ? 'bg-blue-500/20 border-blue-500 text-blue-500'
              : isDark
              ? 'bg-[#262A31] border-[#333842] text-gray-300 hover:text-white'
              : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <Filter className="w-4 h-4" />
          <span>{language === 'ar' ? 'تصفية' : 'Filter'}</span>
        </button>
      </div>

      {/* Filter drawer (§6.1) */}
      {showFilters && (
        <div className={`p-3 border-b space-y-2 text-xs ${isDark ? 'border-[#333842] bg-[#1E2228]' : 'border-slate-200 bg-slate-100'}`}>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className={`text-[10px] block mb-1 ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>رقم الفاتورة</label>
              <input
                type="text"
                value={filterInvoiceNo}
                onChange={(e) => setFilterInvoiceNo(e.target.value)}
                placeholder="INV-... / DRAFT-..."
                className={`w-full h-10 px-2 rounded-lg border font-mono text-xs outline-none ${
                  isDark ? 'border-[#333842] bg-[#121417] text-white' : 'border-slate-300 bg-white text-slate-900'
                }`}
              />
            </div>
            <div>
              <label className={`text-[10px] block mb-1 ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>نوع الفاتورة</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className={`w-full h-10 px-2 rounded-lg border text-xs outline-none ${
                  isDark ? 'border-[#333842] bg-[#121417] text-white' : 'border-slate-300 bg-white text-slate-900'
                }`}
              >
                <option value="all">الكل</option>
                <option value="credit">آجل</option>
                <option value="cash">نقدي</option>
              </select>
            </div>
            <div>
              <label className={`text-[10px] block mb-1 ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>حالة السداد</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className={`w-full h-10 px-2 rounded-lg border text-xs outline-none ${
                  isDark ? 'border-[#333842] bg-[#121417] text-white' : 'border-slate-300 bg-white text-slate-900'
                }`}
              >
                <option value="all">كل الحالات</option>
                <option value="paid">مسددة بالكامل</option>
                <option value="partial">مسددة جزئياً</option>
                <option value="unpaid">غير مسددة</option>
              </select>
            </div>
          </div>

          <div>
            <label className={`text-[10px] block mb-1 ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>العميل / الرقم الضريبي</label>
            <input
              type="text"
              value={filterCustomer}
              onChange={(e) => setFilterCustomer(e.target.value)}
              placeholder="ابحث بالاسم أو الرقم الضريبي..."
              className={`w-full h-10 px-2 rounded-lg border text-xs outline-none ${
                isDark ? 'border-[#333842] bg-[#121417] text-white' : 'border-slate-300 bg-white text-slate-900'
              }`}
            />
          </div>
        </div>
      )}

      {/* Invoices List Cards (§6.1 & §US-04) */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {filteredInvoices.length === 0 ? (
          <div className={`p-8 text-center rounded-2xl border border-dashed my-6 ${isDark ? 'border-[#333842]' : 'border-slate-300 bg-white'}`}>
            <Receipt className="w-10 h-10 mx-auto text-gray-400 mb-2" />
            <h3 className={`text-sm font-bold ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>
              {language === 'ar' ? 'لا يوجد فواتير صادرة' : 'No Invoices Found'}
            </h3>
            <p className="text-xs text-gray-500 mt-1 mb-4">
              {language === 'ar' ? 'اضغط الزر بالأعلى لإصدار فاتورة جديدة' : 'Tap above to create new sales invoice'}
            </p>
          </div>
        ) : (
          filteredInvoices.map((inv) => {
            const isSettled = inv.settlementStatus === 'paid' || (inv.paidAmount && inv.paidAmount >= inv.netDue);
            const isPartial = inv.settlementStatus === 'partial' || (!isSettled && (inv.paidAmount || 0) > 0);
            const remaining = inv.remainingBalance !== undefined ? inv.remainingBalance : Math.max(0, inv.netDue - (inv.paidAmount || 0));

            return (
              <div
                key={inv.id}
                onClick={() => setSelectedInvoice(inv)}
                className={`p-3.5 rounded-2xl border shadow-sm relative cursor-pointer active:scale-99 transition-all space-y-2 ${
                  isDark
                    ? 'border-[#333842] bg-[#1C1F24] hover:border-blue-500/50'
                    : 'border-slate-200 bg-white hover:border-blue-500/50 shadow-sm'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-xs text-blue-500">
                      {inv.invoiceNumber}
                    </span>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                        inv.invoiceType === 'cash' || inv.isCashPayment
                          ? 'bg-emerald-500/20 text-emerald-500'
                          : 'bg-blue-500/20 text-blue-500'
                      }`}
                    >
                      {inv.invoiceType === 'cash' || inv.isCashPayment ? 'نقدي' : 'آجل'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {isSettled ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-500 border border-emerald-500/30">
                        {language === 'ar' ? 'مسددة بالكامل' : 'Paid in Full'}
                      </span>
                    ) : isPartial ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-500 border border-amber-500/30">
                        {language === 'ar' ? 'مسددة جزئياً' : 'Partially Paid'}
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-500/20 text-slate-400 border border-slate-500/30">
                        {language === 'ar' ? 'غير مسددة' : 'Unpaid'}
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-xs">
                  <div className={`font-bold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>{inv.customerName}</div>
                  <div className={`text-[11px] flex items-center justify-between mt-0.5 ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                    <span>{inv.customerBranch || 'الفرع الرئيسي'}</span>
                    <span className="font-mono">{inv.date}</span>
                  </div>
                </div>

                {/* US-04 Cash Collection & Remaining live sub-bar */}
                {(inv.isCashPayment || (inv.paidAmount && inv.paidAmount > 0)) && (
                  <div className={`p-1.5 rounded-lg border flex items-center justify-between text-[10px] font-mono ${
                    isDark ? 'bg-[#121417] border-[#333842]' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <span className="text-amber-500 font-bold">
                      {language === 'ar' ? 'محصَّل:' : 'Paid:'} {(inv.paidAmount || 0).toLocaleString()} ر.س
                    </span>
                    <span className={remaining > 0 ? 'text-orange-500 font-bold' : 'text-emerald-500 font-bold'}>
                      {language === 'ar' ? 'المتبقي:' : 'Due:'} {remaining.toLocaleString()} ر.س
                    </span>
                  </div>
                )}

                <div className={`pt-2 border-t flex items-center justify-between ${isDark ? 'border-[#333842]/50' : 'border-slate-200'}`}>
                  <span className={`text-[11px] ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                    {language === 'ar' ? 'إجمالي الفاتورة:' : 'Total Net:'}
                  </span>
                  <span className="font-mono font-bold text-sm text-blue-500">
                    {inv.netDue.toFixed(2)} ر.س
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Invoice Quick Action Modal (§6.1 & §US-04: Print thermal receipt, share, details) */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm select-none">
          <div className={`w-full max-w-sm rounded-2xl border shadow-2xl flex flex-col max-h-[85vh] overflow-hidden ${
            isDark ? 'bg-[#1C1F24] border-[#333842] text-[#F5F6F7]' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className={`p-3 border-b flex items-center justify-between ${
              isDark ? 'border-[#333842] bg-[#262A31]' : 'border-slate-200 bg-slate-100'
            }`}>
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-blue-500" />
                <span className="font-bold text-sm">{selectedInvoice.invoiceNumber}</span>
              </div>
              <button
                onClick={() => setSelectedInvoice(null)}
                className={isDark ? 'text-gray-400 hover:text-white' : 'text-slate-500 hover:text-slate-800'}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs">
              <div className={`flex justify-between items-center pb-2 border-b ${isDark ? 'border-[#333842]' : 'border-slate-200'}`}>
                <span className={isDark ? 'text-gray-400' : 'text-slate-500'}>نوع الفاتورة:</span>
                <span className="font-bold text-blue-500">
                  {selectedInvoice.invoiceType === 'cash' || selectedInvoice.isCashPayment ? 'نقدي (كاش)' : 'آجل (على الحساب)'}
                </span>
              </div>

              <div>
                <span className={`block text-[10px] ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>العميل:</span>
                <span className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>{selectedInvoice.customerName}</span>
                <span className={`font-mono block text-[11px] mt-0.5 ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                  الرقم الضريبي: {selectedInvoice.customerTaxNumber}
                </span>
              </div>

              {/* Items List */}
              <div>
                <span className={`font-bold text-xs block mb-1.5 ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>أصناف الفاتورة:</span>
                <div className="space-y-1.5">
                  {selectedInvoice.items.map((it, idx) => (
                    <div
                      key={idx}
                      className={`p-2 rounded-lg border flex justify-between items-center ${
                        isDark ? 'bg-[#121417] border-[#333842]' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div>
                        <div className={`font-bold truncate max-w-[180px] ${isDark ? 'text-white' : 'text-slate-900'}`}>{it.name}</div>
                        <div className={`text-[10px] font-mono ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                          {it.enteredQty} × {it.unitPrice.toFixed(2)}
                        </div>
                      </div>
                      <div className="font-mono font-bold text-blue-500">
                        {it.lineTotal.toFixed(2)} ر.س
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* US-04: Cash Payment Breakdown Card in Modal */}
              {(selectedInvoice.isCashPayment || (selectedInvoice.paidAmount && selectedInvoice.paidAmount > 0)) && (
                <div className={`p-3 rounded-xl border space-y-2 ${
                  isDark ? 'bg-amber-950/20 border-amber-500/40 text-amber-300' : 'bg-amber-50 border-amber-300 text-amber-900'
                }`}>
                  <div className="flex items-center justify-between text-xs font-bold border-b border-amber-500/20 pb-1.5">
                    <div className="flex items-center gap-1.5">
                      <Banknote className="w-4 h-4 text-amber-500" />
                      <span>بيانات السداد النقدي وتحديث العهدة:</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-500 border border-amber-500/30">
                      {selectedInvoice.settlementStatus === 'paid' ? 'مسددة بالكامل' : 'سداد جزئي'}
                    </span>
                  </div>

                  <div className="space-y-1 text-[11px] font-mono">
                    <div className="flex justify-between items-center">
                      <span className="opacity-80">المبلغ المحصَّل نقداً:</span>
                      <span className="font-bold text-amber-500">
                        {(selectedInvoice.paidAmount || 0).toLocaleString()} ر.س
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="opacity-80">المتبقي على حساب العميل:</span>
                      <span className="font-bold text-orange-500">
                        {(selectedInvoice.remainingBalance !== undefined ? selectedInvoice.remainingBalance : (selectedInvoice.netDue - (selectedInvoice.paidAmount || 0))).toLocaleString()} ر.س
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-[10px] pt-1.5 border-t border-amber-500/20">
                      <span className="opacity-80">المندوب المسند للعهدة:</span>
                      <span className="font-bold">{selectedInvoice.salesRep}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Grand Total */}
              <div className={`p-3 rounded-xl border flex justify-between items-center font-mono ${
                isDark ? 'bg-[#262A31] border-[#333842]' : 'bg-slate-100 border-slate-200'
              }`}>
                <span className={`text-xs ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>الإجمالي المستحق:</span>
                <span className="text-base font-bold text-blue-500">
                  {selectedInvoice.netDue.toFixed(2)} ر.س
                </span>
              </div>
            </div>

            {/* Quick Actions Footer (§6.1) */}
            <div className={`p-3 border-t grid grid-cols-2 gap-2 ${
              isDark ? 'border-[#333842] bg-[#262A31]' : 'border-slate-200 bg-slate-100'
            }`}>
              <button
                type="button"
                onClick={() => {
                  openReceipt(selectedInvoice, 'invoice');
                  setSelectedInvoice(null);
                }}
                className="h-11 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Printer className="w-4 h-4" />
                <span>طباعة حرارية</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  showToast('تم تجهيز نسخة الفاتورة الرقمية بصيغة PDF', 'info');
                  setSelectedInvoice(null);
                }}
                className={`h-11 border rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                  isDark ? 'border-[#333842] hover:bg-[#333842] text-gray-300' : 'border-slate-300 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <Share2 className="w-4 h-4" />
                <span>مشاركة PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
