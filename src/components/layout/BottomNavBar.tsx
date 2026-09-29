import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  ClipboardList,
  FileText,
  Store,
  RotateCcw,
  UserCheck
} from 'lucide-react';
import { soundService } from '../../services/sound';

export const BottomNavBar: React.FC = () => {
  const { activeTab, setActiveTab, language, theme, hideBottomNav } = useApp();
  const isDark = theme === 'dark';

  if (hideBottomNav) {
    return null;
  }

  const tabs = [
    {
      id: 0,
      labelAr: 'الطلبات',
      labelEn: 'Orders',
      fullLabelAr: 'طلبات البيع',
      fullLabelEn: 'Sales Orders',
      icon: ClipboardList,
      isFab: false
    },
    {
      id: 1,
      labelAr: 'الفواتير',
      labelEn: 'Invoices',
      fullLabelAr: 'فواتير المبيعات',
      fullLabelEn: 'Sales Invoices',
      icon: FileText,
      isFab: false
    },
    {
      id: 2,
      labelAr: 'نقطة بيع',
      labelEn: 'POS',
      fullLabelAr: 'نقطة البيع المباشر',
      fullLabelEn: 'Point of Sale',
      icon: Store,
      isFab: true
    },
    {
      id: 3,
      labelAr: 'المرتجعات',
      labelEn: 'Returns',
      fullLabelAr: 'المرتجعات ومذكرات الائتمان',
      fullLabelEn: 'Returns & Credit Notes',
      icon: RotateCcw,
      isFab: false
    },
    {
      id: 4,
      labelAr: 'حسابي',
      labelEn: 'My Account',
      fullLabelAr: 'حساب المندوب والتحصيلات',
      fullLabelEn: 'Representative & Cash',
      icon: UserCheck,
      isFab: false
    }
  ];

  return (
    <nav
      id="eda50-bottom-nav"
      className={`shrink-0 h-16 border-t px-2 select-none transition-colors ${
        isDark ? 'bg-[#1C1F24] border-[#333842]' : 'bg-white border-gray-200 shadow-md'
      }`}
    >
      <div className="w-full h-full flex items-center justify-between gap-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          if (tab.isFab) {
            return (
              <button
                key={tab.id}
                id={`bottom-nav-tab-${tab.id}`}
                onClick={() => {
                  soundService.playClick();
                  setActiveTab(tab.id);
                }}
                className="flex-1 flex flex-col items-center justify-center h-full py-1 min-w-[52px] min-h-[48px] focus:outline-none active:scale-95 transition-transform"
                title={language === 'ar' ? tab.fullLabelAr : tab.fullLabelEn}
                aria-label={language === 'ar' ? tab.fullLabelAr : tab.fullLabelEn}
              >
                <div
                  className={`w-11 h-8 rounded-xl flex items-center justify-center transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md ring-2 ring-blue-400'
                      : isDark
                      ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'
                      : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span
                  className={`text-[10px] font-bold mt-0.5 whitespace-nowrap ${
                    isActive
                      ? isDark ? 'text-blue-400' : 'text-blue-600'
                      : isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}
                >
                  {language === 'ar' ? tab.labelAr : tab.labelEn}
                </span>
              </button>
            );
          }

          return (
            <button
              key={tab.id}
              id={`bottom-nav-tab-${tab.id}`}
              onClick={() => {
                soundService.playClick();
                setActiveTab(tab.id);
              }}
              className={`flex-1 flex flex-col items-center justify-center h-full py-1 min-w-[48px] min-h-[48px] transition-all active:scale-95 ${
                isActive
                  ? isDark ? 'text-blue-400' : 'text-blue-600'
                  : isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-900'
              }`}
              title={language === 'ar' ? tab.fullLabelAr : tab.fullLabelEn}
              aria-label={language === 'ar' ? tab.fullLabelAr : tab.fullLabelEn}
            >
              <div
                className={`relative px-3 py-1 rounded-xl transition-colors ${
                  isActive ? (isDark ? 'bg-blue-500/15' : 'bg-blue-50') : ''
                }`}
              >
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
              </div>
              <span
                className={`text-[10px] font-medium tracking-tight truncate max-w-full px-0.5 mt-0.5 whitespace-nowrap ${
                  isActive ? 'font-bold' : ''
                }`}
              >
                {language === 'ar' ? tab.labelAr : tab.labelEn}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
