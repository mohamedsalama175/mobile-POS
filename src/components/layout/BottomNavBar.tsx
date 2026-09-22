import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  ClipboardList,
  RotateCcw,
  FileText,
  CreditCard,
  Store
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
      icon: ClipboardList
    },
    {
      id: 1,
      labelAr: 'المرتجعات',
      labelEn: 'Returns',
      fullLabelAr: 'مرتجعات طلبات البيع',
      fullLabelEn: 'Sales Returns',
      icon: RotateCcw
    },
    {
      id: 2,
      labelAr: 'الفواتير',
      labelEn: 'Invoices',
      fullLabelAr: 'فواتير طلبات البيع',
      fullLabelEn: 'Sales Invoices',
      icon: FileText
    },
    {
      id: 3,
      labelAr: 'مذكرات',
      labelEn: 'Credit',
      fullLabelAr: 'مذكرات الائتمان',
      fullLabelEn: 'Credit Notes',
      icon: CreditCard
    },
    {
      id: 4,
      labelAr: 'نقطة البيع',
      labelEn: 'POS',
      fullLabelAr: 'عمليات نقطة البيع',
      fullLabelEn: 'Point of Sale',
      icon: Store
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

        return (
          <button
            key={tab.id}
            id={`bottom-nav-tab-${tab.id}`}
            onClick={() => {
              soundService.playClick();
              setActiveTab(tab.id);
            }}
            className={`flex-1 flex flex-col items-center justify-center h-full py-1 min-w-0 transition-all active:scale-95 ${
              isActive
                ? isDark ? 'text-[#3B82F6]' : 'text-[#1F242F]'
                : isDark ? 'text-[#9AA1AC] hover:text-gray-200' : 'text-gray-400 hover:text-gray-700'
            }`}
            title={language === 'ar' ? tab.fullLabelAr : tab.fullLabelEn}
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
