import React, { useState, useEffect } from 'react';
import { SalesOrder, Customer, LineItem } from '../../types';
import { storageService } from '../../services/storage';
import { soundService } from '../../services/sound';
import { useApp } from '../../context/AppContext';
import { CustomerPicker } from '../common/CustomerPicker';
import { LineItemEditor } from '../common/LineItemEditor';
import { TotalsSummary } from '../common/TotalsSummary';
import { ItemThumbnail } from '../common/ItemThumbnail';
import { WizardHeader, StickyBottomBar } from '../ui';
import { INITIAL_LOOKUP_DATA, GET_SAMPLE_20_LINE_ITEMS } from '../../data/mockData';
import { calculateDocumentTotals } from '../../utils/pricing';
import {
  Plus,
  Filter,
  Search,
  Calendar,
  ChevronDown,
  ChevronUp,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Receipt,
  Printer,
  Package,
  Layers,
  Sparkles,
  X,
  Building,
  User,
  Phone,
  CreditCard,
  Check,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';

export const OrdersScreen: React.FC = () => {
  const { language, theme, currentUser, showToast, refreshPendingCount, openReceipt, setActiveTab, openScanner } = useApp();
  const [view, setView] = useState<'list' | 'create'>('list');
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const isDark = theme === 'dark';
  const isRtl = language === 'ar';

  // Wizard state (1: Customer, 2: Order Info, 3: Items, 4: Review)
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3 | 4>(1);
  const [directInvoice, setDirectInvoice] = useState(false);

  // Filters state
  const [showFilters, setShowFilters] = useState(false);
  const [filterOrderNo, setFilterOrderNo] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [filterCustomer, setFilterCustomer] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Selected Order for detail view
  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null);

  // Form state for Create screen
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(() => {
    const custs = storageService.getCustomers();
    return custs.find(c => c.id === 'cust-1') || custs[0] || null;
  });
  const [requesterName, setRequesterName] = useState('خالد عبد الله');
  const [requesterPhone, setRequesterPhone] = useState('0509988776');
  const [requesterAccordionOpen, setRequesterAccordionOpen] = useState(false);
  const [orderDate, setOrderDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [subCompany, setSubCompany] = useState(INITIAL_LOOKUP_DATA.subCompanies[0]);
  const [itemType, setItemType] = useState(INITIAL_LOOKUP_DATA.itemTypes[0]);
  const [warehouse, setWarehouse] = useState(INITIAL_LOOKUP_DATA.warehouses[0]);
  const [salesRep] = useState(currentUser.displayName);
  const [items, setItems] = useState<LineItem[]>(() => GET_SAMPLE_20_LINE_ITEMS());
  const [orderNotes, setOrderNotes] = useState('');

  // Function to load/reload 35 test items on demand
  const load35TestItems = () => {
    const custs = storageService.getCustomers();
    const testCustomer = custs.find(c => c.id === 'cust-1') || custs[0] || null;
    setSelectedCustomer(testCustomer);
    setRequesterName('خالد عبد الله');
    setRequesterPhone('0509988776');
    setItems(GET_SAMPLE_20_LINE_ITEMS());
    soundService.playScanSuccess();
    showToast(
      isRtl
        ? 'تم تحميل 35 صنفاً مصنفاً (10 شيبسي + 15 شل + 10 عصائر) بنجاح'
        : 'Loaded 35 categorized items (10 Chipsy + 15 Shell + 10 Juices)',
      'success'
    );
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = () => {
    setOrders(storageService.getOrders());
    refreshPendingCount();
  };

  // Live Totals Calculations
  const {
    grossTotal,
    totalDiscount,
    totalAfterDiscount,
    totalTax,
    totalAfterTax,
    withholdingTax,
    netDue
  } = calculateDocumentTotals(items);

  // Handle Wizard Step Navigation
  const handleNextStep = () => {
    soundService.playClick();
    if (wizardStep === 1) {
      if (!selectedCustomer) {
        soundService.playError();
        showToast(isRtl ? 'يرجى اختيار العميل أولاً للمتابعة' : 'Please select a customer first', 'error');
        return;
      }
      setWizardStep(2);
    } else if (wizardStep === 2) {
      if (!orderDate) {
        soundService.playError();
        showToast(isRtl ? 'تاريخ الطلب مطلوب' : 'Order date is required', 'error');
        return;
      }
      setWizardStep(3);
    } else if (wizardStep === 3) {
      if (items.length === 0) {
        soundService.playError();
        showToast(isRtl ? 'يرجى إضافة صنف واحد على الأقل' : 'Please add at least one line item', 'error');
        return;
      }
      setWizardStep(4);
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

  // Handle Save with Decoupled Direct Invoicing
  const handleSave = () => {
    if (!selectedCustomer) {
      setWizardStep(1);
      showToast(isRtl ? 'يرجى اختيار العميل' : 'Please select customer', 'error');
      return;
    }
    if (items.length === 0) {
      setWizardStep(3);
      showToast(isRtl ? 'يرجى إضافة أصناف للطلب' : 'Please add items', 'error');
      return;
    }

    // 1. Decoupled Primary Action: Save Sales Order in storage
    const newOrder = storageService.saveOrder({
      date: orderDate,
      customerId: selectedCustomer.id,
      customerName: selectedCustomer.name,
      customerTaxNumber: selectedCustomer.taxNumber,
      customerPhone: selectedCustomer.phone,
      creditLimit: selectedCustomer.creditLimit,
      customerBranch: selectedCustomer.branchName || 'الفرع الرئيسي',
      requesterName: requesterName.trim() || undefined,
      requesterPhone: requesterPhone.trim() || undefined,
      subCompany,
      itemType,
      warehouse,
      salesRep,
      items,
      grossTotal,
      totalDiscount,
      totalAfterDiscount,
      totalTax,
      totalAfterTax,
      withholdingTax,
      netDue,
      status: 'confirmed'
    });

    loadOrders();

    // 2. Direct Invoicing option (Decoupled: failure does not rollback the order)
    if (directInvoice) {
      try {
        const newInvoice = storageService.saveInvoice({
          linkedOrderNumber: newOrder.orderNumber,
          date: newOrder.date,
          warehouse: newOrder.warehouse,
          customerId: newOrder.customerId,
          customerName: newOrder.customerName,
          customerTaxNumber: newOrder.customerTaxNumber,
          customerPhone: newOrder.customerPhone,
          creditLimit: newOrder.creditLimit,
          customerBranch: newOrder.customerBranch,
          salesRep: newOrder.salesRep,
          items: newOrder.items,
          grossTotal: newOrder.grossTotal,
          totalDiscount: newOrder.totalDiscount,
          totalAfterDiscount: newOrder.totalAfterDiscount,
          totalTax: newOrder.totalTax,
          totalAfterTax: newOrder.totalAfterTax,
          withholdingTax: newOrder.withholdingTax,
          netDue: newOrder.netDue,
          subCompany: newOrder.subCompany,
          isCashPayment: false,
          paidAmount: 0,
          remainingBalance: newOrder.netDue,
          status: 'issued'
        });

        soundService.playScanSuccess();
        showToast(
          isRtl
            ? `تم حفظ الطلب (${newOrder.orderNumber}) وإصدار الفاتورة (${newInvoice.invoiceNumber}) بنجاح`
            : `Order (${newOrder.orderNumber}) saved & invoice (${newInvoice.invoiceNumber}) created`,
          'success'
        );
        resetForm();
        setView('list');
        setActiveTab(1); // Jump to Invoices screen to collect payment
      } catch (err) {
        console.error('Direct invoice error:', err);
        soundService.playScanSuccess();
        showToast(
          isRtl
            ? `تم حفظ الطلب (${newOrder.orderNumber}) بنجاح، ولكن تعذر إصدار الفاتورة المباشرة`
            : `Order (${newOrder.orderNumber}) saved, but direct invoice failed`,
          'warning'
        );
        resetForm();
        setView('list');
      }
    } else {
      soundService.playScanSuccess();
      showToast(
        isRtl
          ? `تم حفظ طلب البيع بنجاح: ${newOrder.orderNumber}`
          : `Sales order saved successfully: ${newOrder.orderNumber}`,
        'success'
      );
      resetForm();
      setView('list');
    }
  };

  const resetForm = () => {
    setSelectedCustomer(null);
    setRequesterName('');
    setRequesterPhone('');
    setOrderDate(new Date().toISOString().split('T')[0]);
    setItems([]);
    setWizardStep(1);
    setDirectInvoice(false);
    setOrderNotes('');
  };

  const filteredOrders = orders.filter((o) => {
    if (filterOrderNo && !o.orderNumber.toLowerCase().includes(filterOrderNo.toLowerCase())) return false;
    if (filterCustomer) {
      const match =
        o.customerName.toLowerCase().includes(filterCustomer.toLowerCase()) ||
        o.customerTaxNumber.includes(filterCustomer);
      if (!match) return false;
    }
    if (filterDateFrom && o.date < filterDateFrom) return false;
    if (filterDateTo && o.date > filterDateTo) return false;
    if (filterStatus !== 'all' && o.status !== filterStatus) return false;
    return true;
  });

  const activeFilterCount = [
    filterOrderNo,
    filterCustomer,
    filterDateFrom,
    filterDateTo,
    filterStatus !== 'all' ? filterStatus : ''
  ].filter(Boolean).length;

  const renderStatusChip = (status: SalesOrder['status']) => {
    switch (status) {
      case 'confirmed':
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400">
            {isRtl ? 'مؤكد' : 'Confirmed'}
          </span>
        );
      case 'delivered':
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
            {isRtl ? 'تم التسليم' : 'Delivered'}
          </span>
        );
      case 'cancelled':
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/20 text-red-400">
            {isRtl ? 'ملغي' : 'Cancelled'}
          </span>
        );
      default:
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-500/20 text-gray-400">
            {isRtl ? 'مسودة' : 'Draft'}
          </span>
        );
    }
  };

  const renderSyncBadge = (sync: SalesOrder['syncStatus']) => {
    if (sync === 'synced') {
      return (
        <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400" title="Synced">
          <CheckCircle2 className="w-3 h-3" />
          <span>{isRtl ? 'متزامن' : 'Synced'}</span>
        </span>
      );
    }
    if (sync === 'failed') {
      return (
        <span className="flex items-center gap-1 text-[10px] font-bold text-red-400" title="Failed">
          <AlertCircle className="w-3 h-3" />
          <span>{isRtl ? 'فشل مزامنة' : 'Failed'}</span>
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 text-[10px] font-bold text-amber-400" title="Pending">
        <Clock className="w-3 h-3" />
        <span>{isRtl ? 'معلق محلياً' : 'Pending'}</span>
      </span>
    );
  };

  // ==========================================
  // VIEW: 4-STEP WIZARD (CREATE ORDER)
  // ==========================================
  if (view === 'create') {
    return (
      <div
        id="create-order-screen"
        className={`flex-1 flex flex-col min-h-0 ${
          isDark ? 'bg-[#121417] text-[#F5F6F7]' : 'bg-[#F9FAFB] text-gray-900'
        }`}
      >
        {/* Wizard Header with Progress Dots */}
        <WizardHeader
          currentStep={wizardStep}
          totalSteps={4}
          title={
            wizardStep === 1
              ? (isRtl ? 'اختيار العميل' : 'Customer Selection')
              : wizardStep === 2
              ? (isRtl ? 'تفاصيل الطلب والمخزن' : 'Order & Warehouse')
              : wizardStep === 3
              ? (isRtl ? `الأصناف المطلوبة (${items.length})` : `Line Items (${items.length})`)
              : (isRtl ? 'المراجعة والتأكيد' : 'Review & Confirm')
          }
          subtitle={
            wizardStep === 1
              ? (isRtl ? 'حدد العميل ومقدم الطلب' : 'Select customer & requester info')
              : wizardStep === 2
              ? (isRtl ? 'حدد تاريخ الطلب، المخزن، ونوع الصنف' : 'Set order date & source warehouse')
              : wizardStep === 3
              ? (isRtl ? 'امسح الباركود وأضف الأصناف وعدّل الكميات' : 'Scan barcode or search & manage quantities')
              : (isRtl ? 'راجع الملخص المالي وخيار إصدار الفاتورة' : 'Review financial totals & direct invoice')
          }
          onBack={handlePrevStep}
        />

        {/* Wizard Step Body */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3 pb-24">
          {/* STEP 1: CUSTOMER & REQUESTER */}
          {wizardStep === 1 && (
            <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-150">
              <div
                className={`p-3.5 rounded-2xl border ${
                  isDark ? 'bg-[#1C1F24] border-[#333842]' : 'bg-white border-gray-200 shadow-sm'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {isRtl ? 'اختيار العميل *' : 'Select Customer *'}
                  </span>
                  {selectedCustomer && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400">
                      {isRtl ? 'تم الاختيار' : 'Selected'}
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

              {/* Collapsible Accordion: Requester Info */}
              <div
                className={`rounded-2xl border overflow-hidden ${
                  isDark ? 'border-[#333842] bg-[#1C1F24]' : 'border-gray-200 bg-white shadow-sm'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setRequesterAccordionOpen(!requesterAccordionOpen)}
                  className={`w-full p-3.5 flex items-center justify-between min-h-[48px] text-xs font-bold transition-colors ${
                    isDark ? 'text-gray-200 hover:bg-[#252932]' : 'text-gray-800 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-blue-400" />
                    <span>{isRtl ? 'بيانات مقدم الطلب (اختياري)' : 'Requester Details (Optional)'}</span>
                  </div>
                  {requesterAccordionOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {requesterAccordionOpen && (
                  <div className="p-3.5 pt-0 border-t border-inherit grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className={`text-[11px] block mb-1 font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {isRtl ? 'اسم مقدم الطلب' : 'Requester Name'}
                      </label>
                      <input
                        type="text"
                        value={requesterName}
                        onChange={(e) => setRequesterName(e.target.value)}
                        placeholder={isRtl ? 'الاسم الثلاثي...' : 'Full name...'}
                        className={`w-full h-11 px-3 rounded-xl border outline-none text-xs transition-colors ${
                          isDark
                            ? 'border-[#333842] bg-[#121417] text-white focus:border-blue-500'
                            : 'border-gray-200 bg-gray-50 text-gray-900 focus:bg-white focus:border-blue-500'
                        }`}
                      />
                    </div>
                    <div>
                      <label className={`text-[11px] block mb-1 font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {isRtl ? 'رقم هاتف مقدم الطلب' : 'Requester Phone'}
                      </label>
                      <input
                        type="tel"
                        value={requesterPhone}
                        onChange={(e) => setRequesterPhone(e.target.value)}
                        placeholder="01XXXXXXXXX"
                        className={`w-full h-11 px-3 font-mono rounded-xl border outline-none text-xs transition-colors ${
                          isDark
                            ? 'border-[#333842] bg-[#121417] text-white focus:border-blue-500'
                            : 'border-gray-200 bg-gray-50 text-gray-900 focus:bg-white focus:border-blue-500'
                        }`}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 2: ORDER INFO & WAREHOUSE */}
          {wizardStep === 2 && (
            <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-150">
              <div
                className={`p-3.5 rounded-2xl border space-y-3.5 ${
                  isDark ? 'bg-[#1C1F24] border-[#333842]' : 'bg-white border-gray-200 shadow-sm'
                }`}
              >
                <div>
                  <label className={`text-xs block mb-1 font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {isRtl ? 'تاريخ الطلب *' : 'Order Date *'}
                  </label>
                  <input
                    type="date"
                    value={orderDate}
                    onChange={(e) => setOrderDate(e.target.value)}
                    className={`w-full h-12 px-3 rounded-xl border outline-none font-mono text-xs transition-colors ${
                      isDark
                        ? 'border-[#333842] bg-[#121417] text-white focus:border-blue-500'
                        : 'border-gray-200 bg-gray-50 text-gray-900 focus:bg-white focus:border-blue-500'
                    }`}
                  />
                </div>

                <div>
                  <label className={`text-xs block mb-1.5 font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {isRtl ? 'المخزن المصدر *' : 'Source Warehouse *'}
                  </label>
                  <select
                    value={warehouse}
                    onChange={(e) => setWarehouse(e.target.value)}
                    className={`w-full h-12 px-3 rounded-xl border text-xs outline-none transition-colors ${
                      isDark
                        ? 'border-[#333842] bg-[#121417] text-white focus:border-blue-500'
                        : 'border-gray-200 bg-gray-50 text-gray-900 focus:bg-white focus:border-blue-500'
                    }`}
                  >
                    {INITIAL_LOOKUP_DATA.warehouses.map((wh, idx) => (
                      <option key={idx} value={wh}>{wh}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={`text-xs block mb-1.5 font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {isRtl ? 'نوع الصنف *' : 'Item Type *'}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {INITIAL_LOOKUP_DATA.itemTypes.map((it, idx) => {
                      const isSelected = itemType === it;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setItemType(it)}
                          className={`h-11 px-3 rounded-xl border text-xs font-bold flex items-center justify-center transition-all ${
                            isSelected
                              ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                              : isDark
                              ? 'border-[#333842] bg-[#121417] text-gray-300 hover:bg-[#252932]'
                              : 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          {it}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-inherit">
                  <div>
                    <label className={`text-[11px] block mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      {isRtl ? 'الشركة الفرعية' : 'Sub-Company'}
                    </label>
                    <input
                      type="text"
                      value={subCompany}
                      readOnly
                      className={`w-full h-10 px-2.5 rounded-lg border text-xs outline-none truncate ${
                        isDark ? 'border-[#333842] bg-[#121417] text-gray-400' : 'border-gray-200 bg-gray-100 text-gray-600'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`text-[11px] block mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      {isRtl ? 'المندوب المسؤول' : 'Sales Rep'}
                    </label>
                    <input
                      type="text"
                      value={salesRep}
                      readOnly
                      className={`w-full h-10 px-2.5 rounded-lg border text-xs outline-none truncate ${
                        isDark ? 'border-[#333842] bg-[#121417] text-gray-400' : 'border-gray-200 bg-gray-100 text-gray-600'
                      }`}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: LINE ITEMS */}
          {wizardStep === 3 && (
            <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-150">
              {/* Quick Actions Bar */}
              <div
                className={`p-2.5 rounded-2xl border flex items-center justify-between gap-2 ${
                  isDark ? 'bg-[#1C1F24] border-[#333842]' : 'bg-white border-gray-200 shadow-sm'
                }`}
              >
                <button
                  type="button"
                  onClick={load35TestItems}
                  className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all min-h-[44px] ${
                    isDark
                      ? 'bg-blue-600 hover:bg-blue-500 text-white'
                      : 'bg-[#252B37] hover:bg-[#1E232D] text-white shadow-sm'
                  }`}
                  title={isRtl ? 'تحميل 35 صنفاً مصنفاً' : 'Load 35 sample items'}
                >
                  <Package className="w-4 h-4" />
                  <span>{isRtl ? 'تحميل 35 صنف مصنف' : 'Sample 35 Items'}</span>
                </button>

                {items.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(isRtl ? 'هل تريد تفريغ سلة الأصناف؟' : 'Clear all items?')) {
                        setItems([]);
                        soundService.playClick();
                      }
                    }}
                    className={`px-3 py-2 rounded-xl border text-xs font-semibold transition-colors min-h-[44px] ${
                      isDark
                        ? 'border-red-500/30 text-red-400 hover:bg-red-500/10'
                        : 'border-red-200 text-red-600 bg-red-50 hover:bg-red-100'
                    }`}
                  >
                    {isRtl ? 'تفريغ السلة' : 'Clear'}
                  </button>
                )}
              </div>

              {/* Line Items Editor with Camera Scanner and Touch-friendly Steppers */}
              <div
                className={`rounded-2xl border overflow-hidden p-2.5 ${
                  isDark ? 'bg-[#1C1F24] border-[#333842]' : 'bg-white border-gray-200 shadow-sm'
                }`}
              >
                <LineItemEditor
                  items={items}
                  onChangeItems={(newItems) => setItems(newItems)}
                />
              </div>
            </div>
          )}

          {/* STEP 4: REVIEW & CONFIRM */}
          {wizardStep === 4 && (
            <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-150">
              {/* Customer & Warehouse Summary Card */}
              <div
                className={`p-3.5 rounded-2xl border space-y-2 text-xs ${
                  isDark ? 'bg-[#1C1F24] border-[#333842]' : 'bg-white border-gray-200 shadow-sm'
                }`}
              >
                <div className="flex items-center justify-between pb-2 border-b border-inherit">
                  <span className={`font-bold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {selectedCustomer?.name}
                  </span>
                  <span className="font-mono text-xs font-bold text-blue-400">
                    {orderDate}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-gray-500 block">{isRtl ? 'المخزن:' : 'Warehouse:'}</span>
                    <span className="font-medium truncate block">{warehouse}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">{isRtl ? 'عدد الأصناف:' : 'Total Items:'}</span>
                    <span className="font-bold text-blue-400 block">{items.length} {isRtl ? 'صنف' : 'items'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">{isRtl ? 'الرقم الضريبي:' : 'Tax No:'}</span>
                    <span className="font-mono">{selectedCustomer?.taxNumber || '-'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">{isRtl ? 'حد الائتمان:' : 'Credit Limit:'}</span>
                    <span className="font-mono font-bold text-emerald-400">
                      {(selectedCustomer?.creditLimit || 0).toLocaleString()} {isRtl ? 'ج.م' : 'EGP'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Direct Invoicing Toggle Card (§0 Mobile Design: direct checkout toggle) */}
              <div
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer select-none ${
                  directInvoice
                    ? isDark
                      ? 'bg-blue-950/40 border-blue-500/50 shadow-md ring-1 ring-blue-500/40'
                      : 'bg-blue-50 border-blue-300 shadow-sm ring-1 ring-blue-400/40'
                    : isDark
                    ? 'bg-[#1C1F24] border-[#333842]'
                    : 'bg-white border-gray-200 shadow-sm'
                }`}
                onClick={() => {
                  soundService.playClick();
                  setDirectInvoice(!directInvoice);
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                        directInvoice ? 'bg-blue-600 text-white' : isDark ? 'bg-[#262A31] text-gray-400' : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      <Receipt className="w-5 h-5" />
                    </div>
                    <div>
                      <div className={`font-bold text-xs ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {isRtl ? 'إصدار فاتورة بيع مباشرة الآن؟' : 'Issue Sales Invoice Directly?'}
                      </div>
                      <div className={`text-[10px] mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {isRtl
                          ? 'حفظ الطلب والانتقال فوراً لشاشة تحصيل السداد النقدي'
                          : 'Save order & immediately advance to cash collection'}
                      </div>
                    </div>
                  </div>

                  <div
                    className={`w-12 h-6 rounded-full transition-colors relative flex items-center p-0.5 ${
                      directInvoice ? 'bg-blue-600' : isDark ? 'bg-gray-700' : 'bg-gray-300'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                        directInvoice
                          ? isRtl ? '-translate-x-6' : 'translate-x-6'
                          : 'translate-x-0'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Optional Notes */}
              <div
                className={`p-3 rounded-2xl border ${
                  isDark ? 'bg-[#1C1F24] border-[#333842]' : 'bg-white border-gray-200 shadow-sm'
                }`}
              >
                <label className={`text-[11px] block mb-1 font-bold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  {isRtl ? 'ملاحظات الطلب (اختياري)' : 'Order Notes (Optional)'}
                </label>
                <textarea
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  rows={2}
                  placeholder={isRtl ? 'أي تعليمات للتسليم أو المخزن...' : 'Special instructions...'}
                  className={`w-full p-2.5 rounded-xl border outline-none text-xs transition-colors resize-none ${
                    isDark
                      ? 'border-[#333842] bg-[#121417] text-white focus:border-blue-500'
                      : 'border-gray-200 bg-gray-50 text-gray-900 focus:bg-white focus:border-blue-500'
                  }`}
                />
              </div>

              {/* Document Totals Summary */}
              <div id="order-totals-summary-container">
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
        </div>

        {/* Wizard Sticky Bottom Action Bar */}
        <StickyBottomBar
          primaryText={
            wizardStep === 1
              ? (isRtl ? 'التالي: تفاصيل الطلب' : 'Next: Order Info')
              : wizardStep === 2
              ? (isRtl ? 'التالي: الأصناف' : 'Next: Items')
              : wizardStep === 3
              ? (isRtl ? 'التالي: المراجعة' : 'Next: Review')
              : directInvoice
              ? (isRtl ? 'تأكيد وإصدار الفاتورة' : 'Confirm & Invoice')
              : (isRtl ? 'تأكيد وحفظ الطلب' : 'Confirm & Save Order')
          }
          primaryIcon={wizardStep === 4 ? <Check className="w-5 h-5" /> : isRtl ? <ArrowLeft className="w-5 h-5" /> : <ArrowRight className="w-5 h-5" />}
          onPrimary={wizardStep === 4 ? handleSave : handleNextStep}
          secondaryText={wizardStep === 1 ? (isRtl ? 'إلغاء' : 'Cancel') : (isRtl ? 'السابق' : 'Back')}
          secondaryIcon={wizardStep === 1 ? <X className="w-4 h-4" /> : isRtl ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
          onSecondary={handlePrevStep}
          summaryValue={items.length > 0 ? netDue.toFixed(2) : undefined}
          summaryLabel={isRtl ? 'صافي الطلب' : 'Net Due'}
        />
      </div>
    );
  }

  // ==========================================
  // VIEW: LIST SCREEN
  // ==========================================
  return (
    <div
      id="orders-list-screen"
      className={`flex-1 flex flex-col min-h-0 relative ${
        isDark ? 'bg-[#121417] text-[#F5F6F7]' : 'bg-[#F9FAFB] text-gray-900'
      }`}
    >
      {/* Top Action & Filter Header */}
      <div
        className={`p-3 border-b flex items-center justify-between gap-2 shrink-0 ${
          isDark ? 'border-[#333842] bg-[#1C1F24]' : 'border-gray-200 bg-white'
        }`}
      >
        <button
          id="create-new-order-btn"
          onClick={() => {
            soundService.playClick();
            if (items.length === 0) load35TestItems();
            setWizardStep(1);
            setView('create');
          }}
          className={`flex-1 h-12 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm active:scale-98 min-h-[48px] ${
            isDark
              ? 'bg-blue-600 hover:bg-blue-500 active:bg-blue-700'
              : 'bg-[#252B37] hover:bg-[#1E232D] active:bg-black'
          }`}
        >
          <Plus className="w-4 h-4" />
          <span>{isRtl ? 'إنشاء طلب بيع جديد (معالج خطوات)' : 'New Order (Wizard)'}</span>
        </button>

        {/* Filter Toggle Button */}
        <button
          id="orders-filter-toggle"
          onClick={() => setShowFilters(!showFilters)}
          className={`h-12 px-3 rounded-xl border flex items-center gap-1.5 text-xs font-semibold transition-colors min-h-[48px] min-w-[48px] ${
            isDark
              ? showFilters || activeFilterCount > 0
                ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                : 'bg-[#262A31] border-[#333842] text-gray-300 hover:text-white'
              : showFilters || activeFilterCount > 0
              ? 'bg-blue-50 border-blue-400 text-blue-700'
              : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
          }`}
          title={isRtl ? 'تصفية وبحث' : 'Filters'}
        >
          <Filter className="w-4 h-4" />
          {activeFilterCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-blue-500 text-white text-[10px] font-bold flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Filter Panel (Collapsible) */}
      {showFilters && (
        <div
          id="orders-filter-panel"
          className={`p-3 border-b space-y-2 text-xs transition-all ${
            isDark ? 'bg-[#16181D] border-[#333842]' : 'bg-gray-50 border-gray-200'
          }`}
        >
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={`text-[10px] block mb-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {isRtl ? 'رقم الطلب' : 'Order #'}
              </label>
              <input
                type="text"
                value={filterOrderNo}
                onChange={(e) => setFilterOrderNo(e.target.value)}
                placeholder="SO-..."
                className={`w-full h-9 px-2 rounded-lg border outline-none font-mono text-xs ${
                  isDark ? 'border-[#333842] bg-[#1C1F24] text-white' : 'border-gray-200 bg-white text-gray-900'
                }`}
              />
            </div>
            <div>
              <label className={`text-[10px] block mb-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {isRtl ? 'اسم العميل / الضريبي' : 'Customer / Tax'}
              </label>
              <input
                type="text"
                value={filterCustomer}
                onChange={(e) => setFilterCustomer(e.target.value)}
                placeholder={isRtl ? 'ابحث...' : 'Search...'}
                className={`w-full h-9 px-2 rounded-lg border outline-none text-xs ${
                  isDark ? 'border-[#333842] bg-[#1C1F24] text-white' : 'border-gray-200 bg-white text-gray-900'
                }`}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={`text-[10px] block mb-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {isRtl ? 'من تاريخ' : 'Date From'}
              </label>
              <input
                type="date"
                value={filterDateFrom}
                onChange={(e) => setFilterDateFrom(e.target.value)}
                className={`w-full h-9 px-2 rounded-lg border outline-none font-mono text-xs ${
                  isDark ? 'border-[#333842] bg-[#1C1F24] text-white' : 'border-gray-200 bg-white text-gray-900'
                }`}
              />
            </div>
            <div>
              <label className={`text-[10px] block mb-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {isRtl ? 'إلى تاريخ' : 'Date To'}
              </label>
              <input
                type="date"
                value={filterDateTo}
                onChange={(e) => setFilterDateTo(e.target.value)}
                className={`w-full h-9 px-2 rounded-lg border outline-none font-mono text-xs ${
                  isDark ? 'border-[#333842] bg-[#1C1F24] text-white' : 'border-gray-200 bg-white text-gray-900'
                }`}
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-1">
              <span className={`text-[10px] ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {isRtl ? 'الحالة:' : 'Status:'}
              </span>
              {['all', 'confirmed', 'delivered', 'cancelled'].map((st) => (
                <button
                  key={st}
                  onClick={() => setFilterStatus(st)}
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition-colors ${
                    filterStatus === st
                      ? 'bg-blue-600 text-white'
                      : isDark
                      ? 'bg-[#262A31] text-gray-400'
                      : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  {st === 'all'
                    ? (isRtl ? 'الكل' : 'All')
                    : st === 'confirmed'
                    ? (isRtl ? 'مؤكد' : 'Confirmed')
                    : st === 'delivered'
                    ? (isRtl ? 'مسلم' : 'Delivered')
                    : (isRtl ? 'ملغي' : 'Cancelled')}
                </button>
              ))}
            </div>

            {activeFilterCount > 0 && (
              <button
                onClick={() => {
                  setFilterOrderNo('');
                  setFilterCustomer('');
                  setFilterDateFrom('');
                  setFilterDateTo('');
                  setFilterStatus('all');
                }}
                className="text-[11px] text-blue-400 hover:underline"
              >
                {isRtl ? 'إعادة تعيين' : 'Reset'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Orders List Body */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5 pb-24">
        {filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center text-gray-400 space-y-3">
            <FileText className="w-12 h-12 opacity-30 stroke-[1.5]" />
            <div className="font-bold text-sm">
              {isRtl ? 'لا توجد طلبات بيع مطابقة' : 'No matching sales orders'}
            </div>
            <p className="text-xs text-gray-500 max-w-xs">
              {isRtl ? 'ابدأ بإنشاء طلب جديد عبر المعالج المبسط' : 'Start by creating a new order using the step wizard'}
            </p>
          </div>
        ) : (
          filteredOrders.map((order) => {
            const isDraft = order.orderNumber.startsWith('DRAFT');

            return (
              <div
                key={order.id}
                onClick={() => {
                  soundService.playClick();
                  setSelectedOrder(order);
                }}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer select-none active:scale-[0.99] ${
                  isDark
                    ? 'bg-[#1C1F24] border-[#333842] hover:border-blue-500/50 hover:bg-[#22262D]'
                    : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-md'
                }`}
              >
                {/* Header: Number & Status */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <FileText className={`w-3.5 h-3.5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                    <span className={`font-mono font-bold text-xs ${isDark ? 'text-blue-400' : 'text-gray-900'}`}>
                      {order.orderNumber}
                    </span>
                    {isDraft && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-500 font-bold">
                        Draft #
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {renderSyncBadge(order.syncStatus)}
                    {renderStatusChip(order.status)}
                  </div>
                </div>

                {/* Customer Info & Date */}
                <div className="text-xs space-y-1">
                  <div className={`font-bold truncate ${isDark ? 'text-[#F5F6F7]' : 'text-gray-900'}`}>
                    {order.customerName}
                  </div>
                  <div className={`flex items-center justify-between text-[11px] ${isDark ? 'text-[#9AA1AC]' : 'text-gray-500'}`}>
                    <span className="font-mono">
                      {order.customerTaxNumber !== '0000000000' ? order.customerTaxNumber : ''}
                    </span>
                    <span>{order.date}</span>
                  </div>
                  <div className={`text-[11px] truncate flex items-center justify-between ${isDark ? 'text-[#9AA1AC]' : 'text-gray-500'}`}>
                    <span>{order.customerBranch} • {order.items.length} {isRtl ? 'أصناف' : 'items'}</span>
                  </div>
                </div>

                {/* Total Net Due Hero */}
                <div className={`mt-3 pt-2.5 border-t flex items-center justify-between ${
                  isDark ? 'border-[#333842]/50' : 'border-gray-100'
                }`}>
                  <span className={`text-[11px] ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    {isRtl ? 'إجمالي المستحق:' : 'Net Due:'}
                  </span>
                  <div className={`font-mono font-bold text-sm tabular-nums ${
                    isDark ? 'text-[#38BDF8]' : 'text-gray-900'
                  }`}>
                    {order.netDue.toFixed(2)} {isRtl ? 'ج.م' : 'EGP'}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Floating Action Button (FAB) for Instant Order Creation */}
      <button
        id="orders-list-fab-create"
        onClick={() => {
          soundService.playClick();
          if (items.length === 0) load35TestItems();
          setWizardStep(1);
          setView('create');
        }}
        className={`fixed z-20 ${
          isRtl ? 'left-5' : 'right-5'
        } bottom-20 w-14 h-14 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-xl shadow-blue-600/30 flex items-center justify-center active:scale-95 transition-transform min-w-[56px] min-h-[56px] focus:outline-none`}
        title={isRtl ? 'إنشاء طلب بيع جديد' : 'New Sales Order'}
        aria-label={isRtl ? 'إنشاء طلب بيع جديد' : 'New Sales Order'}
      >
        <Plus className="w-7 h-7" />
      </button>

      {/* Selected Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/70 backdrop-blur-sm select-none">
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
                <FileText className={`w-4 h-4 ${isDark ? 'text-blue-400' : 'text-gray-700'}`} />
                <span className="font-bold text-sm">{selectedOrder.orderNumber}</span>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className={`p-1 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center ${
                  isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-black hover:bg-gray-100'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs">
              <div className={`flex justify-between items-center pb-2 border-b ${
                isDark ? 'border-[#333842]' : 'border-gray-100'
              }`}>
                <span className="text-gray-500">{isRtl ? 'حالة المزامنة:' : 'Sync Status:'}</span>
                {renderSyncBadge(selectedOrder.syncStatus)}
              </div>

              <div>
                <span className="text-gray-500 block text-[10px]">{isRtl ? 'العميل:' : 'Customer:'}</span>
                <span className={`font-bold text-sm block mt-0.5 ${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedOrder.customerName}</span>
                <span className="font-mono text-gray-500 block text-[11px] mt-0.5">
                  {selectedOrder.customerTaxNumber} • {selectedOrder.customerPhone}
                </span>
              </div>

              <div className={`grid grid-cols-2 gap-2 text-[11px] p-2.5 rounded-xl border ${
                isDark ? 'bg-[#121417] border-[#333842]' : 'bg-gray-50 border-gray-200'
              }`}>
                <div>
                  <span className="text-gray-500 block">{isRtl ? 'التاريخ:' : 'Date:'}</span>
                  <span className="font-mono font-semibold">{selectedOrder.date}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">{isRtl ? 'المخزن:' : 'Warehouse:'}</span>
                  <span className="truncate block font-medium">{selectedOrder.warehouse}</span>
                </div>
              </div>

              {/* Items List */}
              <div>
                <span className={`font-bold text-xs block mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-800'}`}>
                  {isRtl ? 'الأصناف المطلوبة:' : 'Ordered Items:'}
                </span>
                <div className="space-y-1.5">
                  {selectedOrder.items.map((it, idx) => (
                    <div
                      key={idx}
                      className={`p-2.5 rounded-xl border flex items-center justify-between gap-2.5 ${
                        isDark ? 'bg-[#121417] border-[#333842]' : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <ItemThumbnail src={it.imageUrl} name={it.name} size="sm" />
                        <div className="min-w-0 flex-1">
                          <div className={`font-bold text-xs truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{it.name}</div>
                          <div className="text-[10px] text-gray-500 font-mono mt-0.5">
                            {it.enteredQty} × {it.unitPrice.toFixed(2)} | {isRtl ? `الرف: ${it.shelfNumber}` : `Shelf: ${it.shelfNumber}`}
                          </div>
                        </div>
                      </div>
                      <div className={`font-mono font-bold text-xs shrink-0 ${isDark ? 'text-blue-400' : 'text-gray-900'}`}>
                        {it.lineTotal.toFixed(2)} {isRtl ? 'ج.م' : 'EGP'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals Summary */}
              <div className={`p-3 rounded-xl border space-y-1 font-mono text-[11px] ${
                isDark ? 'bg-[#262A31] border-[#333842]' : 'bg-gray-50 border-gray-200'
              }`}>
                <div className="flex justify-between text-gray-500">
                  <span>المجموع الأساسي:</span>
                  <span>{selectedOrder.grossTotal.toFixed(2)} {isRtl ? 'ج.م' : 'EGP'}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>الضريبة (14%):</span>
                  <span>+{selectedOrder.totalTax.toFixed(2)} {isRtl ? 'ج.م' : 'EGP'}</span>
                </div>
                <div className={`flex justify-between font-bold text-sm pt-1 border-t ${
                  isDark ? 'border-[#333842] text-white' : 'border-gray-200 text-gray-900'
                }`}>
                  <span>الإجمالي المستحق:</span>
                  <span className={isDark ? 'text-[#38BDF8]' : 'text-gray-900'}>
                    {selectedOrder.netDue.toFixed(2)} {isRtl ? 'ج.م' : 'EGP'}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions Footer */}
            <div
              className={`p-3 border-t grid grid-cols-2 gap-2 ${
                isDark ? 'border-[#333842] bg-[#262A31]' : 'border-gray-200 bg-gray-50'
              }`}
            >
              <button
                type="button"
                onClick={() => {
                  openReceipt(selectedOrder, 'order');
                  setSelectedOrder(null);
                }}
                className={`h-11 min-h-[44px] rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-sm text-white ${
                  isDark ? 'bg-blue-600 hover:bg-blue-500' : 'bg-[#252B37] hover:bg-[#1E232D]'
                }`}
              >
                <Printer className="w-4 h-4" />
                <span>{isRtl ? 'طباعة السند' : 'Print Order'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedOrder(null);
                  setActiveTab(1); // Jump to Invoices module (Tab 1)
                  showToast(isRtl ? 'تم الانتقال لإنشاء فاتورة' : 'Switched to invoices', 'info');
                }}
                className={`h-11 min-h-[44px] border rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${
                  isDark
                    ? 'border-blue-500/50 hover:bg-blue-500/10 text-blue-400'
                    : 'border-gray-300 bg-white hover:bg-gray-100 text-gray-800'
                }`}
              >
                <Receipt className="w-4 h-4" />
                <span>{isRtl ? 'تحويل لفاتورة' : 'Make Invoice'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
