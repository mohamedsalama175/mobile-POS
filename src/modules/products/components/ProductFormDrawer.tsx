import React, { useState, useEffect } from 'react';
import { ProductItem } from '../../../types';
import { ModalDrawer } from '../../../components/ui/ModalDrawer';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Button } from '../../../components/ui/Button';
import { Barcode, DollarSign, Package, MapPin, Image as ImageIcon } from 'lucide-react';

export interface ProductFormDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  product?: ProductItem | null;
  categories: string[];
  onSave: (product: any) => Promise<void>;
  language: 'ar' | 'en';
}

export const ProductFormDrawer: React.FC<ProductFormDrawerProps> = ({
  isOpen,
  onClose,
  product,
  categories,
  onSave,
  language,
}) => {
  const isRtl = language === 'ar';
  const isEditing = Boolean(product);

  const [formData, setFormData] = useState({
    name: '',
    nameEn: '',
    code: '',
    barcode: '',
    category: '',
    unit: 'حبة',
    unitEn: 'Piece',
    unitPrice: 0,
    availableQty: 100,
    shelfNumber: 'A-01-01',
    imageUrl: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        nameEn: product.nameEn || '',
        code: product.code || '',
        barcode: product.barcode || '',
        category: product.category || (categories[0] || 'شيبسي ومقرمشات'),
        unit: product.unit || 'حبة',
        unitEn: product.unitEn || 'Piece',
        unitPrice: product.unitPrice || 0,
        availableQty: product.availableQty ?? 100,
        shelfNumber: product.shelfNumber || 'A-01-01',
        imageUrl: product.imageUrl || '',
      });
    } else {
      setFormData({
        name: '',
        nameEn: '',
        code: String(Math.floor(1000 + Math.random() * 9000)),
        barcode: String(628100000000 + Math.floor(Math.random() * 999999)),
        category: categories[0] || 'شيبسي ومقرمشات',
        unit: 'كرتونة',
        unitEn: 'Carton',
        unitPrice: 150,
        availableQty: 50,
        shelfNumber: 'S-01-01',
        imageUrl: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=300&auto=format&fit=crop&q=80',
      });
    }
    setErrors({});
  }, [product, isOpen, categories]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) {
      newErrors.name = isRtl ? 'اسم الصنف مطلوب' : 'Product name is required';
    }
    if (!formData.code.trim()) {
      newErrors.code = isRtl ? 'كود الصنف مطلوب' : 'Item code is required';
    }
    if (!formData.barcode.trim()) {
      newErrors.barcode = isRtl ? 'الباركود مطلوب' : 'Barcode is required';
    }
    if (formData.unitPrice < 0) {
      newErrors.unitPrice = isRtl ? 'سعر البيع لا يمكن أن يكون سالباً' : 'Price cannot be negative';
    }
    if (formData.availableQty < 0) {
      newErrors.availableQty = isRtl ? 'الرصيد لا يمكن أن يكون سالباً' : 'Stock cannot be negative';
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
        ...(product ? { id: product.id } : {}),
        ...formData,
        unitPrice: Number(formData.unitPrice),
        availableQty: Number(formData.availableQty),
      });
      onClose();
    } catch (err: any) {
      setErrors({ form: err?.message || 'حدث خطأ أثناء حفظ الصنف' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const categoryOptions = categories.map((c) => ({ value: c, label: c }));

  return (
    <ModalDrawer
      isOpen={isOpen}
      onClose={onClose}
      title={
        isEditing
          ? isRtl
            ? 'تعديل بيانات الصنف'
            : 'Edit Product Details'
          : isRtl
          ? 'إضافة صنف جديد للكتالوج'
          : 'Add New Product to Catalog'
      }
      description={
        isRtl
          ? 'تُحفظ البيانات محلياً في IndexedDB مع مزامنة سحابية تلقائية'
          : 'Saved locally to IndexedDB with automatic cloud sync'
      }
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errors.form && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 text-xs font-bold">
            {errors.form}
          </div>
        )}

        {/* Primary Name & English Name */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label={isRtl ? 'اسم الصنف (بالعربية)' : 'Product Name (Arabic)'}
            required
            placeholder={isRtl ? 'مثال: شيبسي بالملح عائلي' : 'e.g. Chipsy Salt Family'}
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            error={errors.name}
          />
          <Input
            label={isRtl ? 'الاسم بالإنجليزية (اختياري)' : 'English Name (Optional)'}
            placeholder="e.g. Chipsy Salt Family"
            value={formData.nameEn}
            onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
          />
        </div>

        {/* Code & Barcode */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label={isRtl ? 'كود الصنف (SKU)' : 'Item Code (SKU)'}
            required
            placeholder="e.g. 2001"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            error={errors.code}
          />
          <Input
            label={isRtl ? 'رقم الباركود' : 'Barcode Number'}
            required
            leftIcon={<Barcode className="w-4 h-4" />}
            placeholder="e.g. 628100123456"
            value={formData.barcode}
            onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
            error={errors.barcode}
          />
        </div>

        {/* Category & Packaging Unit */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {categoryOptions.length > 0 ? (
            <Select
              label={isRtl ? 'التصنيف / الفئة' : 'Category'}
              options={categoryOptions}
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            />
          ) : (
            <Input
              label={isRtl ? 'التصنيف / الفئة' : 'Category'}
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            />
          )}

          <Input
            label={isRtl ? 'وحدة القياس / العبوة' : 'Packaging Unit'}
            placeholder={isRtl ? 'مثال: كرتونة (24 كيس)' : 'e.g. Carton (24 bags)'}
            value={formData.unit}
            onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
          />
        </div>

        {/* Price & Available Stock */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input
            type="number"
            step="0.01"
            min="0"
            label={isRtl ? 'سعر البيع (ج.م)' : 'Unit Price (EGP)'}
            required
            leftIcon={<DollarSign className="w-4 h-4" />}
            value={formData.unitPrice}
            onChange={(e) => setFormData({ ...formData, unitPrice: parseFloat(e.target.value) || 0 })}
            error={errors.unitPrice}
          />

          <Input
            type="number"
            step="1"
            min="0"
            label={isRtl ? 'الرصيد المتاح' : 'Available Stock'}
            required
            leftIcon={<Package className="w-4 h-4" />}
            value={formData.availableQty}
            onChange={(e) => setFormData({ ...formData, availableQty: parseInt(e.target.value) || 0 })}
            error={errors.availableQty}
          />

          <Input
            label={isRtl ? 'رقم الرف / الموقع' : 'Shelf / Location'}
            leftIcon={<MapPin className="w-4 h-4" />}
            placeholder="e.g. S-01-01"
            value={formData.shelfNumber}
            onChange={(e) => setFormData({ ...formData, shelfNumber: e.target.value })}
          />
        </div>

        {/* Image URL with live preview */}
        <div>
          <Input
            label={isRtl ? 'رابط صورة المنتج (URL)' : 'Product Image URL'}
            leftIcon={<ImageIcon className="w-4 h-4" />}
            placeholder="https://..."
            value={formData.imageUrl}
            onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
          />
          {formData.imageUrl && (
            <div className="mt-2 flex items-center gap-2 p-2 rounded-xl border border-gray-200 dark:border-[#2D333F] bg-gray-50 dark:bg-[#121417]">
              <img
                src={formData.imageUrl}
                alt="Preview"
                className="w-12 h-12 object-contain rounded-lg border border-gray-200 dark:border-[#333842] bg-white dark:bg-[#16181D]"
                onError={(e) => (e.currentTarget.style.display = 'none')}
              />
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {isRtl ? 'معاينة صورة الصنف' : 'Image Preview'}
              </span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-100 dark:border-[#2D333F]">
          <Button type="button" variant="outline" size="md" onClick={onClose}>
            {isRtl ? 'إلغاء' : 'Cancel'}
          </Button>
          <Button type="submit" variant="primary" size="md" isLoading={isSubmitting}>
            {isEditing
              ? isRtl
                ? 'حفظ التعديلات'
                : 'Save Changes'
              : isRtl
              ? 'إضافة الصنف الآن'
              : 'Add Product Now'}
          </Button>
        </div>
      </form>
    </ModalDrawer>
  );
};
