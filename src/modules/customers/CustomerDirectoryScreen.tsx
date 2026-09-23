import React, { useState } from 'react';
import { useCustomers } from './hooks/useCustomers';
import { Customer } from '../../types';
import { useApp } from '../../context/AppContext';
import { ListItem } from '../../components/ui/ListItem';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { LoadingState, EmptyState, ErrorState } from '../../components/ui/StateView';
import { CustomerFormDrawer } from './components/CustomerFormDrawer';
import {
  Users,
  Search,
  Plus,
  Edit3,
  Phone,
  Building2,
  CreditCard,
  AlertTriangle
} from 'lucide-react';

export const CustomerDirectoryScreen: React.FC = () => {
  const { language, showToast } = useApp();
  const isRtl = language === 'ar';

  const {
    customers,
    searchQuery,
    setSearchQuery,
    loading,
    error,
    refresh,
    createCustomer,
    updateCustomer,
  } = useCustomers();

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  const handleOpenAdd = () => {
    setEditingCustomer(null);
    setIsDrawerOpen(true);
  };

  const handleOpenEdit = (cust: Customer) => {
    setEditingCustomer(cust);
    setIsDrawerOpen(true);
  };

  const handleSaveCustomer = async (data: any) => {
    if (editingCustomer) {
      await updateCustomer(data);
      showToast(
        isRtl ? 'تم تحديث بيانات العميل في IndexedDB بنجاح' : 'Customer updated in IndexedDB',
        'success'
      );
    } else {
      await createCustomer(data);
      showToast(
        isRtl ? 'تمت إضافة العميل الجديد إلى IndexedDB بنجاح' : 'New customer added to IndexedDB',
        'success'
      );
    }
  };

  // Compute initials for the avatar
  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="w-full max-w-screen-xl mx-auto p-3 sm:p-5 space-y-4 select-none">
      {/* 1. Header Bar: Title, Count, Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-gray-200/80 dark:border-[#2D333F]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100">
                {isRtl ? 'دليل العملاء' : 'Customer Directory'}
              </h1>
              <Badge variant="primary" size="sm">
                {customers.length} {isRtl ? 'عميل' : 'customers'}
              </Badge>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {isRtl
                ? 'إدارة حسابات العملاء وحدود الائتمان والأرصدة دون اتصال (IndexedDB)'
                : 'Offline customer ledger, credit limits, and balances powered by IndexedDB'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="primary"
            size="md"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={handleOpenAdd}
          >
            {isRtl ? 'إضافة عميل جديد' : 'New Customer'}
          </Button>
        </div>
      </div>

      {/* 2. Search Bar */}
      <div className="flex items-center gap-2.5">
        <Input
          placeholder={
            isRtl
              ? 'ابحث باسم العميل، رقم الهاتف، الرقم الضريبي، أو الفرع...'
              : 'Search by customer name, phone, tax ID, or branch...'
          }
          leftIcon={<Search className="w-4 h-4" />}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* 3. Main List with States */}
      <div className="w-full min-h-[300px]">
        {loading ? (
          <LoadingState count={6} />
        ) : error ? (
          <ErrorState message={error} onRetry={refresh} />
        ) : customers.length === 0 ? (
          <EmptyState
            icon={<Users className="w-7 h-7" />}
            title={
              searchQuery
                ? isRtl
                  ? `لا توجد نتائج مطابقة لـ "${searchQuery}"`
                  : `No customers matching "${searchQuery}"`
                : isRtl
                ? 'لا يوجد عملاء مسجلون حتى الآن'
                : 'No registered customers yet'
            }
            description={
              isRtl
                ? 'يمكنك تسجيل عميل جديد الآن مع تحديد حد الائتمان والشروط المالية.'
                : 'Add a new customer profile with credit limits and financial terms.'
            }
            actionText={isRtl ? 'إضافة عميل جديد' : 'Add New Customer'}
            onAction={handleOpenAdd}
          />
        ) : (
          <div className="space-y-2">
            {customers.map((cust) => {
              const isOverLimit = cust.creditLimit > 0 && cust.currentBalance > cust.creditLimit;
              return (
                <ListItem
                  key={cust.id}
                  onClick={() => handleOpenEdit(cust)}
                  start={
                    <div className="w-12 h-12 rounded-xl border border-gray-200/90 dark:border-[#333842] bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 font-bold text-sm flex items-center justify-center shrink-0 shadow-xs">
                      {getInitials(cust.name)}
                    </div>
                  }
                  title={
                    <div className="flex items-center gap-2">
                      <span>{cust.name}</span>
                      {isOverLimit && (
                        <Badge variant="danger" size="sm" dot>
                          {isRtl ? 'تجاوز حد الائتمان' : 'Over Limit'}
                        </Badge>
                      )}
                    </div>
                  }
                  subtitle={
                    <>
                      <span className="font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
                        <Phone className="w-3 h-3 text-gray-400" />
                        <span>{cust.phone}</span>
                      </span>
                      {cust.branchName && (
                        <>
                          <span className="text-gray-300 dark:text-gray-600">•</span>
                          <span>{cust.branchName}</span>
                        </>
                      )}
                      {cust.taxNumber && (
                        <>
                          <span className="text-gray-300 dark:text-gray-600">•</span>
                          <span className="font-mono text-[11px] text-gray-400">
                            ض: {cust.taxNumber.slice(-6)}
                          </span>
                        </>
                      )}
                    </>
                  }
                  trailingTop={
                    <span className={cust.currentBalance > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}>
                      {cust.currentBalance.toFixed(2)} {isRtl ? 'ر.س' : 'SAR'}
                    </span>
                  }
                  trailingBottom={`حد: ${cust.creditLimit.toLocaleString()} ${isRtl ? 'ر.س' : 'SAR'}`}
                  trailingAction={
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenEdit(cust);
                      }}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                      title={isRtl ? 'تعديل بيانات العميل' : 'Edit Customer'}
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  }
                />
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Responsive Customer Form Drawer (Add / Edit) */}
      <CustomerFormDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        customer={editingCustomer}
        onSave={handleSaveCustomer}
        language={language}
      />
    </div>
  );
};
