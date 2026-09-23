import React, { useState, useEffect } from 'react';
import { Customer } from '../../../types';
import { ModalDrawer } from '../../../components/ui/ModalDrawer';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Button } from '../../../components/ui/Button';
import { Building2, Phone, CreditCard, DollarSign, FileText } from 'lucide-react';

export interface CustomerFormDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  customer?: Customer | null;
  onSave: (customer: any) => Promise<void>;
  language: 'ar' | 'en';
}

export const CustomerFormDrawer: React.FC<CustomerFormDrawerProps> = ({
  isOpen,
  onClose,
  customer,
  onSave,
  language,
}) => {
  const isRtl = language === 'ar';
  const isEditing = Boolean(customer);

  const [formData, setFormData] = useState({
    name: '',
    taxNumber: '',
    phone: '',
    creditLimit: 25000,
    currentBalance: 0,
    branchName: 'الفرع الرئيسي',
    cardNumber: '',
    paymentTerms: 'credit_30' as 'cash' | 'credit_30' | 'credit_60',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (customer) {
      setFormData({
        name: customer.name || '',
        taxNumber: customer.taxNumber || '',
        phone: customer.phone || '',
        creditLimit: customer.creditLimit ?? 25000,
        currentBalance: customer.currentBalance ?? 0,
        branchName: customer.branchName || 'الفرع الرئيسي',
        cardNumber: customer.cardNumber || '',
        paymentTerms: (customer as any).paymentTerms || 'credit_30',
      });
    } else {
      setFormData({
        name: '',
        taxNumber: '300' + String(Math.floor(100000000000 + Math.random() * 900000000000)),
        phone: '05' + String(Math.floor(10000000 + Math.random() * 90000000)),
        creditLimit: 30000,
        currentBalance: 0,
        branchName: 'الفرع الرئيسي',
        cardNumber: 'CRD-' + String(Math.floor(1000 + Math.random() * 9000)),
        paymentTerms: 'credit_30',
      });
    }
    setErrors({});
  }, [customer, isOpen]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) {
      newErrors.name = isRtl ? 'اسم العميل / المنشأة مطلوب' : 'Customer name is required';
    }
    if (!formData.phone.trim()) {
      newErrors.phone = isRtl ? 'رقم الهاتف مطلوب' : 'Phone number is required';
    }
    if (formData.creditLimit < 0) {
      newErrors.creditLimit = isRtl ? 'حد الائتمان لا يمكن أن يكون سالباً' : 'Credit limit cannot be negative';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setIsSubmitting(true);
      await onSave({
        ...(customer ? { id: customer.id } : {}),
        ...formData,
        creditLimit: Number(formData.creditLimit),
        currentBalance: Number(formData.currentBalance),
      });
      onClose();
    } catch (err: any) {
      setErrors({ form: err?.message || 'حدث خطأ أثناء حفظ بيانات العميل' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const paymentTermsOptions = [
    { value: 'cash', label: isRtl ? 'نقدي فوري (Cash)' : 'Cash on Delivery' },
    { value: 'credit_30', label: isRtl ? 'آجل 30 يوماً (Net 30)' : 'Net 30 Days' },
    { value: 'credit_60', label: isRtl ? 'آجل 60 يوماً (Net 60)' : 'Net 60 Days' },
  ];

  return (
    <ModalDrawer
      isOpen={isOpen}
      onClose={onClose}
      title={
        isEditing
          ? isRtl
            ? 'تعديل بيانات العميل'
            : 'Edit Customer Details'
          : isRtl
          ? 'إضافة عميل جديد'
          : 'Add New Customer'
      }
      description={
        isRtl
          ? 'تسجيل حساب عميل مع فحص حد الائتمان والمزامنة المحلية في IndexedDB'
          : 'Register customer account with credit check & local IndexedDB sync'
      }
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errors.form && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 text-xs font-bold">
            {errors.form}
          </div>
        )}

        {/* Customer Name & Branch */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label={isRtl ? 'اسم العميل / المنشأة' : 'Customer Name / Entity'}
            required
            leftIcon={<Building2 className="w-4 h-4" />}
            placeholder={isRtl ? 'مثال: مؤسسة النور للتجارة' : 'e.g. Al Noor Trading Co.'}
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            error={errors.name}
          />

          <Input
            label={isRtl ? 'اسم الفرع / الموقع' : 'Branch Name / Location'}
            placeholder={isRtl ? 'مثال: فرع المروج' : 'e.g. Al-Morouj Branch'}
            value={formData.branchName}
            onChange={(e) => setFormData({ ...formData, branchName: e.target.value })}
          />
        </div>

        {/* Phone & Tax Number */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label={isRtl ? 'رقم الهاتف / الجوال' : 'Phone Number'}
            required
            leftIcon={<Phone className="w-4 h-4" />}
            placeholder="05XXXXXXXX"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            error={errors.phone}
          />

          <Input
            label={isRtl ? 'الرقم الضريبي (15 رقم)' : 'Tax Number (15 digits)'}
            leftIcon={<FileText className="w-4 h-4" />}
            placeholder="300XXXXXXXXXXXX"
            value={formData.taxNumber}
            onChange={(e) => setFormData({ ...formData, taxNumber: e.target.value })}
          />
        </div>

        {/* Credit Limit & Current Balance */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            type="number"
            min="0"
            step="1000"
            label={isRtl ? 'حد الائتمان (ر.س)' : 'Credit Limit (SAR)'}
            required
            leftIcon={<DollarSign className="w-4 h-4" />}
            value={formData.creditLimit}
            onChange={(e) => setFormData({ ...formData, creditLimit: parseFloat(e.target.value) || 0 })}
            error={errors.creditLimit}
          />

          <Input
            type="number"
            step="0.01"
            label={isRtl ? 'الرصيد الافتتاحي / الحالي (ر.س)' : 'Current Balance (SAR)'}
            leftIcon={<DollarSign className="w-4 h-4" />}
            value={formData.currentBalance}
            onChange={(e) => setFormData({ ...formData, currentBalance: parseFloat(e.target.value) || 0 })}
          />
        </div>

        {/* Card Number & Payment Terms */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label={isRtl ? 'رقم بطاقة العميل (NFC / Barcode)' : 'Customer Card ID (NFC / Barcode)'}
            leftIcon={<CreditCard className="w-4 h-4" />}
            placeholder="CRD-XXXX"
            value={formData.cardNumber}
            onChange={(e) => setFormData({ ...formData, cardNumber: e.target.value })}
          />

          <Select
            label={isRtl ? 'شروط السداد المعتمدة' : 'Payment Terms'}
            options={paymentTermsOptions}
            value={formData.paymentTerms}
            onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value as any })}
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-100 dark:border-[#2D333F]">
          <Button type="button" variant="outline" size="md" onClick={onClose}>
            {isRtl ? 'إلغاء' : 'Cancel'}
          </Button>
          <Button type="submit" variant="primary" size="md" isLoading={isSubmitting}>
            {isEditing
              ? isRtl
                ? 'حفظ بيانات العميل'
                : 'Save Customer'
              : isRtl
              ? 'تسجيل العميل الآن'
              : 'Register Customer'}
          </Button>
        </div>
      </form>
    </ModalDrawer>
  );
};
