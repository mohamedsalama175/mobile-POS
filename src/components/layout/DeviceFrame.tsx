import React from 'react';
import { useApp } from '../../context/AppContext';
import { Zap, Wifi, Battery, Scan } from 'lucide-react';

interface DeviceFrameProps {
  children: React.ReactNode;
}

export const DeviceFrame: React.FC<DeviceFrameProps> = ({ children }) => {
  const { handheldMode, fireHardwareTrigger, isOnline, language, theme } = useApp();
  const isDark = theme === 'dark';

  if (!handheldMode) {
    return (
      <div
        className={`h-full w-full flex flex-col transition-colors ${
          isDark ? 'bg-[#121417] text-[#F5F6F7]' : 'bg-[#F8F9FA] text-[#111827]'
        }`}
        style={{ height: '100dvh' }}
      >
        {children}
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen w-full py-4 px-2 sm:px-6 flex flex-col items-center justify-center overflow-x-hidden transition-colors ${
        isDark ? 'bg-[#0B0C0E]' : 'bg-[#E8ECEF]'
      }`}
    >
      {/* Device Top Control Hints for Desktop Testing */}
      <div
        className={`mb-2 text-center text-xs flex items-center justify-center gap-3 ${
          isDark ? 'text-gray-400' : 'text-gray-600'
        }`}
      >
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block animate-pulse"></span>
          <span>{language === 'ar' ? 'أزرار المسح الجانبية الصفراء فعّالة للضغط' : 'Yellow side scan triggers are clickable'}</span>
        </span>
        <span className="text-gray-400 hidden sm:inline">•</span>
        <span className="hidden sm:inline font-mono opacity-80">Honeywell ScanPal EDA50 (5.0" HD)</span>
      </div>

      {/* The Rugged Handheld EDA50 Body */}
      <div className="relative flex items-center">
        {/* Left Physical Trigger (Yellow) */}
        <button
          id="eda50-left-scan-trigger"
          onClick={fireHardwareTrigger}
          className="group relative -mr-1.5 z-20 flex flex-col items-center justify-center w-5 h-24 bg-[#EAB308] hover:bg-[#FACC15] active:bg-[#CA8A04] rounded-l-md border-y border-l border-[#A16207] shadow-lg transition-transform active:scale-95 cursor-pointer"
          title={language === 'ar' ? 'زر المسح الجانبي الأيسر (Hardware Trigger)' : 'Left Scan Trigger (Hardware)'}
        >
          <div className="w-1 h-12 bg-[#854D0E] rounded-full opacity-60"></div>
          <span className="absolute -left-12 top-1/2 -translate-y-1/2 bg-[#1C1F24] text-yellow-400 text-[10px] font-bold px-1.5 py-0.5 rounded shadow border border-[#333842] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            {language === 'ar' ? 'مسح باركود' : 'SCAN'}
          </span>
        </button>

        {/* EDA50 Main Chassis */}
        <div
          className={`w-[390px] sm:w-[420px] max-w-[94vw] border-4 rounded-[36px] p-3 relative flex flex-col transition-colors ${
            isDark
              ? 'bg-[#1E2228] border-[#333842] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] ring-1 ring-white/10'
              : 'bg-[#F3F4F6] border-[#D1D5DB] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.18)] ring-1 ring-black/5'
          }`}
        >
          {/* Top Scanner Window & Speaker */}
          <div className="flex flex-col items-center pt-1 pb-2">
            {/* 2D Imager Red Window at top */}
            <div className="w-20 h-2 bg-red-950/80 border border-red-700/60 rounded-full mb-2 flex items-center justify-center">
              <div className="w-12 h-0.5 bg-red-500/80 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.8)]"></div>
            </div>

            {/* Speaker & LEDs */}
            <div className="w-full flex items-center justify-between px-6">
              {/* Battery / Status LED */}
              <div className="flex items-center gap-1.5">
                <span
                  className={`w-2 h-2 rounded-full ${
                    isOnline ? 'bg-emerald-500 shadow-[0_0_6px_rgba(34,197,94,0.8)]' : 'bg-amber-500'
                  }`}
                  title={isOnline ? 'System Online' : 'System Offline'}
                ></span>
                <span className="w-2 h-2 rounded-full bg-blue-500/60" title="Bluetooth Radio"></span>
              </div>

              {/* Earpiece Grille */}
              <div
                className={`w-16 h-1.5 rounded-full border ${
                  isDark ? 'bg-[#121417] border-[#333842]' : 'bg-gray-300 border-gray-400'
                }`}
              ></div>

              {/* Front Camera / Sensor */}
              <div
                className={`w-3 h-3 rounded-full border flex items-center justify-center ${
                  isDark ? 'bg-[#121417] border-[#333842]' : 'bg-gray-300 border-gray-400'
                }`}
              >
                <div className="w-1 h-1 rounded-full bg-blue-900/60"></div>
              </div>
            </div>
          </div>

          {/* Device Screen Container (5" Viewport Aspect) */}
          <div
            className={`relative w-full h-[680px] sm:h-[720px] rounded-[20px] overflow-hidden flex flex-col border shadow-inner transition-colors ${
              isDark
                ? 'bg-[#121417] border-[#333842]/70'
                : 'bg-[#F8F9FA] border-gray-300'
            }`}
          >
            {/* Handheld Android Status Bar */}
            <div
              className={`h-6 text-[10px] px-3 flex items-center justify-between select-none font-mono transition-colors ${
                isDark
                  ? 'bg-black/40 text-gray-400'
                  : 'bg-white/95 text-gray-800 border-b border-gray-200'
              }`}
            >
              <span className={`font-semibold ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>09:41</span>
              <div className="flex items-center gap-2">
                <span className="text-[9px] text-gray-500 font-bold tracking-wider">EDA50</span>
                {isOnline ? (
                  <Wifi className="w-3 h-3 text-emerald-600" />
                ) : (
                  <span className="text-[9px] text-amber-500">Offline</span>
                )}
                <span className="flex items-center text-[10px]">
                  94% <Battery className={`w-3 h-3 ml-0.5 ${isDark ? 'text-gray-300' : 'text-gray-700'}`} />
                </span>
              </div>
            </div>

            {/* Screen Content Viewport */}
            <div className="flex-1 flex flex-col overflow-hidden relative">
              {children}
            </div>
          </div>

          {/* Bottom EDA50 Bezel with Honeywell Logo */}
          <div className="pt-3 pb-1 flex flex-col items-center justify-center">
            <div className="flex items-center gap-1.5">
              <span className="text-[12px] font-extrabold tracking-widest text-red-500 font-sans">
                Honeywell
              </span>
              <span className={`text-[10px] font-semibold tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                ScanPal™
              </span>
            </div>
          </div>
        </div>

        {/* Right Physical Trigger (Yellow) */}
        <button
          id="eda50-right-scan-trigger"
          onClick={fireHardwareTrigger}
          className="group relative -ml-1.5 z-20 flex flex-col items-center justify-center w-5 h-24 bg-[#EAB308] hover:bg-[#FACC15] active:bg-[#CA8A04] rounded-r-md border-y border-r border-[#A16207] shadow-lg transition-transform active:scale-95 cursor-pointer"
          title={language === 'ar' ? 'زر المسح الجانبي الأيمن (Hardware Trigger)' : 'Right Scan Trigger (Hardware)'}
        >
          <div className="w-1 h-12 bg-[#854D0E] rounded-full opacity-60"></div>
          <span className="absolute -right-12 top-1/2 -translate-y-1/2 bg-[#1C1F24] text-yellow-400 text-[10px] font-bold px-1.5 py-0.5 rounded shadow border border-[#333842] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            {language === 'ar' ? 'مسح باركود' : 'SCAN'}
          </span>
        </button>
      </div>
    </div>
  );
};
