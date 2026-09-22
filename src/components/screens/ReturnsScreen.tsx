import React, { useState, useEffect } from 'react';
import { SalesReturn, SalesOrder, LineItem } from '../../types';
import { storageService } from '../../services/storage';
import { soundService } from '../../services/sound';
import { useApp } from '../../context/AppContext';
import { LineItemEditor } from '../common/LineItemEditor';
import { TotalsSummary } from '../common/TotalsSummary';
import {
  Plus,
  Filter,
  Search,
  RotateCcw,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  FileText,
  ChevronDown,
  ChevronUp,
  X
} from 'lucide-react';

export const ReturnsScreen: React.FC = () => {
  const { language, theme, currentUser, showToast, refreshPendingCount } = useApp();
  const [view, setView] = useState<'list' | 'create'>('list');
  const [returns, setReturns] = useState<SalesReturn[]>([]);
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const isDark = theme === 'dark';

  // Filters state
  const [showFilters, setShowFilters] = useState(false);
  const [filterOrderNo, setFilterOrderNo] = useState('');
  const [filterReturnNo, setFilterReturnNo] = useState('');
  const [filterCustomer, setFilterCustomer] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Create Form State
  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null);
  const [returnDate, setReturnDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [items, setItems] = useState<LineItem[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setReturns(storageService.getReturns());
    setOrders(storageService.getOrders());
    refreshPendingCount();
  };

  // When order is selected in Create screen, pull items pre-populated
  const handleSelectSourceOrder = (order: SalesOrder) => {
    soundService.playScanSuccess();
    setSelectedOrder(order);
    const returnItems: LineItem[] = order.items.map((it) => ({
      ...it,
      maxReturnQty: it.enteredQty,
      enteredQty: it.enteredQty, // default to returning all or user adjusts
      lineTotal: Math.max(0, it.enteredQty * it.unitPrice - (it.discount || 0))
    }));
    setItems(returnItems);
  };

  // Calculations (§3.6)
  const grossTotal = items.reduce((sum, item) => sum + (item.enteredQty * item.unitPrice), 0);
  const totalDiscount = items.reduce((sum, item) => sum + (item.discount || 0), 0);
  const totalAfterDiscount = Math.max(0, grossTotal - totalDiscount);
  const totalTax = Number((totalAfterDiscount * 0.14).toFixed(2));
  const totalAfterTax = Number((totalAfterDiscount + totalTax).toFixed(2));
  const withholdingTax = Number((totalAfterDiscount * 0.01).toFixed(2));
  const netDue = Number((totalAfterTax - withholdingTax).toFixed(2));

  const handleSave = () => {
    if (!selectedOrder) {
      soundService.playError();
      showToast(language === 'ar' ? 'يرجى اختيار طلب البيع الأصلي أولاً' : 'Select source sales order', 'error');
      return;
    }

    const validItems = items.filter(it => it.enteredQty > 0);
    if (validItems.length === 0) {
      soundService.playError();
      showToast(language === 'ar' ? 'حدد كمية صنف واحد على الأقل للإرجاع' : 'Specify return qty for at least 1 item', 'error');
      return;
    }

    const newReturn = storageService.saveReturn({
      linkedOrderNumber: selectedOrder.orderNumber,
      date: returnDate,
      customerId: selectedOrder.customerId,
      customerName: selectedOrder.customerName,
      customerTaxNumber: selectedOrder.customerTaxNumber,
      customerPhone: selectedOrder.customerPhone,
      creditLimit: selectedOrder.creditLimit,
      customerBranch: selectedOrder.customerBranch,
      requesterName: selectedOrder.requesterName,
      requesterPhone: selectedOrder.requesterPhone,
      subCompany: selectedOrder.subCompany,
      itemType: selectedOrder.itemType,
      warehouse: selectedOrder.warehouse,
      salesRep: currentUser.displayName,
      items: validItems,
      grossTotal,
      totalDiscount,
      totalAfterDiscount,
      totalTax,
      totalAfterTax,
      withholdingTax,
      netDue,
      status: 'pending_approval'
    });

    soundService.playScanSuccess();
    showToast(
      language === 'ar'
        ? `تم إنشاء مرتجع طلب البيع بنجاح: ${newReturn.returnNumber}`
        : `Sales return recorded: ${newReturn.returnNumber}`,
      'success'
    );

    setSelectedOrder(null);
    setItems([]);
    loadData();
    setView('list');
  };

  const filteredReturns = returns.filter((r) => {
    if (filterReturnNo && !r.returnNumber.toLowerCase().includes(filterReturnNo.toLowerCase())) return false;
    if (filterOrderNo && !r.linkedOrderNumber.toLowerCase().includes(filterOrderNo.toLowerCase())) return false;
    if (filterCustomer) {
      const match =
        r.customerName.toLowerCase().includes(filterCustomer.toLowerCase()) ||
        r.customerTaxNumber.includes(filterCustomer);
      if (!match) return false;
    }
    if (filterDateFrom && r.date < filterDateFrom) return false;
    if (filterDateTo && r.date > filterDateTo) return false;
    if (filterStatus !== 'all' && r.status !== filterStatus) return false;
    return true;
  });

  const activeFilterCount = [
    filterOrderNo,
    filterReturnNo,
    filterCustomer,
    filterDateFrom,
    filterDateTo,
    filterStatus !== 'all' ? filterStatus : ''
  ].filter(Boolean).length;

  // ==========================================
  // VIEW: CREATE SCREEN (§5.2)
  // ==========================================
  if (view === 'create') {
    return (
      <div id="create-return-screen" className="flex-1 flex flex-col min-h-0 bg-[#121417] text-[#F5F6F7]">
        {/* Top bar */}
        <div className="p-3 border-b border-[#333842] bg-[#1C1F24] flex items-center justify-between">
          <button
            id="create-return-back-button"
            type="button"
            onClick={() => {
              setView('list');
              setSelectedOrder(null);
              setItems([]);
            }}
            className="flex items-center gap-1.5 text-xs text-gray-300 hover:text-white"
          >
            {language === 'ar' ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
            <span>{language === 'ar' ? 'رجوع للقائمة' : 'Back to List'}</span>
          </button>
          <span className="text-sm font-bold text-white">
            {language === 'ar' ? 'إنشاء طلب إرجاع' : 'New Sales Return'}
          </span>
          <div className="w-12"></div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-3 pb-32">
          {/* Step 1: Select Original Sales Order (§5.2) */}
          <div className="rounded-2xl border border-[#333842] bg-[#1C1F24] p-3">
            <label className="text-xs font-bold text-blue-400 block mb-1.5">
              {language === 'ar' ? 'اختيار طلب البيع الأصلي المراد إرجاعه *' : 'Pick Source Sales Order *'}
            </label>
            <select
              id="source-order-picker"
              value={selectedOrder?.id || ''}
              onChange={(e) => {
                const found = orders.find(o => o.id === e.target.value);
                if (found) handleSelectSourceOrder(found);
              }}
              className="w-full h-12 px-3 rounded-xl border border-[#333842] bg-[#121417] text-white text-xs outline-none"
            >
              <option value="">{language === 'ar' ? '-- اختر طلب بيع من القائمة --' : '-- Choose Sales Order --'}</option>
              {orders.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.orderNumber} - {o.customerName} ({o.netDue.toFixed(2)} ر.س) - {o.date}
                </option>
              ))}
            </select>
          </div>

          {/* If source order selected: show pre-filled details */}
          {selectedOrder && (
            <>
              {/* Order Info (Read-only mirror per §5.2) */}
              <div className="rounded-2xl border border-[#333842] bg-[#1C1F24] p-3 text-xs space-y-2">
                <span className="font-bold text-gray-400 block text-[11px]">
                  {language === 'ar' ? 'بيانات الطلب والعميل (مطابقة للأصل)' : 'Source Order Details'}
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] text-gray-500 block">العميل:</span>
                    <span className="font-bold text-white">{selectedOrder.customerName}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-500 block">الرقم الضريبي:</span>
                    <span className="font-mono text-white">{selectedOrder.customerTaxNumber}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-500 block">المخزن:</span>
                    <span className="text-white truncate block">{selectedOrder.warehouse}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-500 block">تاريخ الإرجاع:</span>
                    <input
                      type="date"
                      value={returnDate}
                      onChange={(e) => setReturnDate(e.target.value)}
                      className="font-mono text-xs text-white bg-transparent border-b border-[#333842] outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Line Items for Return */}
              <div className="rounded-2xl border border-[#333842] bg-[#1C1F24] p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-white">
                    {language === 'ar' ? 'أصناف الإرجاع (حدد الكميات المرتجعة)' : 'Return Line Items'}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const returnAll = items.map(it => ({
                        ...it,
                        enteredQty: it.maxReturnQty || it.enteredQty,
                        lineTotal: Math.max(0, (it.maxReturnQty || it.enteredQty) * it.unitPrice - it.discount)
                      }));
                      setItems(returnAll);
                      soundService.playScanSuccess();
                    }}
                    className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 text-[11px] font-bold"
                  >
                    {language === 'ar' ? 'إرجاع كل الكميات' : 'Return All Qties'}
                  </button>
                </div>

                <LineItemEditor
                  items={items}
                  onChangeItems={(newItems) => setItems(newItems)}
                  isReturnMode={true}
                />
              </div>

              {/* Totals Summary */}
              <TotalsSummary
                grossTotal={grossTotal}
                totalDiscount={totalDiscount}
                totalAfterDiscount={totalAfterDiscount}
                totalTax={totalTax}
                totalAfterTax={totalAfterTax}
                withholdingTax={withholdingTax}
                netDue={netDue}
              />
            </>
          )}
        </div>

        {/* Sticky Action Bar */}
        <div className="sticky bottom-0 z-20 p-3 bg-[#262A31] border-t border-[#333842] flex items-center gap-2 shadow-2xl">
          <button
            type="button"
            id="save-return-button"
            onClick={handleSave}
            disabled={!selectedOrder}
            className="flex-1 h-14 bg-rose-600 hover:bg-rose-500 active:bg-rose-700 disabled:opacity-50 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg active:scale-98"
          >
            <RotateCcw className="w-4 h-4" />
            <span>{language === 'ar' ? 'حفظ طلب الإرجاع' : 'Save Return'}</span>
          </button>

          <button
            type="button"
            onClick={() => setView('list')}
            className="h-14 px-5 border border-[#333842] hover:bg-[#333842] text-gray-300 rounded-xl font-semibold text-xs flex items-center justify-center transition-colors"
          >
            <span>{language === 'ar' ? 'رجوع' : 'Back'}</span>
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW: LIST SCREEN (§5.1)
  // ==========================================
  return (
    <div id="returns-list-screen" className="flex-1 flex flex-col min-h-0 bg-[#121417] text-[#F5F6F7]">
      {/* Top Action Bar */}
      <div className="p-3 border-b border-[#333842] bg-[#1C1F24] flex items-center justify-between gap-2">
        <button
          id="create-new-return-btn"
          onClick={() => {
            soundService.playClick();
            setView('create');
          }}
          className="flex-1 h-12 bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-98"
        >
          <Plus className="w-4 h-4" />
          <span>{language === 'ar' ? 'إنشاء طلب ارجاع' : 'New Return'}</span>
        </button>

        <button
          id="returns-filter-toggle"
          onClick={() => setShowFilters(!showFilters)}
          className={`h-12 px-3 rounded-xl border flex items-center gap-1.5 text-xs font-semibold transition-colors ${
            showFilters || activeFilterCount > 0
              ? 'bg-rose-500/20 border-rose-500 text-rose-400'
              : 'bg-[#262A31] border-[#333842] text-gray-300 hover:text-white'
          }`}
        >
          <Filter className="w-4 h-4" />
          <span>{language === 'ar' ? 'تصفية' : 'Filter'}</span>
          {activeFilterCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] flex items-center justify-center font-bold">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Filter drawer (§5.1) */}
      {showFilters && (
        <div className="p-3 border-b border-[#333842] bg-[#1E2228] space-y-2 text-xs">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-gray-400 block mb-1">رقم مرتجع البيع</label>
              <input
                type="text"
                value={filterReturnNo}
                onChange={(e) => setFilterReturnNo(e.target.value)}
                placeholder="RET-..."
                className="w-full h-10 px-2 rounded-lg border border-[#333842] bg-[#121417] text-white font-mono text-xs outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] text-gray-400 block mb-1">رقم طلب البيع الأصلي</label>
              <input
                type="text"
                value={filterOrderNo}
                onChange={(e) => setFilterOrderNo(e.target.value)}
                placeholder="SO-..."
                className="w-full h-10 px-2 rounded-lg border border-[#333842] bg-[#121417] text-white font-mono text-xs outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] text-gray-400 block mb-1">العميل / الرقم الضريبي</label>
            <input
              type="text"
              value={filterCustomer}
              onChange={(e) => setFilterCustomer(e.target.value)}
              placeholder="البحث بالاسم أو الرقم الضريبي..."
              className="w-full h-10 px-2 rounded-lg border border-[#333842] bg-[#121417] text-white text-xs outline-none"
            />
          </div>
        </div>
      )}

      {/* Returns List Cards (§5.1) */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {filteredReturns.length === 0 ? (
          <div className="p-8 text-center rounded-2xl border border-dashed border-[#333842] my-6">
            <RotateCcw className="w-10 h-10 mx-auto text-gray-500 mb-2" />
            <h3 className="text-sm font-bold text-gray-300">
              {language === 'ar' ? 'لا يوجد مرتجعات مسجلة' : 'No Returns Found'}
            </h3>
            <p className="text-xs text-gray-500 mt-1 mb-4">
              {language === 'ar' ? 'يمكنك إنشاء طلب إرجاع مرتبط بطلب بيع سابق' : 'Create return linked to a sales order'}
            </p>
            <button
              onClick={() => setView('create')}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-colors inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>{language === 'ar' ? 'إنشاء أول طلب إرجاع' : 'New Return'}</span>
            </button>
          </div>
        ) : (
          filteredReturns.map((ret) => (
            <div
              key={ret.id}
              className="p-3.5 rounded-2xl border border-[#333842] bg-[#1C1F24] shadow-sm relative space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-xs text-rose-400">
                  {ret.returnNumber}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400">
                  {language === 'ar' ? 'قيد المراجعة' : 'Pending'}
                </span>
              </div>

              <div className="text-xs">
                <div className="font-bold text-white">{ret.customerName}</div>
                <div className="text-[11px] text-gray-400 flex items-center justify-between mt-0.5">
                  <span>مرتبط بطلب: {ret.linkedOrderNumber}</span>
                  <span className="font-mono">{ret.date}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-[#333842]/50 flex items-center justify-between">
                <span className="text-[11px] text-gray-400">قيمة الإرجاع:</span>
                <span className="font-mono font-bold text-sm text-rose-400">
                  {ret.netDue.toFixed(2)} ر.س
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
