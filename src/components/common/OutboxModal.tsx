import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { storageService } from '../../services/storage';
import {
  X,
  Cloud,
  CloudOff,
  RefreshCw,
  AlertCircle,
  Clock,
  CheckCircle2,
  Send,
  Trash2,
  FileText,
  ShieldCheck
} from 'lucide-react';
import { soundService } from '../../services/sound';

export const OutboxModal: React.FC = () => {
  const { isOutboxOpen, setIsOutboxOpen, isOnline, setIsOnline, triggerSync, language, theme, refreshPendingCount, showToast } = useApp();
  const [activeItems, setActiveItems] = useState<any[]>([]);
  const isDark = theme === 'dark';

  const loadOutbox = () => {
    const orders = storageService.getOrders().map(o => ({ ...o, type: 'order' }));
    const returns = storageService.getReturns().map(r => ({ ...r, type: 'return' }));
    const invoices = storageService.getInvoices().map(i => ({ ...i, type: 'invoice' }));
    const creditNotes = storageService.getCreditNotes().map(c => ({ ...c, type: 'credit_note' }));
    const posSales = storageService.getPosSales().map(p => ({ ...p, type: 'pos' }));

    const all = [...orders, ...returns, ...invoices, ...creditNotes, ...posSales];
    setActiveItems(all);
    refreshPendingCount();
  };

  useEffect(() => {
    if (isOutboxOpen) {
      loadOutbox();
    }
  }, [isOutboxOpen]);

  if (!isOutboxOpen) return null;

  const pendingOrFailed = activeItems.filter(
    (x) => x.syncStatus === 'pending' || x.syncStatus === 'failed'
  );
  const syncedItems = activeItems.filter((x) => x.syncStatus === 'synced');

  const typeLabels: Record<string, { ar: string; en: string }> = {
    order: { ar: 'طلب بيع', en: 'Sales Order' },
    return: { ar: 'مرتجع بيع', en: 'Sales Return' },
    invoice: { ar: 'فاتورة مبيعات', en: 'Sales Invoice' },
    credit_note: { ar: 'مذكرة ائتمان', en: 'Credit Note' },
    pos: { ar: 'عملية كاشير', en: 'POS Sale' }
  };

  const handleManualSync = () => {
    triggerSync();
    setTimeout(() => {
      loadOutbox();
    }, 200);
  };

  const handleOverrideCredit = (orderId: string) => {
    storageService.overrideOrderCreditLimit(orderId);
    soundService.playScanSuccess();
    showToast(
      language === 'ar'
        ? 'تم اعتماد رفع الحد الائتماني بواسطة المشرف. جاري إعادة المزامنة...'
        : 'Supervisor override applied. Re-syncing...',
      'success'
    );
    loadOutbox();
    triggerSync();
    setTimeout(() => loadOutbox(), 300);
  };

  return (
    <div
      id="eda50-outbox-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm select-none"
    >
      <div
        className={`w-full max-w-sm rounded-2xl border shadow-2xl flex flex-col max-h-[85vh] overflow-hidden ${
          isDark ? 'bg-[#1C1F24] border-[#333842] text-[#F5F6F7]' : 'bg-white border-slate-300 text-slate-900'
        }`}
      >
        {/* Header */}
        <div className={`p-3 border-b flex items-center justify-between ${
          isDark ? 'border-[#333842] bg-[#262A31]' : 'border-slate-200 bg-slate-100'
        }`}>
          <div className="flex items-center gap-2">
            <Send className="w-4 h-4 text-blue-500" />
            <div>
              <h3 className="text-sm font-bold">
                {language === 'ar' ? 'صندوق الصادر والمزامنة' : 'Outbox & Sync Engine'}
              </h3>
              <div className={`flex items-center gap-2 text-[10px] ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                <span className="flex items-center gap-1">
                  {isOnline ? (
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  )}
                  {isOnline ? 'Online' : 'Offline'}
                </span>
                <span>•</span>
                <span>
                  {language === 'ar'
                    ? `${pendingOrFailed.length} في الانتظار`
                    : `${pendingOrFailed.length} pending`}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setIsOutboxOpen(false)}
            className={`p-1.5 rounded-lg transition-colors ${
              isDark ? 'text-gray-400 hover:text-white hover:bg-gray-700/50' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Network & Quick Actions Bar */}
        <div className={`p-3 border-b flex items-center justify-between text-xs ${
          isDark ? 'border-[#333842] bg-[#1E2228]' : 'border-slate-200 bg-slate-50'
        }`}>
          <button
            type="button"
            onClick={() => setIsOnline(!isOnline)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-semibold transition-colors ${
              isOnline
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-500'
            }`}
          >
            {isOnline ? <Cloud className="w-3.5 h-3.5" /> : <CloudOff className="w-3.5 h-3.5" />}
            <span>{isOnline ? 'شبكة متصلة' : 'دون اتصال (Offline)'}</span>
          </button>

          <button
            type="button"
            onClick={handleManualSync}
            disabled={!isOnline}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold transition-colors shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{language === 'ar' ? 'مزامنة الكل الآن' : 'Sync All Now'}</span>
          </button>
        </div>

        {/* Queue Content */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {/* Pending / Failed Section */}
          <div>
            <div className={`flex items-center justify-between text-xs font-bold mb-2 ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
              <span>{language === 'ar' ? 'في انتظار الإرسال والخادم' : 'Pending Server Upload'}</span>
              <span className="font-mono text-amber-500 font-bold">{pendingOrFailed.length}</span>
            </div>

            {pendingOrFailed.length === 0 ? (
              <div className={`p-4 rounded-xl border border-dashed text-center text-xs ${
                isDark ? 'border-[#333842] text-gray-400' : 'border-slate-300 text-slate-500 bg-slate-50'
              }`}>
                <CheckCircle2 className="w-6 h-6 mx-auto text-emerald-500 mb-1" />
                <span>
                  {language === 'ar'
                    ? 'جميع المستندات متزامنة ومؤكدة بالكامل'
                    : 'All documents are fully synced with server'}
                </span>
              </div>
            ) : (
              <div className="space-y-2">
                {pendingOrFailed.map((item, idx) => {
                  const isFailed = item.syncStatus === 'failed';
                  const docNum = item.orderNumber || item.returnNumber || item.invoiceNumber || item.creditNoteNumber || item.receiptNumber;

                  return (
                    <div
                      key={idx}
                      className={`p-2.5 rounded-xl border transition-all ${
                        isFailed
                          ? 'bg-red-500/10 border-red-500/30'
                          : isDark
                          ? 'bg-[#262A31] border-[#333842]'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold">{docNum}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-500 font-semibold">
                              {language === 'ar' ? typeLabels[item.type]?.ar : typeLabels[item.type]?.en}
                            </span>
                          </div>
                          <span className={`text-[11px] block mt-0.5 ${isDark ? 'text-gray-300' : 'text-slate-600'}`}>
                            {item.customerName}
                          </span>
                        </div>

                        <div className="text-right">
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              isFailed
                                ? 'bg-red-500/20 text-red-500'
                                : 'bg-amber-500/20 text-amber-500'
                            }`}
                          >
                            {isFailed ? <AlertCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                            <span>{isFailed ? 'فشل بالخادم' : 'معلق محلياً'}</span>
                          </span>
                          <span className={`font-mono font-bold text-xs block mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            {(item.netDue || 0).toFixed(2)} ر.س
                          </span>
                        </div>
                      </div>

                      {/* Server Conflict / Error Message (§2) */}
                      {isFailed && item.syncError && (
                        <div className="mt-2 p-2.5 rounded-lg bg-red-950/40 border border-red-800 text-[11px] text-red-300 space-y-1.5">
                          <span className="font-bold block">سبب رفض الخادم:</span>
                          <span className="block leading-relaxed">{item.syncError}</span>
                          {item.type === 'order' && (
                            <button
                              type="button"
                              onClick={() => handleOverrideCredit(item.id)}
                              className="mt-1 w-full py-1.5 px-2 bg-emerald-700 hover:bg-emerald-600 active:bg-emerald-800 text-white rounded-lg font-bold text-[10px] flex items-center justify-center gap-1.5 transition-colors shadow"
                            >
                              <ShieldCheck className="w-3.5 h-3.5" />
                              <span>{language === 'ar' ? 'اعتماد المشرف وتجاوز الحد الائتماني' : 'Supervisor Approval Override'}</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Synced History Section */}
          <div className={`pt-2 border-t ${isDark ? 'border-[#333842]' : 'border-slate-200'}`}>
            <div className={`flex items-center justify-between text-xs font-bold mb-2 ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
              <span>{language === 'ar' ? 'سجلات تم تأكيدها بنجاح' : 'Confirmed Synced Records'}</span>
              <span className="font-mono text-emerald-500 font-bold">{syncedItems.length}</span>
            </div>

            <div className="space-y-1.5 max-h-36 overflow-y-auto">
              {syncedItems.slice(0, 5).map((item, idx) => {
                const docNum = item.orderNumber || item.returnNumber || item.invoiceNumber || item.creditNoteNumber || item.receiptNumber;
                return (
                  <div
                    key={idx}
                    className={`p-2 rounded-lg border flex items-center justify-between text-xs ${
                      isDark ? 'bg-[#121417] border-[#333842]' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      <span className={`font-mono font-semibold text-[11px] ${isDark ? 'text-gray-200' : 'text-slate-700'}`}>
                        {docNum}
                      </span>
                    </div>
                    <span className={`font-mono text-[11px] ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                      {(item.netDue || 0).toFixed(2)} ر.س
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
