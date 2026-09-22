import React, { useState, useEffect } from 'react';
import { SalesInvoice, SalesOrder, Customer, LineItem } from '../../types';
import { storageService } from '../../services/storage';
import { soundService } from '../../services/sound';
import { useApp } from '../../context/AppContext';
import { CustomerPicker } from '../common/CustomerPicker';
import { LineItemEditor } from '../common/LineItemEditor';
import { TotalsSummary } from '../common/TotalsSummary';
import { INITIAL_LOOKUP_DATA } from '../../data/mockData';
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

  // Totals calculations (§3.6)
  const grossTotal = items.reduce((sum, item) => sum + (item.enteredQty * item.unitPrice), 0);
  const totalDiscount = items.reduce((sum, item) => sum + (item.discount || 0), 0);
  const totalAfterDiscount = Math.max(0, grossTotal - totalDiscount);
  const totalTax = Number((totalAfterDiscount * 0.14).toFixed(2));
  const totalAfterTax = Number((totalAfterDiscount + totalTax).toFixed(2));
  const withholdingTax = Number((totalAfterDiscount * 0.01).toFixed(2));
  const netDue = Number((totalAfterTax - withholdingTax).toFixed(2));

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
      status: 'issued'
    });

    soundService.playScanSuccess();
    showToast(
      language === 'ar'
        ? `تم إصدار الفاتورة الضريبية: ${saved.invoiceNumber}`
        : `Tax invoice issued: ${saved.invoiceNumber}`,
      'success'
    );

    if (shouldPrint) {
      openReceipt(saved, 'invoice');
    }

    // Reset and return
    setSelectedOrder(null);
    setSelectedCustomer(null);
    setItems([]);
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
    if (filterStatus !== 'all' && inv.status !== filterStatus) return false;
    return true;
  });

  // ==========================================
  // VIEW: CREATE INVOICE SCREEN (§6.2)
  // ==========================================
  if (view === 'create') {
    return (
      <div id="create-invoice-screen" className="flex-1 flex flex-col min-h-0 bg-[#121417] text-[#F5F6F7]">
        {/* Header */}
        <div className="p-3 border-b border-[#333842] bg-[#1C1F24] flex items-center justify-between">
          <button
            id="create-invoice-back-button"
            type="button"
            onClick={() => {
              setView('list');
              setSelectedOrder(null);
              setSelectedCustomer(null);
              setItems([]);
            }}
            className="flex items-center gap-1.5 text-xs text-gray-300 hover:text-white"
          >
            {language === 'ar' ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
            <span>{language === 'ar' ? 'رجوع' : 'Back'}</span>
          </button>
          <span className="text-sm font-bold text-white">
            {language === 'ar' ? 'إنشاء وإصدار فاتورة بيع' : 'New Sales Invoice'}
          </span>
          <div className="w-12"></div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-3 pb-32">
          {/* Optional: Pull from Confirmed Sales Order (§6.2) */}
          <div className="rounded-2xl border border-[#333842] bg-[#1C1F24] p-3">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-blue-400">
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
                  className="text-[10px] text-rose-400 hover:underline"
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
              className="w-full h-11 px-3 rounded-xl border border-[#333842] bg-[#121417] text-white text-xs outline-none"
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
          <div className="rounded-2xl border border-[#333842] bg-[#1C1F24] p-3">
            <CustomerPicker
              selectedCustomer={selectedCustomer}
              onSelectCustomer={(c) => setSelectedCustomer(c)}
              isReadOnly={!!selectedOrder}
            />
          </div>

          {/* Invoice Type Toggle (آجل / كاش §6.1 & §6.2) */}
          <div className="rounded-2xl border border-[#333842] bg-[#1C1F24] p-3 text-xs space-y-2">
            <span className="font-bold text-gray-300 block mb-1">
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
                    : 'bg-[#121417] border-[#333842] text-gray-400 hover:text-white'
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
                    : 'bg-[#121417] border-[#333842] text-gray-400 hover:text-white'
                }`}
              >
                <Banknote className="w-4 h-4" />
                <span>{language === 'ar' ? 'نقدي (كاش فوري)' : 'Cash'}</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <div>
                <label className="text-[10px] text-gray-400 block mb-1">
                  {language === 'ar' ? 'تاريخ الفاتورة' : 'Invoice Date'}
                </label>
                <input
                  type="date"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  className="w-full h-10 px-2 rounded-lg border border-[#333842] bg-[#121417] text-white font-mono text-xs outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] text-gray-400 block mb-1">
                  {language === 'ar' ? 'المستودع' : 'Warehouse'}
                </label>
                <select
                  value={warehouse}
                  onChange={(e) => setWarehouse(e.target.value)}
                  className="w-full h-10 px-2 rounded-lg border border-[#333842] bg-[#121417] text-white text-xs outline-none truncate"
                >
                  {INITIAL_LOOKUP_DATA.warehouses.map((wh, i) => (
                    <option key={i} value={wh}>{wh}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Line Items Editor */}
          <div className="rounded-2xl border border-[#333842] bg-[#1C1F24] p-3">
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
        </div>

        {/* Sticky Action Bar (§6.2: Save & Print) */}
        <div className="sticky bottom-0 z-20 p-3 bg-[#262A31] border-t border-[#333842] flex items-center gap-2 shadow-2xl">
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
    <div id="invoices-list-screen" className="flex-1 flex flex-col min-h-0 bg-[#121417] text-[#F5F6F7]">
      {/* Top Action Bar */}
      <div className="p-3 border-b border-[#333842] bg-[#1C1F24] flex items-center justify-between gap-2">
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
              ? 'bg-blue-500/20 border-blue-500 text-blue-400'
              : 'bg-[#262A31] border-[#333842] text-gray-300 hover:text-white'
          }`}
        >
          <Filter className="w-4 h-4" />
          <span>{language === 'ar' ? 'تصفية' : 'Filter'}</span>
        </button>
      </div>

      {/* Filter drawer (§6.1) */}
      {showFilters && (
        <div className="p-3 border-b border-[#333842] bg-[#1E2228] space-y-2 text-xs">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-gray-400 block mb-1">رقم الفاتورة</label>
              <input
                type="text"
                value={filterInvoiceNo}
                onChange={(e) => setFilterInvoiceNo(e.target.value)}
                placeholder="INV-... / DRAFT-..."
                className="w-full h-10 px-2 rounded-lg border border-[#333842] bg-[#121417] text-white font-mono text-xs outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] text-gray-400 block mb-1">نوع الفاتورة</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full h-10 px-2 rounded-lg border border-[#333842] bg-[#121417] text-white text-xs outline-none"
              >
                <option value="all">الكل</option>
                <option value="credit">آجل</option>
                <option value="cash">نقدي</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[10px] text-gray-400 block mb-1">العميل / الرقم الضريبي</label>
            <input
              type="text"
              value={filterCustomer}
              onChange={(e) => setFilterCustomer(e.target.value)}
              placeholder="ابحث بالاسم أو الرقم الضريبي..."
              className="w-full h-10 px-2 rounded-lg border border-[#333842] bg-[#121417] text-white text-xs outline-none"
            />
          </div>
        </div>
      )}

      {/* Invoices List Cards (§6.1) */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {filteredInvoices.length === 0 ? (
          <div className="p-8 text-center rounded-2xl border border-dashed border-[#333842] my-6">
            <Receipt className="w-10 h-10 mx-auto text-gray-500 mb-2" />
            <h3 className="text-sm font-bold text-gray-300">
              {language === 'ar' ? 'لا يوجد فواتير صادرة' : 'No Invoices Found'}
            </h3>
            <p className="text-xs text-gray-500 mt-1 mb-4">
              {language === 'ar' ? 'اضغط الزر بالأعلى لإصدار فاتورة جديدة' : 'Tap above to create new sales invoice'}
            </p>
          </div>
        ) : (
          filteredInvoices.map((inv) => (
            <div
              key={inv.id}
              onClick={() => setSelectedInvoice(inv)}
              className="p-3.5 rounded-2xl border border-[#333842] bg-[#1C1F24] hover:border-blue-500/50 shadow-sm relative cursor-pointer active:scale-99 transition-all space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-bold text-xs text-blue-400">
                    {inv.invoiceNumber}
                  </span>
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                      inv.invoiceType === 'cash'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-blue-500/20 text-blue-400'
                    }`}
                  >
                    {inv.invoiceType === 'cash' ? 'نقدي' : 'آجل'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
                    {language === 'ar' ? 'تم الإصدار' : 'Issued'}
                  </span>
                </div>
              </div>

              <div className="text-xs">
                <div className="font-bold text-white truncate">{inv.customerName}</div>
                <div className="text-[11px] text-gray-400 flex items-center justify-between mt-0.5">
                  <span>{inv.customerBranch}</span>
                  <span className="font-mono">{inv.date}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-[#333842]/50 flex items-center justify-between">
                <span className="text-[11px] text-gray-400">
                  {language === 'ar' ? 'اجمالي المستحق:' : 'Net Due:'}
                </span>
                <span className="font-mono font-bold text-sm text-[#38BDF8]">
                  {inv.netDue.toFixed(2)} ر.س
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Invoice Quick Action Modal (§6.1: Print thermal receipt, share, details) */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm select-none">
          <div className="w-full max-w-sm rounded-2xl bg-[#1C1F24] border border-[#333842] shadow-2xl flex flex-col max-h-[85vh] overflow-hidden text-[#F5F6F7]">
            <div className="p-3 border-b border-[#333842] flex items-center justify-between bg-[#262A31]">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-blue-400" />
                <span className="font-bold text-sm">{selectedInvoice.invoiceNumber}</span>
              </div>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-[#333842]">
                <span className="text-gray-400">نوع الفاتورة:</span>
                <span className="font-bold text-blue-400">
                  {selectedInvoice.invoiceType === 'cash' ? 'نقدي (كاش)' : 'آجل (على الحساب)'}
                </span>
              </div>

              <div>
                <span className="text-gray-400 block text-[10px]">العميل:</span>
                <span className="font-bold text-sm text-white">{selectedInvoice.customerName}</span>
                <span className="font-mono text-gray-400 block text-[11px] mt-0.5">
                  الرقم الضريبي: {selectedInvoice.customerTaxNumber}
                </span>
              </div>

              {/* Items List */}
              <div>
                <span className="font-bold text-xs text-gray-300 block mb-1.5">أصناف الفاتورة:</span>
                <div className="space-y-1.5">
                  {selectedInvoice.items.map((it, idx) => (
                    <div
                      key={idx}
                      className="p-2 rounded-lg bg-[#121417] border border-[#333842] flex justify-between items-center"
                    >
                      <div>
                        <div className="font-bold truncate max-w-[180px]">{it.name}</div>
                        <div className="text-[10px] text-gray-400 font-mono">
                          {it.enteredQty} × {it.unitPrice.toFixed(2)}
                        </div>
                      </div>
                      <div className="font-mono font-bold text-blue-400">
                        {it.lineTotal.toFixed(2)} ر.س
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Grand Total */}
              <div className="p-3 rounded-xl bg-[#262A31] border border-[#333842] flex justify-between items-center font-mono">
                <span className="text-xs text-gray-300">الإجمالي المستحق:</span>
                <span className="text-base font-bold text-[#38BDF8]">
                  {selectedInvoice.netDue.toFixed(2)} ر.س
                </span>
              </div>
            </div>

            {/* Quick Actions Footer (§6.1) */}
            <div className="p-3 border-t border-[#333842] bg-[#262A31] grid grid-cols-2 gap-2">
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
                className="h-11 border border-[#333842] hover:bg-[#333842] text-gray-300 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
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
