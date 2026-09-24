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
  const { activeTab, setActiveTab, language, theme } = useApp();
  const isDark = theme === 'dark';

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
      className={`sticky bottom-0 z-30 flex items-center justify-around h-16 border-t px-1 select-none transition-colors ${
        isDark ? 'bg-[#262A31] border-[#333842]' : 'bg-white border-[#E5E7EB]'
      }`}
    >
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
              className="relative -top-4 flex flex-col items-center justify-center min-w-[56px] min-h-[56px] focus:outline-none active:scale-95 transition-transform"
              title={language === 'ar' ? tab.fullLabelAr : tab.fullLabelEn}
              aria-label={language === 'ar' ? tab.fullLabelAr : tab.fullLabelEn}
            >
              <div
                className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all border-4 ${
                  isDark ? 'border-[#262A31]' : 'border-white'
                } ${
                  isActive
                    ? 'bg-gradient-to-tr from-blue-600 to-indigo-500 text-white ring-2 ring-blue-400 ring-offset-1'
                    : 'bg-gradient-to-tr from-blue-500 to-indigo-600 text-white hover:brightness-110'
                }`}
              >
                <Icon className="w-6 h-6" />
              </div>
              <span
                className={`text-[10px] font-bold mt-0.5 whitespace-nowrap ${
                  isActive
                    ? isDark ? 'text-blue-400' : 'text-blue-600'
                    : isDark ? 'text-gray-400' : 'text-gray-600'
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
            className={`flex-1 flex flex-col items-center justify-center h-full py-1 min-w-[44px] min-h-[44px] transition-all active:scale-95 ${
              isActive
                ? isDark ? 'text-[#3B82F6]' : 'text-[#1F242F]'
                : isDark ? 'text-[#9AA1AC] hover:text-gray-200' : 'text-gray-400 hover:text-gray-700'
            }`}
            title={language === 'ar' ? tab.fullLabelAr : tab.fullLabelEn}
            aria-label={language === 'ar' ? tab.fullLabelAr : tab.fullLabelEn}
          >
            <div className={`relative p-1 rounded-lg ${isActive ? (isDark ? 'bg-blue-500/15' : 'bg-gray-100') : ''}`}>
              <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
            </div>
            <span
              className={`text-[11px] font-medium tracking-tight truncate max-w-full px-0.5 mt-0.5 whitespace-nowrap ${
                isActive ? (isDark ? 'font-bold text-[#3B82F6]' : 'font-bold text-[#1F242F]') : ''
              }`}
            >
              {language === 'ar' ? tab.labelAr : tab.labelEn}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
