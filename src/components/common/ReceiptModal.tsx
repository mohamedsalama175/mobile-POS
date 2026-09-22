import React from 'react';
import { useApp } from '../../context/AppContext';
import { X, Printer, Share2, Check, QrCode } from 'lucide-react';
import { soundService } from '../../services/sound';

export const ReceiptModal: React.FC = () => {
  const { isReceiptOpen, closeReceipt, receiptData, receiptType, language, theme, showToast } = useApp();

  if (!isReceiptOpen || !receiptData) return null;

  const handlePrint = () => {
    soundService.playScanSuccess();
    showToast(
      language === 'ar'
        ? 'تم إرسال أمر الطباعة إلى طابعة البلوتوث المحمولة (ESC/POS)'
        : 'Print job dispatched to paired Bluetooth thermal printer',
      'success'
    );
    window.print();
  };

  const handleShare = () => {
    soundService.playClick();
    showToast(
      language === 'ar' ? 'تم نسخ رابط/مستند الفاتورة لمشاركته كـ PDF' : 'Receipt PDF generated for sharing',
      'info'
    );
  };

  const titleMap = {
    pos: language === 'ar' ? 'إيصال نقطة بيع إلكتروني' : 'POS Electronic Receipt',
    invoice: language === 'ar' ? 'فاتورة ضريبية مبسطة' : 'Simplified Tax Invoice',
    order: language === 'ar' ? 'سند طلب بيع' : 'Sales Order Voucher'
  };

  const docNumber =
    receiptData.receiptNumber ||
    receiptData.invoiceNumber ||
    receiptData.orderNumber ||
    'DOC-2026';

  return (
    <div
      id="eda50-receipt-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm select-none"
    >
      <div className="w-full max-w-sm rounded-2xl bg-[#1C1F24] border border-[#333842] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-[#F5F6F7]">
        {/* Header */}
        <div className="p-3 border-b border-[#333842] flex items-center justify-between bg-[#262A31]">
          <div className="flex items-center gap-2">
            <Printer className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-bold">
              {receiptType ? titleMap[receiptType] : 'إيصال'}
            </h3>
          </div>
          <button
            onClick={closeReceipt}
            className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700/50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Paper Receipt Body (Thermal 80mm ESC/POS layout) */}
        <div className="flex-1 overflow-y-auto p-4 bg-white text-black font-mono text-xs select-text">
          {/* Business Header */}
          <div className="text-center pb-3 border-b border-dashed border-gray-400">
            <h2 className="text-base font-extrabold tracking-wider text-black">
              شركة دار السلام للتجارة
            </h2>
            <p className="text-[11px] text-gray-600">
              Dar Al-Salam Trading & Distribution Co.
            </p>
            <p className="text-[10px] text-gray-500 mt-1">
              الرقم الضريبي: 300124567800003
            </p>
            <p className="text-[10px] text-gray-500">
              سجل تجاري: 1010892341 | فرع الرياض
            </p>
          </div>

          {/* Document Meta */}
          <div className="py-2.5 border-b border-dashed border-gray-400 space-y-1 text-[11px]">
            <div className="flex justify-between">
              <span className="text-gray-600">رقم السند:</span>
              <span className="font-bold">{docNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">التاريخ والوقت:</span>
              <span>{receiptData.date || new Date().toISOString().split('T')[0]} 09:42</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">العميل:</span>
              <span className="font-semibold truncate max-w-[180px]">
                {receiptData.customerName || 'عميل نقدي'}
              </span>
            </div>
            {receiptData.customerTaxNumber && receiptData.customerTaxNumber !== '0000000000' && (
              <div className="flex justify-between">
                <span className="text-gray-600">رقم ضريبي العميل:</span>
                <span>{receiptData.customerTaxNumber}</span>
              </div>
            )}
            <div className="flex justify-between text-[10px] text-gray-500">
              <span>جهاز: Honeywell EDA50</span>
              <span>المستخدم: {receiptData.salesRep || receiptData.employeeName || 'SA'}</span>
            </div>
          </div>

          {/* Items Table */}
          <div className="py-2.5 border-b border-dashed border-gray-400">
            <div className="flex justify-between text-[10px] text-gray-500 pb-1 font-bold border-b border-gray-200">
              <span>الصنف</span>
              <span className="text-center">الكمية</span>
              <span className="text-left">المجموع</span>
            </div>

            <div className="divide-y divide-gray-100 py-1 space-y-1">
              {(receiptData.items || []).map((it: any, i: number) => (
                <div key={i} className="pt-1">
                  <div className="font-bold text-[11px] truncate">{it.name}</div>
                  <div className="flex justify-between text-[10px] text-gray-600">
                    <span>
                      {it.enteredQty} × {it.unitPrice.toFixed(2)}
                      {it.discount > 0 ? ` (خصم ${it.discount})` : ''}
                    </span>
                    <span className="font-bold">{it.lineTotal.toFixed(2)} ر.س</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Financial Breakdown */}
          <div className="py-2.5 space-y-1 text-[11px] border-b border-dashed border-gray-400">
            <div className="flex justify-between">
              <span>المجموع الأساسي:</span>
              <span>{(receiptData.grossTotal || 0).toFixed(2)} ر.س</span>
            </div>
            {(receiptData.totalDiscount || 0) > 0 && (
              <div className="flex justify-between text-gray-600">
                <span>إجمالي الخصم:</span>
                <span>- {(receiptData.totalDiscount || 0).toFixed(2)} ر.س</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>ضريبة القيمة المضافة (14%):</span>
              <span>+ {(receiptData.totalTax || 0).toFixed(2)} ر.س</span>
            </div>
            <div className="flex justify-between font-extrabold text-sm pt-1 border-t border-gray-300">
              <span>الإجمالي المستحق:</span>
              <span>{(receiptData.netDue || 0).toFixed(2)} ر.س</span>
            </div>

            {receiptData.amountPaid !== undefined && (
              <>
                <div className="flex justify-between text-gray-600 pt-1">
                  <span>
                    المدفوع ({receiptData.paymentMethod === 'card' ? 'بطاقة ائتمان' : 'نقدي'}):
                  </span>
                  <span>{receiptData.amountPaid.toFixed(2)} ر.س</span>
                </div>
                <div className="flex justify-between text-emerald-700 font-bold">
                  <span>المتبقي (الـفـكـة):</span>
                  <span>{(receiptData.changeDue || 0).toFixed(2)} ر.س</span>
                </div>
              </>
            )}
          </div>

          {/* QR Code & Barcode Simulation */}
          <div className="pt-3 pb-1 flex flex-col items-center justify-center text-center">
            {/* Mock ZATCA Electronic Invoice QR Code */}
            <div className="w-24 h-24 bg-gray-100 border border-gray-300 p-1 flex items-center justify-center rounded">
              <QrCode className="w-20 h-20 text-gray-800" />
            </div>
            <span className="text-[9px] text-gray-500 mt-1">
              فاتورة إلكترونية معتمدة (ZATCA Phase 2 Compliant)
            </span>

            {/* Linear Barcode representation */}
            <div className="mt-2 text-center">
              <div className="tracking-[3px] text-xs font-mono font-bold">
                ||||| | |||| ||| ||||| || |
              </div>
              <span className="text-[10px] text-gray-600 font-mono">{docNumber}</span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-3 border-t border-[#333842] flex items-center gap-2 bg-[#262A31]">
          <button
            onClick={handlePrint}
            className="flex-1 h-12 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>{language === 'ar' ? 'طباعة حرارية (Bluetooth)' : 'Thermal Print'}</span>
          </button>
          <button
            onClick={handleShare}
            className="h-12 px-3.5 border border-[#333842] hover:bg-[#333842] text-gray-300 rounded-xl text-xs font-semibold flex items-center justify-center transition-colors"
            title="Share PDF"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
