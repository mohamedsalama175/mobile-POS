import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { soundService } from '../../services/sound';
import { Lock, Scan, CheckCircle2, User, KeyRound, X } from 'lucide-react';
import { UserSession } from '../../types';

export const PinLockModal: React.FC = () => {
  const { isPinOpen, setIsPinOpen, currentUser, setCurrentUser, language, theme, showToast } = useApp();
  const [pin, setPin] = useState('');
  const isDark = theme === 'dark';

  if (!isPinOpen) return null;

  const users: UserSession[] = [
    {
      username: 'sa',
      displayName: 'SA (Super Admin)',
      displayNameEn: 'SA (Super Admin)',
      badgeNumber: 'SA-901',
      role: 'super_admin',
      defaultBranch: 'الفرع الرئيسي (SA)',
      defaultWarehouse: 'المستودع الرئيسي - المنطقة الصناعية'
    },
    {
      username: 'ahmed',
      displayName: 'أحمد مصطفى (مندوب توزيع 1)',
      displayNameEn: 'Ahmed Mostafa (Sales Rep 1)',
      badgeNumber: 'REP-404',
      role: 'sales_rep',
      defaultBranch: 'فرع الرياض / القاهرة',
      defaultWarehouse: 'مستودع التوزيع السريع - الفرع الجنوبي'
    },
    {
      username: 'mahmoud',
      displayName: 'محمود الشريف (مندوب جملة)',
      displayNameEn: 'Mahmoud El-Sherif (Wholesale Rep)',
      badgeNumber: 'REP-505',
      role: 'sales_rep',
      defaultBranch: 'الفرع الرئيسي (SA)',
      defaultWarehouse: 'مستودع الأمانات والتحميل'
    }
  ];

  const handleDigit = (digit: string) => {
    soundService.playClick();
    if (pin.length < 4) {
      const nextPin = pin + digit;
      setPin(nextPin);
      if (nextPin.length === 4) {
        soundService.playScanSuccess();
        setTimeout(() => {
          setIsPinOpen(false);
          setPin('');
          showToast(
            language === 'ar' ? `مرحباً بك: ${currentUser.displayName}` : `Welcome: ${currentUser.displayNameEn}`,
            'success'
          );
        }, 150);
      }
    }
  };

  const handleBackspace = () => {
    soundService.playClick();
    setPin(prev => prev.slice(0, -1));
  };

  const handleSwitchUser = (u: UserSession) => {
    soundService.playScanSuccess();
    setCurrentUser(u);
    showToast(
      language === 'ar' ? `تم تبديل المستخدم إلى: ${u.displayName}` : `Switched user to: ${u.displayNameEn}`,
      'info'
    );
  };

  return (
    <div
      id="eda50-pin-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-sm select-none"
    >
      <div
        className={`w-full max-w-xs rounded-2xl border shadow-2xl flex flex-col overflow-hidden ${
          isDark ? 'bg-[#1C1F24] border-[#333842] text-[#F5F6F7]' : 'bg-white border-slate-300 text-slate-900'
        }`}
      >
        {/* Top Header */}
        <div className={`p-3 border-b flex items-center justify-between ${
          isDark ? 'border-[#333842] bg-[#262A31]' : 'border-slate-200 bg-slate-100'
        }`}>
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-bold">
              {language === 'ar' ? 'تبديل وردية الجهاز (EDA50)' : 'Shift Handover & PIN Lock'}
            </h3>
          </div>
          <button
            onClick={() => setIsPinOpen(false)}
            className={`p-1 transition-colors ${
              isDark ? 'text-gray-400 hover:text-white' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current Active User Card */}
        <div className={`p-3 border-b ${
          isDark ? 'bg-[#121417] border-[#333842]' : 'bg-slate-50 border-slate-200'
        }`}>
          <span className={`text-[10px] block mb-1 ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
            {language === 'ar' ? 'المستخدم الحالي بالجهاز:' : 'Current Device Operator:'}
          </span>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xs shadow-sm">
                {currentUser.username.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <div className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {language === 'ar' ? currentUser.displayName : currentUser.displayNameEn}
                </div>
                <div className={`text-[10px] font-mono ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                  {currentUser.defaultBranch}
                </div>
              </div>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-500 font-bold">
              {currentUser.badgeNumber}
            </span>
          </div>
        </div>

        {/* PIN Entry Indicators */}
        <div className="p-4 flex flex-col items-center">
          <p className={`text-xs mb-3 text-center ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
            {language === 'ar' ? 'أدخل الرمز السري (4 أرقام) للمتابعة' : 'Enter 4-digit PIN'}
          </p>
          <div className="flex items-center gap-3 mb-4">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={`w-3.5 h-3.5 rounded-full border-2 transition-all ${
                  pin.length > i
                    ? 'bg-blue-500 border-blue-400 scale-110 shadow-[0_0_8px_rgba(59,130,246,0.8)]'
                    : isDark ? 'border-gray-500 bg-transparent' : 'border-slate-300 bg-slate-100'
                }`}
              />
            ))}
          </div>

          {/* Keypad Grid (Thumb & glove friendly 48-56dp) */}
          <div className="grid grid-cols-3 gap-2 w-full max-w-[220px]">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
              <button
                key={digit}
                type="button"
                onClick={() => handleDigit(digit)}
                className={`h-12 rounded-xl text-base font-bold font-mono border active:scale-95 transition-all ${
                  isDark
                    ? 'bg-[#262A31] border-[#333842] text-white hover:bg-[#333842]'
                    : 'bg-slate-100 border-slate-300 text-slate-800 hover:bg-slate-200'
                }`}
              >
                {digit}
              </button>
            ))}
            <button
              type="button"
              onClick={handleBackspace}
              className={`h-12 rounded-xl text-xs font-bold border active:scale-95 transition-all flex items-center justify-center ${
                isDark ? 'bg-[#262A31] border-[#333842] text-gray-400' : 'bg-slate-100 border-slate-300 text-slate-600 hover:bg-slate-200'
              }`}
            >
              ⌫
            </button>
            <button
              type="button"
              onClick={() => handleDigit('0')}
              className={`h-12 rounded-xl text-base font-bold font-mono border active:scale-95 transition-all ${
                isDark
                  ? 'bg-[#262A31] border-[#333842] text-white hover:bg-[#333842]'
                  : 'bg-slate-100 border-slate-300 text-slate-800 hover:bg-slate-200'
              }`}
            >
              0
            </button>
            <button
              type="button"
              onClick={() => setPin('1234')}
              className={`h-12 rounded-xl text-[10px] font-bold border active:scale-95 transition-all flex items-center justify-center text-blue-500 ${
                isDark ? 'bg-[#262A31] border-[#333842]' : 'bg-slate-100 border-slate-300 hover:bg-slate-200'
              }`}
              title="Auto PIN"
            >
              PIN
            </button>
          </div>
        </div>

        {/* Quick Shift Handover (Switch representative) */}
        <div className={`p-3 border-t ${
          isDark ? 'border-[#333842] bg-[#1E2228]' : 'border-slate-200 bg-slate-50'
        }`}>
          <span className={`text-[10px] font-semibold block mb-2 ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
            {language === 'ar' ? 'تبديل سريع للموظف (تسليم الوردية):' : 'Quick Shift Handover:'}
          </span>
          <div className="space-y-1">
            {users.map((u) => (
              <button
                key={u.username}
                type="button"
                onClick={() => handleSwitchUser(u)}
                className={`w-full p-1.5 rounded-lg text-left text-xs flex items-center justify-between border transition-colors ${
                  currentUser.username === u.username
                    ? 'border-blue-500 bg-blue-500/10 text-blue-500 font-bold'
                    : isDark ? 'border-transparent text-gray-300 hover:bg-[#262A31]' : 'border-transparent text-slate-700 hover:bg-slate-200'
                }`}
              >
                <span className="truncate">{language === 'ar' ? u.displayName : u.displayNameEn}</span>
                <span className={`text-[10px] font-mono ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>{u.badgeNumber}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
