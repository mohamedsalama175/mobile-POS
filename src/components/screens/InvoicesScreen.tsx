import React, { useState, useEffect } from 'react';
import { SalesInvoice, SalesOrder, Customer, LineItem } from '../../types';
import { storageService } from '../../services/storage';
import { soundService } from '../../services/sound';
import { useApp } from '../../context/AppContext';
import { CustomerPicker } from '../common/CustomerPicker';
import { LineItemEditor } from '../common/LineItemEditor';
import { TotalsSummary } from '../common/TotalsSummary';
import { WizardHeader, StickyBottomBar, NumericKeypad, AuthGate } from '../ui';
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
  RotateCcw,
  ChevronDown,
  ChevronUp,
  FileCheck,
  CreditCard,
  Banknote,
  X,
  Building,
  User,
  Phone,
  Check,
  ArrowRight,
  ArrowLeft,
  DollarSign
} from 'lucide-react';

export const InvoicesScreen: React.FC = () => {
  const { language, theme, currentUser, showToast, refreshPendingCount, openReceipt, setHideBottomNav } = useApp();
  const [view, setView] = useState<'list' | 'create'>('list');
  const [invoices, setInvoices] = useState<SalesInvoice[]>([]);
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const isDark = theme === 'dark';
  const isRtl = language === 'ar';

  useEffect(() => {
    setHideBottomNav(view === 'create');
    return () => setHideBottomNav(false);
  }, [view, setHideBottomNav]);

  // Wizard state: 1: Order/Customer, 2: Line Items, 3: Payment & Cash
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1);

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

  // Cash Authentication Gate state
  const [isAuthGateOpen, setIsAuthGateOpen] = useState(false);
  const [pendingPrintAfterAuth, setPendingPrintAfterAuth] = useState(false);

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
      isRtl
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

  // Wizard Step Navigation
  const handleNextStep = () => {
    soundService.playClick();
    if (wizardStep === 1) {
      if (!selectedCustomer) {
        soundService.playError();
        showToast(isRtl ? 'يرجى تحديد العميل أو اختيار طلب بيع' : 'Please select customer or order', 'error');
        return;
      }
      setWizardStep(2);
    } else if (wizardStep === 2) {
      if (items.length === 0) {
        soundService.playError();
        showToast(isRtl ? 'أضف صنفاً واحداً على الأقل للفاتورة' : 'Add at least one line item', 'error');
        return;
      }
      setWizardStep(3);
    }
  };

  const handlePrevStep = () => {
    soundService.playClick();
    if (wizardStep > 1) {
      setWizardStep((prev) => (prev - 1) as any);
    } else {
      setView('list');
    }
  };

  // Trigger Save with optional PIN Auth for Cash
  const initiateSave = (shouldPrint: boolean) => {
    if (!selectedCustomer) {
      setWizardStep(1);
      showToast(isRtl ? 'يرجى تحديد العميل' : 'Please select a customer', 'error');
      return;
    }
    if (items.length === 0) {
      setWizardStep(2);
      showToast(isRtl ? 'أضف صنفاً واحداً على الأقل للفاتورة' : 'Add at least one line item', 'error');
      return;
    }

    if (isCashPayment) {
      const parsedPaid = Number(paidAmountInput);
      if (isNaN(parsedPaid) || parsedPaid <= 0) {
        soundService.playError();
        showToast(
          isRtl
            ? 'يرجى إدخال مبلغ محصل أكبر من صفر عبر لوحة المفاتيح'
            : 'Please enter collected amount greater than zero',
          'error'
        );
        return;
      }
      if (parsedPaid > netDue) {
        soundService.playError();
        showToast(
          isRtl
            ? `المبلغ المحصل (${parsedPaid}) لا يمكن أن يتجاوز إجمالي الفاتورة (${netDue.toFixed(2)})`
            : `Collected amount cannot exceed invoice net due`,
          'error'
        );
        return;
      }

      // Cash Movement Security: Open AuthGate PIN modal
      setPendingPrintAfterAuth(shouldPrint);
      setIsAuthGateOpen(true);
      return;
    }

    // Direct save for credit (non-cash) invoice
    commitInvoice(shouldPrint);
  };

  // Final Commit to Storage
  const commitInvoice = (shouldPrint: boolean) => {
    const saved = storageService.saveInvoice({
      linkedOrderNumber: selectedOrder?.orderNumber,
      date: invoiceDate,
      customerId: selectedCustomer!.id,
      customerName: selectedCustomer!.name,
      customerTaxNumber: selectedCustomer!.taxNumber,
      customerPhone: selectedCustomer!.phone,
      creditLimit: selectedCustomer!.creditLimit,
      customerBranch: selectedCustomer!.branchName || 'الفرع الرئيسي',
      invoiceType: isCashPayment ? 'cash' : invoiceType,
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
      isRtl
        ? `تم إصدار الفاتورة: ${saved.invoiceNumber}${isCashPayment ? ` (تحصيل: ${Number(paidAmountInput).toLocaleString()} ج.م)` : ''}`
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
    setWizardStep(1);
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
  // VIEW: 3-STEP WIZARD (CREATE INVOICE)
  // ==========================================
  if (view === 'create') {
    return (
      <div
        id="create-invoice-screen"
        className={`flex-1 flex flex-col min-h-0 ${
          isDark ? 'bg-[#121417] text-[#F5F6F7]' : 'bg-[#F9FAFB] text-gray-900'
        }`}
      >
        {/* Wizard Header */}
        <WizardHeader
          currentStep={wizardStep}
          totalSteps={3}
          title={
            wizardStep === 1
              ? (isRtl ? 'تحديد العميل أو الطلب' : 'Customer or Order')
              : wizardStep === 2
              ? (isRtl ? `مراجعة الأصناف (${items.length})` : `Review Items (${items.length})`)
              : (isRtl ? 'طريقة السداد والتحصيل' : 'Payment & Cash Collection')
          }
          subtitle={
            wizardStep === 1
              ? (isRtl ? 'اختر طلب بيع لتحويله أو حدد عميلاً مباشرة' : 'Convert existing order or select customer directly')
              : wizardStep === 2
              ? (isRtl ? 'تحقق من الكميات والخصم وإجمالي الفاتورة' : 'Verify quantities, discounts and net due')
              : (isRtl ? 'حدد السداد النقدي أو الآجل وأدخل المبلغ المحصل' : 'Choose cash or credit and record collected cash')
          }
          onBack={handlePrevStep}
        />

        <div className="flex-1 overflow-y-auto p-3 sm:p-5 pb-24">
          <div className="max-w-4xl mx-auto w-full space-y-4">
          {/* STEP 1: SELECT ORDER OR DIRECT CUSTOMER */}
          {wizardStep === 1 && (
            <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-150">
              {/* Confirmed Orders to convert */}
              {orders.length > 0 && (
                <div
                  className={`p-3.5 rounded-2xl border space-y-2.5 ${
                    isDark ? 'bg-[#1C1F24] border-[#333842]' : 'bg-white border-gray-200 shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {isRtl ? 'تحويل من طلب بيع مؤكد (سريع)' : 'Convert Confirmed Order (Fast)'}
                    </span>
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
                        {isRtl ? 'إلغاء الربط' : 'Unlink'}
                      </button>
                    )}
                  </div>

                  <select
                    value={selectedOrder?.id || ''}
                    onChange={(e) => {
                      const found = orders.find(o => o.id === e.target.value);
                      if (found) handleLinkOrder(found);
                    }}
                    className={`w-full h-12 px-3 rounded-xl border text-xs outline-none transition-colors ${
                      isDark
                        ? 'border-[#333842] bg-[#121417] text-white focus:border-blue-500'
                        : 'border-gray-200 bg-gray-50 text-gray-900 focus:bg-white focus:border-blue-500'
                    }`}
                  >
                    <option value="">
                      {isRtl ? '-- اضغط لاختيار طلب بيع مؤكد --' : '-- Tap to select confirmed order --'}
                    </option>
                    {orders.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.orderNumber} - {o.customerName} ({o.netDue.toFixed(2)} {isRtl ? 'ج.م' : 'EGP'})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Customer Picker */}
              <div
                className={`p-3.5 rounded-2xl border ${
                  isDark ? 'bg-[#1C1F24] border-[#333842]' : 'bg-white border-gray-200 shadow-sm'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {isRtl ? 'العميل المستلم للفاتورة *' : 'Invoice Customer *'}
                  </span>
                  {selectedCustomer && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400">
                      {isRtl ? 'تم التحديد' : 'Selected'}
                    </span>
                  )}
                </div>
                <CustomerPicker
                  selectedCustomer={selectedCustomer}
                  onSelectCustomer={(c) => {
                    setSelectedCustomer(c);
                    soundService.playClick();
                  }}
                />
              </div>

              {/* Warehouse & Date info */}
              <div
                className={`p-3.5 rounded-2xl border grid grid-cols-2 gap-2 text-xs ${
                  isDark ? 'bg-[#1C1F24] border-[#333842]' : 'bg-white border-gray-200 shadow-sm'
                }`}
              >
                <div>
                  <label className={`text-[11px] block mb-1 font-bold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {isRtl ? 'تاريخ الفاتورة' : 'Invoice Date'}
                  </label>
                  <input
                    type="date"
                    value={invoiceDate}
                    onChange={(e) => setInvoiceDate(e.target.value)}
                    className={`w-full h-11 px-2.5 rounded-xl border outline-none font-mono text-xs ${
                      isDark ? 'border-[#333842] bg-[#121417] text-white' : 'border-gray-200 bg-gray-50 text-gray-900'
                    }`}
                  />
                </div>
                <div>
                  <label className={`text-[11px] block mb-1 font-bold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {isRtl ? 'المخزن المصدر' : 'Warehouse'}
                  </label>
                  <select
                    value={warehouse}
                    onChange={(e) => setWarehouse(e.target.value)}
                    className={`w-full h-11 px-2.5 rounded-xl border text-xs outline-none truncate ${
                      isDark ? 'border-[#333842] bg-[#121417] text-white' : 'border-gray-200 bg-gray-50 text-gray-900'
                    }`}
                  >
                    {INITIAL_LOOKUP_DATA.warehouses.map((wh, idx) => (
                      <option key={idx} value={wh}>{wh}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: REVIEW LINE ITEMS */}
          {wizardStep === 2 && (
            <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-150">
              <div
                className={`rounded-2xl border p-2.5 ${
                  isDark ? 'bg-[#1C1F24] border-[#333842]' : 'bg-white border-gray-200 shadow-sm'
                }`}
              >
                <LineItemEditor
                  items={items}
                  onChangeItems={(newItems) => setItems(newItems)}
                />
              </div>

              <div id="invoice-totals-summary-container">
                <TotalsSummary
                  grossTotal={grossTotal}
                  totalDiscount={totalDiscount}
                  totalAfterDiscount={totalAfterDiscount}
                  totalTax={totalTax}
                  totalAfterTax={totalAfterTax}
                  withholdingTax={withholdingTax}
                  netDue={netDue}
                />
              </div>
            </div>
          )}

          {/* STEP 3: PAYMENT METHOD & CASH COLLECTION (US-04) */}
          {wizardStep === 3 && (
            <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-150">
              {/* Payment Mode Segment */}
              <div
                className={`p-3.5 rounded-2xl border space-y-3 ${
                  isDark ? 'bg-[#1C1F24] border-[#333842]' : 'bg-white border-gray-200 shadow-sm'
                }`}
              >
                <div className={`text-xs font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {isRtl ? 'اختر طريقة السداد *' : 'Select Payment Method *'}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      soundService.playClick();
                      setIsCashPayment(false);
                      setInvoiceType('credit');
                      setPaidAmountInput('');
                    }}
                    className={`h-14 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${
                      !isCashPayment
                        ? 'bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-400 ring-offset-1'
                        : isDark
                        ? 'border-[#333842] bg-[#121417] text-gray-300 hover:bg-[#252932]'
                        : 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <CreditCard className="w-5 h-5" />
                    <span className="text-xs font-bold">{isRtl ? 'آجل (على الحساب)' : 'Credit (On Account)'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      soundService.playClick();
                      setIsCashPayment(true);
                      setInvoiceType('cash');
                      if (!paidAmountInput) {
                        setPaidAmountInput(String(netDue));
                      }
                    }}
                    className={`h-14 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${
                      isCashPayment
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-md ring-2 ring-emerald-400 ring-offset-1'
                        : isDark
                        ? 'border-[#333842] bg-[#121417] text-gray-300 hover:bg-[#252932]'
                        : 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Banknote className="w-5 h-5" />
                    <span className="text-xs font-bold">{isRtl ? 'سداد نقدي فوري' : 'Cash Payment'}</span>
                  </button>
                </div>
              </div>

              {/* Cash Numeric Keypad & Live Balance (US-04) */}
              {isCashPayment ? (
                <div
                  className={`p-3.5 rounded-2xl border space-y-3.5 ${
                    isDark ? 'bg-[#1C1F24] border-emerald-500/30' : 'bg-white border-emerald-200 shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {isRtl ? 'إدخال المبلغ المحصل نقداً (ج.م) *' : 'Enter Collected Cash (EGP) *'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setPaidAmountInput(String(netDue))}
                      className="text-[11px] font-bold text-emerald-500 hover:underline"
                    >
                      {isRtl ? 'سداد كامل المبلغ' : 'Pay Full Due'}
                    </button>
                  </div>

                  {/* Numeric Keypad with Quick Chips & Live Change Due */}
                  <NumericKeypad
                    value={paidAmountInput}
                    onChange={(val) => setPaidAmountInput(String(val))}
                    totalRequired={netDue}
                    maxAmount={netDue}
                    quickPresets={[50, 100, 200, 500]}
                    currency={isRtl ? 'ج.م' : 'EGP'}
                    language={language}
                  />
                </div>
              ) : (
                /* Credit Summary */
                <div
                  className={`p-4 rounded-2xl border space-y-2 text-xs ${
                    isDark ? 'bg-[#1C1F24] border-[#333842]' : 'bg-white border-gray-200 shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">{isRtl ? 'المبلغ المستحق على العميل:' : 'Due Amount:'}</span>
                    <span className="font-mono font-bold text-sm text-blue-500">
                      {netDue.toFixed(2)} {isRtl ? 'ج.م' : 'EGP'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">{isRtl ? 'حد الائتمان المتبقي:' : 'Available Credit:'}</span>
                    <span className="font-mono font-bold text-emerald-400">
                      {(selectedCustomer?.creditLimit || 0).toLocaleString()} {isRtl ? 'ج.م' : 'EGP'}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 pt-1 border-t border-inherit">
                    {isRtl
                      ? 'سيتم إضافة إجمالي الفاتورة إلى الرصيد المدين للعميل دون تحصيل نقدي.'
                      : 'The full net due will be added to the customer AR balance without immediate cash collection.'}
                  </p>
                </div>
              )}
            </div>
          )}
          </div>
        </div>

        {/* Wizard Sticky Bottom Action Bar */}
        <StickyBottomBar
          primaryText={
            wizardStep === 1
              ? (isRtl ? 'التالي: الأصناف' : 'Next: Items')
              : wizardStep === 2
              ? (isRtl ? 'التالي: السداد' : 'Next: Payment')
              : (isRtl ? 'إصدار الفاتورة وحفظها' : 'Issue & Save Invoice')
          }
          primaryIcon={wizardStep === 3 ? <Check className="w-5 h-5" /> : isRtl ? <ArrowLeft className="w-5 h-5" /> : <ArrowRight className="w-5 h-5" />}
          onPrimary={wizardStep === 3 ? () => initiateSave(false) : handleNextStep}
          secondaryText={wizardStep === 1 ? (isRtl ? 'إلغاء' : 'Cancel') : (isRtl ? 'السابق' : 'Back')}
          secondaryIcon={wizardStep === 1 ? <X className="w-4 h-4" /> : isRtl ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
          onSecondary={handlePrevStep}
          summaryValue={items.length > 0 ? netDue.toFixed(2) : undefined}
          summaryLabel={isRtl ? 'صافي الفاتورة' : 'Invoice Total'}
        />

        {/* AuthGate PIN Modal for Cash Movement */}
        <AuthGate
          isOpen={isAuthGateOpen}
          onClose={() => {
            setIsAuthGateOpen(false);
            showToast(isRtl ? 'تم إلغاء تأكيد العملية النقدية' : 'Cash transaction cancelled', 'info');
          }}
          onSuccess={() => {
            setIsAuthGateOpen(false);
            commitInvoice(pendingPrintAfterAuth);
          }}
          amount={Number(paidAmountInput || 0)}
          currency={isRtl ? 'ج.م' : 'EGP'}
          title={isRtl ? 'تأكيد عملية التحصيل النقدي' : 'Confirm Cash Collection'}
          description={
            isRtl
              ? `أدخل رمز PIN لتسجيل تحصيل مبلغ ${Number(paidAmountInput || 0).toLocaleString()} ج.م في عهدة المندوب (${currentUser.displayName})`
              : `Enter PIN to register ${Number(paidAmountInput || 0).toLocaleString()} EGP in rep cash custody`
          }
        />
      </div>
    );
  }

  // ==========================================
  // VIEW: LIST SCREEN
  // ==========================================
  return (
    <div
      id="invoices-list-screen"
      className={`flex-1 flex flex-col min-h-0 relative ${
        isDark ? 'bg-[#121417] text-[#F5F6F7]' : 'bg-[#F9FAFB] text-gray-900'
      }`}
    >
      {/* Top Action & Filter Header */}
      <div
        className={`p-3 sm:px-6 border-b shrink-0 ${
          isDark ? 'border-[#333842] bg-[#1C1F24]' : 'border-gray-200 bg-white'
        }`}
      >
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-3">
          <button
            id="create-new-invoice-btn"
            onClick={() => {
              soundService.playClick();
              setSelectedOrder(null);
              setSelectedCustomer(null);
              setItems([]);
              setWizardStep(1);
              setView('create');
            }}
            className={`flex-1 h-12 text-white rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-sm active:scale-98 min-h-[48px] ${
              isDark
                ? 'bg-blue-600 hover:bg-blue-500 active:bg-blue-700'
                : 'bg-[#252B37] hover:bg-[#1E232D] active:bg-black'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>{isRtl ? 'إصدار فاتورة بيع جديدة' : 'New Sales Invoice'}</span>
          </button>

          {/* Filter Toggle Button */}
          <button
            id="invoices-filter-toggle"
            onClick={() => setShowFilters(!showFilters)}
            className={`h-12 px-3.5 rounded-xl border flex items-center gap-1.5 text-xs font-semibold transition-colors min-h-[48px] min-w-[48px] ${
              showFilters
                ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                : isDark
                ? 'bg-[#262A31] border-[#333842] text-gray-300 hover:text-white'
                : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
            }`}
            title={isRtl ? 'تصفية وبحث' : 'Filter'}
          >
            <Filter className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter Drawer */}
      {showFilters && (
        <div
          id="invoices-filter-panel"
          className={`p-3 sm:px-6 border-b transition-all ${
            isDark ? 'bg-[#16181D] border-[#333842]' : 'bg-gray-50 border-gray-200'
          }`}
        >
          <div className="max-w-7xl mx-auto w-full space-y-3 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              <div>
                <label className={`text-[10px] block mb-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {isRtl ? 'رقم الفاتورة' : 'Invoice #'}
                </label>
                <input
                  type="text"
                  value={filterInvoiceNo}
                  onChange={(e) => setFilterInvoiceNo(e.target.value)}
                  placeholder="INV-..."
                  className={`w-full h-9 px-2 rounded-lg border font-mono text-xs outline-none ${
                    isDark ? 'border-[#333842] bg-[#1C1F24] text-white' : 'border-gray-200 bg-white text-gray-900'
                  }`}
                />
              </div>
              <div>
                <label className={`text-[10px] block mb-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {isRtl ? 'نوع الفاتورة' : 'Type'}
                </label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className={`w-full h-9 px-2 rounded-lg border text-xs outline-none ${
                    isDark ? 'border-[#333842] bg-[#1C1F24] text-white' : 'border-gray-200 bg-white text-gray-900'
                  }`}
                >
                  <option value="all">{isRtl ? 'الكل' : 'All'}</option>
                  <option value="credit">{isRtl ? 'آجل' : 'Credit'}</option>
                  <option value="cash">{isRtl ? 'نقدي' : 'Cash'}</option>
                </select>
              </div>
              <div>
                <label className={`text-[10px] block mb-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {isRtl ? 'حالة السداد' : 'Settlement'}
                </label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className={`w-full h-9 px-2 rounded-lg border text-xs outline-none ${
                    isDark ? 'border-[#333842] bg-[#1C1F24] text-white' : 'border-gray-200 bg-white text-gray-900'
                  }`}
                >
                  <option value="all">{isRtl ? 'كل الحالات' : 'All'}</option>
                  <option value="paid">{isRtl ? 'مسددة بالكامل' : 'Paid'}</option>
                  <option value="partial">{isRtl ? 'سداد جزئي' : 'Partial'}</option>
                  <option value="unpaid">{isRtl ? 'غير مسددة' : 'Unpaid'}</option>
                </select>
              </div>
              <div>
                <label className={`text-[10px] block mb-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {isRtl ? 'العميل / الرقم الضريبي' : 'Customer / Tax'}
                </label>
                <input
                  type="text"
                  value={filterCustomer}
                  onChange={(e) => setFilterCustomer(e.target.value)}
                  placeholder={isRtl ? 'ابحث...' : 'Search...'}
                  className={`w-full h-9 px-2 rounded-lg border text-xs outline-none ${
                    isDark ? 'border-[#333842] bg-[#1C1F24] text-white' : 'border-gray-200 bg-white text-gray-900'
                  }`}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invoices List Cards */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-5 pb-24">
        <div className="max-w-7xl mx-auto w-full">
          {filteredInvoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-gray-400 space-y-3">
              <Receipt className="w-12 h-12 opacity-30 stroke-[1.5]" />
              <div className="font-bold text-sm">
                {isRtl ? 'لا توجد فواتير مبيعات مطابقة' : 'No matching sales invoices'}
              </div>
              <p className="text-xs text-gray-500 max-w-xs">
                {isRtl ? 'أنشئ فاتورة جديدة أو حوّل طلباً مؤكداً' : 'Create new invoice or convert confirmed order'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {filteredInvoices.map((inv) => {
                const isSettled = inv.settlementStatus === 'paid' || (inv.paidAmount && inv.paidAmount >= inv.netDue);
                const isPartial = inv.settlementStatus === 'partial' || (!isSettled && (inv.paidAmount || 0) > 0);
                const remaining = inv.remainingBalance !== undefined ? inv.remainingBalance : Math.max(0, inv.netDue - (inv.paidAmount || 0));

                return (
                  <div
                key={inv.id}
                onClick={() => {
                  soundService.playClick();
                  setSelectedInvoice(inv);
                }}
                className={`p-3.5 rounded-2xl border shadow-sm relative cursor-pointer active:scale-[0.99] transition-all space-y-2 ${
                  isDark
                    ? 'border-[#333842] bg-[#1C1F24] hover:border-blue-500/50'
                    : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-md'
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
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-blue-500/20 text-blue-400'
                      }`}
                    >
                      {inv.invoiceType === 'cash' || inv.isCashPayment ? (isRtl ? 'نقدي' : 'Cash') : (isRtl ? 'آجل' : 'Credit')}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {isSettled ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        {isRtl ? 'مسددة بالكامل' : 'Paid in Full'}
                      </span>
                    ) : isPartial ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                        {isRtl ? 'سداد جزئي' : 'Partially Paid'}
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-500/20 text-gray-400 border border-gray-500/30">
                        {isRtl ? 'غير مسددة' : 'Unpaid'}
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-xs">
                  <div className={`font-bold truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{inv.customerName}</div>
                  <div className={`text-[11px] flex items-center justify-between mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    <span>{inv.customerBranch || 'الفرع الرئيسي'}</span>
                    <span className="font-mono">{inv.date}</span>
                  </div>
                </div>

                {/* US-04 Cash Collection & Remaining live sub-bar */}
                {Boolean(inv.isCashPayment || (inv.paidAmount && inv.paidAmount > 0)) && (
                  <div className={`p-2 rounded-xl border flex items-center justify-between text-[11px] font-mono ${
                    isDark ? 'bg-[#121417] border-[#333842]' : 'bg-gray-50 border-gray-200'
                  }`}>
                    <span className="text-amber-400 font-bold">
                      {isRtl ? 'محصَّل:' : 'Paid:'} {(inv.paidAmount || 0).toLocaleString()} {isRtl ? 'ج.م' : 'EGP'}
                    </span>
                    <span className={remaining > 0 ? 'text-orange-400 font-bold' : 'text-emerald-400 font-bold'}>
                      {isRtl ? 'المتبقي:' : 'Due:'} {remaining.toLocaleString()} {isRtl ? 'ج.م' : 'EGP'}
                    </span>
                  </div>
                )}

                <div className={`pt-2 border-t flex items-center justify-between ${isDark ? 'border-[#333842]/50' : 'border-gray-100'}`}>
                  <span className={`text-[11px] ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    {isRtl ? 'إجمالي الفاتورة:' : 'Total Net:'}
                  </span>
                  <span className="font-mono font-bold text-sm text-blue-500">
                    {inv.netDue.toFixed(2)} {isRtl ? 'ج.م' : 'EGP'}
                  </span>
                </div>
              </div>
            );
          })}
          </div>
        )}
        </div>
      </div>

      {/* Invoice Quick Action Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm select-none">
          <div className={`w-full max-w-sm rounded-2xl border shadow-2xl flex flex-col max-h-[85vh] overflow-hidden ${
            isDark ? 'bg-[#1C1F24] border-[#333842] text-[#F5F6F7]' : 'bg-white border-gray-200 text-gray-900'
          }`}>
            <div className={`p-3 border-b flex items-center justify-between ${
              isDark ? 'border-[#333842] bg-[#262A31]' : 'border-gray-200 bg-gray-50'
            }`}>
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-blue-500" />
                <span className="font-bold text-sm">{selectedInvoice.invoiceNumber}</span>
              </div>
              <button
                onClick={() => setSelectedInvoice(null)}
                className={`p-1 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center ${
                  isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-black hover:bg-gray-100'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs">
              <div className={`flex justify-between items-center pb-2 border-b ${isDark ? 'border-[#333842]' : 'border-gray-100'}`}>
                <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>
                  {isRtl ? 'نوع الفاتورة:' : 'Invoice Type:'}
                </span>
                <span className="font-bold text-blue-500">
                  {selectedInvoice.invoiceType === 'cash' || selectedInvoice.isCashPayment
                    ? (isRtl ? 'نقدي (كاش)' : 'Cash')
                    : (isRtl ? 'آجل (على الحساب)' : 'Credit')}
                </span>
              </div>

              <div>
                <span className={`block text-[10px] ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {isRtl ? 'العميل:' : 'Customer:'}
                </span>
                <span className={`font-bold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedInvoice.customerName}</span>
                <span className={`font-mono block text-[11px] mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {isRtl ? 'الرقم الضريبي:' : 'Tax No:'} {selectedInvoice.customerTaxNumber}
                </span>
              </div>

              {/* Items List */}
              <div>
                <span className={`font-bold text-xs block mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  {isRtl ? 'أصناف الفاتورة:' : 'Invoice Items:'}
                </span>
                <div className="space-y-1.5">
                  {selectedInvoice.items.map((it, idx) => (
                    <div
                      key={idx}
                      className={`p-2.5 rounded-xl border flex justify-between items-center ${
                        isDark ? 'bg-[#121417] border-[#333842]' : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div>
                        <div className={`font-bold truncate max-w-[180px] ${isDark ? 'text-white' : 'text-gray-900'}`}>{it.name}</div>
                        <div className={`text-[10px] font-mono ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
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

              {/* US-04: Cash Payment Breakdown Card in Modal */}
              {(selectedInvoice.isCashPayment || (selectedInvoice.paidAmount && selectedInvoice.paidAmount > 0)) && (
                <div className={`p-3 rounded-xl border space-y-2 ${
                  isDark ? 'bg-amber-950/20 border-amber-500/40 text-amber-300' : 'bg-amber-50 border-amber-300 text-amber-900'
                }`}>
                  <div className="flex items-center justify-between text-xs font-bold border-b border-amber-500/20 pb-1.5">
                    <div className="flex items-center gap-1.5">
                      <Banknote className="w-4 h-4 text-amber-500" />
                      <span>{isRtl ? 'بيانات السداد النقدي وتحديث العهدة:' : 'Cash Payment & Custody Update:'}</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-500 border border-amber-500/30">
                      {selectedInvoice.settlementStatus === 'paid' ? (isRtl ? 'مسددة بالكامل' : 'Paid in Full') : (isRtl ? 'سداد جزئي' : 'Partially Paid')}
                    </span>
                  </div>

                  <div className="space-y-1 text-[11px] font-mono">
                    <div className="flex justify-between items-center">
                      <span className="opacity-80">{isRtl ? 'المبلغ المحصَّل نقداً:' : 'Collected Cash:'}</span>
                      <span className="font-bold text-amber-500">
                        {(selectedInvoice.paidAmount || 0).toLocaleString()} {isRtl ? 'ج.م' : 'EGP'}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="opacity-80">{isRtl ? 'المتبقي على حساب العميل:' : 'Remaining Balance:'}</span>
                      <span className="font-bold text-orange-500">
                        {(selectedInvoice.remainingBalance !== undefined ? selectedInvoice.remainingBalance : (selectedInvoice.netDue - (selectedInvoice.paidAmount || 0))).toLocaleString()} {isRtl ? 'ج.م' : 'EGP'}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-[10px] pt-1.5 border-t border-amber-500/20">
                      <span className="opacity-80">{isRtl ? 'المندوب المسند للعهدة:' : 'Assigned Rep:'}</span>
                      <span className="font-bold">{selectedInvoice.salesRep}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Grand Total */}
              <div className={`p-3 rounded-xl border flex justify-between items-center font-mono ${
                isDark ? 'bg-[#262A31] border-[#333842]' : 'bg-gray-100 border-gray-200'
              }`}>
                <span className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  {isRtl ? 'الإجمالي المستحق:' : 'Total Net:'}
                </span>
                <span className="text-base font-bold text-blue-500">
                  {selectedInvoice.netDue.toFixed(2)} {isRtl ? 'ج.م' : 'EGP'}
                </span>
              </div>
            </div>

            {/* Quick Actions Footer */}
            <div className={`p-3 border-t grid grid-cols-2 gap-2 ${
              isDark ? 'border-[#333842] bg-[#262A31]' : 'border-gray-200 bg-gray-50'
            }`}>
              <button
                type="button"
                onClick={() => {
                  openReceipt(selectedInvoice, 'invoice');
                  setSelectedInvoice(null);
                }}
                className="h-11 min-h-[44px] bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
              >
                <Printer className="w-4 h-4" />
                <span>{isRtl ? 'طباعة حرارية' : 'Thermal Print'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  showToast(isRtl ? 'تم تجهيز نسخة الفاتورة الرقمية بصيغة PDF' : 'Digital PDF generated', 'info');
                  setSelectedInvoice(null);
                }}
                className={`h-11 min-h-[44px] border rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                  isDark ? 'border-[#333842] hover:bg-[#333842] text-gray-300' : 'border-gray-300 hover:bg-gray-100 text-gray-700'
                }`}
              >
                <Share2 className="w-4 h-4" />
                <span>{isRtl ? 'مشاركة PDF' : 'Share PDF'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
