import { useState, useEffect, useCallback } from 'react';
import { ProductItem } from '../../../types';
import { productRepository } from '../../../db/repositories/productRepository';

export interface UseProductsOptions {
  initialCategory?: string;
  autoLoad?: boolean;
}

export const useProducts = (options: UseProductsOptions = {}) => {
  const { initialCategory = 'all', autoLoad = true } = options;

  const [products, setProducts] = useState<ProductItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>(initialCategory);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch products and categories
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [items, cats] = await Promise.all([
        productRepository.search(searchQuery, activeCategory),
        productRepository.getCategories(),
      ]);

      setProducts(items);
      setCategories(cats);
    } catch (err: any) {
      console.error('Error fetching products:', err);
      setError(err?.message || 'فشل في تحميل الأصناف من قاعدة البيانات المحلية');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, activeCategory]);

  useEffect(() => {
    if (autoLoad) {
      loadData();
    }
  }, [loadData, autoLoad]);

  // Create product
  const createProduct = async (productData: Omit<ProductItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newProduct: ProductItem = {
        ...productData,
        id: `prod-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      };
      await productRepository.save(newProduct);
      await loadData();
      return newProduct;
    } catch (err: any) {
      throw new Error(err?.message || 'فشل في حفظ الصنف الجديد');
    }
  };

  // Update product
  const updateProduct = async (product: ProductItem) => {
    try {
      await productRepository.save(product);
      await loadData();
      return product;
    } catch (err: any) {
      throw new Error(err?.message || 'فشل في تحديث الصنف');
    }
  };

  // Delete product
  const deleteProduct = async (id: string) => {
    try {
      await productRepository.delete(id);
      await loadData();
    } catch (err: any) {
      throw new Error(err?.message || 'فشل في حذف الصنف');
    }
  };

  return {
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
    refresh: loadData,
    createProduct,
    updateProduct,
    deleteProduct,
  };
};
