import React, { useState, useEffect } from 'react';
import { SalesOrder, Customer, LineItem } from '../../types';
import { storageService } from '../../services/storage';
import { soundService } from '../../services/sound';
import { useApp } from '../../context/AppContext';
import { CustomerPicker } from '../common/CustomerPicker';
import { LineItemEditor } from '../common/LineItemEditor';
import { TotalsSummary } from '../common/TotalsSummary';
import { ItemThumbnail } from '../common/ItemThumbnail';
import { INITIAL_LOOKUP_DATA, GET_SAMPLE_20_LINE_ITEMS, MOCK_CUSTOMERS } from '../../data/mockData';
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
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  Receipt,
  Copy,
  Printer,
  Package,
  Layers,
  Sparkles,
  X
} from 'lucide-react';

export const OrdersScreen: React.FC = () => {
  const { language, theme, currentUser, showToast, refreshPendingCount, openReceipt, setActiveTab } = useApp();
  const [view, setView] = useState<'list' | 'create'>('list'); // Default to list view so 'قائمة الطلبات' is immediately visible
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const isDark = theme === 'dark';

  // Filters state
  const [showFilters, setShowFilters] = useState(false);
  const [filterOrderNo, setFilterOrderNo] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [filterCustomer, setFilterCustomer] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Selected Order for detail view
  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null);

  // Form state for Create screen - PRE-POPULATED WITH 20 ITEMS FOR UI/UX TESTING
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(() => {
    const custs = storageService.getCustomers();
    return custs.find(c => c.id === 'cust-1') || custs[0] || null;
  });
  const [requesterName, setRequesterName] = useState('خالد عبد الله');
  const [requesterPhone, setRequesterPhone] = useState('0509988776');
  const [orderDate, setOrderDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [subCompany, setSubCompany] = useState(INITIAL_LOOKUP_DATA.subCompanies[0]);
  const [itemType, setItemType] = useState(INITIAL_LOOKUP_DATA.itemTypes[0]);
  const [warehouse, setWarehouse] = useState(INITIAL_LOOKUP_DATA.warehouses[0]);
  const [salesRep, setSalesRep] = useState(currentUser.displayName);
  const [items, setItems] = useState<LineItem[]>(() => GET_SAMPLE_20_LINE_ITEMS());

  // Collapsible section states
  const [customerSectionOpen, setCustomerSectionOpen] = useState(false); // Collapsed so items are immediately in full view
  const [requesterSectionOpen, setRequesterSectionOpen] = useState(false);
  const [orderInfoSectionOpen, setOrderInfoSectionOpen] = useState(false); // Collapsed to prioritize 20 items scrolling
  const [itemsSectionOpen, setItemsSectionOpen] = useState(true);

  // Form error tracking
  const [formErrors, setFormErrors] = useState<string[]>([]);

  // Function to load/reload 20 test items on demand
  const load20TestItems = () => {
    const custs = storageService.getCustomers();
    const testCustomer = custs.find(c => c.id === 'cust-1') || custs[0] || null;
    setSelectedCustomer(testCustomer);
    setRequesterName('خالد عبد الله');
    setRequesterPhone('0509988776');
    setItems(GET_SAMPLE_20_LINE_ITEMS());
    setCustomerSectionOpen(false);
    setItemsSectionOpen(true);
    soundService.playScanSuccess();
    showToast(
      language === 'ar'
        ? 'تم تحميل 35 صنفاً مصنفاً (10 شيبسي + 15 زيوت شل + 10 عصائر) بنجاح'
        : 'Loaded 35 categorized items (10 Chipsy + 15 Shell Oil + 10 Juices)',
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

  // Live Totals Calculations (§3.6)
  const {
    grossTotal,
    totalDiscount,
    totalAfterDiscount,
    totalTax,
    totalAfterTax,
    withholdingTax,
    netDue
  } = calculateDocumentTotals(items);

  // Handle Save
  const handleSave = () => {
    const errors: string[] = [];
    if (!selectedCustomer) {
      errors.push(language === 'ar' ? 'يرجى اختيار العميل' : 'Please select a customer');
    }
    if (items.length === 0) {
      errors.push(language === 'ar' ? 'يرجى إضافة صنف واحد على الأقل' : 'Please add at least one line item');
    }
    if (!orderDate) {
      errors.push(language === 'ar' ? 'تاريخ الطلب مطلوب' : 'Order date is required');
    }

    if (errors.length > 0) {
      setFormErrors(errors);
      soundService.playError();
      showToast(errors[0], 'error');
      return;
    }

    setFormErrors([]);

    const newOrder = storageService.saveOrder({
      date: orderDate,
      customerId: selectedCustomer!.id,
      customerName: selectedCustomer!.name,
      customerTaxNumber: selectedCustomer!.taxNumber,
      customerPhone: selectedCustomer!.phone,
      creditLimit: selectedCustomer!.creditLimit,
      customerBranch: selectedCustomer!.branchName || 'الفرع الرئيسي',
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

    soundService.playScanSuccess();
    showToast(
      language === 'ar'
        ? `تم حفظ طلب البيع بنجاح: ${newOrder.orderNumber}`
        : `Sales order saved successfully: ${newOrder.orderNumber}`,
      'success'
    );

    // Reset & return to list
    resetForm();
    loadOrders();
    setView('list');
  };

  const resetForm = () => {
    setSelectedCustomer(null);
    setRequesterName('');
    setRequesterPhone('');
    setOrderDate(new Date().toISOString().split('T')[0]);
    setItems([]);
    setFormErrors([]);
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

  // Status Chip Renderer
  const renderStatusChip = (status: SalesOrder['status']) => {
    switch (status) {
      case 'confirmed':
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400">
            {language === 'ar' ? 'مؤكد' : 'Confirmed'}
          </span>
        );
      case 'delivered':
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
            {language === 'ar' ? 'تم التسليم' : 'Delivered'}
          </span>
        );
      case 'cancelled':
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/20 text-red-400">
            {language === 'ar' ? 'ملغي' : 'Cancelled'}
          </span>
        );
      default:
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-500/20 text-gray-400">
            {language === 'ar' ? 'مسودة' : 'Draft'}
          </span>
        );
    }
  };

  const renderSyncBadge = (sync: SalesOrder['syncStatus']) => {
    if (sync === 'synced') {
      return (
        <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400" title="Synced with server">
          <CheckCircle2 className="w-3 h-3" />
          <span>{language === 'ar' ? 'متزامن' : 'Synced'}</span>
        </span>
      );
    }
    if (sync === 'failed') {
      return (
        <span className="flex items-center gap-1 text-[10px] font-bold text-red-400" title="Server rejected">
          <AlertCircle className="w-3 h-3" />
          <span>{language === 'ar' ? 'فشل مزامنة' : 'Failed'}</span>
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 text-[10px] font-bold text-amber-400" title="Pending upload in outbox">
        <Clock className="w-3 h-3" />
        <span>{language === 'ar' ? 'معلق محلياً' : 'Pending'}</span>
      </span>
    );
  };

  // ==========================================
  // VIEW: CREATE SCREEN (§4.2)
  // ==========================================
  if (view === 'create') {
    return (
      <div
        id="create-order-screen"
        className={`flex-1 flex flex-col min-h-0 ${
          isDark ? 'bg-[#121417] text-[#F5F6F7]' : 'bg-[#F9FAFB] text-gray-900'
        }`}
      >
        {/* Top Module Sub-Navigation Switcher */}
        <div
          className={`p-2 border-b flex items-center gap-2 shrink-0 ${
            isDark ? 'border-[#333842] bg-[#16181D]' : 'border-gray-200 bg-white'
          }`}
        >
          <button
            type="button"
            id="tab-go-to-orders-list"
            onClick={() => {
              soundService.playClick();
              setView('list');
            }}
            className={`flex-1 h-10 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-98 ${
              isDark
                ? 'border-[#333842] bg-[#1C1F24] hover:bg-[#252932] text-gray-300 hover:text-white'
                : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-700 shadow-sm'
            }`}
          >
            <FileText className={`w-4 h-4 ${isDark ? 'text-blue-400' : 'text-gray-500'}`} />
            <span>{language === 'ar' ? `قائمة الطلبات (${orders.length})` : `Orders List (${orders.length})`}</span>
          </button>

          <button
            type="button"
            id="tab-active-create-order"
            className={`flex-1 h-10 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm cursor-default ${
              isDark ? 'bg-blue-600 text-white' : 'bg-[#252B37] text-white'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>{language === 'ar' ? 'إنشاء طلب بيع جديد' : 'New Sales Order'}</span>
          </button>
        </div>

        {/* Header / Nav */}
        <div
          className={`p-3 border-b flex items-center justify-between ${
            isDark ? 'border-[#333842] bg-[#1C1F24]' : 'border-gray-200 bg-white'
          }`}
        >
          <button
            id="create-order-back-button"
            type="button"
            onClick={() => {
              soundService.playClick();
              setView('list');
            }}
            className={`flex items-center gap-1.5 text-xs font-bold transition-colors ${
              isDark ? 'text-blue-400 hover:text-blue-300' : 'text-gray-700 hover:text-black'
            }`}
          >
            {language === 'ar' ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
            <span>{language === 'ar' ? 'الرجوع إلى قائمة الطلبات' : 'Back to Orders List'}</span>
          </button>
          <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {language === 'ar' ? 'إنشاء طلب بيع جديد' : 'New Sales Order'}
          </span>
          <div className="w-12"></div>
        </div>

        {/* Quick 20-Items Test Strip */}
        <div
          id="test-mode-banner"
          className={`px-3 py-2 border-b flex items-center justify-between text-xs ${
            isDark
              ? 'bg-gradient-to-r from-blue-950/80 via-blue-900/60 to-indigo-950/80 border-blue-500/30'
              : 'bg-gray-100 border-gray-200'
          }`}
        >
          <div className="flex items-center gap-1.5 min-w-0">
            <span className={`w-2 h-2 rounded-full shrink-0 ${isDark ? 'bg-blue-400 animate-pulse' : 'bg-emerald-500'}`}></span>
            <span className={`font-bold text-[11px] truncate ${isDark ? 'text-white' : 'text-gray-800'}`}>
              {language === 'ar' ? 'اختبار الواجهة (UI/UX):' : 'UI/UX Testing:'}
            </span>
            <span
              className={`font-mono text-[11px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                isDark ? 'bg-blue-500/20 text-blue-300' : 'bg-gray-200 text-gray-700'
              }`}
            >
              {items.length} {language === 'ar' ? 'صنف' : 'items'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              id="reload-20-test-items-btn"
              onClick={load20TestItems}
              className={`px-2.5 py-1 rounded-lg font-bold text-[11px] flex items-center gap-1 transition-all shadow-sm ${
                isDark
                  ? 'bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white'
                  : 'bg-[#252B37] hover:bg-[#1E232D] text-white'
              }`}
              title={language === 'ar' ? 'تحميل 35 صنفاً مصنفاً (10 شيبسي + 15 شل + 10 عصائر)' : 'Reload 35 categorized items'}
            >
              <Package className="w-3.5 h-3.5" />
              <span>{language === 'ar' ? '35 صنف مصنف' : '35 Items'}</span>
            </button>

            {items.length > 0 && (
              <button
                type="button"
                id="clear-all-order-items-btn"
                onClick={() => {
                  if (confirm(language === 'ar' ? 'هل تريد تفريغ قائمة الأصناف؟' : 'Clear all items?')) {
                    setItems([]);
                    soundService.playClick();
                  }
                }}
                className={`px-2 py-1 rounded-lg border text-[11px] font-semibold transition-colors ${
                  isDark
                    ? 'border-[#333842] hover:bg-red-500/20 hover:border-red-500/40 text-gray-300 hover:text-red-300'
                    : 'border-gray-200 bg-white hover:bg-red-50 hover:border-red-200 text-gray-700 hover:text-red-600 shadow-sm'
                }`}
                title={language === 'ar' ? 'تفريغ السلة' : 'Clear all'}
              >
                {language === 'ar' ? 'تفريغ' : 'Clear'}
              </button>
            )}
          </div>
        </div>

        {/* Validation Errors Header */}
        {formErrors.length > 0 && (
          <div className="p-2.5 mx-3 mt-2 rounded-xl bg-red-500/15 border border-red-500/40 text-red-400 text-xs">
            {formErrors.map((err, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{err}</span>
              </div>
            ))}
          </div>
        )}

        {/* Stacked Form Body (§1 Single-column stacked layout) */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3 pb-32">
          {/* Quick Floating Jump Pill when reviewing 20 items */}
          {items.length >= 10 && (
            <div className="sticky top-0 z-20 flex justify-center pointer-events-none mb-1">
              <button
                type="button"
                id="jump-to-totals-pill"
                onClick={() => {
                  const el = document.getElementById('order-totals-summary-container');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="pointer-events-auto px-3.5 py-1.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold shadow-xl flex items-center gap-1.5 backdrop-blur-md transition-all active:scale-95 border border-blue-400/40"
              >
                <span>{language === 'ar' ? `الانتقال للإجمالي (${items.length} صنف)` : `Jump to Totals (${items.length} items)`}</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
          {/* 1. معلومات العميل (Customer Info) */}
          <div
            className={`rounded-2xl border overflow-hidden ${
              isDark ? 'border-[#333842] bg-[#1C1F24]' : 'border-gray-200 bg-white shadow-sm'
            }`}
          >
            <button
              type="button"
              onClick={() => setCustomerSectionOpen(!customerSectionOpen)}
              className={`w-full p-3 flex items-center justify-between border-b text-xs font-bold transition-colors ${
                isDark ? 'border-[#333842]/40 text-[#F5F6F7]' : 'border-gray-100 text-gray-900 hover:bg-gray-50/80'
              }`}
            >
              <span>
                {language === 'ar' ? 'معلومات العميل *' : 'Customer Info *'}
              </span>
              {customerSectionOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {customerSectionOpen && (
              <div className="p-3">
                <CustomerPicker
                  selectedCustomer={selectedCustomer}
                  onSelectCustomer={(c) => setSelectedCustomer(c)}
                />
              </div>
            )}
          </div>

          {/* 2. معلومات مقدم الطلب (Requester Info - Optional §4.2) */}
          <div
            className={`rounded-2xl border overflow-hidden ${
              isDark ? 'border-[#333842] bg-[#1C1F24]' : 'border-gray-200 bg-white shadow-sm'
            }`}
          >
            <button
              type="button"
              onClick={() => setRequesterSectionOpen(!requesterSectionOpen)}
              className={`w-full p-3 flex items-center justify-between border-b text-xs font-bold transition-colors ${
                isDark ? 'border-[#333842]/40 text-[#F5F6F7]' : 'border-gray-100 text-gray-900 hover:bg-gray-50/80'
              }`}
            >
              <span>
                {language === 'ar' ? 'معلومات مقدم الطلب (اختياري)' : 'Requester Info (Optional)'}
              </span>
              {requesterSectionOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {requesterSectionOpen && (
              <div className="p-3 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className={`text-[11px] block mb-1 ${isDark ? 'text-[#9AA1AC]' : 'text-gray-500 font-medium'}`}>
                    {language === 'ar' ? 'اسم مقدم الطلب' : 'Requester Name'}
                  </label>
                  <input
                    type="text"
                    value={requesterName}
                    onChange={(e) => setRequesterName(e.target.value)}
                    placeholder={language === 'ar' ? 'الاسم الثلاثي...' : 'Full name...'}
                    className={`w-full h-11 px-3 rounded-xl border outline-none text-xs transition-colors ${
                      isDark
                        ? 'border-[#333842] bg-[#121417] text-white focus:border-blue-500'
                        : 'border-gray-200 bg-gray-50 text-gray-900 focus:bg-white focus:border-[#252B37]'
                    }`}
                  />
                </div>
                <div>
                  <label className={`text-[11px] block mb-1 ${isDark ? 'text-[#9AA1AC]' : 'text-gray-500 font-medium'}`}>
                    {language === 'ar' ? 'رقم هاتف مقدم الطلب' : 'Requester Phone'}
                  </label>
                  <input
                    type="tel"
                    value={requesterPhone}
                    onChange={(e) => setRequesterPhone(e.target.value)}
                    placeholder="05XXXXXXXX"
                    className={`w-full h-11 px-3 font-mono rounded-xl border outline-none text-xs transition-colors ${
                      isDark
                        ? 'border-[#333842] bg-[#121417] text-white focus:border-blue-500'
                        : 'border-gray-200 bg-gray-50 text-gray-900 focus:bg-white focus:border-[#252B37]'
                    }`}
                  />
                </div>
              </div>
            )}
          </div>

          {/* 3. معلومات الطلب (Order Info §4.2) */}
          <div
            className={`rounded-2xl border overflow-hidden ${
              isDark ? 'border-[#333842] bg-[#1C1F24]' : 'border-gray-200 bg-white shadow-sm'
            }`}
          >
            <button
              type="button"
              onClick={() => setOrderInfoSectionOpen(!orderInfoSectionOpen)}
              className={`w-full p-3 flex items-center justify-between border-b text-xs font-bold transition-colors ${
                isDark ? 'border-[#333842]/40 text-[#F5F6F7]' : 'border-gray-100 text-gray-900 hover:bg-gray-50/80'
              }`}
            >
              <span>
                {language === 'ar' ? 'معلومات الطلب والمخزن *' : 'Order & Warehouse Info *'}
              </span>
              {orderInfoSectionOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {orderInfoSectionOpen && (
              <div className="p-3 space-y-2.5 text-xs">
                <div>
                  <label className={`text-[11px] block mb-1 ${isDark ? 'text-[#9AA1AC]' : 'text-gray-500 font-medium'}`}>
                    {language === 'ar' ? 'التاريخ *' : 'Date *'}
                  </label>
                  <input
                    type="date"
                    value={orderDate}
                    onChange={(e) => setOrderDate(e.target.value)}
                    className={`w-full h-11 px-3 rounded-xl border outline-none font-mono text-xs transition-colors ${
                      isDark
                        ? 'border-[#333842] bg-[#121417] text-white focus:border-blue-500'
                        : 'border-gray-200 bg-gray-50 text-gray-900 focus:bg-white focus:border-[#252B37]'
                    }`}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={`text-[11px] block mb-1 ${isDark ? 'text-[#9AA1AC]' : 'text-gray-500 font-medium'}`}>
                      {language === 'ar' ? 'الشركة الفرعية *' : 'Sub-Company *'}
                    </label>
                    <select
                      value={subCompany}
                      onChange={(e) => setSubCompany(e.target.value)}
                      className={`w-full h-11 px-2 rounded-xl border text-xs outline-none truncate transition-colors ${
                        isDark
                          ? 'border-[#333842] bg-[#121417] text-white focus:border-blue-500'
                          : 'border-gray-200 bg-gray-50 text-gray-900 focus:bg-white focus:border-[#252B37]'
                      }`}
                    >
                      {INITIAL_LOOKUP_DATA.subCompanies.map((sc, i) => (
                        <option key={i} value={sc}>{sc}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={`text-[11px] block mb-1 ${isDark ? 'text-[#9AA1AC]' : 'text-gray-500 font-medium'}`}>
                      {language === 'ar' ? 'نوع الصنف *' : 'Item Type *'}
                    </label>
                    <select
                      value={itemType}
                      onChange={(e) => setItemType(e.target.value)}
                      className={`w-full h-11 px-2 rounded-xl border text-xs outline-none truncate transition-colors ${
                        isDark
                          ? 'border-[#333842] bg-[#121417] text-white focus:border-blue-500'
                          : 'border-gray-200 bg-gray-50 text-gray-900 focus:bg-white focus:border-[#252B37]'
                      }`}
                    >
                      {INITIAL_LOOKUP_DATA.itemTypes.map((it, i) => (
                        <option key={i} value={it}>{it}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={`text-[11px] block mb-1 ${isDark ? 'text-[#9AA1AC]' : 'text-gray-500 font-medium'}`}>
                      {language === 'ar' ? 'المخزن *' : 'Warehouse *'}
                    </label>
                    <select
                      value={warehouse}
                      onChange={(e) => setWarehouse(e.target.value)}
                      className={`w-full h-11 px-2 rounded-xl border text-xs outline-none truncate transition-colors ${
                        isDark
                          ? 'border-[#333842] bg-[#121417] text-white focus:border-blue-500'
                          : 'border-gray-200 bg-gray-50 text-gray-900 focus:bg-white focus:border-[#252B37]'
                      }`}
                    >
                      {INITIAL_LOOKUP_DATA.warehouses.map((wh, i) => (
                        <option key={i} value={wh}>{wh}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={`text-[11px] block mb-1 ${isDark ? 'text-[#9AA1AC]' : 'text-gray-500 font-medium'}`}>
                      {language === 'ar' ? 'منسوب المبيعات' : 'Sales Rep'}
                    </label>
                    <input
                      type="text"
                      value={salesRep}
                      readOnly
                      className={`w-full h-11 px-3 rounded-xl border text-xs outline-none truncate cursor-not-allowed ${
                        isDark
                          ? 'border-[#333842] bg-[#121417] text-gray-400'
                          : 'border-gray-200 bg-gray-100 text-gray-600'
                      }`}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 4. معلومات الأصناف (Line Items - §3.5 Largest section expanded by default) */}
          <div
            className={`rounded-2xl border overflow-hidden ${
              isDark ? 'border-[#333842] bg-[#1C1F24]' : 'border-gray-200 bg-white shadow-sm'
            }`}
          >
            <button
              type="button"
              onClick={() => setItemsSectionOpen(!itemsSectionOpen)}
              className={`w-full p-3 flex items-center justify-between border-b text-xs font-bold transition-colors ${
                isDark ? 'border-[#333842]/40 text-[#F5F6F7]' : 'border-gray-100 text-gray-900 hover:bg-gray-50/80'
              }`}
            >
              <div className="flex items-center gap-2">
                <span>
                  {language === 'ar' ? 'معلومات الأصناف *' : 'Line Items *'}
                </span>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                    isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {items.length}
                </span>
              </div>
              {itemsSectionOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {itemsSectionOpen && (
              <div className="p-3">
                <LineItemEditor
                  items={items}
                  onChangeItems={(newItems) => setItems(newItems)}
                />
              </div>
            )}
          </div>

          {/* 5. Totals Summary Card (§3.6) */}
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

        {/* Sticky Action Bar (Save & Back §3.3 & §6 56dp height) */}
        <div
          id="order-sticky-action-bar"
          className={`sticky bottom-0 z-20 p-3 border-t flex items-center gap-2 shadow-xl ${
            isDark ? 'bg-[#262A31] border-[#333842]' : 'bg-white border-gray-200'
          }`}
        >
          <button
            type="button"
            id="save-order-button"
            onClick={handleSave}
            className={`flex-1 h-14 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md active:scale-98 ${
              isDark
                ? 'bg-blue-600 hover:bg-blue-500 active:bg-blue-700'
                : 'bg-[#252B37] hover:bg-[#1E232D] active:bg-black'
            }`}
          >
            <span>{language === 'ar' ? 'حفظ طلب البيع' : 'Save Sales Order'}</span>
          </button>

          <button
            type="button"
            id="cancel-order-button"
            onClick={() => setView('list')}
            className={`h-14 px-5 border rounded-xl font-semibold text-xs flex items-center justify-center transition-colors ${
              isDark
                ? 'border-[#333842] hover:bg-[#333842] text-gray-300'
                : 'border-gray-200 bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            <span>{language === 'ar' ? 'رجوع' : 'Back'}</span>
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW: LIST SCREEN (§4.1)
  // ==========================================
  return (
    <div
      id="orders-list-screen"
      className={`flex-1 flex flex-col min-h-0 ${
        isDark ? 'bg-[#121417] text-[#F5F6F7]' : 'bg-[#F9FAFB] text-gray-900'
      }`}
    >
      {/* Top Module Sub-Navigation Switcher */}
      <div
        className={`p-2 border-b flex items-center gap-2 shrink-0 ${
          isDark ? 'border-[#333842] bg-[#16181D]' : 'border-gray-200 bg-white'
        }`}
      >
        <button
          type="button"
          id="orders-list-tab-active"
          className={`flex-1 h-10 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm cursor-default ${
            isDark ? 'bg-blue-600 text-white' : 'bg-[#252B37] text-white'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>{language === 'ar' ? `قائمة الطلبات (${orders.length})` : `Orders List (${orders.length})`}</span>
        </button>

        <button
          type="button"
          id="orders-list-tab-create"
          onClick={() => {
            soundService.playClick();
            if (items.length === 0) {
              load20TestItems();
            }
            setView('create');
          }}
          className={`flex-1 h-10 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-98 ${
            isDark
              ? 'border-[#333842] bg-[#1C1F24] hover:bg-[#252932] text-gray-300 hover:text-white'
              : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-700 shadow-sm'
          }`}
        >
          <Plus className={`w-4 h-4 ${isDark ? 'text-blue-400' : 'text-gray-500'}`} />
          <span>{language === 'ar' ? 'إنشاء طلب بيع جديد' : 'New Sales Order'}</span>
          {items.length > 0 && (
            <span
              className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full font-bold ${
                isDark ? 'bg-blue-500/20 text-blue-300' : 'bg-gray-100 text-gray-700'
              }`}
            >
              {items.length}
            </span>
          )}
        </button>
      </div>

      {/* Action & Filter Bar */}
      <div
        className={`p-3 border-b flex items-center justify-between gap-2 ${
          isDark ? 'border-[#333842] bg-[#1C1F24]' : 'border-gray-200 bg-white'
        }`}
      >
        <button
          id="create-new-order-btn"
          onClick={() => {
            soundService.playClick();
            load20TestItems();
            setView('create');
          }}
          className={`flex-1 h-12 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm active:scale-98 ${
            isDark
              ? 'bg-blue-600 hover:bg-blue-500 active:bg-blue-700'
              : 'bg-[#252B37] hover:bg-[#1E232D] active:bg-black'
          }`}
        >
          <Plus className="w-4 h-4" />
          <span>{language === 'ar' ? 'إنشاء طلب بيع (20 صنف للتجربة)' : 'New Order (20 Test Items)'}</span>
        </button>

        {/* Filter Toggle Button */}
        <button
          id="orders-filter-toggle"
          onClick={() => setShowFilters(!showFilters)}
          className={`h-12 px-3 rounded-xl border flex items-center gap-1.5 text-xs font-semibold transition-colors ${
            isDark
              ? showFilters || activeFilterCount > 0
                ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                : 'bg-[#262A31] border-[#333842] text-gray-300 hover:text-white'
              : showFilters || activeFilterCount > 0
                ? 'bg-gray-200 border-gray-400 text-gray-900'
                : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
          }`}
        >
          <Filter className="w-4 h-4" />
          <span>{language === 'ar' ? 'تصفية' : 'Filter'}</span>
          {activeFilterCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-blue-500 text-white text-[10px] flex items-center justify-center font-bold">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Collapsible Filter Sheet (§4.1) */}
      {showFilters && (
        <div
          className={`p-3 border-b space-y-2.5 text-xs ${
            isDark ? 'border-[#333842] bg-[#1E2228]' : 'border-gray-200 bg-gray-50'
          }`}
        >
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={`text-[10px] block mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600 font-medium'}`}>
                {language === 'ar' ? 'رقم طلب البيع' : 'Order Number'}
              </label>
              <input
                type="text"
                value={filterOrderNo}
                onChange={(e) => setFilterOrderNo(e.target.value)}
                placeholder="SO-... / DRAFT-..."
                className={`w-full h-10 px-2.5 rounded-lg border outline-none font-mono text-xs ${
                  isDark
                    ? 'border-[#333842] bg-[#121417] text-white'
                    : 'border-gray-200 bg-white text-gray-900 focus:border-[#252B37]'
                }`}
              />
            </div>
            <div>
              <label className={`text-[10px] block mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600 font-medium'}`}>
                {language === 'ar' ? 'الحالة' : 'Status'}
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className={`w-full h-10 px-2 rounded-lg border outline-none text-xs ${
                  isDark
                    ? 'border-[#333842] bg-[#121417] text-white'
                    : 'border-gray-200 bg-white text-gray-900 focus:border-[#252B37]'
                }`}
              >
                <option value="all">{language === 'ar' ? 'الكل' : 'All'}</option>
                <option value="confirmed">{language === 'ar' ? 'مؤكد' : 'Confirmed'}</option>
                <option value="delivered">{language === 'ar' ? 'تم التسليم' : 'Delivered'}</option>
                <option value="draft">{language === 'ar' ? 'مسودة' : 'Draft'}</option>
              </select>
            </div>
          </div>

          <div>
            <label className={`text-[10px] block mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600 font-medium'}`}>
              {language === 'ar' ? 'البحث عن عميل / الرقم الضريبي' : 'Customer / Tax Number'}
            </label>
            <input
              type="text"
              value={filterCustomer}
              onChange={(e) => setFilterCustomer(e.target.value)}
              placeholder={language === 'ar' ? 'اسم العميل أو رقمه الضريبي...' : 'Customer name or tax ID...'}
              className={`w-full h-10 px-2.5 rounded-lg border outline-none text-xs ${
                isDark
                  ? 'border-[#333842] bg-[#121417] text-white'
                  : 'border-gray-200 bg-white text-gray-900 focus:border-[#252B37]'
              }`}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={`text-[10px] block mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600 font-medium'}`}>
                {language === 'ar' ? 'التاريخ من' : 'Date From'}
              </label>
              <input
                type="date"
                value={filterDateFrom}
                onChange={(e) => setFilterDateFrom(e.target.value)}
                className={`w-full h-10 px-2 rounded-lg border outline-none font-mono text-xs ${
                  isDark
                    ? 'border-[#333842] bg-[#121417] text-white'
                    : 'border-gray-200 bg-white text-gray-900 focus:border-[#252B37]'
                }`}
              />
            </div>
            <div>
              <label className={`text-[10px] block mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600 font-medium'}`}>
                {language === 'ar' ? 'التاريخ إلى' : 'Date To'}
              </label>
              <input
                type="date"
                value={filterDateTo}
                onChange={(e) => setFilterDateTo(e.target.value)}
                className={`w-full h-10 px-2 rounded-lg border outline-none font-mono text-xs ${
                  isDark
                    ? 'border-[#333842] bg-[#121417] text-white'
                    : 'border-gray-200 bg-white text-gray-900 focus:border-[#252B37]'
                }`}
              />
            </div>
          </div>

          {activeFilterCount > 0 && (
            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => {
                  setFilterOrderNo('');
                  setFilterCustomer('');
                  setFilterDateFrom('');
                  setFilterDateTo('');
                  setFilterStatus('all');
                }}
                className="text-[11px] text-rose-500 hover:underline font-semibold"
              >
                {language === 'ar' ? 'إعادة تعيين الفلاتر' : 'Reset Filters'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Orders List Cards (§1 & §4.1 Cards, not tables) */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {filteredOrders.length === 0 ? (
          <div
            id="empty-orders-view"
            className={`p-8 text-center rounded-2xl border border-dashed my-6 ${
              isDark ? 'border-[#333842]' : 'border-gray-300 bg-white'
            }`}
          >
            <FileText className="w-10 h-10 mx-auto text-gray-400 mb-2" />
            <h3 className={`text-sm font-bold ${isDark ? 'text-gray-300' : 'text-gray-800'}`}>
              {language === 'ar' ? 'لا يوجد بيانات' : 'No Data Available'}
            </h3>
            <p className="text-xs text-gray-500 mt-1 mb-4">
              {language === 'ar'
                ? 'لم يتم العثور على طلبات بيع مطابقة للفلاتر الحالية'
                : 'No sales orders found matching your search criteria'}
            </p>
            <button
              onClick={() => {
                resetForm();
                setView('create');
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors inline-flex items-center gap-1.5 shadow-sm text-white ${
                isDark ? 'bg-blue-600 hover:bg-blue-500' : 'bg-[#252B37] hover:bg-[#1E232D]'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>{language === 'ar' ? 'إنشاء طلب بيع جديد' : 'Create First Order'}</span>
            </button>
          </div>
        ) : (
          filteredOrders.map((order) => {
            const isDraft = order.orderNumber.startsWith('DRAFT');

            return (
              <div
                key={order.id}
                id={`order-card-${order.id}`}
                onClick={() => setSelectedOrder(order)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer shadow-sm relative active:scale-99 ${
                  isDark
                    ? 'border-[#333842] bg-[#1C1F24] hover:border-blue-500/50'
                    : 'border-gray-200 bg-white hover:border-gray-400'
                }`}
              >
                {/* Header: Order #, Sync Badge, Status */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
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
                    <span>{order.customerBranch} • {order.items.length} {language === 'ar' ? 'أصناف' : 'items'}</span>
                    {order.items.length >= 10 && (
                      <span className={`px-1.5 py-0.5 rounded font-bold text-[10px] ${
                        isDark ? 'bg-blue-500/20 text-blue-300' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {language === 'ar' ? `${order.items.length} صنف (اختبار)` : `${order.items.length} items (Test)`}
                      </span>
                    )}
                  </div>
                </div>

                {/* Total Net Due Hero */}
                <div className={`mt-3 pt-2.5 border-t flex items-center justify-between ${
                  isDark ? 'border-[#333842]/50' : 'border-gray-100'
                }`}>
                  <span className={`text-[11px] ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    {language === 'ar' ? 'اجمالي المستحق:' : 'Net Due:'}
                  </span>
                  <div className={`font-mono font-bold text-sm tabular-nums ${
                    isDark ? 'text-[#38BDF8]' : 'text-gray-900'
                  }`}>
                    {order.netDue.toFixed(2)} ر.س
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

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
                className={`p-1 rounded-lg transition-colors ${
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
                <span className="text-gray-500">{language === 'ar' ? 'حالة المزامنة:' : 'Sync Status:'}</span>
                {renderSyncBadge(selectedOrder.syncStatus)}
              </div>

              <div>
                <span className="text-gray-500 block text-[10px]">{language === 'ar' ? 'العميل:' : 'Customer:'}</span>
                <span className={`font-bold text-sm block mt-0.5 ${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedOrder.customerName}</span>
                <span className="font-mono text-gray-500 block text-[11px] mt-0.5">
                  {selectedOrder.customerTaxNumber} • {selectedOrder.customerPhone}
                </span>
              </div>

              <div className={`grid grid-cols-2 gap-2 text-[11px] p-2.5 rounded-xl border ${
                isDark ? 'bg-[#121417] border-[#333842]' : 'bg-gray-50 border-gray-200'
              }`}>
                <div>
                  <span className="text-gray-500 block">{language === 'ar' ? 'التاريخ:' : 'Date:'}</span>
                  <span className="font-mono font-semibold">{selectedOrder.date}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">{language === 'ar' ? 'المخزن:' : 'Warehouse:'}</span>
                  <span className="truncate block font-medium">{selectedOrder.warehouse}</span>
                </div>
              </div>

              {/* Items List */}
              <div>
                <span className={`font-bold text-xs block mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-800'}`}>
                  {language === 'ar' ? 'الأصناف المطلوبة:' : 'Ordered Items:'}
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
                            {it.enteredQty} × {it.unitPrice.toFixed(2)} | {language === 'ar' ? `الرف: ${it.shelfNumber}` : `Shelf: ${it.shelfNumber}`}
                          </div>
                        </div>
                      </div>
                      <div className={`font-mono font-bold text-xs shrink-0 ${isDark ? 'text-blue-400' : 'text-gray-900'}`}>
                        {it.lineTotal.toFixed(2)} ر.س
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
                  <span>{selectedOrder.grossTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>الضريبة (14%):</span>
                  <span>+{selectedOrder.totalTax.toFixed(2)}</span>
                </div>
                <div className={`flex justify-between font-bold text-sm pt-1 border-t ${
                  isDark ? 'border-[#333842] text-white' : 'border-gray-200 text-gray-900'
                }`}>
                  <span>الإجمالي المستحق:</span>
                  <span className={isDark ? 'text-[#38BDF8]' : 'text-gray-900'}>{selectedOrder.netDue.toFixed(2)} ر.س</span>
                </div>
              </div>
            </div>

            {/* Quick Actions Footer (§4.1: Print, Create Invoice, Return) */}
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
                className={`h-11 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-sm text-white ${
                  isDark ? 'bg-blue-600 hover:bg-blue-500' : 'bg-[#252B37] hover:bg-[#1E232D]'
                }`}
              >
                <Printer className="w-4 h-4" />
                <span>{language === 'ar' ? 'طباعة السند' : 'Print Order'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedOrder(null);
                  setActiveTab(2); // Jump to Invoices module to invoice this order
                  showToast(language === 'ar' ? 'تم الانتقال لإنشاء فاتورة' : 'Switched to invoice creation', 'info');
                }}
                className={`h-11 border rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${
                  isDark
                    ? 'border-blue-500/50 hover:bg-blue-500/10 text-blue-400'
                    : 'border-gray-300 bg-white hover:bg-gray-100 text-gray-800'
                }`}
              >
                <Receipt className="w-4 h-4" />
                <span>{language === 'ar' ? 'تحويل لفاتورة' : 'Make Invoice'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
