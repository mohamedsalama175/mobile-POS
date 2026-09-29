import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  X,
  Printer,
  Share2,
  Check,
  QrCode,
  Bluetooth,
  BluetoothConnected,
  Settings,
  Copy,
  Sliders,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { soundService } from '../../services/sound';
import { printerService } from '../../services/printerService';

export const ReceiptModal: React.FC = () => {
  const {
    isReceiptOpen,
    closeReceipt,
    receiptData,
    receiptType,
    language,
    theme,
    showToast,
    printerSettings,
    updatePrinterSettings
  } = useApp();

  const [copied, setCopied] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isBluetoothConnected, setIsBluetoothConnected] = useState(printerService.isConnected());
  const [connectedDeviceName, setConnectedDeviceName] = useState(printerService.getConnectedDeviceName());
  const [isConnectingBt, setIsConnectingBt] = useState(false);

  // Local settings draft when editing in modal
  const [localSettings, setLocalSettings] = useState(printerSettings);

  useEffect(() => {
    setLocalSettings(printerSettings);
  }, [printerSettings]);

  useEffect(() => {
    const unsub = printerService.onConnectionChange((connected, name) => {
      setIsBluetoothConnected(connected);
      setConnectedDeviceName(name);
    });
    return unsub;
  }, []);

  if (!isReceiptOpen || !receiptData) return null;

  const isDark = theme === 'dark';
  const isRtl = language === 'ar';
  const is58mm = printerSettings.paperWidth === '58mm';

  const docNumber =
    receiptData.receiptNumber ||
    receiptData.invoiceNumber ||
    receiptData.orderNumber ||
    receiptData.returnNumber ||
    receiptData.creditNoteNumber ||
    'DOC-2026';

  const titleMap = {
    pos: isRtl ? 'إيصال نقطة بيع إلكتروني' : 'POS Electronic Receipt',
    invoice: isRtl ? 'فاتورة ضريبية مبسطة' : 'Simplified Tax Invoice',
    order: isRtl ? 'سند طلب بيع' : 'Sales Order Voucher',
    return: isRtl ? 'سند إرجاع مبيعات' : 'Sales Return Voucher',
    credit_note: isRtl ? 'إشعار دائن ضريبي' : 'Tax Credit Note'
  };

  // Primary Print Action (System Print or Direct Bluetooth)
  const handlePrint = async () => {
    soundService.playScanSuccess();

    if (printerSettings.printerType === 'bluetooth') {
      if (!printerService.isConnected()) {
        showToast(
          isRtl
            ? 'جاري البحث والاقتران بطابعة البلوتوث...'
            : 'Connecting to Bluetooth thermal printer...',
          'info'
        );
      }

      const res = await printerService.printBluetooth(receiptData, receiptType || 'pos');
      if (res.success) {
        showToast(
          isRtl
            ? 'تمت الطباعة بنجاح عبر طابعة البلوتوث المحمولة'
            : 'Printed successfully via Bluetooth thermal printer',
          'success'
        );
      } else {
        showToast(
          isRtl
            ? `${res.message} (تم التحويل إلى طباعة النظام/PDF)`
            : `${res.message} (Switched to system print/PDF)`,
          'warning'
        );
        // Fallback to system print if Bluetooth fails
        printerService.printSystem(printerSettings);
      }
    } else {
      showToast(
        isRtl
          ? 'تم فتح نافذة الطباعة / حفظ PDF'
          : 'Opening print dialog / save as PDF',
        'info'
      );
      printerService.printSystem(printerSettings);
    }
  };

  // Dedicated System Print action
  const handleSystemPrint = () => {
    soundService.playClick();
    printerService.printSystem(printerSettings);
  };

  // Pair Bluetooth Printer
  const handlePairBluetooth = async () => {
    setIsConnectingBt(true);
    soundService.playClick();
    const res = await printerService.connectBluetooth();
    setIsConnectingBt(false);

    if (res.success) {
      showToast(
        isRtl ? `تم الاقتران بنجاح: ${res.deviceName}` : `Paired with ${res.deviceName}`,
        'success'
      );
      updatePrinterSettings({ printerType: 'bluetooth' });
    } else {
      showToast(res.message, 'warning');
    }
  };

  // Test Print
  const handleTestPrint = async () => {
    soundService.playScanSuccess();
    const testData = {
      receiptNumber: 'TEST-001',
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString(),
      customerName: 'فحص الاتصال والطباعة',
      grossTotal: 100,
      totalTax: 14,
      netDue: 114,
      paymentMethod: 'cash',
      amountPaid: 114,
      changeDue: 0,
      items: [
        { name: 'بند تجريبي 1 (Test Item 1)', enteredQty: 1, unitPrice: 50, lineTotal: 50 },
        { name: 'بند تجريبي 2 (Test Item 2)', enteredQty: 2, unitPrice: 25, lineTotal: 50 }
      ]
    };

    if (printerSettings.printerType === 'bluetooth' && printerService.isConnected()) {
      const res = await printerService.printBluetooth(testData, 'pos');
      showToast(res.message, res.success ? 'success' : 'error');
    } else {
      printerService.printSystem(printerSettings);
    }
  };

  // Copy receipt text to clipboard
  const handleCopyText = async () => {
    soundService.playClick();
    const text = printerService.generateReceiptText(receiptData, receiptType || 'pos', printerSettings);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      showToast(
        isRtl ? 'تم نسخ نص الإيصال بالكامل إلى الحافظة' : 'Receipt text copied to clipboard',
        'success'
      );
      setTimeout(() => setCopied(false), 2500);
    } catch {
      showToast(isRtl ? 'تعذر النسخ إلى الحافظة' : 'Failed to copy to clipboard', 'error');
    }
  };

  // Share via WhatsApp
  const handleShareWhatsApp = () => {
    soundService.playClick();
    const phone = receiptData.customerPhone || '';
    printerService.shareWhatsApp(receiptData, receiptType || 'pos', phone);
    showToast(isRtl ? 'تم تجهيز الإيصال للمشاركة عبر واتساب' : 'Opening WhatsApp with receipt...', 'info');
  };

  // Save Settings from draft
  const handleSaveSettings = () => {
    updatePrinterSettings(localSettings);
    setShowSettings(false);
    soundService.playScanSuccess();
    showToast(isRtl ? 'تم حفظ إعدادات الطابعة' : 'Printer settings saved', 'success');
  };

  return (
    <div
      id="eda50-receipt-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md select-none overflow-y-auto"
    >
      <div
        className={`w-full ${
          is58mm ? 'max-w-[320px]' : 'max-w-md'
        } rounded-2xl border shadow-2xl flex flex-col max-h-[92vh] overflow-hidden transition-all duration-200 ${
          isDark ? 'bg-[#1C1F24] border-[#333842] text-[#F5F6F7]' : 'bg-white border-slate-300 text-slate-900'
        }`}
      >
        {/* Header (Hidden during print) */}
        <div
          className={`no-print p-3 border-b flex items-center justify-between shrink-0 ${
            isDark ? 'border-[#333842] bg-[#262A31]' : 'border-slate-200 bg-slate-100'
          }`}
        >
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-500 flex items-center justify-center">
              <Printer className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold leading-tight">
                {receiptType ? titleMap[receiptType] : (isRtl ? 'إيصال إلكتروني' : 'Receipt')}
              </h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[10px] font-mono px-1.5 py-0.2 bg-blue-500/10 text-blue-400 rounded">
                  {printerSettings.paperWidth}
                </span>
                {isBluetoothConnected && (
                  <span className="text-[10px] flex items-center gap-0.5 text-emerald-400">
                    <BluetoothConnected className="w-3 h-3" />
                    <span className="truncate max-w-[80px]">{connectedDeviceName || 'BT'}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                soundService.playClick();
                setShowSettings(!showSettings);
              }}
              className={`p-1.5 rounded-lg transition-colors ${
                showSettings
                  ? 'bg-blue-600 text-white'
                  : isDark
                  ? 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200'
              }`}
              title={isRtl ? 'إعدادات الطابعة' : 'Printer Settings'}
            >
              <Settings className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={closeReceipt}
              className={`p-1.5 rounded-lg transition-colors ${
                isDark ? 'text-gray-400 hover:text-white hover:bg-gray-700/50' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200'
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Paper Size & Quick Toggle Bar (Hidden in Print) */}
        <div
          className={`no-print px-3 py-1.5 border-b text-[11px] flex items-center justify-between shrink-0 ${
            isDark ? 'border-[#333842] bg-[#171A1F] text-gray-300' : 'border-slate-200 bg-slate-50 text-slate-700'
          }`}
        >
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-semibold text-gray-400">{isRtl ? 'عرض الورق:' : 'Paper:'}</span>
            <button
              type="button"
              onClick={() => updatePrinterSettings({ paperWidth: '80mm' })}
              className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${
                printerSettings.paperWidth === '80mm'
                  ? 'bg-blue-600 text-white'
                  : isDark
                  ? 'bg-[#262A31] text-gray-400 hover:text-white'
                  : 'bg-white text-gray-600 border'
              }`}
            >
              80mm
            </button>
            <button
              type="button"
              onClick={() => updatePrinterSettings({ paperWidth: '58mm' })}
              className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${
                printerSettings.paperWidth === '58mm'
                  ? 'bg-blue-600 text-white'
                  : isDark
                  ? 'bg-[#262A31] text-gray-400 hover:text-white'
                  : 'bg-white text-gray-600 border'
              }`}
            >
              58mm
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-gray-400">{isRtl ? 'النوع:' : 'Type:'}</span>
            <button
              type="button"
              onClick={() =>
                updatePrinterSettings({
                  printerType: printerSettings.printerType === 'bluetooth' ? 'system' : 'bluetooth'
                })
              }
              className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 transition-colors ${
                printerSettings.printerType === 'bluetooth'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-indigo-600 text-white'
              }`}
            >
              {printerSettings.printerType === 'bluetooth' ? (
                <>
                  <Bluetooth className="w-3 h-3" />
                  <span>Bluetooth</span>
                </>
              ) : (
                <>
                  <Printer className="w-3 h-3" />
                  <span>System / PDF</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* In-Modal Printer Settings Drawer (Hidden during print) */}
        {showSettings && (
          <div
            className={`no-print p-3 border-b max-h-[45vh] overflow-y-auto space-y-3 text-xs shrink-0 animate-in slide-in-from-top-2 ${
              isDark ? 'border-[#333842] bg-[#121417]' : 'border-slate-200 bg-slate-50'
            }`}
          >
            <div className="flex items-center justify-between font-bold border-b pb-1.5">
              <span>{isRtl ? 'إعدادات الطابعة والإيصال' : 'Printer & Receipt Settings'}</span>
              <button
                type="button"
                onClick={handleTestPrint}
                className="text-[10px] text-blue-500 hover:underline flex items-center gap-1 font-semibold"
              >
                <Printer className="w-3 h-3" />
                <span>{isRtl ? 'طباعة تجريبية' : 'Test Print'}</span>
              </button>
            </div>

            {/* Bluetooth connection manager */}
            <div
              className={`p-2.5 rounded-xl border space-y-2 ${
                isDark ? 'bg-[#1C1F24] border-[#333842]' : 'bg-white border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[11px] flex items-center gap-1">
                  <Bluetooth className="w-3.5 h-3.5 text-blue-400" />
                  <span>{isRtl ? 'طابعة البلوتوث (ESC/POS)' : 'Bluetooth Thermal Printer'}</span>
                </span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    isBluetoothConnected ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-500/20 text-gray-400'
                  }`}
                >
                  {isBluetoothConnected ? (connectedDeviceName || 'Connected') : (isRtl ? 'غير متصل' : 'Disconnected')}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {!isBluetoothConnected ? (
                  <button
                    type="button"
                    onClick={handlePairBluetooth}
                    disabled={isConnectingBt}
                    className="flex-1 py-1.5 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-[11px] flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    <Bluetooth className="w-3.5 h-3.5" />
                    <span>
                      {isConnectingBt
                        ? (isRtl ? 'جاري الاقتران...' : 'Connecting...')
                        : (isRtl ? 'اقتران بطابعة بلوتوث' : 'Pair Bluetooth Printer')}
                    </span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => printerService.disconnectBluetooth()}
                    className="flex-1 py-1.5 px-3 border border-red-500/40 text-red-400 hover:bg-red-500/10 rounded-lg font-bold text-[11px] transition-colors"
                  >
                    {isRtl ? 'قطع الاتصال' : 'Disconnect'}
                  </button>
                )}
              </div>
            </div>

            {/* Store Information */}
            <div className="space-y-2 text-[11px]">
              <div>
                <label className="block text-gray-400 mb-0.5">{isRtl ? 'اسم المنشأة بالعربي:' : 'Store Name (AR):'}</label>
                <input
                  type="text"
                  value={localSettings.storeName}
                  onChange={(e) => setLocalSettings({ ...localSettings, storeName: e.target.value })}
                  className={`w-full px-2.5 py-1.5 rounded-lg border text-xs ${
                    isDark ? 'bg-[#262A31] border-[#333842] text-white' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-0.5">{isRtl ? 'اسم المنشأة بالإنجليزي:' : 'Store Name (EN):'}</label>
                <input
                  type="text"
                  value={localSettings.storeNameEn}
                  onChange={(e) => setLocalSettings({ ...localSettings, storeNameEn: e.target.value })}
                  className={`w-full px-2.5 py-1.5 rounded-lg border text-xs ${
                    isDark ? 'bg-[#262A31] border-[#333842] text-white' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-gray-400 mb-0.5">{isRtl ? 'الرقم الضريبي:' : 'VAT Number:'}</label>
                  <input
                    type="text"
                    value={localSettings.taxNumber}
                    onChange={(e) => setLocalSettings({ ...localSettings, taxNumber: e.target.value })}
                    className={`w-full px-2.5 py-1.5 rounded-lg border text-xs font-mono ${
                      isDark ? 'bg-[#262A31] border-[#333842] text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-gray-400 mb-0.5">{isRtl ? 'السجل التجاري:' : 'CR Number:'}</label>
                  <input
                    type="text"
                    value={localSettings.crNumber}
                    onChange={(e) => setLocalSettings({ ...localSettings, crNumber: e.target.value })}
                    className={`w-full px-2.5 py-1.5 rounded-lg border text-xs font-mono ${
                      isDark ? 'bg-[#262A31] border-[#333842] text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-400 mb-0.5">{isRtl ? 'ملاحظة أسفل الإيصال:' : 'Footer Note:'}</label>
                <input
                  type="text"
                  value={localSettings.footerNote}
                  onChange={(e) => setLocalSettings({ ...localSettings, footerNote: e.target.value })}
                  className={`w-full px-2.5 py-1.5 rounded-lg border text-xs ${
                    isDark ? 'bg-[#262A31] border-[#333842] text-white' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowSettings(false)}
                  className="px-3 py-1.5 border rounded-lg text-gray-400 hover:text-white"
                >
                  {isRtl ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={handleSaveSettings}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold"
                >
                  {isRtl ? 'حفظ الإعدادات' : 'Save Settings'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Paper Receipt Body (Thermal layout - Designated Printable Area) */}
        <div className="flex-1 overflow-y-auto p-2 sm:p-4 bg-slate-200 dark:bg-black/50 flex justify-center">
          <div
            id="printable-thermal-receipt"
            className={`w-full bg-white text-black font-mono shadow-md p-4 transition-all duration-200 select-text ${
              is58mm ? 'max-w-[270px] text-[10px]' : 'max-w-[340px] text-[11px]'
            }`}
            style={{
              fontFamily: "'Cairo', 'Courier New', monospace"
            }}
          >
            {/* Business Header */}
            <div className="text-center pb-2.5 border-b border-dashed border-gray-500">
              <h2 className="text-sm sm:text-base font-extrabold tracking-wide text-black leading-tight">
                {printerSettings.storeName}
              </h2>
              <p className="text-[10px] text-gray-700 font-sans mt-0.5">
                {printerSettings.storeNameEn}
              </p>
              {printerSettings.taxNumber && (
                <p className="text-[9px] sm:text-[10px] text-gray-800 mt-1 font-bold">
                  الرقم الضريبي: {printerSettings.taxNumber}
                </p>
              )}
              {printerSettings.crNumber && (
                <p className="text-[9px] text-gray-600">
                  سجل تجاري: {printerSettings.crNumber} | {printerSettings.address || 'الفرع الرئيسي'}
                </p>
              )}
              {printerSettings.phone && (
                <p className="text-[9px] text-gray-600">
                  هاتف: {printerSettings.phone}
                </p>
              )}
            </div>

            {/* Document Meta */}
            <div className="py-2 border-b border-dashed border-gray-500 space-y-1 text-[10px] sm:text-[11px]">
              <div className="flex justify-between font-bold text-[11px]">
                <span className="text-gray-700">السند:</span>
                <span>{receiptType ? titleMap[receiptType] : 'إيصال مبيعات'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">رقم السند:</span>
                <span className="font-bold">{docNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">التاريخ والوقت:</span>
                <span>
                  {receiptData.date || new Date().toISOString().split('T')[0]} {receiptData.time || '10:00'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">العميل:</span>
                <span className="font-semibold truncate max-w-[170px]">
                  {receiptData.customerName || 'عميل نقدي'}
                </span>
              </div>
              {receiptData.customerTaxNumber && receiptData.customerTaxNumber !== '0000000000' && (
                <div className="flex justify-between text-[9px]">
                  <span className="text-gray-700">رقم ضريبي العميل:</span>
                  <span>{receiptData.customerTaxNumber}</span>
                </div>
              )}
              <div className="flex justify-between text-[9px] text-gray-600 pt-0.5">
                <span>جهاز: Honeywell EDA50</span>
                <span>المستخدم: {receiptData.salesRep || receiptData.employeeName || 'SA'}</span>
              </div>
            </div>

            {/* Items Table */}
            <div className="py-2 border-b border-dashed border-gray-500">
              <div className="flex justify-between text-[9px] sm:text-[10px] text-gray-700 pb-1 font-bold border-b border-gray-300">
                <span className="text-right flex-1">الصنف</span>
                <span className="text-center w-14">الكمية</span>
                <span className="text-left w-16">المجموع</span>
              </div>

              <div className="divide-y divide-gray-100 py-1 space-y-1">
                {(receiptData.items || []).map((it: any, i: number) => (
                  <div key={i} className="pt-1">
                    <div className="font-bold text-[10px] sm:text-[11px] truncate">{it.name}</div>
                    <div className="flex justify-between text-[9px] sm:text-[10px] text-gray-700">
                      <span>
                        {it.enteredQty} × {(it.unitPrice || 0).toFixed(2)}
                        {it.discount > 0 ? ` (خصم ${it.discount})` : ''}
                      </span>
                      <span className="font-bold">{(it.lineTotal || 0).toFixed(2)} ج.م</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Financial Breakdown */}
            <div className="py-2 space-y-1 text-[10px] sm:text-[11px] border-b border-dashed border-gray-500">
              <div className="flex justify-between">
                <span>المجموع الأساسي:</span>
                <span>{(receiptData.grossTotal || 0).toFixed(2)} ج.م</span>
              </div>
              {(receiptData.totalDiscount || 0) > 0 && (
                <div className="flex justify-between text-gray-700">
                  <span>إجمالي الخصم:</span>
                  <span>- {(receiptData.totalDiscount || 0).toFixed(2)} ج.م</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>ضريبة القيمة المضافة (14%):</span>
                <span>+ {(receiptData.totalTax || 0).toFixed(2)} ج.م</span>
              </div>
              <div className="flex justify-between font-extrabold text-xs sm:text-sm pt-1 border-t border-gray-400">
                <span>الإجمالي المستحق:</span>
                <span>{(receiptData.netDue || 0).toFixed(2)} ج.م</span>
              </div>

              {receiptData.amountPaid !== undefined && (
                <>
                  <div className="flex justify-between text-gray-700 pt-1">
                    <span>
                      المدفوع ({receiptData.paymentMethod === 'card' ? 'بطاقة ائتمان' : 'نقدي'}):
                    </span>
                    <span>{(receiptData.amountPaid || 0).toFixed(2)} ج.م</span>
                  </div>
                  <div className="flex justify-between text-emerald-800 font-bold">
                    <span>المتبقي (الـفـكـة):</span>
                    <span>{(receiptData.changeDue || 0).toFixed(2)} ج.م</span>
                  </div>
                </>
              )}
            </div>

            {/* QR Code & Barcode Simulation */}
            <div className="pt-2.5 pb-1 flex flex-col items-center justify-center text-center">
              {/* ZATCA Electronic Invoice QR Code */}
              <div className="w-20 h-20 bg-gray-50 border border-gray-300 p-1 flex items-center justify-center rounded">
                <QrCode className="w-16 h-16 text-black" />
              </div>
              <span className="text-[8px] text-gray-600 mt-1">
                فاتورة إلكترونية معتمدة (ZATCA / ETA Compliant)
              </span>

              {/* Linear Barcode representation */}
              <div className="mt-1.5 text-center">
                <div className="tracking-[3px] text-xs font-mono font-bold leading-none">
                  ||||| | |||| ||| ||||| || |
                </div>
                <span className="text-[9px] text-gray-700 font-mono">{docNumber}</span>
              </div>

              {/* Policy & Footer Note */}
              <div className="mt-2 text-[8px] sm:text-[9px] text-gray-600 border-t border-gray-200 pt-1.5 w-full">
                <p>{printerSettings.footerNote}</p>
                <p className="mt-0.5 text-gray-400">نظام نقاط البيع المحمول Honeywell EDA50</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions (Hidden in Print) */}
        <div
          className={`no-print p-3 border-t flex items-center gap-2 shrink-0 ${
            isDark ? 'border-[#333842] bg-[#262A31]' : 'border-slate-200 bg-slate-100'
          }`}
        >
          {/* Main Print Button */}
          <button
            type="button"
            onClick={handlePrint}
            className="flex-1 h-12 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-colors shadow-md cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>
              {printerSettings.printerType === 'bluetooth'
                ? (isRtl ? 'طباعة حرارية (Bluetooth)' : 'Bluetooth Print')
                : (isRtl ? 'طباعة فورية / PDF' : 'Print / Save PDF')}
            </span>
          </button>

          {/* Fallback System Print Button if in Bluetooth mode */}
          {printerSettings.printerType === 'bluetooth' && (
            <button
              type="button"
              onClick={handleSystemPrint}
              className={`h-12 px-3 border rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-colors ${
                isDark ? 'border-[#333842] hover:bg-[#333842] text-gray-300' : 'border-slate-300 hover:bg-slate-200 text-slate-700'
              }`}
              title={isRtl ? 'طباعة النظام / PDF' : 'System Print / PDF'}
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">PDF</span>
            </button>
          )}

          {/* Copy Receipt Text Button */}
          <button
            type="button"
            onClick={handleCopyText}
            className={`h-12 px-3.5 border rounded-xl text-xs font-semibold flex items-center justify-center transition-colors ${
              copied
                ? 'bg-emerald-600 border-emerald-600 text-white'
                : isDark
                ? 'border-[#333842] hover:bg-[#333842] text-gray-300'
                : 'border-slate-300 hover:bg-slate-200 text-slate-700'
            }`}
            title={isRtl ? 'نسخ نص الإيصال' : 'Copy Text'}
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </button>

          {/* WhatsApp Share Button */}
          <button
            type="button"
            onClick={handleShareWhatsApp}
            className="h-12 px-3.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center transition-colors shadow-sm"
            title={isRtl ? 'مشاركة عبر واتساب' : 'Share via WhatsApp'}
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
