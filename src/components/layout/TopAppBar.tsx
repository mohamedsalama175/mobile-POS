import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Cloud,
  CloudOff,
  RefreshCw,
  MoreVertical,
  Search,
  Globe,
  Sun,
  Moon,
  Smartphone,
  Maximize2,
  Lock,
  Layers,
  RotateCcw,
  Users
} from 'lucide-react';
import { storageService } from '../../services/storage';
import { soundService } from '../../services/sound';

interface TopAppBarProps {
  title?: string;
  onSearchToggle?: () => void;
  isSearchActive?: boolean;
}

export const TopAppBar: React.FC<TopAppBarProps> = ({
  title,
  onSearchToggle,
  isSearchActive = false
}) => {
  const {
    language,
    setLanguage,
    theme,
    setTheme,
    isOnline,
    setIsOnline,
    pendingSyncCount,
    triggerSync,
    setIsOutboxOpen,
    setIsPinOpen,
    handheldMode,
    setHandheldMode,
    activeTab,
    setActiveTab,
    showToast
  } = useApp();

  const [menuOpen, setMenuOpen] = useState(false);

  const defaultTitles: Record<number, { ar: string; en: string }> = {
    0: { ar: 'طلبات البيع', en: 'Sales Orders' },
    1: { ar: 'فواتير المبيعات', en: 'Sales Invoices' },
    2: { ar: 'نقطة البيع (POS)', en: 'Point of Sale' },
    3: { ar: 'المرتجعات والائتمان', en: 'Returns & Credit' },
    4: { ar: 'حساب المندوب والتحصيل', en: 'Representative & Collections' },
    5: { ar: 'كتالوج الأصناف (IndexedDB)', en: 'Product Catalog' },
    6: { ar: 'دليل العملاء (IndexedDB)', en: 'Customer Directory' }
  };

  const displayTitle = title || (language === 'ar' ? defaultTitles[activeTab]?.ar : defaultTitles[activeTab]?.en) || 'Honeywell EDA50';

  const toggleLanguage = () => {
    const next = language === 'ar' ? 'en' : 'ar';
    setLanguage(next);
    showToast(next === 'ar' ? 'تم تحويل اللغة إلى العربية' : 'Switched language to English', 'info');
    setMenuOpen(false);
  };

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    setMenuOpen(false);
  };

  const toggleNetwork = () => {
    setIsOnline(!isOnline);
    setMenuOpen(false);
  };

  const handleResetData = () => {
    if (confirm(language === 'ar' ? 'هل تريد استعادة البيانات التجريبية الأولية؟' : 'Reset demo database to defaults?')) {
      storageService.resetDemoData();
      window.location.reload();
    }
  };

  const isDark = theme === 'dark';

  return (
    <header
      id="eda50-top-bar"
      className={`sticky top-0 z-30 flex items-center justify-between h-14 px-3 border-b select-none transition-colors ${
        isDark ? 'bg-[#262A31] border-[#333842] text-[#F5F6F7]' : 'bg-[#FFFFFF] border-[#E5E7EB] text-[#111827]'
      }`}
    >
      {/* Title & Brand */}
      <div className="flex items-center gap-2 overflow-hidden">
        <div className="flex flex-col min-w-0">
          <span className="text-[10px] font-semibold tracking-wider text-blue-400 uppercase">
            EDA50 • {language === 'ar' ? 'دار السلام' : 'Dar Al-Salam'}
          </span>
          <h1 className="text-base font-bold truncate leading-tight">
            {displayTitle}
          </h1>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        {/* Search toggle (if provided) */}
        {onSearchToggle && (
          <button
            id="topbar-search-toggle"
            onClick={onSearchToggle}
            className={`p-2 rounded-lg transition-colors ${
              isSearchActive
                ? 'bg-blue-600 text-white'
                : isDark ? 'text-gray-300 hover:bg-[#333842]' : 'text-gray-600 hover:bg-gray-100'
            }`}
            title={language === 'ar' ? 'بحث' : 'Search'}
          >
            <Search className="w-5 h-5" />
          </button>
        )}

        {/* Sync Status Button with Badge */}
        <button
          id="topbar-sync-button"
          onClick={() => setIsOutboxOpen(true)}
          className={`relative p-2 rounded-lg flex items-center gap-1 transition-colors ${
            !isOnline
              ? 'text-amber-400 hover:bg-amber-400/10'
              : pendingSyncCount > 0
              ? 'text-blue-400 hover:bg-blue-400/10'
              : 'text-emerald-400 hover:bg-emerald-400/10'
          }`}
          title={language === 'ar' ? 'حالة المزامنة وصندوق الصادر' : 'Sync Status & Outbox'}
        >
          {isOnline ? <Cloud className="w-5 h-5" /> : <CloudOff className="w-5 h-5" />}
          {pendingSyncCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-amber-500 text-black text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center shadow-sm">
              {pendingSyncCount}
            </span>
          )}
        </button>

        {/* Sync Now Action */}
        <button
          id="topbar-sync-now"
          onClick={triggerSync}
          className={`p-2 rounded-lg transition-colors ${
            isDark ? 'text-gray-300 hover:bg-[#333842]' : 'text-gray-600 hover:bg-gray-100'
          }`}
          title={language === 'ar' ? 'مزامنة الآن' : 'Sync Now'}
        >
          <RefreshCw className="w-5 h-5" />
        </button>

        {/* Representative Dashboard Quick Action */}
        <button
          id="topbar-rep-button"
          onClick={() => {
            soundService.playClick();
            setActiveTab(activeTab === 4 ? 0 : 4);
          }}
          className={`p-2 rounded-lg transition-colors flex items-center gap-1 ${
            activeTab === 4
              ? 'bg-blue-600 text-white shadow-md'
              : isDark ? 'text-blue-400 hover:bg-[#333842]' : 'text-blue-600 hover:bg-gray-100'
          }`}
          title={language === 'ar' ? 'لوحة المندوب والتحصيل' : 'Representative Dashboard'}
        >
          <Users className="w-5 h-5" />
        </button>

        {/* Overflow Menu Button */}
        <div className="relative">
          <button
            id="topbar-overflow-menu"
            onClick={() => setMenuOpen(!menuOpen)}
            className={`p-2 rounded-lg transition-colors ${
              menuOpen
                ? 'bg-blue-600 text-white'
                : isDark ? 'text-gray-300 hover:bg-[#333842]' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <MoreVertical className="w-5 h-5" />
          </button>

          {/* Menu Dropdown */}
          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-40 bg-black/20"
                onClick={() => setMenuOpen(false)}
              />
              <div
                id="topbar-menu-dropdown"
                className={`absolute ${language === 'ar' ? 'left-0' : 'right-0'} mt-2 w-56 rounded-xl shadow-2xl border z-50 py-1.5 text-sm transition-all ${
                  isDark ? 'bg-[#1C1F24] border-[#333842] text-gray-200' : 'bg-white border-gray-200 text-gray-800'
                }`}
              >
                {/* Representative Dashboard Link */}
                <button
                  id="menu-open-representative"
                  onClick={() => {
                    setActiveTab(4);
                    setMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 transition-colors border-b ${
                    isDark ? 'border-[#333842] hover:bg-[#262A31]' : 'border-gray-100 hover:bg-gray-50'
                  }`}
                >
                  <span className="flex items-center gap-2 font-bold text-blue-500">
                    <Users className="w-4 h-4 text-blue-400" />
                    {language === 'ar' ? 'حساب وتحصيلات المندوب' : 'Representative Dashboard'}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 font-bold">
                    ERP
                  </span>
                </button>

                {/* Product Catalog Navigation */}
                <button
                  id="menu-open-catalog"
                  onClick={() => {
                    setActiveTab(5);
                    setMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 transition-colors ${
                    isDark ? 'hover:bg-[#262A31]' : 'hover:bg-gray-50'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-purple-400" />
                    {language === 'ar' ? 'كتالوج الأصناف والمخزن' : 'Product Catalog'}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-400 font-mono font-bold">
                    IndexedDB
                  </span>
                </button>

                {/* Customer Directory Navigation */}
                <button
                  id="menu-open-customers"
                  onClick={() => {
                    setActiveTab(6);
                    setMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 transition-colors ${
                    isDark ? 'hover:bg-[#262A31]' : 'hover:bg-gray-50'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-emerald-400" />
                    {language === 'ar' ? 'دليل حسابات العملاء' : 'Customer Directory'}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 font-mono font-bold">
                    IndexedDB
                  </span>
                </button>

                {/* Language Switch */}
                <button
                  id="menu-toggle-lang"
                  onClick={toggleLanguage}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 transition-colors ${
                    isDark ? 'hover:bg-[#262A31]' : 'hover:bg-gray-50'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-blue-400" />
                    {language === 'ar' ? 'اللغة: English' : 'Language: العربية'}
                  </span>
                  <span className="text-xs px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 font-bold">
                    {language.toUpperCase()}
                  </span>
                </button>

                {/* Theme Switch */}
                <button
                  id="menu-toggle-theme"
                  onClick={toggleTheme}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 transition-colors ${
                    isDark ? 'hover:bg-[#262A31]' : 'hover:bg-gray-50'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-purple-500" />}
                    {isDark
                      ? (language === 'ar' ? 'الوضع الفاتح (عالي التباين)' : 'High-Contrast Light')
                      : (language === 'ar' ? 'الوضع الليلي (الافتراضي)' : 'Dark Theme (Default)')}
                  </span>
                </button>

                {/* Network Toggle (Simulation) */}
                <button
                  id="menu-toggle-network"
                  onClick={toggleNetwork}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 transition-colors ${
                    isDark ? 'hover:bg-[#262A31]' : 'hover:bg-gray-50'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {isOnline ? <CloudOff className="w-4 h-4 text-amber-400" /> : <Cloud className="w-4 h-4 text-emerald-400" />}
                    {isOnline
                      ? (language === 'ar' ? 'محاكاة وضع دون اتصال (Offline)' : 'Simulate Offline Mode')
                      : (language === 'ar' ? 'استعادة الاتصال (Online)' : 'Restore Online Mode')}
                  </span>
                </button>

                {/* Outbox Drawer */}
                <button
                  id="menu-open-outbox"
                  onClick={() => {
                    setIsOutboxOpen(true);
                    setMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 transition-colors ${
                    isDark ? 'hover:bg-[#262A31]' : 'hover:bg-gray-50'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-indigo-400" />
                    {language === 'ar' ? 'صندوق الصادر والمزامنة' : 'Outbox & Sync Queue'}
                  </span>
                  {pendingSyncCount > 0 && (
                    <span className="text-xs px-1.5 py-0.5 rounded-full bg-amber-500 text-black font-bold">
                      {pendingSyncCount}
                    </span>
                  )}
                </button>

                {/* Handheld Device Frame Toggle */}
                <button
                  id="menu-toggle-handheld-frame"
                  onClick={() => {
                    setHandheldMode(!handheldMode);
                    setMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 transition-colors ${
                    isDark ? 'hover:bg-[#262A31]' : 'hover:bg-gray-50'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {handheldMode ? <Maximize2 className="w-4 h-4 text-teal-400" /> : <Smartphone className="w-4 h-4 text-teal-400" />}
                    {handheldMode
                      ? (language === 'ar' ? 'عرض ملء الشاشة' : 'Full Screen View')
                      : (language === 'ar' ? 'هيكل جهاز EDA50' : 'EDA50 Handheld Frame')}
                  </span>
                </button>

                {/* Handover / PIN Lock */}
                <button
                  id="menu-pin-lock"
                  onClick={() => {
                    setIsPinOpen(true);
                    setMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-2 px-3.5 py-2.5 transition-colors ${
                    isDark ? 'hover:bg-[#262A31]' : 'hover:bg-gray-50'
                  }`}
                >
                  <Lock className="w-4 h-4 text-orange-400" />
                  {language === 'ar' ? 'تبديل وردية / قفل بكلمة مرور' : 'Shift Handover / PIN'}
                </button>

                <div className={`my-1 border-t ${isDark ? 'border-[#333842]' : 'border-gray-200'}`} />

                {/* Reset Data */}
                <button
                  id="menu-reset-data"
                  onClick={handleResetData}
                  className="w-full flex items-center gap-2 px-3.5 py-2 text-rose-400 hover:bg-rose-500/10 text-xs transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  {language === 'ar' ? 'استعادة البيانات الافتراضية' : 'Reset Demo Data'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
