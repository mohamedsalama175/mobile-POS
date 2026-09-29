import React, { useState, useEffect } from 'react';
import { SalesReturn, CreditNote, SalesOrder, SalesInvoice, LineItem } from '../../types';
import { storageService } from '../../services/storage';
import { soundService } from '../../services/sound';
import { useApp } from '../../context/AppContext';
import { LineItemEditor } from '../common/LineItemEditor';
import { TotalsSummary } from '../common/TotalsSummary';
import { WizardHeader, StickyBottomBar } from '../ui';
import { calculateDocumentTotals, calculateLineTotal, DEFAULT_VAT_RATE, DEFAULT_WITHHOLDING_RATE } from '../../utils/pricing';
import {
  RotateCcw,
  CreditCard,
  Plus,
  Filter,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  Receipt,
  X,
  Check,
  ArrowRight,
  ArrowLeft,
  ChevronDown,
  Layers,
  Sparkles,
  Printer
} from 'lucide-react';

export const ReturnsScreen: React.FC = () => {
  const { language, theme, currentUser, showToast, refreshPendingCount, setHideBottomNav, openReceipt } = useApp();
  const isDark = theme === 'dark';
  const isRtl = language === 'ar';

  // Segment filter: 'all' | 'returns' | 'credit_notes'
  const [activeSegment, setActiveSegment] = useState<'all' | 'returns' | 'credit_notes'>('all');

  // Creation Wizard mode: null (list) | 'return' | 'credit_note'
  const [createMode, setCreateMode] = useState<null | 'return' | 'credit_note'>(null);
  const [wizardStep, setWizardStep] = useState<1 | 2>(1);
  const [isChoiceSheetOpen, setIsChoiceSheetOpen] = useState(false);

  useEffect(() => {
    setHideBottomNav(createMode !== null);
    return () => setHideBottomNav(false);
  }, [createMode, setHideBottomNav]);

  // Data state
  const [returns, setReturns] = useState<SalesReturn[]>([]);
  const [creditNotes, setCreditNotes] = useState<CreditNote[]>([]);
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [invoices, setInvoices] = useState<SalesInvoice[]>([]);

  // Filters state
  const [showFilters, setShowFilters] = useState(false);
  const [filterQuery, setFilterQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Selected item modal
  const [selectedReturn, setSelectedReturn] = useState<SalesReturn | null>(null);
  const [selectedCreditNote, setSelectedCreditNote] = useState<CreditNote | null>(null);

  // Return Form State
  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null);
  const [returnDate, setReturnDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [returnReason, setReturnReason] = useState('إرجاع بضاعة تالفة أو غير مطابقة للمواصفات');
  const [returnItems, setReturnItems] = useState<LineItem[]>([]);

  // Credit Note Form State
  const [selectedInvoice, setSelectedInvoice] = useState<SalesInvoice | null>(null);
  const [creditNoteDate, setCreditNoteDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [creditReason, setCreditReason] = useState('خصم تسوية / إرجاع بضاعة');
  const [creditItems, setCreditItems] = useState<LineItem[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setReturns(storageService.getReturns());
    setCreditNotes(storageService.getCreditNotes());
    setOrders(storageService.getOrders());
    setInvoices(storageService.getInvoices());
    refreshPendingCount();
  };

  // Select source order for Return
  const handleSelectOrder = (order: SalesOrder) => {
    soundService.playScanSuccess();
    setSelectedOrder(order);
    const lines: LineItem[] = order.items.map((it) => ({
      ...it,
      maxReturnQty: it.enteredQty,
      enteredQty: it.enteredQty,
      lineTotal: calculateLineTotal(it.enteredQty, it.unitPrice, it.discount, it.discountType)
    }));
    setReturnItems(lines);
  };

  // Select source invoice for Credit Note
  const handleSelectInvoice = (inv: SalesInvoice) => {
    soundService.playScanSuccess();
    setSelectedInvoice(inv);
    const lines: LineItem[] = inv.items.map((it) => ({
      ...it,
      maxReturnQty: it.enteredQty,
      enteredQty: it.enteredQty,
      lineTotal: calculateLineTotal(it.enteredQty, it.unitPrice, it.discount, it.discountType)
    }));
    setCreditItems(lines);
  };

  // Return totals
  const returnTotals = calculateDocumentTotals(returnItems, DEFAULT_VAT_RATE, true, DEFAULT_WITHHOLDING_RATE);

  // Credit Note totals
  const creditTotals = calculateDocumentTotals(creditItems, DEFAULT_VAT_RATE, true, DEFAULT_WITHHOLDING_RATE);

  // Save Sales Return
  const handleSaveReturn = () => {
    if (!selectedOrder) {
      soundService.playError();
      showToast(isRtl ? 'يرجى اختيار طلب البيع الأصلي أولاً' : 'Select source sales order', 'error');
      setWizardStep(1);
      return;
    }

    const validItems = returnItems.filter(it => it.enteredQty > 0);
    if (validItems.length === 0) {
      soundService.playError();
      showToast(isRtl ? 'حدد كمية صنف واحد على الأقل للإرجاع' : 'Specify return qty for at least 1 item', 'error');
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
      grossTotal: returnTotals.grossTotal,
      totalDiscount: returnTotals.totalDiscount,
      totalAfterDiscount: returnTotals.totalAfterDiscount,
      totalTax: returnTotals.totalTax,
      totalAfterTax: returnTotals.totalAfterTax,
      withholdingTax: returnTotals.withholdingTax,
      netDue: returnTotals.netDue,
      status: 'pending_approval'
    });

    soundService.playScanSuccess();
    showToast(
      isRtl
        ? `تم إنشاء مرتجع طلب البيع: ${newReturn.returnNumber}`
        : `Sales return recorded: ${newReturn.returnNumber}`,
      'success'
    );

    setSelectedOrder(null);
    setReturnItems([]);
    setCreateMode(null);
    setWizardStep(1);
    loadData();
  };

  // Save Credit Note
  const handleSaveCreditNote = () => {
    if (!selectedInvoice) {
      soundService.playError();
      showToast(isRtl ? 'حدد الفاتورة الأصلية أولاً' : 'Select source invoice', 'error');
      setWizardStep(1);
      return;
    }

    const validItems = creditItems.filter(it => it.enteredQty > 0);
    if (validItems.length === 0) {
      soundService.playError();
      showToast(isRtl ? 'حدد كمية صنف واحد على الأقل لمذكرة الائتمان' : 'Specify qty for at least 1 item', 'error');
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
      reason: creditReason,
      warehouse: selectedInvoice.warehouse,
      subCompany: selectedInvoice.subCompany,
      salesRep: currentUser.displayName,
      items: validItems,
      grossTotal: creditTotals.grossTotal,
      totalDiscount: creditTotals.totalDiscount,
      totalAfterDiscount: creditTotals.totalAfterDiscount,
      totalTax: creditTotals.totalTax,
      totalAfterTax: creditTotals.totalAfterTax,
      withholdingTax: creditTotals.withholdingTax,
      netDue: creditTotals.netDue,
      status: 'approved'
    });

    soundService.playScanSuccess();
    showToast(
      isRtl
        ? `تم إصدار مذكرة الائتمان: ${saved.creditNoteNumber}`
        : `Credit note issued: ${saved.creditNoteNumber}`,
      'success'
    );

    setSelectedInvoice(null);
    setCreditItems([]);
    setCreateMode(null);
    setWizardStep(1);
    loadData();
  };

  // Filtered lists
  const filteredReturns = returns.filter((r) => {
    if (filterQuery) {
      const q = filterQuery.toLowerCase();
      const match =
        r.returnNumber.toLowerCase().includes(q) ||
        r.linkedOrderNumber.toLowerCase().includes(q) ||
        r.customerName.toLowerCase().includes(q);
      if (!match) return false;
    }
    if (filterStatus !== 'all' && r.status !== filterStatus) return false;
    return true;
  });

  const filteredCreditNotes = creditNotes.filter((c) => {
    if (filterQuery) {
      const q = filterQuery.toLowerCase();
      const match =
        c.creditNoteNumber.toLowerCase().includes(q) ||
        (c.linkedInvoiceNumber || '').toLowerCase().includes(q) ||
        c.customerName.toLowerCase().includes(q);
      if (!match) return false;
    }
    if (filterStatus !== 'all' && c.status !== filterStatus) return false;
    return true;
  });

  // =========================================================
  // VIEW: CREATE RETURN WIZARD (2 STEPS)
  // =========================================================
  if (createMode === 'return') {
    return (
      <div
        id="create-return-screen"
        className={`flex-1 flex flex-col min-h-0 ${
          isDark ? 'bg-[#121417] text-[#F5F6F7]' : 'bg-[#F9FAFB] text-gray-900'
        }`}
      >
        <WizardHeader
          currentStep={wizardStep}
          totalSteps={2}
          title={
            wizardStep === 1
              ? (isRtl ? 'طلب البيع وسبب الإرجاع' : 'Select Order & Reason')
              : (isRtl ? `أصناف المرتجع (${returnItems.length})` : `Return Items (${returnItems.length})`)
          }
          subtitle={
            wizardStep === 1
              ? (isRtl ? 'حدد طلب البيع المراد عمل مرتجع له' : 'Pick confirmed sales order to return')
              : (isRtl ? 'عدّل الكميات المردودة بحد أقصى كمية الطلب' : 'Adjust returned quantities capped at order max')
          }
          onBack={() => {
            if (wizardStep === 2) setWizardStep(1);
            else setCreateMode(null);
          }}
        />

        <div className="flex-1 overflow-y-auto p-3 space-y-3 pb-24">
          {wizardStep === 1 ? (
            <div className="space-y-3 animate-in fade-in duration-150">
              {/* Select Source Order */}
              <div
                className={`p-3.5 rounded-2xl border space-y-2.5 ${
                  isDark ? 'bg-[#1C1F24] border-[#333842]' : 'bg-white border-gray-200 shadow-sm'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {isRtl ? 'طلب البيع الأصلي *' : 'Source Sales Order *'}
                  </span>
                  {selectedOrder && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400">
                      {isRtl ? 'تم الربط' : 'Linked'}
                    </span>
                  )}
                </div>

                <select
                  value={selectedOrder?.id || ''}
                  onChange={(e) => {
                    const found = orders.find(o => o.id === e.target.value);
                    if (found) handleSelectOrder(found);
                  }}
                  className={`w-full h-12 px-3 rounded-xl border text-xs outline-none transition-colors ${
                    isDark
                      ? 'border-[#333842] bg-[#121417] text-white focus:border-blue-500'
                      : 'border-gray-200 bg-gray-50 text-gray-900 focus:bg-white focus:border-blue-500'
                  }`}
                >
                  <option value="">{isRtl ? '-- اختر طلب البيع --' : '-- Select Sales Order --'}</option>
                  {orders.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.orderNumber} - {o.customerName} ({o.netDue.toFixed(2)} {isRtl ? 'ج.م' : 'EGP'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Date & Reason */}
              <div
                className={`p-3.5 rounded-2xl border space-y-3 ${
                  isDark ? 'bg-[#1C1F24] border-[#333842]' : 'bg-white border-gray-200 shadow-sm'
                }`}
              >
                <div>
                  <label className={`text-[11px] block mb-1 font-bold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {isRtl ? 'تاريخ المرتجع' : 'Return Date'}
                  </label>
                  <input
                    type="date"
                    value={returnDate}
                    onChange={(e) => setReturnDate(e.target.value)}
                    className={`w-full h-11 px-3 rounded-xl border outline-none font-mono text-xs ${
                      isDark ? 'border-[#333842] bg-[#121417] text-white' : 'border-gray-200 bg-gray-50 text-gray-900'
                    }`}
                  />
                </div>

                <div>
                  <label className={`text-[11px] block mb-1 font-bold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {isRtl ? 'سبب الإرجاع' : 'Reason for Return'}
                  </label>
                  <textarea
                    rows={2}
                    value={returnReason}
                    onChange={(e) => setReturnReason(e.target.value)}
                    className={`w-full p-2.5 rounded-xl border text-xs outline-none resize-none ${
                      isDark ? 'border-[#333842] bg-[#121417] text-white' : 'border-gray-200 bg-gray-50 text-gray-900'
                    }`}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3 animate-in fade-in duration-150">
              <div
                className={`rounded-2xl border p-2.5 ${
                  isDark ? 'bg-[#1C1F24] border-[#333842]' : 'bg-white border-gray-200 shadow-sm'
                }`}
              >
                <LineItemEditor
                  items={returnItems}
                  onChangeItems={(newItems) => setReturnItems(newItems)}
                  isReturnMode={true}
                />
              </div>

              <TotalsSummary
                grossTotal={returnTotals.grossTotal}
                totalDiscount={returnTotals.totalDiscount}
                totalAfterDiscount={returnTotals.totalAfterDiscount}
                totalTax={returnTotals.totalTax}
                totalAfterTax={returnTotals.totalAfterTax}
                withholdingTax={returnTotals.withholdingTax}
                netDue={returnTotals.netDue}
              />
            </div>
          )}
        </div>

        <StickyBottomBar
          primaryText={wizardStep === 1 ? (isRtl ? 'التالي: الأصناف' : 'Next: Items') : (isRtl ? 'تأكيد وحفظ المرتجع' : 'Save Return')}
          primaryIcon={wizardStep === 2 ? <Check className="w-5 h-5" /> : isRtl ? <ArrowLeft className="w-5 h-5" /> : <ArrowRight className="w-5 h-5" />}
          onPrimary={wizardStep === 1 ? () => {
            if (!selectedOrder) {
              soundService.playError();
              showToast(isRtl ? 'اختر طلب بيع للمتابعة' : 'Select order to continue', 'error');
              return;
            }
            soundService.playClick();
            setWizardStep(2);
          } : handleSaveReturn}
          secondaryText={wizardStep === 1 ? (isRtl ? 'إلغاء' : 'Cancel') : (isRtl ? 'السابق' : 'Back')}
          secondaryIcon={wizardStep === 1 ? <X className="w-4 h-4" /> : isRtl ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
          onSecondary={() => {
            if (wizardStep === 2) setWizardStep(1);
            else setCreateMode(null);
          }}
          summaryValue={returnItems.length > 0 ? returnTotals.netDue.toFixed(2) : undefined}
          summaryLabel={isRtl ? 'إجمالي المرتجع' : 'Return Total'}
        />
      </div>
    );
  }

  // =========================================================
  // VIEW: CREATE CREDIT NOTE WIZARD (2 STEPS)
  // =========================================================
  if (createMode === 'credit_note') {
    return (
      <div
        id="create-credit-note-screen"
        className={`flex-1 flex flex-col min-h-0 ${
          isDark ? 'bg-[#121417] text-[#F5F6F7]' : 'bg-[#F9FAFB] text-gray-900'
        }`}
      >
        <WizardHeader
          currentStep={wizardStep}
          totalSteps={2}
          title={
            wizardStep === 1
              ? (isRtl ? 'الفاتورة الأصلية والسبب' : 'Select Invoice & Reason')
              : (isRtl ? `أصناف مذكرة الائتمان (${creditItems.length})` : `Credit Items (${creditItems.length})`)
          }
          subtitle={
            wizardStep === 1
              ? (isRtl ? 'اختر الفاتورة الصادرة لإصدار إشعار ائتمان' : 'Select sales invoice to credit')
              : (isRtl ? 'حدد الأصناف والمبالغ المردودة لحساب العميل' : 'Specify credited items and amounts')
          }
          onBack={() => {
            if (wizardStep === 2) setWizardStep(1);
            else setCreateMode(null);
          }}
        />

        <div className="flex-1 overflow-y-auto p-3 space-y-3 pb-24">
          {wizardStep === 1 ? (
            <div className="space-y-3 animate-in fade-in duration-150">
              <div
                className={`p-3.5 rounded-2xl border space-y-2.5 ${
                  isDark ? 'bg-[#1C1F24] border-[#333842]' : 'bg-white border-gray-200 shadow-sm'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {isRtl ? 'الفاتورة الأصلية *' : 'Source Invoice *'}
                  </span>
                  {selectedInvoice && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400">
                      {isRtl ? 'تم الربط' : 'Linked'}
                    </span>
                  )}
                </div>

                <select
                  value={selectedInvoice?.id || ''}
                  onChange={(e) => {
                    const found = invoices.find(inv => inv.id === e.target.value);
                    if (found) handleSelectInvoice(found);
                  }}
                  className={`w-full h-12 px-3 rounded-xl border text-xs outline-none transition-colors ${
                    isDark
                      ? 'border-[#333842] bg-[#121417] text-white focus:border-blue-500'
                      : 'border-gray-200 bg-gray-50 text-gray-900 focus:bg-white focus:border-blue-500'
                  }`}
                >
                  <option value="">{isRtl ? '-- اختر الفاتورة الأصلية --' : '-- Select Invoice --'}</option>
                  {invoices.map((inv) => (
                    <option key={inv.id} value={inv.id}>
                      {inv.invoiceNumber} - {inv.customerName} ({inv.netDue.toFixed(2)} {isRtl ? 'ج.م' : 'EGP'})
                    </option>
                  ))}
                </select>
              </div>

              <div
                className={`p-3.5 rounded-2xl border space-y-3 ${
                  isDark ? 'bg-[#1C1F24] border-[#333842]' : 'bg-white border-gray-200 shadow-sm'
                }`}
              >
                <div>
                  <label className={`text-[11px] block mb-1 font-bold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {isRtl ? 'تاريخ مذكرة الائتمان' : 'Credit Date'}
                  </label>
                  <input
                    type="date"
                    value={creditNoteDate}
                    onChange={(e) => setCreditNoteDate(e.target.value)}
                    className={`w-full h-11 px-3 rounded-xl border outline-none font-mono text-xs ${
                      isDark ? 'border-[#333842] bg-[#121417] text-white' : 'border-gray-200 bg-gray-50 text-gray-900'
                    }`}
                  />
                </div>

                <div>
                  <label className={`text-[11px] block mb-1 font-bold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {isRtl ? 'سبب الائتمان' : 'Reason'}
                  </label>
                  <textarea
                    rows={2}
                    value={creditReason}
                    onChange={(e) => setCreditReason(e.target.value)}
                    className={`w-full p-2.5 rounded-xl border text-xs outline-none resize-none ${
                      isDark ? 'border-[#333842] bg-[#121417] text-white' : 'border-gray-200 bg-gray-50 text-gray-900'
                    }`}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3 animate-in fade-in duration-150">
              <div
                className={`rounded-2xl border p-2.5 ${
                  isDark ? 'bg-[#1C1F24] border-[#333842]' : 'bg-white border-gray-200 shadow-sm'
                }`}
              >
                <LineItemEditor
                  items={creditItems}
                  onChangeItems={(newItems) => setCreditItems(newItems)}
                  isReturnMode={true}
                  showReturnAllButton={true}
                  onReturnAll={() => {
                    const all = creditItems.map(it => ({
                      ...it,
                      enteredQty: it.maxReturnQty || 1,
                      lineTotal: calculateLineTotal(it.maxReturnQty || 1, it.unitPrice, it.discount, it.discountType)
                    }));
                    setCreditItems(all);
                    showToast(isRtl ? 'تم ضبط كامل الكميات' : 'Set all to full return', 'info');
                  }}
                />
              </div>

              <TotalsSummary
                grossTotal={creditTotals.grossTotal}
                totalDiscount={creditTotals.totalDiscount}
                totalAfterDiscount={creditTotals.totalAfterDiscount}
                totalTax={creditTotals.totalTax}
                totalAfterTax={creditTotals.totalAfterTax}
                withholdingTax={creditTotals.withholdingTax}
                netDue={creditTotals.netDue}
              />
            </div>
          )}
        </div>

        <StickyBottomBar
          primaryText={wizardStep === 1 ? (isRtl ? 'التالي: الأصناف' : 'Next: Items') : (isRtl ? 'تأكيد وإصدار المذكرة' : 'Save Credit Note')}
          primaryIcon={wizardStep === 2 ? <Check className="w-5 h-5" /> : isRtl ? <ArrowLeft className="w-5 h-5" /> : <ArrowRight className="w-5 h-5" />}
          onPrimary={wizardStep === 1 ? () => {
            if (!selectedInvoice) {
              soundService.playError();
              showToast(isRtl ? 'اختر فاتورة للمتابعة' : 'Select invoice to continue', 'error');
              return;
            }
            soundService.playClick();
            setWizardStep(2);
          } : handleSaveCreditNote}
          secondaryText={wizardStep === 1 ? (isRtl ? 'إلغاء' : 'Cancel') : (isRtl ? 'السابق' : 'Back')}
          secondaryIcon={wizardStep === 1 ? <X className="w-4 h-4" /> : isRtl ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
          onSecondary={() => {
            if (wizardStep === 2) setWizardStep(1);
            else setCreateMode(null);
          }}
          summaryValue={creditItems.length > 0 ? creditTotals.netDue.toFixed(2) : undefined}
          summaryLabel={isRtl ? 'إجمالي الائتمان' : 'Credit Total'}
        />
      </div>
    );
  }

  // =========================================================
  // VIEW: UNIFIED LIST SCREEN (RETURNS & CREDIT NOTES)
  // =========================================================
  return (
    <div
      id="returns-unified-screen"
      className={`flex-1 flex flex-col min-h-0 relative ${
        isDark ? 'bg-[#121417] text-[#F5F6F7]' : 'bg-[#F9FAFB] text-gray-900'
      }`}
    >
      {/* Top Segment Toggle: All | Returns | Credit Notes */}
      <div
        className={`p-2 border-b flex items-center gap-1.5 shrink-0 select-none ${
          isDark ? 'border-[#333842] bg-[#1C1F24]' : 'border-gray-200 bg-white'
        }`}
      >
        <button
          type="button"
          onClick={() => {
            soundService.playClick();
            setActiveSegment('all');
          }}
          className={`flex-1 h-10 rounded-xl text-xs font-bold transition-all min-h-[44px] ${
            activeSegment === 'all'
              ? 'bg-blue-600 text-white shadow-sm'
              : isDark
              ? 'text-gray-400 hover:text-white hover:bg-[#252932]'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          {isRtl ? `الكل (${returns.length + creditNotes.length})` : `All (${returns.length + creditNotes.length})`}
        </button>

        <button
          type="button"
          onClick={() => {
            soundService.playClick();
            setActiveSegment('returns');
          }}
          className={`flex-1 h-10 rounded-xl text-xs font-bold transition-all min-h-[44px] ${
            activeSegment === 'returns'
              ? 'bg-blue-600 text-white shadow-sm'
              : isDark
              ? 'text-gray-400 hover:text-white hover:bg-[#252932]'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          {isRtl ? `مرتجعات (${returns.length})` : `Returns (${returns.length})`}
        </button>

        <button
          type="button"
          onClick={() => {
            soundService.playClick();
            setActiveSegment('credit_notes');
          }}
          className={`flex-1 h-10 rounded-xl text-xs font-bold transition-all min-h-[44px] ${
            activeSegment === 'credit_notes'
              ? 'bg-blue-600 text-white shadow-sm'
              : isDark
              ? 'text-gray-400 hover:text-white hover:bg-[#252932]'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          {isRtl ? `مذكرات ائتمان (${creditNotes.length})` : `Credit (${creditNotes.length})`}
        </button>
      </div>

      {/* Search & Filter Header */}
      <div
        className={`p-3 sm:px-6 border-b shrink-0 ${
          isDark ? 'border-[#333842] bg-[#181B20]' : 'border-gray-200 bg-gray-50'
        }`}
      >
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-3">
          <div className="flex-1">
            <input
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder={isRtl ? 'بحث برقم السند أو اسم العميل...' : 'Search doc # or customer...'}
              className={`w-full h-11 px-3 rounded-xl border text-xs outline-none ${
                isDark ? 'border-[#333842] bg-[#121417] text-white' : 'border-gray-200 bg-white text-gray-900'
              }`}
            />
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`h-11 px-3.5 rounded-xl border flex items-center gap-1.5 text-xs font-semibold min-h-[44px] ${
              showFilters
                ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                : isDark
                ? 'border-[#333842] bg-[#262A31] text-gray-300'
                : 'border-gray-200 bg-white text-gray-700'
            }`}
          >
            <Filter className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* List Body */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-5 pb-24">
        <div className="max-w-7xl mx-auto w-full">
          {/* Returns section */}
          {(activeSegment === 'all' || activeSegment === 'returns') && (
            <div className="mb-4">
              {activeSegment === 'all' && (
                <div className="text-[11px] font-bold text-gray-400 px-1 pb-2 flex items-center gap-1.5">
                  <RotateCcw className="w-3.5 h-3.5 text-amber-500" />
                  <span>{isRtl ? 'مرتجعات طلبات البيع' : 'Sales Returns'}</span>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {filteredReturns.map((ret) => (
                  <div
                    key={ret.id}
                    onClick={() => {
                      soundService.playClick();
                      setSelectedReturn(ret);
                    }}
                    className={`p-3.5 rounded-2xl border shadow-sm cursor-pointer select-none active:scale-[0.99] transition-all space-y-2 flex flex-col justify-between ${
                      isDark
                        ? 'border-[#333842] bg-[#1C1F24] hover:border-amber-500/40'
                        : 'border-gray-200 bg-white hover:border-amber-300 shadow-sm'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <RotateCcw className="w-3.5 h-3.5 text-amber-500" />
                        <span className="font-mono font-bold text-xs text-amber-500">{ret.returnNumber}</span>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400">
                        {isRtl ? 'مرتجع بيع' : 'Return'}
                      </span>
                    </div>

                    <div className="text-xs">
                      <div className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{ret.customerName}</div>
                      <div className="text-[11px] text-gray-500 flex justify-between mt-0.5">
                        <span>{ret.items.length} {isRtl ? 'أصناف' : 'items'} • طلب: {ret.linkedOrderNumber}</span>
                        <span className="font-mono">{ret.date}</span>
                      </div>
                    </div>

                    <div className={`pt-2 border-t flex items-center justify-between ${isDark ? 'border-[#333842]/50' : 'border-gray-100'}`}>
                      <span className="text-[11px] text-gray-500">{isRtl ? 'قيمة المرتجع:' : 'Return Total:'}</span>
                      <span className="font-mono font-bold text-sm text-amber-500">
                        {ret.netDue.toFixed(2)} {isRtl ? 'ج.م' : 'EGP'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Credit Notes section */}
          {(activeSegment === 'all' || activeSegment === 'credit_notes') && (
            <div className="mb-4">
              {activeSegment === 'all' && (
                <div className="text-[11px] font-bold text-gray-400 px-1 pb-2 flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{isRtl ? 'مذكرات الائتمان' : 'Credit Notes'}</span>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {filteredCreditNotes.map((cn) => (
                  <div
                    key={cn.id}
                    onClick={() => {
                      soundService.playClick();
                      setSelectedCreditNote(cn);
                    }}
                    className={`p-3.5 rounded-2xl border shadow-sm cursor-pointer select-none active:scale-[0.99] transition-all space-y-2 flex flex-col justify-between ${
                      isDark
                        ? 'border-[#333842] bg-[#1C1F24] hover:border-indigo-500/40'
                        : 'border-gray-200 bg-white hover:border-indigo-300 shadow-sm'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <CreditCard className="w-3.5 h-3.5 text-indigo-400" />
                        <span className="font-mono font-bold text-xs text-indigo-400">{cn.creditNoteNumber}</span>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400">
                        {isRtl ? 'مذكرة ائتمان' : 'Credit Note'}
                      </span>
                    </div>

                    <div className="text-xs">
                      <div className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{cn.customerName}</div>
                      <div className="text-[11px] text-gray-500 flex justify-between mt-0.5">
                        <span>فاتورة: {cn.linkedInvoiceNumber || '-'}</span>
                        <span className="font-mono">{cn.date}</span>
                      </div>
                    </div>

                    <div className={`pt-2 border-t flex items-center justify-between ${isDark ? 'border-[#333842]/50' : 'border-gray-100'}`}>
                      <span className="text-[11px] text-gray-500">{isRtl ? 'مبلغ الائتمان:' : 'Credited Amount:'}</span>
                      <span className="font-mono font-bold text-sm text-indigo-400">
                        {cn.netDue.toFixed(2)} {isRtl ? 'ج.م' : 'EGP'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {filteredReturns.length === 0 && filteredCreditNotes.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center text-gray-400 space-y-3">
              <RotateCcw className="w-12 h-12 opacity-30 stroke-[1.5]" />
              <div className="font-bold text-sm">
                {isRtl ? 'لا توجد مرتجعات أو مذكرات ائتمان مسجلة' : 'No returns or credit notes recorded'}
              </div>
              <p className="text-xs text-gray-500 max-w-xs">
                {isRtl ? 'اضغط زر الإضافة (+) أدناه لإنشاء مرتجع أو مذكرة ائتمان جديدة' : 'Tap (+) below to create a return or credit note'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Floating Action Button (FAB) for Choice Bottom Sheet */}
      <button
        id="returns-list-fab-create"
        onClick={() => {
          soundService.playClick();
          setIsChoiceSheetOpen(true);
        }}
        className={`fixed z-20 ${
          isRtl ? 'left-5' : 'right-5'
        } bottom-20 w-14 h-14 rounded-full bg-gradient-to-tr from-amber-600 to-indigo-600 text-white shadow-xl shadow-amber-600/30 flex items-center justify-center active:scale-95 transition-transform min-w-[56px] min-h-[56px] focus:outline-none`}
        title={isRtl ? 'إضافة جديد' : 'New Entry'}
        aria-label={isRtl ? 'إضافة مرتجع أو مذكرة ائتمان' : 'New Return or Credit Note'}
      >
        <Plus className="w-7 h-7" />
      </button>

      {/* Choice Bottom Sheet Modal */}
      {isChoiceSheetOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm select-none animate-in fade-in duration-150">
          <div
            className={`w-full max-w-md rounded-t-3xl sm:rounded-2xl border shadow-2xl p-4 space-y-3 ${
              isDark ? 'bg-[#1C1F24] border-[#333842] text-white' : 'bg-white border-gray-200 text-gray-900'
            }`}
          >
            <div className="flex items-center justify-between pb-2 border-b border-inherit">
              <span className="font-bold text-sm">{isRtl ? 'اختر نوع المعاملة الجديدة' : 'Select New Transaction'}</span>
              <button
                onClick={() => setIsChoiceSheetOpen(false)}
                className={`p-1.5 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center ${
                  isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-black'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => {
                  soundService.playClick();
                  setIsChoiceSheetOpen(false);
                  setSelectedOrder(null);
                  setReturnItems([]);
                  setWizardStep(1);
                  setCreateMode('return');
                }}
                className={`w-full p-4 rounded-2xl border flex items-center gap-3.5 transition-all text-start min-h-[56px] ${
                  isDark
                    ? 'border-[#333842] bg-[#121417] hover:bg-[#252932] hover:border-amber-500/50'
                    : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                }`}
              >
                <div className="w-11 h-11 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center shrink-0">
                  <RotateCcw className="w-6 h-6" />
                </div>
                <div>
                  <div className="font-bold text-sm">{isRtl ? 'طلب مرتجع بيع (Sales Return)' : 'New Sales Return'}</div>
                  <div className="text-[11px] text-gray-400 mt-0.5">
                    {isRtl ? 'إرجاع بضاعة من طلب بيع مؤكد إلى المخزن' : 'Return items from confirmed order to warehouse'}
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  soundService.playClick();
                  setIsChoiceSheetOpen(false);
                  setSelectedInvoice(null);
                  setCreditItems([]);
                  setWizardStep(1);
                  setCreateMode('credit_note');
                }}
                className={`w-full p-4 rounded-2xl border flex items-center gap-3.5 transition-all text-start min-h-[56px] ${
                  isDark
                    ? 'border-[#333842] bg-[#121417] hover:bg-[#252932] hover:border-indigo-500/50'
                    : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                }`}
              >
                <div className="w-11 h-11 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                  <CreditCard className="w-6 h-6" />
                </div>
                <div>
                  <div className="font-bold text-sm">{isRtl ? 'إصدار مذكرة ائتمان (Credit Note)' : 'New Credit Note'}</div>
                  <div className="text-[11px] text-gray-400 mt-0.5">
                    {isRtl ? 'تسوية مالية وإشعار دائن لحساب العميل' : 'Financial credit adjustment for customer invoice'}
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Return Detail Modal */}
      {selectedReturn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm select-none">
          <div className={`w-full max-w-sm rounded-2xl border shadow-2xl flex flex-col max-h-[85vh] overflow-hidden ${
            isDark ? 'bg-[#1C1F24] border-[#333842] text-white' : 'bg-white border-gray-200 text-gray-900'
          }`}>
            <div className={`p-3 border-b flex items-center justify-between ${
              isDark ? 'border-[#333842] bg-[#262A31]' : 'border-gray-200 bg-gray-50'
            }`}>
              <div className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-amber-500" />
                <span className="font-bold text-sm">{selectedReturn.returnNumber}</span>
              </div>
              <button
                onClick={() => setSelectedReturn(null)}
                className={`p-1 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center ${
                  isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-black'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs">
              <div>
                <span className="text-gray-500 block text-[10px]">{isRtl ? 'العميل:' : 'Customer:'}</span>
                <span className="font-bold text-sm block mt-0.5">{selectedReturn.customerName}</span>
                <span className="text-[11px] text-gray-400 font-mono block">
                  طلب: {selectedReturn.linkedOrderNumber} • {selectedReturn.date}
                </span>
              </div>

              <div>
                <span className="font-bold text-xs block mb-1.5">{isRtl ? 'الأصناف المردودة:' : 'Returned Items:'}</span>
                <div className="space-y-1.5">
                  {selectedReturn.items.map((it, idx) => (
                    <div
                      key={idx}
                      className={`p-2.5 rounded-xl border flex justify-between items-center ${
                        isDark ? 'bg-[#121417] border-[#333842]' : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div>
                        <div className="font-bold truncate max-w-[180px]">{it.name}</div>
                        <div className="text-[10px] font-mono text-gray-500">
                          {it.enteredQty} × {it.unitPrice.toFixed(2)}
                        </div>
                      </div>
                      <div className="font-mono font-bold text-amber-500">
                        {it.lineTotal.toFixed(2)} {isRtl ? 'ج.م' : 'EGP'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className={`p-3 rounded-xl border flex justify-between items-center font-mono ${
                isDark ? 'bg-[#262A31] border-[#333842]' : 'bg-gray-100 border-gray-200'
              }`}>
                <span className="text-xs">{isRtl ? 'إجمالي المرتجع:' : 'Total Return:'}</span>
                <span className="text-base font-bold text-amber-500">
                  {selectedReturn.netDue.toFixed(2)} {isRtl ? 'ج.م' : 'EGP'}
                </span>
              </div>
            </div>

            {/* Footer Quick Print Action */}
            <div className={`p-3 border-t grid grid-cols-2 gap-2 ${
              isDark ? 'border-[#333842] bg-[#262A31]' : 'border-gray-200 bg-gray-50'
            }`}>
              <button
                type="button"
                onClick={() => {
                  openReceipt(selectedReturn, 'return');
                  setSelectedReturn(null);
                }}
                className="h-11 min-h-[44px] bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
              >
                <Printer className="w-4 h-4" />
                <span>{isRtl ? 'طباعة الإشعار' : 'Print Voucher'}</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedReturn(null)}
                className={`h-11 min-h-[44px] border rounded-xl text-xs font-semibold flex items-center justify-center transition-colors ${
                  isDark ? 'border-[#333842] hover:bg-[#333842] text-gray-300' : 'border-gray-300 hover:bg-gray-100 text-gray-700'
                }`}
              >
                {isRtl ? 'إغلاق' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Credit Note Detail Modal */}
      {selectedCreditNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm select-none">
          <div className={`w-full max-w-sm rounded-2xl border shadow-2xl flex flex-col max-h-[85vh] overflow-hidden ${
            isDark ? 'bg-[#1C1F24] border-[#333842] text-white' : 'bg-white border-gray-200 text-gray-900'
          }`}>
            <div className={`p-3 border-b flex items-center justify-between ${
              isDark ? 'border-[#333842] bg-[#262A31]' : 'border-gray-200 bg-gray-50'
            }`}>
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-indigo-400" />
                <span className="font-bold text-sm">{selectedCreditNote.creditNoteNumber}</span>
              </div>
              <button
                onClick={() => setSelectedCreditNote(null)}
                className={`p-1 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center ${
                  isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-black'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs">
              <div>
                <span className="text-gray-500 block text-[10px]">{isRtl ? 'العميل:' : 'Customer:'}</span>
                <span className="font-bold text-sm block mt-0.5">{selectedCreditNote.customerName}</span>
                <span className="text-[11px] text-gray-400 font-mono block">
                  فاتورة: {selectedCreditNote.linkedInvoiceNumber || '-'} • {selectedCreditNote.date}
                </span>
              </div>

              <div>
                <span className="text-gray-500 block text-[10px]">{isRtl ? 'السبب:' : 'Reason:'}</span>
                <span className="font-medium text-xs block mt-0.5">{selectedCreditNote.reason}</span>
              </div>

              <div className={`p-3 rounded-xl border flex justify-between items-center font-mono ${
                isDark ? 'bg-[#262A31] border-[#333842]' : 'bg-gray-100 border-gray-200'
              }`}>
                <span className="text-xs">{isRtl ? 'مبلغ الائتمان الدائن:' : 'Credited Amount:'}</span>
                <span className="text-base font-bold text-indigo-400">
                  {selectedCreditNote.netDue.toFixed(2)} {isRtl ? 'ج.م' : 'EGP'}
                </span>
              </div>
            </div>

            {/* Footer Quick Print Action */}
            <div className={`p-3 border-t grid grid-cols-2 gap-2 ${
              isDark ? 'border-[#333842] bg-[#262A31]' : 'border-gray-200 bg-gray-50'
            }`}>
              <button
                type="button"
                onClick={() => {
                  openReceipt(selectedCreditNote, 'credit_note');
                  setSelectedCreditNote(null);
                }}
                className="h-11 min-h-[44px] bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
              >
                <Printer className="w-4 h-4" />
                <span>{isRtl ? 'طباعة الإشعار الدائن' : 'Print Credit Note'}</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedCreditNote(null)}
                className={`h-11 min-h-[44px] border rounded-xl text-xs font-semibold flex items-center justify-center transition-colors ${
                  isDark ? 'border-[#333842] hover:bg-[#333842] text-gray-300' : 'border-gray-300 hover:bg-gray-100 text-gray-700'
                }`}
              >
                {isRtl ? 'إغلاق' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
