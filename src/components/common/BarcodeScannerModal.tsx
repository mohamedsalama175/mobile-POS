import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { soundService } from '../../services/sound';
import { X, Scan, Zap, CheckCircle2, Search, ArrowRight } from 'lucide-react';
import { MOCK_PRODUCTS } from '../../data/mockData';

export const BarcodeScannerModal: React.FC = () => {
  const { isScannerOpen, closeScanner, activeScanCallback, language, theme, showToast } = useApp();
  const [manualCode, setManualCode] = useState('');
  const isDark = theme === 'dark';

  useEffect(() => {
    if (isScannerOpen) {
      setManualCode('');
    }
  }, [isScannerOpen]);

  if (!isScannerOpen) return null;

  const handleScanCode = (code: string, productName?: string) => {
    soundService.playScanSuccess();
    if (activeScanCallback) {
      activeScanCallback(code);
    }
    showToast(
      language === 'ar'
        ? `تم مسح الباركود: ${code} ${productName ? `(${productName})` : ''}`
        : `Scanned: ${code} ${productName ? `(${productName})` : ''}`,
      'success'
    );
    closeScanner();
  };

  return (
    <div
      id="eda50-scanner-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm select-none"
    >
      <div
        className={`w-full max-w-sm rounded-2xl border shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 ${
          isDark ? 'bg-[#1C1F24] border-[#333842] text-[#F5F6F7]' : 'bg-white border-gray-200 text-gray-900'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#333842]">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400">
              <Scan className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold">
                {language === 'ar' ? 'قارئ الباركود (EDA50 2D Imager)' : 'Barcode Scanner (EDA50 2D)'}
              </h2>
              <p className="text-[11px] text-gray-400">
                {language === 'ar' ? 'وجه الليزر نحو الباركود أو اختر صنفاً' : 'Aim at barcode or pick test item'}
              </p>
            </div>
          </div>
          <button
            id="close-scanner-button"
            onClick={closeScanner}
            className="p-1.5 rounded-lg hover:bg-gray-500/20 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewfinder simulation with red laser scanning line */}
        <div className="relative h-44 bg-black flex flex-col items-center justify-center overflow-hidden border-y border-red-950">
          {/* Target Reticle corners */}
          <div className="absolute inset-x-8 inset-y-6 border-2 border-red-500/40 rounded-lg pointer-events-none flex flex-col justify-between">
            <div className="flex justify-between p-1">
              <div className="w-4 h-4 border-t-2 border-l-2 border-red-500"></div>
              <div className="w-4 h-4 border-t-2 border-r-2 border-red-500"></div>
            </div>
            <div className="flex justify-between p-1">
              <div className="w-4 h-4 border-b-2 border-l-2 border-red-500"></div>
              <div className="w-4 h-4 border-b-2 border-r-2 border-red-500"></div>
            </div>
          </div>

          {/* Sweeping laser beam */}
          <div className="absolute inset-x-0 h-0.5 bg-red-500 shadow-[0_0_12px_rgba(239,68,68,1)] animate-pulse top-1/2 -translate-y-1/2 pointer-events-none"></div>

          <div className="z-10 text-center px-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-950/80 border border-red-800 text-red-300 text-xs font-mono mb-1">
              <Zap className="w-3 h-3 text-red-400 animate-bounce" />
              <span>{language === 'ar' ? 'حساس المسح نشط' : 'Imager Sensor Active'}</span>
            </div>
            <p className="text-[11px] text-gray-400">
              {language === 'ar' ? 'اضغط أحد الأصناف أدناه للمسح الفوري' : 'Tap any item below to simulate scan'}
            </p>
          </div>
        </div>

        {/* Quick Test Barcode Buttons (FMCG warehouse items) */}
        <div className="p-3 flex-1 flex flex-col min-h-0">
          <span className="text-xs font-semibold text-gray-400 mb-2 px-1">
            {language === 'ar' ? 'أصناف تجريبية جاهزة للمسح:' : 'Ready-to-scan test items:'}
          </span>
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {MOCK_PRODUCTS.map((prod) => (
              <button
                key={prod.id}
                id={`simulate-scan-${prod.code}`}
                onClick={() => handleScanCode(prod.barcode, language === 'ar' ? prod.name : prod.nameEn)}
                className={`w-full flex items-center justify-between p-2 rounded-lg border text-left text-xs transition-colors active:scale-98 ${
                  isDark
                    ? 'bg-[#262A31] border-[#333842] hover:border-blue-500 hover:bg-[#2B3039]'
                    : 'bg-gray-50 border-gray-200 hover:border-blue-500 hover:bg-blue-50/50'
                }`}
              >
                <div className="min-w-0 pr-2">
                  <div className="font-semibold truncate">
                    {language === 'ar' ? prod.name : prod.nameEn}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-gray-400 font-mono">
                    <span className="text-blue-400 font-bold">#{prod.code}</span>
                    <span>|</span>
                    <span>{prod.barcode}</span>
                    <span>|</span>
                    <span>{prod.shelfNumber}</span>
                  </div>
                </div>
                <div className="shrink-0 flex items-center gap-1 text-blue-400 text-[11px] font-bold">
                  <span>{prod.unitPrice} ر.س</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
              </button>
            ))}
          </div>

          {/* Manual Barcode Input Fallback */}
          <div className="mt-3 pt-2 border-t border-[#333842]">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (manualCode.trim()) {
                  handleScanCode(manualCode.trim());
                }
              }}
              className="flex items-center gap-1.5"
            >
              <div className="relative flex-1">
                <input
                  id="scanner-manual-input"
                  type="text"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  placeholder={language === 'ar' ? 'أدخل كود أو باركود يدوياً...' : 'Type code or barcode manually...'}
                  className={`w-full h-10 px-3 text-xs rounded-lg border outline-none font-mono transition-colors ${
                    isDark
                      ? 'bg-[#121417] border-[#333842] text-white focus:border-blue-500'
                      : 'bg-gray-100 border-gray-300 text-gray-900 focus:border-blue-500'
                  }`}
                />
              </div>
              <button
                type="submit"
                id="scanner-manual-submit"
                className="h-10 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
              >
                <span>{language === 'ar' ? 'إدخال' : 'Submit'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
