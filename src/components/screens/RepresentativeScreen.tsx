import React, { useState, useEffect, useMemo } from 'react';
import {
  RepresentativeProfile,
  SalesInvoice,
  PettyCashTransaction
} from '../../types';
import { storageService } from '../../services/storage';
import { soundService } from '../../services/sound';
import { useApp } from '../../context/AppContext';
import {
  Users,
  Wallet,
  Receipt,
  CheckCircle2,
  Clock,
  Search,
  Printer,
  Share2,
  Layers,
  RefreshCw,
  FileText,
  X,
  PieChart,
  BarChart3,
  Banknote,
  ShieldCheck,
  ChevronDown
} from 'lucide-react';

export const RepresentativeScreen: React.FC = () => {
  const { language, theme, showToast, openReceipt } = useApp();
  const isDark = theme === 'dark';

  // Data State
  const [representatives, setRepresentatives] = useState<RepresentativeProfile[]>([]);
  const [selectedRepId, setSelectedRepId] = useState<string>('');
  const [invoices, setInvoices] = useState<SalesInvoice[]>([]);
  const [transactions, setTransactions] = useState<PettyCashTransaction[]>([]);

  // Active View Tab
  const [activeTab, setActiveTab] = useState<'overview' | 'invoices' | 'ledger'>('overview');

  // Filters
  const [filterSearch, setFilterSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'unpaid' | 'partial' | 'paid'>('all');
  const [dateFrom] = useState('');
  const [dateTo] = useState('');

  // Modals
  const [showFifoModal, setShowFifoModal] = useState(false);
  const [fifoAmount, setFifoAmount] = useState<string>('');
  const [fifoNotes, setFifoNotes] = useState('');
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<SalesInvoice | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const reps = storageService.getRepresentatives();
    setRepresentatives(reps);
    if (reps.length > 0 && !selectedRepId) {
      setSelectedRepId(reps[0].id);
    }
    const invs = storageService.getInvoices();
    setInvoices(invs);
    const txs = storageService.getPettyCashTransactions();
    setTransactions(txs);
  };

  const currentRep = useMemo(() => {
    return representatives.find(r => r.id === selectedRepId) || representatives[0];
  }, [representatives, selectedRepId]);

  // Invoices specifically related to this representative
  const repInvoices = useMemo(() => {
    if (!currentRep) return [];
    return invoices.filter(inv => {
      const repName = currentRep.displayName.toLowerCase();
      const repUser = currentRep.username.toLowerCase();
      const invRep = (inv.salesRep || '').toLowerCase();
      return (
        invRep === repName ||
        invRep.includes(repUser) ||
        currentRep.username === 'sa'
      );
    });
  }, [invoices, currentRep]);

  // Petty cash transactions for this representative
  const repTransactions = useMemo(() => {
    if (!currentRep) return [];
    return transactions.filter(t => t.repId === currentRep.id || currentRep.username === 'sa');
  }, [transactions, currentRep]);

  // Metrics for the 6 KPI Cards (matching the user ERP screenshot)
  const metrics = useMemo(() => {
    const totalInvoicesCount = repInvoices.length;
    const totalInvoicesValue = repInvoices.reduce((acc, inv) => acc + inv.netDue, 0);

    const paidInvoices = repInvoices.filter(
      inv => inv.settlementStatus === 'paid' || (inv.paidAmount && inv.paidAmount >= inv.netDue)
    );
    const paidCount = paidInvoices.length;
    const paidAmount = repInvoices.reduce((acc, inv) => acc + (inv.paidAmount || 0), 0);

    const unpaidInvoices = repInvoices.filter(
      inv => inv.settlementStatus === 'unpaid' || (!inv.settlementStatus && (!inv.paidAmount || inv.paidAmount === 0))
    );
    const partialInvoices = repInvoices.filter(inv => inv.settlementStatus === 'partial');
    const unpaidCount = unpaidInvoices.length + partialInvoices.length;
    const unpaidAmount = repInvoices.reduce((acc, inv) => {
      const remaining = inv.remainingBalance !== undefined ? inv.remainingBalance : (inv.netDue - (inv.paidAmount || 0));
      return acc + Math.max(0, remaining);
    }, 0);

    const pettyCash = currentRep ? currentRep.pettyCashBalance : 0;
    const creditLimit = currentRep ? currentRep.creditLimit : 0;
    const allocationCeiling = currentRep ? currentRep.allocationCeiling : 0;

    const ceilingUsageRatio = allocationCeiling > 0 ? (pettyCash / allocationCeiling) * 100 : 0;
    const collectionRate = totalInvoicesValue > 0 ? (paidAmount / totalInvoicesValue) * 100 : 0;

    return {
      totalInvoicesCount,
      totalInvoicesValue,
      paidCount,
      paidAmount,
      unpaidCount,
      unpaidAmount,
      pettyCash,
      creditLimit,
      allocationCeiling,
      ceilingUsageRatio,
      collectionRate
    };
  }, [repInvoices, currentRep]);

  // Filtered invoices in the list tab
  const filteredInvoices = useMemo(() => {
    return repInvoices.filter(inv => {
      if (filterSearch) {
        const query = filterSearch.toLowerCase();
        const matchNo = inv.invoiceNumber.toLowerCase().includes(query);
        const matchCust = inv.customerName.toLowerCase().includes(query);
        if (!matchNo && !matchCust) return false;
      }
      if (filterStatus === 'paid') {
        if (inv.settlementStatus !== 'paid' && !(inv.paidAmount && inv.paidAmount >= inv.netDue)) return false;
      } else if (filterStatus === 'partial') {
        if (inv.settlementStatus !== 'partial') return false;
      } else if (filterStatus === 'unpaid') {
        if (inv.settlementStatus === 'paid' || inv.settlementStatus === 'partial' || (inv.paidAmount && inv.paidAmount > 0)) return false;
      }
      if (dateFrom && inv.date < dateFrom) return false;
      if (dateTo && inv.date > dateTo) return false;
      return true;
    });
  }, [repInvoices, filterSearch, filterStatus, dateFrom, dateTo]);

  // Open FIFO Dialog with sensible default
  const handleOpenFifo = () => {
    soundService.playClick();
    if (!currentRep || currentRep.pettyCashBalance <= 0) {
      soundService.playError();
      showToast(
        language === 'ar'
          ? 'رصيد العهدة الحالي هو صفر (0.00 ر.س). لا توجد مبالغ متاحة للتسوية'
          : 'Petty cash balance is zero. No funds available for settlement.',
        'error'
      );
      return;
    }
    const defaultSettlement = Math.min(currentRep.pettyCashBalance, metrics.unpaidAmount);
    setFifoAmount(defaultSettlement > 0 ? defaultSettlement.toString() : '');
    setFifoNotes('');
    setShowFifoModal(true);
  };

  // Execute FIFO Auto-Settlement
  const handleExecuteFifo = () => {
    if (!currentRep) return;
    const amountNum = Number(fifoAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      soundService.playError();
      showToast(language === 'ar' ? 'يرجى إدخال مبلغ تسوية صحيح' : 'Please enter valid settlement amount', 'error');
      return;
    }

    const res = storageService.applyFifoSettlement(currentRep.id, amountNum, fifoNotes);
    if (!res.success) {
      soundService.playError();
      showToast(res.error || 'حدث خطأ أثناء إجراء التسوية', 'error');
      return;
    }

    soundService.playScanSuccess();
    showToast(
      language === 'ar'
        ? `تمت التسوية بنجاح: تم سداد ${res.settledAmount.toLocaleString()} ر.س عبر ${res.settledInvoicesCount} فواتير وفق FIFO`
        : `Successfully settled ${res.settledAmount} across ${res.settledInvoicesCount} invoices via FIFO`,
      'success'
    );
    setShowFifoModal(false);
    loadData();
  };

  if (!currentRep) {
    return null;
  }

  return (
    <div id="representative-screen" className={`flex-1 flex flex-col min-h-0 ${isDark ? 'bg-[#121417] text-[#F5F6F7]' : 'bg-slate-50 text-slate-900'}`}>
      {/* Top Header & Representative Switcher */}
      <div className={`p-3 border-b flex flex-col gap-2 ${isDark ? 'border-[#333842] bg-[#1C1F24]' : 'border-slate-200 bg-white shadow-sm'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-blue-600/20 text-blue-500 border border-blue-500/30 flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xs font-bold leading-tight">
                {language === 'ar' ? 'لوحة المندوب والتحصيل المالي' : 'Representative & Collections'}
              </h2>
              <span className="text-[10px] text-gray-500">
                {language === 'ar' ? 'متابعة الفواتير ورصيد العهدة والتسوية التلقائية' : 'Track Invoices, Petty Cash & FIFO Settlements'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                soundService.playClick();
                setShowReportModal(true);
              }}
              className={`h-9 px-2.5 rounded-xl border text-[11px] font-bold flex items-center gap-1.5 transition-colors ${
                isDark ? 'border-[#333842] bg-[#262A31] text-gray-300 hover:text-white' : 'border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-blue-500" />
              <span>{language === 'ar' ? 'تقرير' : 'Report'}</span>
            </button>

            <button
              onClick={loadData}
              className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-colors ${
                isDark ? 'border-[#333842] bg-[#262A31] text-gray-400 hover:text-white' : 'border-slate-300 bg-slate-100 text-slate-600 hover:text-slate-900'
              }`}
              title="تحديث البيانات"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Rep Selector Dropdown */}
        <div className="relative">
          <select
            id="rep-selector"
            value={selectedRepId}
            onChange={(e) => {
              soundService.playClick();
              setSelectedRepId(e.target.value);
            }}
            className={`w-full h-11 pl-3 pr-9 rounded-xl border text-xs font-bold outline-none appearance-none transition-all ${
              isDark ? 'border-[#333842] bg-[#121417] text-white focus:border-blue-500' : 'border-slate-300 bg-slate-50 text-slate-900 focus:border-blue-500 shadow-sm'
            }`}
          >
            {representatives.map((rep) => (
              <option key={rep.id} value={rep.id}>
                {rep.displayName} - ({rep.badgeNumber}) - {rep.branch}
              </option>
            ))}
          </select>
          <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
            <ChevronDown className="w-4 h-4" />
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-500/20 pt-1 -mb-1 gap-1">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-2 px-3 text-xs font-bold transition-colors relative ${
              activeTab === 'overview'
                ? 'text-blue-500'
                : isDark ? 'text-gray-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <span>{language === 'ar' ? 'المؤشرات والرسوم' : 'Overview'}</span>
            {activeTab === 'overview' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-full" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('invoices')}
            className={`pb-2 px-3 text-xs font-bold transition-colors relative flex items-center gap-1.5 ${
              activeTab === 'invoices'
                ? 'text-blue-500'
                : isDark ? 'text-gray-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <span>{language === 'ar' ? 'فواتير المندوب' : 'Invoices'}</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-500/20 text-blue-500 font-mono">
              {repInvoices.length}
            </span>
            {activeTab === 'invoices' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-full" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('ledger')}
            className={`pb-2 px-3 text-xs font-bold transition-colors relative flex items-center gap-1.5 ${
              activeTab === 'ledger'
                ? 'text-blue-500'
                : isDark ? 'text-gray-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <span>{language === 'ar' ? 'سجل حركة العهدة' : 'Petty Cash Ledger'}</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-cyan-500/20 text-cyan-400 font-mono">
              {repTransactions.length}
            </span>
            {activeTab === 'ledger' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-full" />
            )}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 pb-24">
        {/* ========================================================================= */}
        {/* 6 CORE ERP KPI SUMMARY CARDS (Matching user screenshot)                   */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-2 gap-2.5">
          {/* 1. إجمالي الفواتير (Total Invoices) - Blue */}
          <div className={`p-3 rounded-2xl border transition-all ${
            isDark ? 'bg-blue-950/20 border-blue-500/30' : 'bg-blue-50 border-blue-200 shadow-sm'
          }`}>
            <div className="flex items-center justify-between text-xs text-blue-500 font-bold mb-1">
              <span>{language === 'ar' ? 'إجمالي الفواتير' : 'Total Invoices'}</span>
              <Receipt className="w-4 h-4 opacity-80" />
            </div>
            <div className="text-lg font-black font-mono text-blue-500">
              {metrics.totalInvoicesValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              <span className="text-[10px] font-sans font-normal opacity-80 mr-1">ر.س</span>
            </div>
            <div className="text-[10px] text-gray-500 mt-1 flex items-center justify-between font-mono">
              <span>{language === 'ar' ? 'عدد الفواتير:' : 'Count:'} {metrics.totalInvoicesCount}</span>
              <span className="text-blue-400">100%</span>
            </div>
          </div>

          {/* 2. غير مسدد (Unpaid) - Orange / Amber */}
          <div className={`p-3 rounded-2xl border transition-all ${
            isDark ? 'bg-amber-950/20 border-amber-500/30' : 'bg-amber-50 border-amber-200 shadow-sm'
          }`}>
            <div className="flex items-center justify-between text-xs text-amber-500 font-bold mb-1">
              <span>{language === 'ar' ? 'غير مسدد' : 'Unpaid'}</span>
              <Clock className="w-4 h-4 opacity-80" />
            </div>
            <div className="text-lg font-black font-mono text-amber-500">
              {metrics.unpaidAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              <span className="text-[10px] font-sans font-normal opacity-80 mr-1">ر.س</span>
            </div>
            <div className="text-[10px] text-gray-500 mt-1 flex items-center justify-between font-mono">
              <span>{language === 'ar' ? 'الفواتير المعلقة:' : 'Open Invoices:'} {metrics.unpaidCount}</span>
              <span className="text-amber-400">
                {metrics.totalInvoicesValue > 0 ? ((metrics.unpaidAmount / metrics.totalInvoicesValue) * 100).toFixed(0) : 0}%
              </span>
            </div>
          </div>

          {/* 3. مسدد (Paid) - Green */}
          <div className={`p-3 rounded-2xl border transition-all ${
            isDark ? 'bg-emerald-950/20 border-emerald-500/30' : 'bg-emerald-50 border-emerald-200 shadow-sm'
          }`}>
            <div className="flex items-center justify-between text-xs text-emerald-500 font-bold mb-1">
              <span>{language === 'ar' ? 'مسدد' : 'Paid'}</span>
              <CheckCircle2 className="w-4 h-4 opacity-80" />
            </div>
            <div className="text-lg font-black font-mono text-emerald-500">
              {metrics.paidAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              <span className="text-[10px] font-sans font-normal opacity-80 mr-1">ر.س</span>
            </div>
            <div className="text-[10px] text-gray-500 mt-1 flex items-center justify-between font-mono">
              <span>{language === 'ar' ? 'الفواتير المسددة:' : 'Settled:'} {metrics.paidCount}</span>
              <span className="text-emerald-400 font-bold">{metrics.collectionRate.toFixed(0)}%</span>
            </div>
          </div>

          {/* 4. رصيد العهدة / الخزينة الصغيرة (Petty Cash Balance) - Cyan */}
          <div className={`p-3 rounded-2xl border transition-all relative overflow-hidden ${
            isDark ? 'bg-cyan-950/20 border-cyan-500/30' : 'bg-cyan-50 border-cyan-200 shadow-sm'
          }`}>
            <div className="flex items-center justify-between text-xs text-cyan-400 font-bold mb-1">
              <span>{language === 'ar' ? 'رصيد العهدة' : 'Petty Cash'}</span>
              <Wallet className="w-4 h-4 opacity-80 text-cyan-400" />
            </div>
            <div className="text-lg font-black font-mono text-cyan-400">
              {metrics.pettyCash.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              <span className="text-[10px] font-sans font-normal opacity-80 mr-1">ر.س</span>
            </div>
            <div className="text-[10px] text-cyan-600 dark:text-cyan-300 mt-1 flex items-center justify-between">
              <span>{language === 'ar' ? 'نقدية متاحة بيده' : 'In Rep Hand'}</span>
              <span className="font-bold text-[9px] px-1 bg-cyan-500/20 rounded">جاهز للتسوية</span>
            </div>
          </div>

          {/* 5. حد الائتمان (Credit Limit) - Red / Rose */}
          <div className={`p-3 rounded-2xl border transition-all ${
            isDark ? 'bg-rose-950/20 border-rose-500/30' : 'bg-rose-50 border-rose-200 shadow-sm'
          }`}>
            <div className="flex items-center justify-between text-xs text-rose-500 font-bold mb-1">
              <span>{language === 'ar' ? 'حد الائتمان' : 'Credit Limit'}</span>
              <ShieldCheck className="w-4 h-4 opacity-80" />
            </div>
            <div className="text-lg font-black font-mono text-rose-500">
              {metrics.creditLimit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              <span className="text-[10px] font-sans font-normal opacity-80 mr-1">ر.س</span>
            </div>
            <div className="text-[10px] text-gray-500 mt-1 font-mono">
              {language === 'ar' ? 'سقف المديونية المسموح' : 'Max Allowed Rep Debt'}
            </div>
          </div>

          {/* 6. مبلغ التخصيص / سقف التخصيص (Allocation Ceiling) - Slate / Indigo */}
          <div className={`p-3 rounded-2xl border transition-all ${
            isDark ? 'bg-indigo-950/20 border-indigo-500/30' : 'bg-indigo-50 border-indigo-200 shadow-sm'
          }`}>
            <div className="flex items-center justify-between text-xs text-indigo-400 font-bold mb-1">
              <span>{language === 'ar' ? 'مبلغ التخصيص' : 'Allocation Ceiling'}</span>
              <Layers className="w-4 h-4 opacity-80" />
            </div>
            <div className="text-lg font-black font-mono text-indigo-400">
              {metrics.allocationCeiling.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              <span className="text-[10px] font-sans font-normal opacity-80 mr-1">ر.س</span>
            </div>
            <div className="text-[10px] text-gray-500 mt-1 flex items-center justify-between font-mono">
              <span>{language === 'ar' ? 'سقف العهدة:' : 'Custody Cap:'}</span>
              <span className="text-indigo-400 font-bold">{metrics.ceilingUsageRatio.toFixed(1)}%</span>
            </div>
          </div>
        </div>

        {/* Prominent Action Bar: FIFO Auto-Settlement Trigger */}
        <div className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 ${
          isDark ? 'bg-[#1C1F24] border-[#333842]' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-500 border border-amber-500/30 flex items-center justify-center font-bold">
              <Banknote className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold leading-tight flex items-center gap-1.5">
                <span>{language === 'ar' ? 'التسوية التلقائية بمبلغ متاح' : 'FIFO Auto-Settlement'}</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-500 font-mono">FIFO</span>
              </div>
              <div className="text-[10px] text-gray-500 mt-0.5">
                {language === 'ar'
                  ? `متاح بعهدة المندوب: ${metrics.pettyCash.toLocaleString()} ر.س | مستحق: ${metrics.unpaidAmount.toLocaleString()} ر.س`
                  : `Custody Available: ${metrics.pettyCash} SAR | Due: ${metrics.unpaidAmount} SAR`}
              </div>
            </div>
          </div>

          <button
            id="open-fifo-settlement-btn"
            type="button"
            onClick={handleOpenFifo}
            disabled={metrics.pettyCash <= 0 || metrics.unpaidAmount <= 0}
            className={`h-11 px-3.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-md active:scale-98 ${
              metrics.pettyCash > 0 && metrics.unpaidAmount > 0
                ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/30'
                : 'bg-gray-500/20 text-gray-400 cursor-not-allowed border border-gray-500/20'
            }`}
          >
            <Banknote className="w-4 h-4" />
            <span>{language === 'ar' ? 'تسوية تلقائية' : 'Auto Settle'}</span>
          </button>
        </div>

        {/* TAB 1: OVERVIEW & INTERACTIVE SVG CHARTS */}
        {activeTab === 'overview' && (
          <div className="space-y-3">
            {/* Chart 1: Donut breakdown & Collection Gauge */}
            <div className={`p-3.5 rounded-2xl border space-y-3 ${
              isDark ? 'bg-[#1C1F24] border-[#333842]' : 'bg-white border-slate-200 shadow-sm'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-blue-500" />
                  <span className="text-xs font-bold">
                    {language === 'ar' ? 'توزيع المبالغ والتحصيل' : 'Payment Distribution Breakdown'}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-gray-500">
                  {language === 'ar' ? 'نسبة التحصيل:' : 'Collection:'} {metrics.collectionRate.toFixed(1)}%
                </span>
              </div>

              {/* Visual Progress Bar (Multi-segment) */}
              <div className="h-4 w-full rounded-full bg-gray-200 dark:bg-gray-800 overflow-hidden flex">
                <div
                  style={{ width: `${Math.min(100, metrics.collectionRate)}%` }}
                  className="bg-emerald-500 h-full transition-all duration-500"
                  title={`مسدد: ${metrics.paidAmount.toLocaleString()} ر.س`}
                />
                <div
                  style={{ width: `${Math.min(100, 100 - metrics.collectionRate)}%` }}
                  className="bg-amber-500 h-full transition-all duration-500"
                  title={`غير مسدد: ${metrics.unpaidAmount.toLocaleString()} ر.س`}
                />
              </div>

              {/* Chart Legend */}
              <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-gray-500/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span>{language === 'ar' ? 'المسدد والمحصل:' : 'Paid & Collected:'}</span>
                  </div>
                  <span className="font-mono font-bold text-emerald-500">{metrics.paidAmount.toLocaleString()} ر.س</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <span>{language === 'ar' ? 'المتبقي المستحق:' : 'Unpaid Due:'}</span>
                  </div>
                  <span className="font-mono font-bold text-amber-500">{metrics.unpaidAmount.toLocaleString()} ر.س</span>
                </div>
              </div>
            </div>

            {/* Chart 2: Custody vs Allocation Ceiling Gauge */}
            <div className={`p-3.5 rounded-2xl border space-y-2.5 ${
              isDark ? 'bg-[#1C1F24] border-[#333842]' : 'bg-white border-slate-200 shadow-sm'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-bold">
                    {language === 'ar' ? 'سقف التخصيص واستخدام العهدة' : 'Allocation Ceiling vs Custody'}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-cyan-400 font-bold">
                  {metrics.pettyCash.toLocaleString()} / {metrics.allocationCeiling.toLocaleString()} ر.س
                </span>
              </div>

              <div className="space-y-1">
                <div className="h-3 w-full rounded-full bg-gray-200 dark:bg-gray-800 overflow-hidden">
                  <div
                    style={{ width: `${Math.min(100, metrics.ceilingUsageRatio)}%` }}
                    className={`h-full transition-all duration-500 ${
                      metrics.ceilingUsageRatio > 90
                        ? 'bg-rose-500'
                        : metrics.ceilingUsageRatio > 70
                        ? 'bg-amber-500'
                        : 'bg-cyan-500'
                    }`}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-gray-500">
                  <span>0 ر.س</span>
                  <span>{metrics.ceilingUsageRatio.toFixed(1)}% من سقف التخصيص</span>
                  <span>{metrics.allocationCeiling.toLocaleString()} ر.س</span>
                </div>
              </div>
            </div>

            {/* Recent Collections Feed */}
            <div className={`p-3.5 rounded-2xl border space-y-2.5 ${
              isDark ? 'bg-[#1C1F24] border-[#333842]' : 'bg-white border-slate-200 shadow-sm'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold">
                  {language === 'ar' ? 'آخر التحصيلات النقدية المودعة بالعهدة' : 'Recent Custody Collections'}
                </span>
                <span className="text-[10px] text-blue-500 font-bold cursor-pointer" onClick={() => setActiveTab('ledger')}>
                  {language === 'ar' ? 'عرض الكل' : 'View All'}
                </span>
              </div>

              {repTransactions.length === 0 ? (
                <div className="text-center py-4 text-xs text-gray-500">
                  {language === 'ar' ? 'لا توجد حركات عهدة مسجلة بعد' : 'No transactions recorded'}
                </div>
              ) : (
                <div className="space-y-1.5">
                  {repTransactions.slice(0, 3).map((tx) => (
                    <div
                      key={tx.id}
                      className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
                        isDark ? 'bg-[#121417] border-[#333842]' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold ${
                          tx.type === 'collection'
                            ? 'bg-emerald-500/20 text-emerald-500'
                            : 'bg-amber-500/20 text-amber-500'
                        }`}>
                          {tx.type === 'collection' ? '+' : '-'}
                        </div>
                        <div>
                          <div className="font-bold text-[11px] truncate max-w-[180px]">
                            {tx.notes || tx.customerName || 'حركة نقدية'}
                          </div>
                          <div className="text-[10px] text-gray-500 font-mono">
                            {tx.date} {tx.invoiceNumber ? `(${tx.invoiceNumber})` : ''}
                          </div>
                        </div>
                      </div>
                      <div className={`font-mono font-bold text-xs ${
                        tx.type === 'collection' ? 'text-emerald-500' : 'text-amber-500'
                      }`}>
                        {tx.type === 'collection' ? '+' : '-'}{tx.amount.toLocaleString()} ر.س
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: INVOICES TABLE & FILTERING */}
        {activeTab === 'invoices' && (
          <div className="space-y-3">
            {/* Filter toolbar */}
            <div className={`p-3 rounded-2xl border space-y-2 text-xs ${
              isDark ? 'bg-[#1C1F24] border-[#333842]' : 'bg-white border-slate-200 shadow-sm'
            }`}>
              <div className="relative">
                <input
                  type="text"
                  value={filterSearch}
                  onChange={(e) => setFilterSearch(e.target.value)}
                  placeholder={language === 'ar' ? 'بحث برقم الفاتورة أو العميل...' : 'Search by invoice # or customer...'}
                  className={`w-full h-10 pl-3 pr-8 rounded-xl border text-xs outline-none ${
                    isDark ? 'border-[#333842] bg-[#121417] text-white' : 'border-slate-300 bg-slate-50 text-slate-900'
                  }`}
                />
                <Search className="w-4 h-4 absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>

              {/* Status Tabs */}
              <div className="grid grid-cols-4 gap-1.5 pt-1">
                {(['all', 'unpaid', 'partial', 'paid'] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setFilterStatus(st)}
                    className={`py-1.5 rounded-lg text-[10px] font-bold border transition-colors ${
                      filterStatus === st
                        ? 'bg-blue-600 border-blue-500 text-white'
                        : isDark
                        ? 'bg-[#121417] border-[#333842] text-gray-400'
                        : 'bg-slate-100 border-slate-300 text-slate-600'
                    }`}
                  >
                    {st === 'all'
                      ? 'الكل'
                      : st === 'unpaid'
                      ? 'غير مسدد'
                      : st === 'partial'
                      ? 'جزئي'
                      : 'مسدد'}
                  </button>
                ))}
              </div>
            </div>

            {/* Invoices List */}
            <div className="space-y-2">
              {filteredInvoices.length === 0 ? (
                <div className={`p-8 text-center rounded-2xl border border-dashed ${
                  isDark ? 'border-[#333842]' : 'border-slate-300 bg-white'
                }`}>
                  <Receipt className="w-10 h-10 mx-auto text-gray-400 mb-2" />
                  <div className="text-xs text-gray-500">لا توجد فواتير مطابقة للمحددات</div>
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
                      className={`p-3 rounded-2xl border cursor-pointer active:scale-99 transition-all space-y-1.5 ${
                        isDark
                          ? 'bg-[#1C1F24] border-[#333842] hover:border-blue-500/50'
                          : 'bg-white border-slate-200 hover:border-blue-500/50 shadow-sm'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-xs text-blue-500">
                            {inv.invoiceNumber}
                          </span>
                          <span className="text-[10px] text-gray-400 font-mono">
                            {inv.date}
                          </span>
                        </div>

                        {isSettled ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-500">
                            مسددة بالكامل
                          </span>
                        ) : isPartial ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-500">
                            مسددة جزئياً
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-500/20 text-slate-400">
                            غير مسددة
                          </span>
                        )}
                      </div>

                      <div className="text-xs font-bold truncate">
                        {inv.customerName}
                      </div>

                      <div className="flex items-center justify-between text-xs pt-1 border-t border-gray-500/10 font-mono">
                        <span className="text-[11px] text-gray-500">
                          {language === 'ar' ? 'إجمالي:' : 'Total:'} {inv.netDue.toFixed(2)} ر.س
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-amber-500 font-bold text-[11px]">
                            {language === 'ar' ? 'محصل:' : 'Paid:'} {(inv.paidAmount || 0).toFixed(2)}
                          </span>
                          <span className={`font-bold text-[11px] ${remaining > 0 ? 'text-orange-500' : 'text-emerald-500'}`}>
                            {language === 'ar' ? 'متبقي:' : 'Due:'} {remaining.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* TAB 3: PETTY CASH LEDGER */}
        {activeTab === 'ledger' && (
          <div className="space-y-2.5">
            <div className={`p-3 rounded-2xl border flex items-center justify-between ${
              isDark ? 'bg-cyan-950/20 border-cyan-500/30' : 'bg-cyan-50 border-cyan-200'
            }`}>
              <div className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-cyan-400" />
                <div>
                  <div className="text-xs font-bold text-cyan-400">رصيد العهدة النقدية الحالي</div>
                  <div className="text-[10px] text-gray-400">مجموع التحصيلات ناقص التسويات</div>
                </div>
              </div>
              <div className="text-base font-black font-mono text-cyan-400">
                {metrics.pettyCash.toLocaleString(undefined, { minimumFractionDigits: 2 })} ر.س
              </div>
            </div>

            <div className="space-y-1.5">
              {repTransactions.length === 0 ? (
                <div className={`p-8 text-center rounded-2xl border border-dashed ${
                  isDark ? 'border-[#333842]' : 'border-slate-300 bg-white'
                }`}>
                  <Wallet className="w-10 h-10 mx-auto text-gray-400 mb-2" />
                  <div className="text-xs text-gray-500">لا توجد حركات عهدة مسجلة</div>
                </div>
              ) : (
                repTransactions.map((tx) => (
                  <div
                    key={tx.id}
                    className={`p-3 rounded-2xl border space-y-1 text-xs ${
                      isDark ? 'bg-[#1C1F24] border-[#333842]' : 'bg-white border-slate-200 shadow-sm'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          tx.type === 'collection'
                            ? 'bg-emerald-500/20 text-emerald-500'
                            : 'bg-amber-500/20 text-amber-500'
                        }`}>
                          {tx.type === 'collection' ? 'تحصيل نقدي (+)' : 'تسوية فواتير (-)'}
                        </span>
                        <span className="font-mono text-[10px] text-gray-500">{tx.date}</span>
                      </div>
                      <span className={`font-mono font-bold text-sm ${
                        tx.type === 'collection' ? 'text-emerald-500' : 'text-amber-500'
                      }`}>
                        {tx.type === 'collection' ? '+' : '-'}{tx.amount.toLocaleString()} ر.س
                      </span>
                    </div>

                    <div className="font-bold text-[11px] truncate">
                      {tx.notes || tx.customerName}
                    </div>

                    {tx.invoiceNumber && (
                      <div className="text-[10px] text-gray-500 font-mono">
                        الفاتورة المرتبطة: {tx.invoiceNumber}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: FIFO AUTO-SETTLEMENT DIALOG                                      */}
      {/* ========================================================================= */}
      {showFifoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm select-none animate-fadeIn">
          <div className={`w-full max-w-sm rounded-2xl border shadow-2xl flex flex-col max-h-[90vh] overflow-hidden ${
            isDark ? 'bg-[#1C1F24] border-[#333842] text-[#F5F6F7]' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className={`p-3 border-b flex items-center justify-between ${
              isDark ? 'border-[#333842] bg-[#262A31]' : 'border-slate-200 bg-slate-100'
            }`}>
              <div className="flex items-center gap-2">
                <Banknote className="w-4 h-4 text-amber-500" />
                <span className="font-bold text-sm">{language === 'ar' ? 'التسوية التلقائية (FIFO)' : 'FIFO Auto-Settlement'}</span>
              </div>
              <button onClick={() => setShowFifoModal(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs">
              <div className={`p-3 rounded-xl border flex items-center justify-between ${
                isDark ? 'bg-cyan-950/20 border-cyan-500/30' : 'bg-cyan-50 border-cyan-200'
              }`}>
                <div>
                  <span className="block text-[10px] text-gray-400">رصيد العهدة المتاح للتسوية:</span>
                  <span className="text-base font-black font-mono text-cyan-400">
                    {metrics.pettyCash.toLocaleString()} ر.س
                  </span>
                </div>
                <div className="text-left font-mono">
                  <span className="block text-[10px] text-gray-400">إجمالي غير المسدد:</span>
                  <span className="text-sm font-bold text-amber-500">
                    {metrics.unpaidAmount.toLocaleString()} ر.س
                  </span>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold block mb-1">
                  {language === 'ar' ? 'مبلغ التسوية المطلوب خصمه من العهدة *' : 'Settlement Amount *'}
                </label>
                <input
                  id="fifo-amount-input"
                  type="number"
                  step="0.01"
                  max={metrics.pettyCash}
                  value={fifoAmount}
                  onChange={(e) => setFifoAmount(e.target.value)}
                  placeholder="0.00"
                  className={`w-full h-11 px-3 rounded-xl border font-mono text-sm font-bold outline-none ${
                    Number(fifoAmount) > metrics.pettyCash
                      ? 'border-rose-500 bg-rose-500/10 text-rose-500'
                      : isDark
                      ? 'border-[#333842] bg-[#121417] text-white'
                      : 'border-slate-300 bg-slate-50 text-slate-900'
                  }`}
                />
                {Number(fifoAmount) > metrics.pettyCash && (
                  <span className="text-[10px] text-rose-500 mt-1 block">
                    المبلغ يتجاوز رصيد العهدة المتوفر ({metrics.pettyCash.toLocaleString()} ر.س)
                  </span>
                )}
              </div>

              <div>
                <label className="text-[10px] block mb-1 text-gray-400">ملاحظات التسوية (اختياري)</label>
                <input
                  type="text"
                  value={fifoNotes}
                  onChange={(e) => setFifoNotes(e.target.value)}
                  placeholder="مثال: تسوية مبيعات الأسبوع الأول"
                  className={`w-full h-10 px-3 rounded-xl border text-xs outline-none ${
                    isDark ? 'border-[#333842] bg-[#121417] text-white' : 'border-slate-300 bg-slate-50 text-slate-900'
                  }`}
                />
              </div>

              <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[11px] space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span>آلية التنفيذ المحاسبي FIFO:</span>
                </div>
                <p className="text-[10px] leading-relaxed text-gray-300">
                  سيقوم النظام تلقائياً بتوجيه المبلغ لسداد أقدم الفواتير الصادرة أولاً بأول حتى استنفاد كامل المبلغ، وتحديث رصيد العهدة فوراً.
                </p>
              </div>
            </div>

            <div className={`p-3 border-t grid grid-cols-2 gap-2 ${
              isDark ? 'border-[#333842] bg-[#262A31]' : 'border-slate-200 bg-slate-100'
            }`}>
              <button
                type="button"
                onClick={() => setShowFifoModal(false)}
                className={`h-11 border rounded-xl text-xs font-semibold ${
                  isDark ? 'border-[#333842] text-gray-300' : 'border-slate-300 text-slate-700'
                }`}
              >
                {language === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>

              <button
                type="button"
                id="confirm-fifo-btn"
                onClick={handleExecuteFifo}
                disabled={Number(fifoAmount) <= 0 || Number(fifoAmount) > metrics.pettyCash}
                className={`h-11 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-1.5 transition-all ${
                  Number(fifoAmount) > 0 && Number(fifoAmount) <= metrics.pettyCash
                    ? 'bg-amber-600 hover:bg-amber-500'
                    : 'bg-gray-500/30 cursor-not-allowed text-gray-400'
                }`}
              >
                <span>{language === 'ar' ? 'تأكيد التسوية' : 'Confirm'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: PRINTABLE REPRESENTATIVE REPORT                                  */}
      {/* ========================================================================= */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm select-none animate-fadeIn">
          <div className={`w-full max-w-sm rounded-2xl border shadow-2xl flex flex-col max-h-[90vh] overflow-hidden ${
            isDark ? 'bg-[#1C1F24] border-[#333842] text-[#F5F6F7]' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className={`p-3 border-b flex items-center justify-between ${
              isDark ? 'border-[#333842] bg-[#262A31]' : 'border-slate-200 bg-slate-100'
            }`}>
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-500" />
                <span className="font-bold text-sm">تقرير أداء المندوب والتحصيل</span>
              </div>
              <button onClick={() => setShowReportModal(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs">
              <div className="text-center pb-2 border-b border-gray-500/20">
                <div className="font-black text-sm">{currentRep.displayName}</div>
                <div className="text-[10px] text-gray-500">كود المندوب: {currentRep.badgeNumber} | الفرع: {currentRep.branch}</div>
                <div className="text-[10px] text-gray-500">تاريخ التقرير: {new Date().toLocaleDateString('ar-SA')}</div>
              </div>

              {/* Report Summary Table */}
              <div className="space-y-1.5 font-mono text-[11px]">
                <div className="flex justify-between py-1 border-b border-gray-500/10">
                  <span>إجمالي فواتير المبيعات:</span>
                  <span className="font-bold text-blue-500">{metrics.totalInvoicesValue.toLocaleString()} ر.س</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-500/10">
                  <span>إجمالي المبالغ المسددة:</span>
                  <span className="font-bold text-emerald-500">{metrics.paidAmount.toLocaleString()} ر.س</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-500/10">
                  <span>إجمالي المتبقي غير المسدد:</span>
                  <span className="font-bold text-amber-500">{metrics.unpaidAmount.toLocaleString()} ر.س</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-500/10">
                  <span>رصيد العهدة الحالي بيده:</span>
                  <span className="font-bold text-cyan-400">{metrics.pettyCash.toLocaleString()} ر.س</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-500/10">
                  <span>حد الائتمان المعتمد:</span>
                  <span className="font-bold text-rose-500">{metrics.creditLimit.toLocaleString()} ر.س</span>
                </div>
                <div className="flex justify-between py-1">
                  <span>سقف التخصيص:</span>
                  <span className="font-bold text-indigo-400">{metrics.allocationCeiling.toLocaleString()} ر.س</span>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-gray-500/10 border border-gray-500/20 text-center text-[10px] text-gray-400">
                تم استخراج هذا التقرير تلقائياً من نظام سانا سوفت لإدارة نقاط البيع والتوزيع المتنقل
              </div>
            </div>

            <div className={`p-3 border-t grid grid-cols-2 gap-2 ${
              isDark ? 'border-[#333842] bg-[#262A31]' : 'border-slate-200 bg-slate-100'
            }`}>
              <button
                type="button"
                onClick={() => {
                  soundService.playScanSuccess();
                  showToast('تم إرسال أمر الطباعة إلى الطابعة الحرارية', 'success');
                }}
                className="h-11 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Printer className="w-4 h-4" />
                <span>طباعة التقرير</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  soundService.playClick();
                  showToast('تم تصدير التقرير ومشاركته بصيغة PDF', 'info');
                  setShowReportModal(false);
                }}
                className={`h-11 border rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                  isDark ? 'border-[#333842] text-gray-300' : 'border-slate-300 text-slate-700'
                }`}
              >
                <Share2 className="w-4 h-4" />
                <span>مشاركة</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: INVOICE QUICK DETAIL                                             */}
      {/* ========================================================================= */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm select-none animate-fadeIn">
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
              <button onClick={() => setSelectedInvoice(null)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-gray-500/20">
                <span className="text-gray-400">حالة السداد:</span>
                <span className="font-bold text-blue-500">
                  {selectedInvoice.settlementStatus === 'paid' ? 'مسددة بالكامل' : (selectedInvoice.paidAmount && selectedInvoice.paidAmount > 0 ? 'مسددة جزئياً' : 'غير مسددة')}
                </span>
              </div>

              <div>
                <span className="block text-[10px] text-gray-400">العميل:</span>
                <span className="font-bold text-sm">{selectedInvoice.customerName}</span>
                <span className="block text-[10px] text-gray-500 font-mono mt-0.5">
                  الرقم الضريبي: {selectedInvoice.customerTaxNumber}
                </span>
              </div>

              {/* Financial values */}
              <div className="p-3 rounded-xl border space-y-1.5 font-mono text-[11px] bg-slate-500/5 border-gray-500/20">
                <div className="flex justify-between items-center">
                  <span>صافي الفاتورة:</span>
                  <span className="font-bold text-blue-500">{selectedInvoice.netDue.toFixed(2)} ر.س</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>المبلغ المسدد:</span>
                  <span className="font-bold text-amber-500">{(selectedInvoice.paidAmount || 0).toFixed(2)} ر.س</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>المتبقي المطلوب:</span>
                  <span className="font-bold text-orange-500">
                    {(selectedInvoice.remainingBalance !== undefined ? selectedInvoice.remainingBalance : (selectedInvoice.netDue - (selectedInvoice.paidAmount || 0))).toFixed(2)} ر.س
                  </span>
                </div>
              </div>
            </div>

            <div className={`p-3 border-t flex justify-end gap-2 ${
              isDark ? 'border-[#333842] bg-[#262A31]' : 'border-slate-200 bg-slate-100'
            }`}>
              <button
                type="button"
                onClick={() => {
                  openReceipt(selectedInvoice, 'invoice');
                  setSelectedInvoice(null);
                }}
                className="h-10 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>طباعة حرارية</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
