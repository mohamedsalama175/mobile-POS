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
  FileText
} from 'lucide-react';
import { soundService } from '../../services/sound';

export const OutboxModal: React.FC = () => {
  const { isOutboxOpen, setIsOutboxOpen, isOnline, setIsOnline, triggerSync, language, theme, refreshPendingCount } = useApp();
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

  return (
    <div
      id="eda50-outbox-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm select-none"
    >
      <div
        className={`w-full max-w-sm rounded-2xl border shadow-2xl flex flex-col max-h-[85vh] overflow-hidden ${
          isDark ? 'bg-[#1C1F24] border-[#333842] text-[#F5F6F7]' : 'bg-white border-gray-200 text-gray-900'
        }`}
      >
        {/* Header */}
        <div className="p-3 border-b border-[#333842] flex items-center justify-between bg-[#262A31]">
          <div className="flex items-center gap-2">
            <Send className="w-4 h-4 text-blue-400" />
            <div>
              <h3 className="text-sm font-bold">
                {language === 'ar' ? 'صندوق الصادر والمزامنة' : 'Outbox & Sync Engine'}
              </h3>
              <div className="flex items-center gap-2 text-[10px] text-gray-400">
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
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700/50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Network & Quick Actions Bar */}
        <div className="p-3 border-b border-[#333842] flex items-center justify-between bg-[#1E2228] text-xs">
          <button
            type="button"
            onClick={() => setIsOnline(!isOnline)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-semibold transition-colors ${
              isOnline
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
            }`}
          >
            {isOnline ? <Cloud className="w-3.5 h-3.5" /> : <CloudOff className="w-3.5 h-3.5" />}
            <span>{isOnline ? 'شبكة متصلة' : 'دون اتصال (Offline)'}</span>
          </button>

          <button
            type="button"
            onClick={handleManualSync}
            disabled={!isOnline}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{language === 'ar' ? 'مزامنة الكل الآن' : 'Sync All Now'}</span>
          </button>
        </div>

        {/* Queue Content */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {/* Pending / Failed Section */}
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-gray-400 mb-2">
              <span>{language === 'ar' ? 'في انتظار الإرسال والخادم' : 'Pending Server Upload'}</span>
              <span className="font-mono text-amber-400">{pendingOrFailed.length}</span>
            </div>

            {pendingOrFailed.length === 0 ? (
              <div className="p-4 rounded-xl border border-dashed border-[#333842] text-center text-xs text-gray-400">
                <CheckCircle2 className="w-6 h-6 mx-auto text-emerald-400 mb-1" />
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
                          : 'bg-[#262A31] border-[#333842]'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold">{docNum}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400">
                              {language === 'ar' ? typeLabels[item.type]?.ar : typeLabels[item.type]?.en}
                            </span>
                          </div>
                          <span className="text-[11px] text-gray-300 block mt-0.5">
                            {item.customerName}
                          </span>
                        </div>

                        <div className="text-right">
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              isFailed
                                ? 'bg-red-500/20 text-red-400'
                                : 'bg-amber-500/20 text-amber-400'
                            }`}
                          >
                            {isFailed ? <AlertCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                            <span>{isFailed ? 'فشل بالخادم' : 'معلق محلياً'}</span>
                          </span>
                          <span className="font-mono font-bold text-xs text-white block mt-1">
                            {(item.netDue || 0).toFixed(2)} ر.س
                          </span>
                        </div>
                      </div>

                      {/* Server Conflict / Error Message (§2) */}
                      {isFailed && item.syncError && (
                        <div className="mt-2 p-2 rounded-lg bg-red-950/40 border border-red-800 text-[11px] text-red-300">
                          <span className="font-bold block">سبب رفض الخادم:</span>
                          <span>{item.syncError}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Synced History Section */}
          <div className="pt-2 border-t border-[#333842]">
            <div className="flex items-center justify-between text-xs font-bold text-gray-400 mb-2">
              <span>{language === 'ar' ? 'سجلات تم تأكيدها بنجاح' : 'Confirmed Synced Records'}</span>
              <span className="font-mono text-emerald-400">{syncedItems.length}</span>
            </div>

            <div className="space-y-1.5 max-h-36 overflow-y-auto">
              {syncedItems.slice(0, 5).map((item, idx) => {
                const docNum = item.orderNumber || item.returnNumber || item.invoiceNumber || item.creditNoteNumber || item.receiptNumber;
                return (
                  <div
                    key={idx}
                    className="p-2 rounded-lg bg-[#121417] border border-[#333842] flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="font-mono font-semibold text-[11px] text-gray-200">
                        {docNum}
                      </span>
                    </div>
                    <span className="font-mono text-[11px] text-gray-400">
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
