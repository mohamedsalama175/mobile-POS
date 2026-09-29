import React, { useState, useEffect, useMemo } from 'react';
import {
  RepresentativeProfile,
  SalesInvoice,
  PettyCashTransaction
} from '../../types';
import { storageService } from '../../services/storage';
import { soundService } from '../../services/sound';
import { useApp } from '../../context/AppContext';
import { NumericKeypad, AuthGate, StickyBottomBar } from '../ui';
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
  Banknote,
  ShieldCheck,
  ChevronDown,
  ArrowRight,
  ArrowLeft,
  Check,
  Sparkles,
  Info
} from 'lucide-react';

export const RepresentativeScreen: React.FC = () => {
  const { language, theme, showToast, openReceipt, currentUser } = useApp();
  const isDark = theme === 'dark';
  const isRtl = language === 'ar';

  // Data State
  const [representatives, setRepresentatives] = useState<RepresentativeProfile[]>([]);
  const [selectedRepId, setSelectedRepId] = useState<string>('');
  const [invoices, setInvoices] = useState<SalesInvoice[]>([]);
  const [transactions, setTransactions] = useState<PettyCashTransaction[]>([]);

  // Active View Tab: 'overview' | 'invoices' | 'ledger'
  const [activeTab, setActiveTab] = useState<'overview' | 'invoices' | 'ledger'>('overview');

  // Filters
  const [filterSearch, setFilterSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'unpaid' | 'partial' | 'paid'>('all');

  // Modals & Bottom Sheets
  const [showFifoModal, setShowFifoModal] = useState(false);
  const [fifoAmount, setFifoAmount] = useState<number>(0);
  const [fifoNotes, setFifoNotes] = useState('');
  const [isAuthGateOpen, setIsAuthGateOpen] = useState(false);
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

  // Metrics for the KPI Carousel Cards
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

  // Filtered invoices in the invoices tab
  const filteredInvoices = useMemo(() => {
    return repInvoices.filter(inv => {
      if (filterSearch) {
        const q = filterSearch.toLowerCase();
        const match =
          inv.invoiceNumber.toLowerCase().includes(q) ||
          inv.customerName.toLowerCase().includes(q) ||
          (inv.linkedOrderNumber || '').toLowerCase().includes(q);
        if (!match) return false;
      }
      if (filterStatus === 'paid') {
        if (inv.settlementStatus !== 'paid' && !(inv.paidAmount && inv.paidAmount >= inv.netDue)) return false;
      } else if (filterStatus === 'partial') {
        if (inv.settlementStatus !== 'partial') return false;
      } else if (filterStatus === 'unpaid') {
        if (inv.settlementStatus === 'paid' || inv.settlementStatus === 'partial' || (inv.paidAmount && inv.paidAmount > 0)) return false;
      }
      return true;
    });
  }, [repInvoices, filterSearch, filterStatus]);

  // Eligible invoices for FIFO settlement sorted oldest first
  const eligibleInvoicesForFifo = useMemo(() => {
    return repInvoices
      .filter(inv => {
        const remaining = inv.remainingBalance !== undefined ? inv.remainingBalance : (inv.netDue - (inv.paidAmount || 0));
        return remaining > 0.01;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [repInvoices]);

  // Live Pre-Settlement Preview (MePreview) calculation
  const fifoPreview = useMemo(() => {
    let remainingToAllocate = fifoAmount || 0;
    const previewList: Array<{
      invoice: SalesInvoice;
      dueAmount: number;
      allocatedAmount: number;
      remainingAfter: number;
      isFullySettled: boolean;
    }> = [];

    for (const inv of eligibleInvoicesForFifo) {
      if (remainingToAllocate <= 0) break;
      const due = inv.remainingBalance !== undefined ? inv.remainingBalance : (inv.netDue - (inv.paidAmount || 0));
      if (due <= 0) continue;

      const allocated = Math.min(remainingToAllocate, due);
      const remainingAfter = Math.max(0, due - allocated);
      remainingToAllocate -= allocated;

      previewList.push({
        invoice: inv,
        dueAmount: due,
        allocatedAmount: allocated,
        remainingAfter,
        isFullySettled: remainingAfter <= 0.01
      });
    }

    return previewList;
  }, [eligibleInvoicesForFifo, fifoAmount]);

  // Open FIFO Bottom Sheet
  const handleOpenFifo = () => {
    soundService.playClick();
    if (!currentRep || currentRep.pettyCashBalance <= 0) {
      soundService.playError();
      showToast(
        isRtl
          ? 'رصيد العهدة الحالي هو صفر (0.00 ج.م). لا توجد مبالغ متاحة للتسوية'
          : 'Petty cash balance is zero. No funds available for settlement.',
        'error'
      );
      return;
    }
    const defaultSettlement = Math.min(currentRep.pettyCashBalance, metrics.unpaidAmount);
    setFifoAmount(defaultSettlement > 0 ? defaultSettlement : 0);
    setFifoNotes('');
    setShowFifoModal(true);
  };

  // Pre-execute verification trigger
  const handleInitiateFifo = () => {
    if (fifoAmount <= 0) {
      soundService.playError();
      showToast(isRtl ? 'أدخل مبلغ تسوية أكبر من صفر' : 'Enter amount greater than zero', 'error');
      return;
    }
    if (fifoAmount > metrics.pettyCash) {
      soundService.playError();
      showToast(isRtl ? 'المبلغ يتجاوز رصيد العهدة المتاح' : 'Amount exceeds petty cash', 'error');
      return;
    }

    // Open AuthGate PIN modal for security check
    setIsAuthGateOpen(true);
  };

  // Final Commit of FIFO Settlement
  const commitFifoSettlement = () => {
    if (!currentRep) return;
    const res = storageService.applyFifoSettlement(currentRep.id, fifoAmount, fifoNotes);
    if (!res.success) {
      soundService.playError();
      showToast(res.error || 'حدث خطأ أثناء إجراء التسوية', 'error');
      return;
    }

    soundService.playScanSuccess();
    showToast(
      isRtl
        ? `تمت التسوية بنجاح: سداد ${res.settledAmount.toLocaleString()} ج.م عبر ${res.settledInvoicesCount} فواتير وفق FIFO`
        : `Successfully settled ${res.settledAmount.toLocaleString()} EGP across ${res.settledInvoicesCount} invoices`,
      'success'
    );
    setShowFifoModal(false);
    loadData();
  };

  if (!currentRep) return null;

  return (
    <div
      id="representative-screen"
      className={`flex-1 flex flex-col min-h-0 relative ${
        isDark ? 'bg-[#121417] text-[#F5F6F7]' : 'bg-[#F9FAFB] text-gray-900'
      }`}
    >
      {/* Header & Rep Switcher */}
      <div
        className={`p-3 border-b shrink-0 select-none ${
          isDark ? 'border-[#333842] bg-[#1C1F24]' : 'border-gray-200 bg-white'
        }`}
      >
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-500 border border-blue-500/30 flex items-center justify-center font-bold shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-xs sm:text-sm font-bold leading-tight truncate">
                {currentRep.displayName}
              </h2>
              <span className="text-[10px] text-gray-400 font-mono truncate block">
                {currentRep.badgeNumber} • {currentRep.branch}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                soundService.playClick();
                setShowReportModal(true);
              }}
              className={`h-10 px-3 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-colors min-h-[44px] ${
                isDark
                  ? 'border-[#333842] bg-[#262A31] text-gray-300 hover:text-white'
                  : 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100'
              }`}
            >
              <FileText className="w-4 h-4 text-blue-500" />
              <span className="hidden sm:inline">{isRtl ? 'تقرير' : 'Report'}</span>
            </button>

            <button
              type="button"
              onClick={loadData}
              className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-colors min-h-[44px] min-w-[44px] ${
                isDark
                  ? 'border-[#333842] bg-[#262A31] text-gray-300 hover:text-white'
                  : 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100'
              }`}
              title={isRtl ? 'تحديث البيانات' : 'Refresh'}
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Tabs Switcher: Overview | Invoices | Ledger */}
      <div
        className={`p-2 border-b shrink-0 select-none ${
          isDark ? 'border-[#333842] bg-[#181B20]' : 'border-gray-200 bg-gray-50'
        }`}
      >
        <div className="max-w-7xl mx-auto w-full flex items-center gap-1 sm:gap-2">
          <button
            type="button"
            onClick={() => {
              soundService.playClick();
              setActiveTab('overview');
            }}
            className={`flex-1 h-9 rounded-xl text-xs font-bold transition-all min-h-[44px] ${
              activeTab === 'overview'
                ? 'bg-blue-600 text-white shadow-sm'
                : isDark
                ? 'text-gray-400 hover:text-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {isRtl ? 'نظرة عامة' : 'Overview'}
          </button>

          <button
            type="button"
            onClick={() => {
              soundService.playClick();
              setActiveTab('invoices');
            }}
            className={`flex-1 h-9 rounded-xl text-xs font-bold transition-all min-h-[44px] ${
              activeTab === 'invoices'
                ? 'bg-blue-600 text-white shadow-sm'
                : isDark
                ? 'text-gray-400 hover:text-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {isRtl ? `الفواتير (${repInvoices.length})` : `Invoices (${repInvoices.length})`}
          </button>

          <button
            type="button"
            onClick={() => {
              soundService.playClick();
              setActiveTab('ledger');
            }}
            className={`flex-1 h-9 rounded-xl text-xs font-bold transition-all min-h-[44px] ${
              activeTab === 'ledger'
                ? 'bg-blue-600 text-white shadow-sm'
                : isDark
                ? 'text-gray-400 hover:text-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {isRtl ? `حركات العهدة (${repTransactions.length})` : `Ledger (${repTransactions.length})`}
          </button>
        </div>
      </div>

      {/* Main Body */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 pb-24">
        <div className="max-w-7xl mx-auto w-full space-y-4">
        {/* ========================================================= */}
        {/* HORIZONTAL SWIPEABLE KPI CAROUSEL ON MOBILE, GRID ON TABLET/DESKTOP */}
        {/* ========================================================= */}
        <div className="flex items-center gap-2.5 overflow-x-auto pb-1 snap-x scrollbar-none select-none sm:grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 sm:overflow-x-visible sm:pb-0">
          {/* 1. رصيد العهدة (Petty Cash) */}
          <div
            className={`min-w-[170px] sm:min-w-0 flex-1 p-3.5 rounded-2xl border snap-start shrink-0 transition-all ${
              isDark ? 'bg-cyan-950/20 border-cyan-500/30' : 'bg-cyan-50 border-cyan-200 shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-cyan-400 font-bold mb-1">
              <span>{isRtl ? 'رصيد العهدة' : 'Petty Cash'}</span>
              <Wallet className="w-4 h-4 opacity-80" />
            </div>
            <div className="text-xl font-black font-mono text-cyan-400">
              {metrics.pettyCash.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              <span className="text-[10px] font-sans font-normal opacity-80 mr-1 ml-1">{isRtl ? 'ج.م' : 'EGP'}</span>
            </div>
            <div className="text-[10px] text-cyan-600 dark:text-cyan-300 mt-1 flex items-center justify-between">
              <span>{isRtl ? 'نقدية بيده' : 'In Custody'}</span>
              <span className="font-bold text-[9px] px-1 bg-cyan-500/20 rounded">
                {isRtl ? 'متاح للتسوية' : 'Ready'}
              </span>
            </div>
          </div>

          {/* 2. إجمالي الفواتير (Total Invoices) */}
          <div
            className={`min-w-[170px] sm:min-w-0 flex-1 p-3.5 rounded-2xl border snap-start shrink-0 transition-all ${
              isDark ? 'bg-blue-950/20 border-blue-500/30' : 'bg-blue-50 border-blue-200 shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-blue-500 font-bold mb-1">
              <span>{isRtl ? 'إجمالي الفواتير' : 'Total Invoices'}</span>
              <Receipt className="w-4 h-4 opacity-80" />
            </div>
            <div className="text-xl font-black font-mono text-blue-500">
              {metrics.totalInvoicesValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              <span className="text-[10px] font-sans font-normal opacity-80 mr-1 ml-1">{isRtl ? 'ج.م' : 'EGP'}</span>
            </div>
            <div className="text-[10px] text-gray-500 mt-1 flex items-center justify-between font-mono">
              <span>{metrics.totalInvoicesCount} {isRtl ? 'فاتورة' : 'invoices'}</span>
              <span className="text-blue-400 font-bold">100%</span>
            </div>
          </div>

          {/* 3. غير مسدد (Unpaid) */}
          <div
            className={`min-w-[170px] sm:min-w-0 flex-1 p-3.5 rounded-2xl border snap-start shrink-0 transition-all ${
              isDark ? 'bg-amber-950/20 border-amber-500/30' : 'bg-amber-50 border-amber-200 shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-amber-500 font-bold mb-1">
              <span>{isRtl ? 'غير مسدد' : 'Unpaid Debt'}</span>
              <Clock className="w-4 h-4 opacity-80" />
            </div>
            <div className="text-xl font-black font-mono text-amber-500">
              {metrics.unpaidAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              <span className="text-[10px] font-sans font-normal opacity-80 mr-1 ml-1">{isRtl ? 'ج.م' : 'EGP'}</span>
            </div>
            <div className="text-[10px] text-gray-500 mt-1 flex items-center justify-between font-mono">
              <span>{metrics.unpaidCount} {isRtl ? 'معلقة' : 'open'}</span>
              <span className="text-amber-400 font-bold">
                {metrics.totalInvoicesValue > 0 ? ((metrics.unpaidAmount / metrics.totalInvoicesValue) * 100).toFixed(0) : 0}%
              </span>
            </div>
          </div>

          {/* 4. مسدد (Paid) */}
          <div
            className={`min-w-[170px] sm:min-w-0 flex-1 p-3.5 rounded-2xl border snap-start shrink-0 transition-all ${
              isDark ? 'bg-emerald-950/20 border-emerald-500/30' : 'bg-emerald-50 border-emerald-200 shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-emerald-500 font-bold mb-1">
              <span>{isRtl ? 'المبالغ المسددة' : 'Paid Amount'}</span>
              <CheckCircle2 className="w-4 h-4 opacity-80" />
            </div>
            <div className="text-xl font-black font-mono text-emerald-500">
              {metrics.paidAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              <span className="text-[10px] font-sans font-normal opacity-80 mr-1 ml-1">{isRtl ? 'ج.م' : 'EGP'}</span>
            </div>
            <div className="text-[10px] text-gray-500 mt-1 flex items-center justify-between font-mono">
              <span>{metrics.paidCount} {isRtl ? 'مسددة' : 'settled'}</span>
              <span className="text-emerald-400 font-bold">{metrics.collectionRate.toFixed(0)}%</span>
            </div>
          </div>

          {/* 5. سقف التخصيص (Allocation Ceiling) */}
          <div
            className={`min-w-[170px] sm:min-w-0 flex-1 p-3.5 rounded-2xl border snap-start shrink-0 transition-all ${
              isDark ? 'bg-indigo-950/20 border-indigo-500/30' : 'bg-indigo-50 border-indigo-200 shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-indigo-400 font-bold mb-1">
              <span>{isRtl ? 'سقف التخصيص' : 'Ceiling Cap'}</span>
              <Layers className="w-4 h-4 opacity-80" />
            </div>
            <div className="text-xl font-black font-mono text-indigo-400">
              {metrics.allocationCeiling.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              <span className="text-[10px] font-sans font-normal opacity-80 mr-1 ml-1">{isRtl ? 'ج.م' : 'EGP'}</span>
            </div>
            <div className="text-[10px] text-gray-500 mt-1 flex items-center justify-between font-mono">
              <span>{isRtl ? 'نسبة الاستهلاك:' : 'Usage:'}</span>
              <span className="text-indigo-400 font-bold">{metrics.ceilingUsageRatio.toFixed(1)}%</span>
            </div>
          </div>
        </div>

        {/* Quick FIFO Action Banner */}
        <div
          className={`p-3.5 sm:p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
            isDark ? 'bg-[#1C1F24] border-[#333842]' : 'bg-white border-gray-200 shadow-sm'
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-500 border border-amber-500/30 flex items-center justify-center font-bold shrink-0">
              <Banknote className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-xs sm:text-sm font-bold leading-tight truncate">
                {isRtl ? 'التسوية التلقائية بالعهدة (FIFO)' : 'FIFO Petty Cash Settlement'}
              </div>
              <div className="text-[10px] sm:text-xs text-gray-400 truncate mt-0.5">
                {isRtl
                  ? `متاح بعهدة المندوب: ${metrics.pettyCash.toLocaleString()} ج.م | مطلوب: ${metrics.unpaidAmount.toLocaleString()} ج.م`
                  : `In hand: ${metrics.pettyCash.toLocaleString()} EGP | Due: ${metrics.unpaidAmount.toLocaleString()} EGP`}
              </div>
            </div>
          </div>

          <button
            type="button"
            id="rep-quick-fifo-btn"
            onClick={handleOpenFifo}
            disabled={metrics.pettyCash <= 0 || metrics.unpaidAmount <= 0}
            className="h-11 px-4 bg-amber-600 hover:bg-amber-500 active:bg-amber-700 disabled:opacity-40 text-white rounded-xl text-xs sm:text-sm font-bold shrink-0 flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-98 min-h-[44px]"
          >
            <Banknote className="w-4 h-4" />
            <span>{isRtl ? 'تسوية سريعة' : 'Settle Now'}</span>
          </button>
        </div>

        {/* TAB 1: OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Custody Consumption Progress Bar */}
            <div
              className={`p-4 rounded-2xl border space-y-2.5 ${
                isDark ? 'bg-[#1C1F24] border-[#333842]' : 'bg-white border-gray-200 shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <span className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {isRtl ? 'مؤشر استخدام سقف العهدة المالية' : 'Custody Allocation Usage'}
                </span>
                <span className="font-mono font-bold text-blue-500">
                  {metrics.ceilingUsageRatio.toFixed(1)}%
                </span>
              </div>

              <div className="w-full h-3 rounded-full bg-gray-200 dark:bg-[#121417] overflow-hidden p-0.5 border border-inherit">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-500 transition-all duration-500"
                  style={{ width: `${Math.min(100, metrics.ceilingUsageRatio)}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] sm:text-xs text-gray-500 font-mono">
                <span>0 {isRtl ? 'ج.م' : 'EGP'}</span>
                <span>{metrics.pettyCash.toLocaleString()} / {metrics.allocationCeiling.toLocaleString()} {isRtl ? 'ج.م' : 'EGP'}</span>
              </div>
            </div>

            {/* Quick Summary of Recent 3 Transactions */}
            <div
              className={`p-3.5 sm:p-4 rounded-2xl border space-y-2.5 ${
                isDark ? 'bg-[#1C1F24] border-[#333842]' : 'bg-white border-gray-200 shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-xs sm:text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {isRtl ? 'أحدث حركات العهدة النقدية' : 'Recent Custody Movements'}
                </span>
                <button
                  type="button"
                  onClick={() => setActiveTab('ledger')}
                  className="text-[11px] sm:text-xs font-bold text-blue-500 hover:underline min-h-[44px] flex items-center"
                >
                  {isRtl ? 'عرض الكل' : 'View All'}
                </button>
              </div>

              {repTransactions.length === 0 ? (
                <div className="text-center py-6 text-gray-400 text-xs">
                  {isRtl ? 'لا توجد حركات عهدة مسجلة' : 'No transactions recorded'}
                </div>
              ) : (
                <div className="space-y-2">
                  {repTransactions.slice(0, 3).map((tx) => (
                    <div
                      key={tx.id}
                      className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
                        isDark ? 'bg-[#121417] border-[#333842]' : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="font-bold truncate">{tx.notes}</div>
                        <div className="text-[10px] text-gray-400 font-mono mt-0.5">{tx.date}</div>
                      </div>
                      <div
                        className={`font-mono font-bold text-xs shrink-0 ${
                          tx.type === 'collection' ? 'text-emerald-500' : 'text-amber-500'
                        }`}
                      >
                        {tx.type === 'collection' ? '+' : '-'}{tx.amount.toLocaleString()} {isRtl ? 'ج.م' : 'EGP'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: INVOICES TAB */}
        {activeTab === 'invoices' && (
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute top-1/2 -translate-y-1/2 start-3 text-gray-400" />
                <input
                  type="text"
                  value={filterSearch}
                  onChange={(e) => setFilterSearch(e.target.value)}
                  placeholder={isRtl ? 'بحث بالفاتورة أو العميل...' : 'Search invoice or customer...'}
                  className={`w-full h-11 ps-9 pe-3 rounded-xl border text-xs sm:text-sm outline-none ${
                    isDark ? 'border-[#333842] bg-[#1C1F24] text-white' : 'border-gray-200 bg-white text-gray-900'
                  }`}
                />
              </div>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className={`h-11 px-3 rounded-xl border text-xs sm:text-sm outline-none shrink-0 ${
                  isDark ? 'border-[#333842] bg-[#1C1F24] text-white' : 'border-gray-200 bg-white text-gray-900'
                }`}
              >
                <option value="all">{isRtl ? 'كل الحالات' : 'All Statuses'}</option>
                <option value="unpaid">{isRtl ? 'غير مسدد' : 'Unpaid'}</option>
                <option value="partial">{isRtl ? 'سداد جزئي' : 'Partial'}</option>
                <option value="paid">{isRtl ? 'مسدد بالكامل' : 'Paid'}</option>
              </select>
            </div>

            {filteredInvoices.length === 0 ? (
              <div className="text-center py-12 text-gray-400 text-xs">
                {isRtl ? 'لا توجد فواتير مطابقة' : 'No matching invoices'}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {filteredInvoices.map((inv) => {
                  const isSettled = inv.settlementStatus === 'paid' || (inv.paidAmount && inv.paidAmount >= inv.netDue);
                  const remaining = inv.remainingBalance !== undefined ? inv.remainingBalance : Math.max(0, inv.netDue - (inv.paidAmount || 0));

                  return (
                    <div
                      key={inv.id}
                      onClick={() => setSelectedInvoice(inv)}
                      className={`p-3.5 rounded-2xl border cursor-pointer select-none active:scale-[0.99] transition-all flex flex-col justify-between ${
                        isDark ? 'bg-[#1C1F24] border-[#333842] hover:border-blue-500/40' : 'bg-white border-gray-200 shadow-sm hover:border-blue-300'
                      }`}
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-mono font-bold text-blue-500">{inv.invoiceNumber}</span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              isSettled
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : remaining < inv.netDue
                                ? 'bg-amber-500/20 text-amber-400'
                                : 'bg-gray-500/20 text-gray-400'
                            }`}
                          >
                            {isSettled ? (isRtl ? 'مسددة' : 'Paid') : remaining < inv.netDue ? (isRtl ? 'سداد جزئي' : 'Partial') : (isRtl ? 'غير مسددة' : 'Unpaid')}
                          </span>
                        </div>

                        <div className="text-xs sm:text-sm font-bold truncate">{inv.customerName}</div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] sm:text-xs font-mono pt-2 mt-2 border-t border-inherit">
                        <span className="text-gray-400">{isRtl ? 'إجمالي:' : 'Total:'} {inv.netDue.toFixed(2)} {isRtl ? 'ج.م' : 'EGP'}</span>
                        <span className={remaining > 0 ? 'text-amber-500 font-bold' : 'text-emerald-500 font-bold'}>
                          {isRtl ? 'المتبقي:' : 'Due:'} {remaining.toFixed(2)} {isRtl ? 'ج.م' : 'EGP'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: LEDGER TAB */}
        {activeTab === 'ledger' && (
          <div>
            {repTransactions.length === 0 ? (
              <div className="text-center py-16 text-gray-400 text-xs">
                {isRtl ? 'لا توجد حركات عهدة مسجلة' : 'No transactions recorded'}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {repTransactions.map((tx) => (
                  <div
                    key={tx.id}
                    className={`p-3.5 rounded-2xl border flex items-center justify-between text-xs space-y-1 ${
                      isDark ? 'bg-[#1C1F24] border-[#333842]' : 'bg-white border-gray-200 shadow-sm'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            tx.type === 'collection'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-amber-500/20 text-amber-400'
                          }`}
                        >
                          {tx.type === 'collection' ? (isRtl ? 'تحصيل نقدي' : 'Collection') : (isRtl ? 'تسوية عهدة' : 'Settlement')}
                        </span>
                        <span className="font-mono text-[10px] text-gray-400">{tx.date}</span>
                      </div>
                      <div className={`font-bold mt-1 text-xs sm:text-sm truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {tx.notes}
                      </div>
                      {tx.invoiceNumber && (
                        <div className="text-[10px] text-gray-400 font-mono mt-0.5 truncate">
                          {isRtl ? 'فاتورة:' : 'Invoice:'} {tx.invoiceNumber} • {tx.customerName || ''}
                        </div>
                      )}
                    </div>

                    <div
                      className={`font-mono font-bold text-sm shrink-0 ps-2 ${
                        tx.type === 'collection' ? 'text-emerald-500' : 'text-amber-500'
                      }`}
                    >
                      {tx.type === 'collection' ? '+' : '-'}{tx.amount.toLocaleString()} {isRtl ? 'ج.م' : 'EGP'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* FIFO AUTO-SETTLEMENT BOTTOM SHEET MODAL WITH MEPREVIEW     */}
      {/* ========================================================= */}
      {showFifoModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm select-none animate-in fade-in duration-150">
          <div
            className={`w-full max-w-lg rounded-t-3xl sm:rounded-2xl border shadow-2xl flex flex-col max-h-[92vh] overflow-hidden ${
              isDark ? 'bg-[#1C1F24] border-[#333842] text-[#F5F6F7]' : 'bg-white border-gray-200 text-gray-900'
            }`}
          >
            {/* Modal Header */}
            <div
              className={`p-3.5 border-b flex items-center justify-between ${
                isDark ? 'border-[#333842] bg-[#262A31]' : 'border-gray-200 bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-2">
                <Banknote className="w-5 h-5 text-amber-500" />
                <span className="font-bold text-sm">
                  {isRtl ? 'التسوية التلقائية للعهد (FIFO)' : 'FIFO Custody Auto-Settlement'}
                </span>
              </div>
              <button
                onClick={() => setShowFifoModal(false)}
                className={`p-1.5 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center ${
                  isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-black'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
              {/* Custody vs Due Header Card */}
              <div
                className={`p-3 rounded-2xl border flex items-center justify-between ${
                  isDark ? 'bg-cyan-950/20 border-cyan-500/30' : 'bg-cyan-50 border-cyan-200'
                }`}
              >
                <div>
                  <span className="block text-[10px] text-gray-400">{isRtl ? 'رصيد العهدة بيدك:' : 'Custody In Hand:'}</span>
                  <span className="text-base font-black font-mono text-cyan-400">
                    {metrics.pettyCash.toLocaleString()} {isRtl ? 'ج.م' : 'EGP'}
                  </span>
                </div>
                <div className="text-end font-mono">
                  <span className="block text-[10px] text-gray-400">{isRtl ? 'إجمالي المطلوب تسويته:' : 'Total Unsettled:'}</span>
                  <span className="text-sm font-bold text-amber-500">
                    {metrics.unpaidAmount.toLocaleString()} {isRtl ? 'ج.م' : 'EGP'}
                  </span>
                </div>
              </div>

              {/* Amount input & Quick Chips */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold block">
                    {isRtl ? 'مبلغ التسوية المطلوب خصمه من العهدة *' : 'Settlement Amount *'}
                  </label>
                  <button
                    type="button"
                    onClick={() => setFifoAmount(Math.min(metrics.pettyCash, metrics.unpaidAmount))}
                    className="text-[11px] font-bold text-blue-500 hover:underline min-h-[44px] flex items-center"
                  >
                    {isRtl ? 'كامل المبلغ المتاح' : 'Max Available'}
                  </button>
                </div>

                <NumericKeypad
                  value={fifoAmount}
                  onChange={(val) => setFifoAmount(Math.min(val, metrics.pettyCash))}
                  maxAmount={metrics.pettyCash}
                  quickPresets={[100, 200, 500, 1000]}
                  currency={isRtl ? 'ج.م' : 'EGP'}
                  language={language}
                />
              </div>

              {/* Notes */}
              <div>
                <label className="text-[10px] block mb-1 text-gray-400">
                  {isRtl ? 'ملاحظات التسوية (اختياري)' : 'Notes (Optional)'}
                </label>
                <input
                  type="text"
                  value={fifoNotes}
                  onChange={(e) => setFifoNotes(e.target.value)}
                  placeholder={isRtl ? 'مثال: تسوية تحصيلات نهاية الأسبوع' : 'e.g. End of week settlement'}
                  className={`w-full h-10 px-3 rounded-xl border text-xs outline-none ${
                    isDark ? 'border-[#333842] bg-[#121417] text-white' : 'border-gray-300 bg-white text-gray-900'
                  }`}
                />
              </div>

              {/* ===================================================== */}
              {/* PRE-SETTLEMENT PREVIEW TABLE (MePreview)              */}
              {/* ===================================================== */}
              <div
                className={`rounded-2xl border overflow-hidden ${
                  isDark ? 'border-[#333842] bg-[#16181D]' : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div
                  className={`p-2.5 border-b flex items-center justify-between text-[11px] font-bold ${
                    isDark ? 'border-[#333842] bg-[#1C1F24] text-white' : 'border-gray-200 bg-gray-100 text-gray-800'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>{isRtl ? 'معاينة التسوية المسبقة (FIFO)' : 'Pre-Settlement Preview'}</span>
                  </div>
                  <span className="font-mono text-[10px] text-amber-500">
                    {fifoPreview.length} {isRtl ? 'فواتير ستُسدد' : 'invoices impacted'}
                  </span>
                </div>

                {fifoPreview.length === 0 ? (
                  <div className="p-4 text-center text-gray-400 text-[11px]">
                    {isRtl ? 'أدخل مبلغ تسوية لمعاينة الفواتير التي سيتم سدادها أولاً بأول' : 'Enter amount to preview impacted invoices'}
                  </div>
                ) : (
                  <div className="max-h-48 overflow-y-auto divide-y divide-inherit text-[11px]">
                    {fifoPreview.map(({ invoice, dueAmount, allocatedAmount, remainingAfter, isFullySettled }, idx) => (
                      <div key={invoice.id} className="p-2.5 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-blue-400">
                            #{idx + 1} {invoice.invoiceNumber}
                          </span>
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                              isFullySettled
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : 'bg-amber-500/20 text-amber-400'
                            }`}
                          >
                            {isFullySettled ? (isRtl ? 'سداد تام' : 'Full') : (isRtl ? 'سداد جزئي' : 'Partial')}
                          </span>
                        </div>
                        <div className="text-[10px] text-gray-400 truncate">{invoice.customerName}</div>
                        <div className="flex items-center justify-between font-mono text-[10px] pt-0.5">
                          <span className="text-gray-500">{isRtl ? 'المطلوب:' : 'Due:'} {dueAmount.toFixed(2)}</span>
                          <span className="text-emerald-500 font-bold">{isRtl ? 'المخصوم:' : 'Settled:'} -{allocatedAmount.toFixed(2)}</span>
                          <span className="text-gray-400">{isRtl ? 'المتبقي:' : 'Rem:'} {remainingAfter.toFixed(2)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Actions */}
            <div
              className={`p-3.5 border-t grid grid-cols-2 gap-2 ${
                isDark ? 'border-[#333842] bg-[#262A31]' : 'border-gray-200 bg-gray-50'
              }`}
            >
              <button
                type="button"
                onClick={() => setShowFifoModal(false)}
                className={`h-12 border rounded-xl font-bold text-xs transition-colors min-h-[44px] ${
                  isDark ? 'border-[#333842] text-gray-300 hover:bg-[#333842]' : 'border-gray-300 text-gray-700 bg-white'
                }`}
              >
                {isRtl ? 'إلغاء' : 'Cancel'}
              </button>

              <button
                type="button"
                id="confirm-fifo-btn"
                onClick={handleInitiateFifo}
                disabled={fifoAmount <= 0 || fifoAmount > metrics.pettyCash || fifoPreview.length === 0}
                className="h-12 bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-98 min-h-[44px]"
              >
                <Check className="w-4 h-4" />
                <span>{isRtl ? 'تأكيد التسوية وحفظ' : 'Confirm Settlement'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AuthGate PIN Modal for FIFO Settlement */}
      <AuthGate
        isOpen={isAuthGateOpen}
        onClose={() => {
          setIsAuthGateOpen(false);
          showToast(isRtl ? 'تم إلغاء تأكيد التسوية' : 'Settlement cancelled', 'info');
        }}
        onSuccess={() => {
          setIsAuthGateOpen(false);
          commitFifoSettlement();
        }}
        amount={fifoAmount}
        currency={isRtl ? 'ج.م' : 'EGP'}
        title={isRtl ? 'تأكيد تسوية العهدة النقدية' : 'Authorize Custody Settlement'}
        description={
          isRtl
            ? `أدخل رمز PIN لخصم مبلغ ${fifoAmount.toLocaleString()} ج.م من عهدة المندوب وسداد الفواتير وفق FIFO`
            : `Enter PIN to deduct ${fifoAmount.toLocaleString()} EGP from rep custody via FIFO`
        }
      />

      {/* Printable Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm select-none animate-in fade-in duration-150">
          <div
            className={`w-full max-w-sm rounded-2xl border shadow-2xl flex flex-col max-h-[90vh] overflow-hidden ${
              isDark ? 'bg-[#1C1F24] border-[#333842] text-[#F5F6F7]' : 'bg-white border-gray-200 text-gray-900'
            }`}
          >
            <div
              className={`p-3 border-b flex items-center justify-between ${
                isDark ? 'border-[#333842] bg-[#262A31]' : 'border-gray-200 bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-500" />
                <span className="font-bold text-sm">{isRtl ? 'تقرير أداء المندوب والتحصيل' : 'Rep Performance Report'}</span>
              </div>
              <button
                onClick={() => setShowReportModal(false)}
                className={`p-1.5 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center ${
                  isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-black'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs">
              <div className="text-center pb-2 border-b border-inherit">
                <div className="font-black text-sm">{currentRep.displayName}</div>
                <div className="text-[10px] text-gray-400 font-mono mt-0.5">
                  {currentRep.badgeNumber} • {currentRep.branch}
                </div>
              </div>

              <div className="space-y-1.5 font-mono text-[11px]">
                <div className="flex justify-between py-1 border-b border-inherit">
                  <span>{isRtl ? 'إجمالي فواتير المبيعات:' : 'Total Sales Invoices:'}</span>
                  <span className="font-bold text-blue-500">{metrics.totalInvoicesValue.toLocaleString()} {isRtl ? 'ج.م' : 'EGP'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-inherit">
                  <span>{isRtl ? 'إجمالي المبالغ المسددة:' : 'Total Paid:'}</span>
                  <span className="font-bold text-emerald-500">{metrics.paidAmount.toLocaleString()} {isRtl ? 'ج.م' : 'EGP'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-inherit">
                  <span>{isRtl ? 'إجمالي غير المسدد:' : 'Total Unpaid:'}</span>
                  <span className="font-bold text-amber-500">{metrics.unpaidAmount.toLocaleString()} {isRtl ? 'ج.م' : 'EGP'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-inherit">
                  <span>{isRtl ? 'رصيد العهدة بيده:' : 'Petty Cash in Hand:'}</span>
                  <span className="font-bold text-cyan-400">{metrics.pettyCash.toLocaleString()} {isRtl ? 'ج.م' : 'EGP'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-inherit">
                  <span>{isRtl ? 'حد الائتمان المعتمد:' : 'Credit Limit:'}</span>
                  <span className="font-bold text-rose-500">{metrics.creditLimit.toLocaleString()} {isRtl ? 'ج.م' : 'EGP'}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span>{isRtl ? 'سقف التخصيص:' : 'Allocation Ceiling:'}</span>
                  <span className="font-bold text-indigo-400">{metrics.allocationCeiling.toLocaleString()} {isRtl ? 'ج.م' : 'EGP'}</span>
                </div>
              </div>
            </div>

            <div
              className={`p-3 border-t grid grid-cols-2 gap-2 ${
                isDark ? 'border-[#333842] bg-[#262A31]' : 'border-gray-200 bg-gray-50'
              }`}
            >
              <button
                type="button"
                onClick={() => {
                  soundService.playScanSuccess();
                  showToast(isRtl ? 'تم إرسال التقرير للطابعة' : 'Report printed', 'success');
                }}
                className="h-11 min-h-[44px] bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Printer className="w-4 h-4" />
                <span>{isRtl ? 'طباعة' : 'Print'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  soundService.playClick();
                  showToast(isRtl ? 'تمت مشاركة التقرير PDF' : 'Report shared', 'info');
                  setShowReportModal(false);
                }}
                className={`h-11 min-h-[44px] border rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                  isDark ? 'border-[#333842] text-gray-300' : 'border-gray-300 text-gray-700'
                }`}
              >
                <Share2 className="w-4 h-4" />
                <span>{isRtl ? 'مشاركة' : 'Share'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Detail Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm select-none animate-in fade-in duration-150">
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
                <Receipt className="w-4 h-4 text-blue-500" />
                <span className="font-bold text-sm">{selectedInvoice.invoiceNumber}</span>
              </div>
              <button
                onClick={() => setSelectedInvoice(null)}
                className={`p-1.5 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center ${
                  isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-black'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs">
              <div>
                <span className="block text-[10px] text-gray-400">{isRtl ? 'العميل:' : 'Customer:'}</span>
                <span className="font-bold text-sm">{selectedInvoice.customerName}</span>
                <span className="block text-[10px] text-gray-500 font-mono mt-0.5">
                  {selectedInvoice.customerTaxNumber}
                </span>
              </div>

              <div
                className={`p-3 rounded-xl border space-y-1.5 font-mono text-[11px] ${
                  isDark ? 'bg-[#121417] border-[#333842]' : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span>{isRtl ? 'صافي الفاتورة:' : 'Net Due:'}</span>
                  <span className="font-bold text-blue-500">{selectedInvoice.netDue.toFixed(2)} {isRtl ? 'ج.م' : 'EGP'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>{isRtl ? 'المبلغ المسدد:' : 'Paid:'}</span>
                  <span className="font-bold text-emerald-500">{(selectedInvoice.paidAmount || 0).toFixed(2)} {isRtl ? 'ج.م' : 'EGP'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>{isRtl ? 'المتبقي المطلوب:' : 'Remaining:'}</span>
                  <span className="font-bold text-amber-500">
                    {(selectedInvoice.remainingBalance !== undefined ? selectedInvoice.remainingBalance : (selectedInvoice.netDue - (selectedInvoice.paidAmount || 0))).toFixed(2)} {isRtl ? 'ج.م' : 'EGP'}
                  </span>
                </div>
              </div>
            </div>

            <div
              className={`p-3 border-t flex justify-end gap-2 ${
                isDark ? 'border-[#333842] bg-[#262A31]' : 'border-gray-200 bg-gray-50'
              }`}
            >
              <button
                type="button"
                onClick={() => {
                  openReceipt(selectedInvoice, 'invoice');
                  setSelectedInvoice(null);
                }}
                className="h-10 px-4 min-h-[44px] bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
              >
                <Printer className="w-4 h-4" />
                <span>{isRtl ? 'طباعة حرارية' : 'Thermal Print'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
