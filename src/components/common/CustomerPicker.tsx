import React, { useState, useEffect } from 'react';
import { Customer } from '../../types';
import { storageService } from '../../services/storage';
import { useApp } from '../../context/AppContext';
import { Search, UserCheck, AlertTriangle, ChevronDown, X } from 'lucide-react';

interface CustomerPickerProps {
  selectedCustomer: Customer | null;
  onSelectCustomer: (cust: Customer) => void;
  isReadOnly?: boolean;
}

export const CustomerPicker: React.FC<CustomerPickerProps> = ({
  selectedCustomer,
  onSelectCustomer,
  isReadOnly = false
}) => {
  const { language, theme } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const isDark = theme === 'dark';

  useEffect(() => {
    setCustomers(storageService.getCustomers());
  }, []);

  const filteredCustomers = customers.filter((c) => {
    const term = searchTerm.toLowerCase();
    return (
      c.name.toLowerCase().includes(term) ||
      c.taxNumber.includes(term) ||
      c.phone.includes(term)
    );
  });

  const isOverCreditLimit =
    selectedCustomer &&
    selectedCustomer.creditLimit < 9999999 &&
    selectedCustomer.currentBalance >= selectedCustomer.creditLimit;

  const isNearCreditLimit =
    selectedCustomer &&
    selectedCustomer.creditLimit < 9999999 &&
    !isOverCreditLimit &&
    selectedCustomer.currentBalance / selectedCustomer.creditLimit >= 0.85;

  return (
    <div className="space-y-3">
      {/* Customer search & select trigger */}
      {!isReadOnly && (
        <div className="relative">
          <label className="block text-xs font-semibold text-[#9AA1AC] mb-1">
            {language === 'ar' ? 'البحث عن عميل / الرقم الضريبي *' : 'Search Customer / Tax Number *'}
          </label>
          <div className="relative">
            <input
              id="customer-search-input"
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setIsOpen(true);
              }}
              onFocus={() => setIsOpen(true)}
              placeholder={
                language === 'ar'
                  ? 'اكتب اسم العميل، الرقم الضريبي، أو رقم الهاتف...'
                  : 'Search by name, tax number, or phone...'
              }
              className={`w-full h-12 pl-10 pr-10 text-sm rounded-xl border outline-none transition-colors ${
                isDark
                  ? 'bg-[#1C1F24] border-[#333842] text-[#F5F6F7] focus:border-blue-500'
                  : 'bg-white border-gray-200 text-gray-900 focus:border-[#252B37]'
              }`}
            />
            <Search className={`w-5 h-5 absolute ${language === 'ar' ? 'right-3' : 'left-3'} top-3.5 text-gray-400 pointer-events-none`} />

            {searchTerm && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setIsOpen(false);
                }}
                className={`absolute ${language === 'ar' ? 'left-3' : 'right-3'} top-3.5 text-gray-400 hover:text-white`}
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Dropdown list */}
          {isOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setIsOpen(false)} />
              <div
                id="customer-dropdown-results"
                className={`absolute z-40 w-full mt-1.5 max-h-56 overflow-y-auto rounded-xl border shadow-xl ${
                  isDark ? 'bg-[#1C1F24] border-[#333842]' : 'bg-white border-gray-200'
                }`}
              >
                {filteredCustomers.length === 0 ? (
                  <div className="p-3 text-center text-xs text-gray-400">
                    {language === 'ar' ? 'لا يوجد عملاء مطابقين' : 'No matching customers found'}
                  </div>
                ) : (
                  filteredCustomers.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        onSelectCustomer(c);
                        setSearchTerm('');
                        setIsOpen(false);
                      }}
                      className={`w-full text-left p-3 border-b transition-colors flex items-center justify-between ${
                        isDark
                          ? 'border-[#262A31] hover:bg-[#262A31] text-gray-200'
                          : 'border-gray-100 hover:bg-gray-50 text-gray-800'
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className="font-semibold text-xs truncate">{c.name}</div>
                        <div className="text-[11px] text-gray-400 flex items-center gap-2 mt-0.5 font-mono">
                          <span>{c.taxNumber}</span>
                          <span>•</span>
                          <span>{c.phone}</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[10px] text-gray-400 block">
                          {language === 'ar' ? 'الحد:' : 'Limit:'}
                        </span>
                        <span className="text-xs font-mono font-bold text-blue-400">
                          {c.creditLimit >= 9999999 ? '∞' : c.creditLimit.toLocaleString()}
                        </span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Auto-filled read-only customer details card (Matching web mockups) */}
      {selectedCustomer && (
        <div
          id="customer-details-card"
          className={`p-3 rounded-xl border transition-colors ${
            isDark ? 'bg-[#1C1F24] border-[#333842]' : 'bg-gray-50 border-gray-200'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className={`flex items-center gap-1.5 text-xs font-semibold ${isDark ? 'text-blue-400' : 'text-gray-900'}`}>
              <UserCheck className="w-4 h-4 text-emerald-600" />
              <span>{language === 'ar' ? 'العميل المحدد' : 'Selected Customer'}</span>
            </div>
            {selectedCustomer.cardNumber && (
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                isDark ? 'bg-blue-500/10 text-blue-400' : 'bg-gray-200 text-gray-700'
              }`}>
                {language === 'ar' ? `بطاقة: ${selectedCustomer.cardNumber}` : `Card: ${selectedCustomer.cardNumber}`}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-[11px] text-gray-500 block">
                {language === 'ar' ? 'اسم العميل' : 'Customer Name'}
              </span>
              <span className={`font-bold truncate block mt-0.5 ${isDark ? 'text-[#F5F6F7]' : 'text-gray-900'}`}>
                {selectedCustomer.name}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-gray-500 block">
                {language === 'ar' ? 'الرقم الضريبي' : 'Tax Number'}
              </span>
              <span className={`font-mono font-bold truncate block mt-0.5 ${isDark ? 'text-[#F5F6F7]' : 'text-gray-900'}`}>
                {selectedCustomer.taxNumber}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-gray-500 block">
                {language === 'ar' ? 'رقم الهاتف' : 'Phone Number'}
              </span>
              <span className={`font-mono block mt-0.5 ${isDark ? 'text-[#F5F6F7]' : 'text-gray-800'}`}>
                {selectedCustomer.phone}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-gray-500 block">
                {language === 'ar' ? 'الحد الائتماني' : 'Credit Limit'}
              </span>
              <span className={`font-mono font-bold block mt-0.5 ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
                {selectedCustomer.creditLimit >= 9999999
                  ? (language === 'ar' ? 'غير محدود (نقدي)' : 'Unlimited (Cash)')
                  : `${selectedCustomer.creditLimit.toLocaleString()} ر.س`}
              </span>
            </div>
          </div>

          {/* Credit Limit Warnings (§3.4) */}
          {isOverCreditLimit && (
            <div
              id="customer-credit-breach-warning"
              className="mt-2.5 p-2 rounded-lg bg-red-500/15 border border-red-500/40 text-red-400 flex items-start gap-2 text-xs"
            >
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">
                  {language === 'ar' ? 'تنبيه: تجاوز الحد الائتماني!' : 'Warning: Credit Limit Exceeded!'}
                </span>
                <span className="text-[11px] opacity-90 block">
                  {language === 'ar'
                    ? `رصيد العميل الحالي (${selectedCustomer.currentBalance.toLocaleString()}) يتجاوز الحد الائتماني المسموح به (${selectedCustomer.creditLimit.toLocaleString()}).`
                    : `Customer balance (${selectedCustomer.currentBalance.toLocaleString()}) exceeds approved limit (${selectedCustomer.creditLimit.toLocaleString()}).`}
                </span>
              </div>
            </div>
          )}

          {isNearCreditLimit && (
            <div
              id="customer-credit-near-warning"
              className="mt-2.5 p-2 rounded-lg bg-amber-500/15 border border-amber-500/40 text-amber-400 flex items-start gap-2 text-xs"
            >
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">
                  {language === 'ar' ? 'تنبيه: اقتراب من الحد الائتماني' : 'Notice: Near Credit Limit'}
                </span>
                <span className="text-[11px] opacity-90 block">
                  {language === 'ar'
                    ? `وصل العميل إلى ${Math.round((selectedCustomer.currentBalance / selectedCustomer.creditLimit) * 100)}% من الحد الائتماني المعتمد.`
                    : `Customer has reached ${Math.round((selectedCustomer.currentBalance / selectedCustomer.creditLimit) * 100)}% of limit.`}
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
