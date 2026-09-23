import { getDB } from '../index';
import { STORES } from '../schema';
import { ProductItem } from '../../types';

export class ProductRepository {
  /**
   * Retrieve all products from IndexedDB
   */
  async getAll(): Promise<ProductItem[]> {
    const db = await getDB();
    return await db.getAll(STORES.PRODUCTS);
  }

  /**
   * Get single product by primary key ID
   */
  async getById(id: string): Promise<ProductItem | undefined> {
    const db = await getDB();
    return await db.get(STORES.PRODUCTS, id);
  }

  /**
   * Get product by short unique code (e.g. '2001')
   */
  async getByCode(code: string): Promise<ProductItem | undefined> {
    const db = await getDB();
    const cleanCode = code.trim();
    return await db.getFromIndex(STORES.PRODUCTS, 'code', cleanCode);
  }

  /**
   * Get product by barcode
   */
  async getByBarcode(barcode: string): Promise<ProductItem | undefined> {
    const db = await getDB();
    const cleanBarcode = barcode.trim();
    return await db.getFromIndex(STORES.PRODUCTS, 'barcode', cleanBarcode);
  }

  /**
   * Search products by query (name, code, barcode) and optional category filter
   */
  async search(query: string = '', category?: string): Promise<ProductItem[]> {
    const all = await this.getAll();
    const cleanQuery = query.trim().toLowerCase();

    return all.filter((prod) => {
      // Category filter
      if (category && category !== 'all' && prod.category !== category) {
        return false;
      }

      if (!cleanQuery) return true;

      const matchName = prod.name.toLowerCase().includes(cleanQuery);
      const matchNameEn = prod.nameEn?.toLowerCase().includes(cleanQuery);
      const matchCode = prod.code.toLowerCase().includes(cleanQuery);
      const matchBarcode = prod.barcode.toLowerCase().includes(cleanQuery);
      const matchShelf = prod.shelfNumber.toLowerCase().includes(cleanQuery);

      return matchName || matchNameEn || matchCode || matchBarcode || matchShelf;
    });
  }

  /**
   * Get list of unique categories
   */
  async getCategories(): Promise<string[]> {
    const all = await this.getAll();
    const categoriesSet = new Set<string>();
    for (const item of all) {
      if (item.category && item.category.trim()) {
        categoriesSet.add(item.category.trim());
      }
    }
    return Array.from(categoriesSet);
  }

  /**
   * Add or update a product
   */
  async save(product: ProductItem): Promise<ProductItem> {
    const db = await getDB();
    await db.put(STORES.PRODUCTS, product);

    // Keep localStorage in sync for backwards compatibility
    try {
      const all = await db.getAll(STORES.PRODUCTS);
      localStorage.setItem('eda50_products', JSON.stringify(all));
    } catch {
      // ignore
    }

    return product;
  }

  /**
   * Delete product by ID
   */
  async delete(id: string): Promise<void> {
    const db = await getDB();
    await db.delete(STORES.PRODUCTS, id);

    try {
      const all = await db.getAll(STORES.PRODUCTS);
      localStorage.setItem('eda50_products', JSON.stringify(all));
    } catch {
      // ignore
    }
  }

  /**
   * Update product available stock quantity
   */
  async updateStock(id: string, delta: number): Promise<ProductItem | undefined> {
    const db = await getDB();
    const tx = db.transaction(STORES.PRODUCTS, 'readwrite');
    const product = await tx.store.get(id);

    if (!product) {
      await tx.done;
      return undefined;
    }

    product.availableQty = Math.max(0, product.availableQty + delta);
    await tx.store.put(product);
    await tx.done;

    return product;
  }
}

export const productRepository = new ProductRepository();
