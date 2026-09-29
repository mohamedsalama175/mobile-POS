import React, { useState } from 'react';
import { useProducts } from './hooks/useProducts';
import { ProductItem } from '../../types';
import { useApp } from '../../context/AppContext';
import { ListItem } from '../../components/ui/ListItem';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { LoadingState, EmptyState, ErrorState } from '../../components/ui/StateView';
import { ItemThumbnail } from '../../components/common/ItemThumbnail';
import { ProductFormDrawer } from './components/ProductFormDrawer';
import { ProductCardGrid } from './components/ProductCardGrid';
import {
  Search,
  ScanBarcode,
  Plus,
  LayoutGrid,
  List,
  Edit3,
  Package,
  Layers,
  Sparkles
} from 'lucide-react';

export const ProductCatalogScreen: React.FC = () => {
  const { language, theme, showToast, openScanner } = useApp();
  const isRtl = language === 'ar';
  const isDark = theme === 'dark';

  const {
    products,
    categories,
    activeCategory,
    setActiveCategory,
    searchQuery,
    setSearchQuery,
    viewMode,
    setViewMode,
    loading,
    error,
    refresh,
    createProduct,
    updateProduct,
  } = useProducts();

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setIsDrawerOpen(true);
  };

  const handleOpenEdit = (prod: ProductItem) => {
    setEditingProduct(prod);
    setIsDrawerOpen(true);
  };

  const handleSaveProduct = async (productData: any) => {
    if (editingProduct) {
      await updateProduct(productData);
      showToast(
        isRtl ? 'تم تحديث بيانات الصنف في IndexedDB بنجاح' : 'Product updated in IndexedDB',
        'success'
      );
    } else {
      await createProduct(productData);
      showToast(
        isRtl ? 'تمت إضافة الصنف الجديد إلى IndexedDB بنجاح' : 'New product added to IndexedDB',
        'success'
      );
    }
  };

  return (
    <div className="flex-1 w-full h-full overflow-y-auto p-3 sm:p-4 md:p-6 select-none touch-scroll pb-24">
      <div className="max-w-7xl mx-auto space-y-4">
      {/* 1. Header Bar: Title, Count, Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-gray-200/80 dark:border-[#2D333F]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100">
                {isRtl ? 'كتالوج الأصناف' : 'Product Catalog'}
              </h1>
              <Badge variant="primary" size="sm">
                {products.length} {isRtl ? 'صنف' : 'items'}
              </Badge>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {isRtl
                ? 'قاعدة بيانات محلية متزامنة وسريعة تعمل دون اتصال (IndexedDB)'
                : 'High-performance offline local database powered by IndexedDB'}
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
            {isRtl ? 'إضافة صنف جديد' : 'New Product'}
          </Button>
        </div>
      </div>

      {/* 2. Controls: Search, Scanner, View Switcher */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
        {/* Search Input with Scanner Button */}
        <div className="flex-1 relative flex items-center">
          <Input
            placeholder={
              isRtl
                ? 'ابحث بالاسم، الكود، الباركود، أو الرف...'
                : 'Search by name, SKU code, barcode, or shelf...'
            }
            leftIcon={<Search className="w-4 h-4" />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pe-12"
          />
          <button
            type="button"
            onClick={() => openScanner((code: string) => setSearchQuery(code))}
            className="absolute end-2 p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title={isRtl ? 'مسح الباركود بالكاميرا أو الماسح' : 'Scan Barcode'}
          >
            <ScanBarcode className="w-4 h-4" />
          </button>
        </div>

        {/* View Mode Toggle: List vs Grid */}
        <div className="flex items-center p-1 rounded-xl border border-gray-200 dark:border-[#2D333F] bg-gray-100/70 dark:bg-[#16181D] shrink-0 self-end sm:self-auto">
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={`p-1.5 rounded-lg transition-all ${
              viewMode === 'list'
                ? 'bg-white dark:bg-[#252B37] text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
            title={isRtl ? 'عرض القائمة المرجعية (Photo 2)' : 'List View'}
          >
            <List className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-lg transition-all ${
              viewMode === 'grid'
                ? 'bg-white dark:bg-[#252B37] text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
            title={isRtl ? 'عرض الشبكة المرئية' : 'Grid View'}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 3. Category Filter Chips (Horizontal Scrollable) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          type="button"
          onClick={() => setActiveCategory('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border shrink-0 ${
            activeCategory === 'all'
              ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
              : 'border-gray-200 dark:border-[#2D333F] bg-white dark:bg-[#16181D] text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1C2028]'
          }`}
        >
          {isRtl ? 'جميع الأصناف' : 'All Products'}
        </button>

        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border shrink-0 ${
              activeCategory === cat
                ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                : 'border-gray-200 dark:border-[#2D333F] bg-white dark:bg-[#16181D] text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1C2028]'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* 4. Main Content Area with State Management */}
      <div className="w-full min-h-[300px]">
        {loading ? (
          <LoadingState count={6} layout={viewMode} />
        ) : error ? (
          <ErrorState message={error} onRetry={refresh} />
        ) : products.length === 0 ? (
          <EmptyState
            title={
              searchQuery
                ? isRtl
                  ? `لا توجد نتائج مطابقة لـ "${searchQuery}"`
                  : `No results matching "${searchQuery}"`
                : isRtl
                ? 'لا توجد أصناف في هذه الفئة حتى الآن'
                : 'No products in this category yet'
            }
            description={
              isRtl
                ? 'يمكنك إضافة صنف جديد الآن أو مسح الباركود لإضافته لقاعدة البيانات المحلية.'
                : 'You can add a new product or scan a barcode to register it in IndexedDB.'
            }
            actionText={isRtl ? 'إضافة صنف جديد' : 'Add New Product'}
            onAction={handleOpenAdd}
          />
        ) : viewMode === 'list' ? (
          // Responsive List View: 1-col on mobile, 2-col on md, 3-col on xl
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2.5">
            {products.map((prod) => {
              const isOutOfStock = prod.availableQty <= 0;
              return (
                <ListItem
                  key={prod.id}
                  onClick={() => handleOpenEdit(prod)}
                  start={
                    <ItemThumbnail
                      src={prod.imageUrl}
                      name={prod.name}
                      size="md"
                      className="shrink-0"
                    />
                  }
                  title={isRtl ? prod.name : prod.nameEn || prod.name}
                  subtitle={
                    <>
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        {isRtl ? prod.unit : prod.unitEn || prod.unit}
                      </span>
                      <span className="text-gray-300 dark:text-gray-600">•</span>
                      <span>
                        {isRtl ? `الرف: ${prod.shelfNumber}` : `Shelf: ${prod.shelfNumber}`}
                      </span>
                      <span className="text-gray-300 dark:text-gray-600">•</span>
                      <span
                        className={
                          isOutOfStock
                            ? 'text-red-500 font-bold'
                            : 'text-gray-500 dark:text-gray-400'
                        }
                      >
                        {isOutOfStock
                          ? isRtl
                            ? 'نفد الرصيد'
                            : 'Out of Stock'
                          : isRtl
                          ? `متوفر: ${prod.availableQty}`
                          : `Stock: ${prod.availableQty}`}
                      </span>
                    </>
                  }
                  trailingTop={`${prod.unitPrice.toFixed(2)} ${isRtl ? 'ج.م' : 'EGP'}`}
                  trailingBottom={`#${prod.code}`}
                  trailingAction={
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenEdit(prod);
                      }}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                      title={isRtl ? 'تعديل الصنف' : 'Edit Product'}
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  }
                />
              );
            })}
          </div>
        ) : (
          // Responsive Grid View: 2-col on mobile, 3-col on sm, 4 on md, 5 on lg, 6 on xl
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {products.map((prod) => (
              <ProductCardGrid
                key={prod.id}
                product={prod}
                onEdit={handleOpenEdit}
                language={language}
              />
            ))}
          </div>
        )}
      </div>

      {/* 5. Responsive Product Form Drawer (Add / Edit) */}
      <ProductFormDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        product={editingProduct}
        categories={categories}
        onSave={handleSaveProduct}
        language={language}
      />
      </div>
    </div>
  );
};
