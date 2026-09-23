import React, { useState, useEffect } from 'react';
import { CreditNote, SalesInvoice, LineItem } from '../../types';
import { storageService } from '../../services/storage';
import { soundService } from '../../services/sound';
import { useApp } from '../../context/AppContext';
import { LineItemEditor } from '../common/LineItemEditor';
import { TotalsSummary } from '../common/TotalsSummary';
import { calculateLineTotal, calculateDocumentTotals } from '../../utils/pricing';
import {
  Plus,
  Filter,
  Search,
  BadgeAlert,
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

export const CreditNotesScreen: React.FC = () => {
  const { language, theme, currentUser, showToast, refreshPendingCount } = useApp();
  const [view, setView] = useState<'list' | 'create'>('list');
  const [creditNotes, setCreditNotes] = useState<CreditNote[]>([]);
  const [invoices, setInvoices] = useState<SalesInvoice[]>([]);
  const isDark = theme === 'dark';

  // Filters state
  const [showFilters, setShowFilters] = useState(false);
  const [filterCreditNoteNo, setFilterCreditNoteNo] = useState('');
  const [filterInvoiceNo, setFilterInvoiceNo] = useState('');
  const [filterCustomer, setFilterCustomer] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Create Screen State
  const [selectedInvoice, setSelectedInvoice] = useState<SalesInvoice | null>(null);
  const [creditNoteDate, setCreditNoteDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [reason, setReason] = useState('إرجاع بضاعة تالفة أو غير مطابقة');
  const [items, setItems] = useState<LineItem[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setCreditNotes(storageService.getCreditNotes());
    setInvoices(storageService.getInvoices());
    refreshPendingCount();
  };

  // Pull source invoice lines when picked
  const handleSelectInvoice = (inv: SalesInvoice) => {
    soundService.playScanSuccess();
    setSelectedInvoice(inv);
    const creditLines: LineItem[] = inv.items.map((it) => ({
      ...it,
      maxReturnQty: it.enteredQty,
      enteredQty: it.enteredQty, // pre-fill all or user adjusts
      lineTotal: calculateLineTotal(it.enteredQty, it.unitPrice, it.discount)
    }));
    setItems(creditLines);
  };

  // Return All Button handler (§7.2)
  const handleReturnAllLines = () => {
    soundService.playScanSuccess();
    if (!selectedInvoice) return;
    const all = items.map((it) => {
      const maxQty = it.maxReturnQty || 1;
      return {
        ...it,
        enteredQty: maxQty,
        lineTotal: calculateLineTotal(maxQty, it.unitPrice, it.discount)
      };
    });
    setItems(all);
    showToast(
      language === 'ar' ? 'تم ضبط كميات جميع الأصناف للإرجاع الكامل' : 'All line items set to full return qty',
      'info'
    );
  };

  // Standardized Totals Calculations
  const {
    grossTotal,
    totalDiscount,
    totalAfterDiscount,
    totalTax,
    totalAfterTax,
    withholdingTax,
    netDue
  } = calculateDocumentTotals(items);

  const handleSave = () => {
    if (!selectedInvoice) {
      soundService.playError();
      showToast(language === 'ar' ? 'حدد الفاتورة الأصلية أولاً' : 'Select source invoice', 'error');
      return;
    }

    const validItems = items.filter(it => it.enteredQty > 0);
    if (validItems.length === 0) {
      soundService.playError();
      showToast(language === 'ar' ? 'يرجى إدخال كمية مردودة لصنف واحد على الأقل' : 'Specify return qty', 'error');
      return;
    }

    const saved = storageService.saveCreditNote({
      linkedInvoiceNumber: selectedInvoice.invoiceNumber,
      linkedOrderNumber: selectedInvoice.linkedOrderNumber,
      date: creditNoteDate,
      customerId: selectedInvoice.customerId,
      customerName: selectedInvoice.customerName,
      customerTaxNumber: selectedInvoice.customerTaxNumber,
      customerPhone: selectedInvoice.customerPhone,
      creditLimit: selectedInvoice.creditLimit,
      customerBranch: selectedInvoice.customerBranch,
      reason,
      warehouse: selectedInvoice.warehouse,
      subCompany: selectedInvoice.subCompany,
      salesRep: currentUser.displayName,
      items: validItems,
      grossTotal,
      totalDiscount,
      totalAfterDiscount,
      totalTax,
      totalAfterTax,
      withholdingTax,
      netDue,
      status: 'approved'
    });

    soundService.playScanSuccess();
    showToast(
      language === 'ar'
        ? `تم إصدار مذكرة الائتمان بنجاح: ${saved.creditNoteNumber}`
        : `Credit note issued: ${saved.creditNoteNumber}`,
      'success'
    );

    setSelectedInvoice(null);
    setItems([]);
    loadData();
    setView('list');
  };

  const filteredCreditNotes = creditNotes.filter((cn) => {
    if (filterCreditNoteNo && !cn.creditNoteNumber.toLowerCase().includes(filterCreditNoteNo.toLowerCase())) return false;
    if (filterInvoiceNo && !cn.linkedInvoiceNumber.toLowerCase().includes(filterInvoiceNo.toLowerCase())) return false;
    if (filterCustomer) {
      const match =
        cn.customerName.toLowerCase().includes(filterCustomer.toLowerCase()) ||
        cn.customerTaxNumber.includes(filterCustomer);
      if (!match) return false;
    }
    if (filterDateFrom && cn.date < filterDateFrom) return false;
    if (filterDateTo && cn.date > filterDateTo) return false;
    if (filterStatus !== 'all' && cn.status !== filterStatus) return false;
    return true;
  });

  // ==========================================
  // VIEW: CREATE CREDIT NOTE SCREEN (§7.2)
  // ==========================================
  if (view === 'create') {
    return (
      <div id="create-credit-note-screen" className={`flex-1 flex flex-col min-h-0 ${isDark ? 'bg-[#121417] text-[#F5F6F7]' : 'bg-slate-50 text-slate-900'}`}>
        {/* Header */}
        <div className={`p-3 border-b flex items-center justify-between ${isDark ? 'border-[#333842] bg-[#1C1F24]' : 'border-slate-200 bg-white shadow-sm'}`}>
          <button
            id="create-credit-note-back-button"
            type="button"
            onClick={() => {
              setView('list');
              setSelectedInvoice(null);
              setItems([]);
            }}
            className={`flex items-center gap-1.5 text-xs font-semibold ${isDark ? 'text-gray-300 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}
          >
            {language === 'ar' ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
            <span>{language === 'ar' ? 'رجوع' : 'Back'}</span>
          </button>
          <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {language === 'ar' ? 'إصدار مذكرة ائتمان (خصم)' : 'New Credit Note'}
          </span>
          <div className="w-12"></div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-3 pb-32">
          {/* Step 1: Pick Source Invoice (§7.2) */}
          <div className={`rounded-2xl border p-3 ${isDark ? 'border-[#333842] bg-[#1C1F24]' : 'border-slate-200 bg-white shadow-sm'}`}>
            <label className="text-xs font-bold text-purple-500 block mb-1.5">
              {language === 'ar' ? 'اختيار الفاتورة الأصلية للمذكرة *' : 'Pick Source Sales Invoice *'}
            </label>
            <select
              id="source-invoice-picker"
              value={selectedInvoice?.id || ''}
              onChange={(e) => {
                const found = invoices.find(inv => inv.id === e.target.value);
                if (found) handleSelectInvoice(found);
              }}
              className={`w-full h-12 px-3 rounded-xl border text-xs outline-none ${
                isDark ? 'border-[#333842] bg-[#121417] text-white' : 'border-slate-300 bg-slate-50 text-slate-900'
              }`}
            >
              <option value="">{language === 'ar' ? '-- اختر فاتورة ضريبية من القائمة --' : '-- Choose Invoice --'}</option>
              {invoices.map((inv) => (
                <option key={inv.id} value={inv.id}>
                  {inv.invoiceNumber} - {inv.customerName} ({inv.netDue.toFixed(2)} ر.س)
                </option>
              ))}
            </select>
          </div>

          {selectedInvoice && (
            <>
              {/* Invoice Context (Read-only) */}
              <div className={`rounded-2xl border p-3 text-xs space-y-2 ${isDark ? 'border-[#333842] bg-[#1C1F24]' : 'border-slate-200 bg-white shadow-sm'}`}>
                <span className={`font-bold block text-[11px] ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>بيانات الفاتورة والعميل</span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] text-gray-400 block">العميل:</span>
                    <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{selectedInvoice.customerName}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 block">الفاتورة:</span>
                    <span className="font-mono text-purple-500 font-bold">{selectedInvoice.invoiceNumber}</span>
                  </div>
                  <div className="col-span-2">
                    <label className={`text-[10px] block mb-1 ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>سبب إصدار مذكرة الائتمان:</label>
                    <input
                      type="text"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      className={`w-full h-10 px-3 rounded-xl border text-xs outline-none ${
                        isDark ? 'border-[#333842] bg-[#121417] text-white' : 'border-slate-300 bg-slate-50 text-slate-900'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Line Items Editor with "Return All" Button (§7.2) */}
              <div className={`rounded-2xl border p-3 ${isDark ? 'border-[#333842] bg-[#1C1F24]' : 'border-slate-200 bg-white shadow-sm'}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>الأصناف المردودة / المخفضة</span>
                  <button
                    type="button"
                    id="credit-note-return-all-btn"
                    onClick={handleReturnAllLines}
                    className="px-2.5 py-1 rounded-lg bg-purple-500/20 text-purple-500 hover:bg-purple-500/30 text-[11px] font-bold flex items-center gap-1 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>إرجاع الكل (Return All)</span>
                  </button>
                </div>

                <LineItemEditor
                  items={items}
                  onChangeItems={(newItems) => setItems(newItems)}
                  isReturnMode={true}
                  showReturnAllButton={true}
                  onReturnAll={handleReturnAllLines}
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
        <div className={`sticky bottom-0 z-20 p-3 border-t flex items-center gap-2 shadow-2xl ${
          isDark ? 'bg-[#262A31] border-[#333842]' : 'bg-white border-slate-200'
        }`}>
          <button
            type="button"
            id="save-credit-note-button"
            onClick={handleSave}
            disabled={!selectedInvoice}
            className="flex-1 h-14 bg-purple-600 hover:bg-purple-500 active:bg-purple-700 disabled:opacity-50 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg active:scale-98"
          >
            <BadgeAlert className="w-4 h-4" />
            <span>{language === 'ar' ? 'اعتماد مذكرة الائتمان' : 'Authorize Credit Note'}</span>
          </button>

          <button
            type="button"
            onClick={() => setView('list')}
            className={`h-14 px-5 border rounded-xl font-semibold text-xs flex items-center justify-center transition-colors ${
              isDark ? 'border-[#333842] hover:bg-[#333842] text-gray-300' : 'border-slate-300 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <span>{language === 'ar' ? 'رجوع' : 'Back'}</span>
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW: LIST SCREEN (§7.1)
  // ==========================================
  return (
    <div id="credit-notes-list-screen" className={`flex-1 flex flex-col min-h-0 ${isDark ? 'bg-[#121417] text-[#F5F6F7]' : 'bg-slate-50 text-slate-900'}`}>
      {/* Top Action Bar */}
      <div className={`p-3 border-b flex items-center justify-between gap-2 ${isDark ? 'border-[#333842] bg-[#1C1F24]' : 'border-slate-200 bg-white shadow-sm'}`}>
        <button
          id="create-new-credit-note-btn"
          onClick={() => {
            soundService.playClick();
            setView('create');
          }}
          className="flex-1 h-12 bg-purple-600 hover:bg-purple-500 active:bg-purple-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-98"
        >
          <Plus className="w-4 h-4" />
          <span>{language === 'ar' ? 'إنشاء مذكرة ائتمان' : 'New Credit Note'}</span>
        </button>

        <button
          id="credit-notes-filter-toggle"
          onClick={() => setShowFilters(!showFilters)}
          className={`h-12 px-3 rounded-xl border flex items-center gap-1.5 text-xs font-semibold transition-colors ${
            showFilters
              ? 'bg-purple-500/20 border-purple-500 text-purple-500'
              : isDark
              ? 'bg-[#262A31] border-[#333842] text-gray-300 hover:text-white'
              : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <Filter className="w-4 h-4" />
          <span>{language === 'ar' ? 'تصفية' : 'Filter'}</span>
        </button>
      </div>

      {/* Filter Drawer */}
      {showFilters && (
        <div className={`p-3 border-b space-y-2 text-xs ${isDark ? 'border-[#333842] bg-[#1E2228]' : 'border-slate-200 bg-slate-100'}`}>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={`text-[10px] block mb-1 ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>رقم مذكرة الائتمان</label>
              <input
                type="text"
                value={filterCreditNoteNo}
                onChange={(e) => setFilterCreditNoteNo(e.target.value)}
                placeholder="CN-..."
                className={`w-full h-10 px-2 rounded-lg border font-mono text-xs outline-none ${
                  isDark ? 'border-[#333842] bg-[#121417] text-white' : 'border-slate-300 bg-white text-slate-900'
                }`}
              />
            </div>
            <div>
              <label className={`text-[10px] block mb-1 ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>رقم الفاتورة الأصلية</label>
              <input
                type="text"
                value={filterInvoiceNo}
                onChange={(e) => setFilterInvoiceNo(e.target.value)}
                placeholder="INV-..."
                className={`w-full h-10 px-2 rounded-lg border font-mono text-xs outline-none ${
                  isDark ? 'border-[#333842] bg-[#121417] text-white' : 'border-slate-300 bg-white text-slate-900'
                }`}
              />
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

      {/* Credit Notes List Cards (§7.1) */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {filteredCreditNotes.length === 0 ? (
          <div className={`p-8 text-center rounded-2xl border border-dashed my-6 ${isDark ? 'border-[#333842]' : 'border-slate-300 bg-white'}`}>
            <BadgeAlert className="w-10 h-10 mx-auto text-gray-400 mb-2" />
            <h3 className={`text-sm font-bold ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>
              {language === 'ar' ? 'لا يوجد مذكرات ائتمان' : 'No Credit Notes'}
            </h3>
            <p className="text-xs text-gray-500 mt-1 mb-4">
              {language === 'ar' ? 'أنشئ مذكرة ائتمان لتسوية مرتجعات أو خصومات الفواتير' : 'Create a credit note for invoice refund/adjustment'}
            </p>
          </div>
        ) : (
          filteredCreditNotes.map((cn) => (
            <div
              key={cn.id}
              className={`p-3.5 rounded-2xl border shadow-sm relative space-y-1.5 ${
                isDark ? 'border-[#333842] bg-[#1C1F24]' : 'border-slate-200 bg-white shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-xs text-purple-500">
                  {cn.creditNoteNumber}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-500">
                  معتمدة
                </span>
              </div>

              <div className="text-xs">
                <div className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{cn.customerName}</div>
                <div className={`text-[11px] flex items-center justify-between mt-0.5 ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                  <span>فاتورة: {cn.linkedInvoiceNumber}</span>
                  <span className="font-mono">{cn.date}</span>
                </div>
              </div>

              <div className={`pt-2 border-t flex items-center justify-between ${isDark ? 'border-[#333842]/50' : 'border-slate-200'}`}>
                <span className={`text-[11px] ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>قيمة الخصم/الرد:</span>
                <span className="font-mono font-bold text-sm text-purple-500">
                  - {cn.netDue.toFixed(2)} ر.س
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
