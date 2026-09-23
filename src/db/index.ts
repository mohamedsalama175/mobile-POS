import { openDB, IDBPDatabase } from 'idb';
import { DB_NAME, DB_VERSION, STORES } from './schema';
import {
  MOCK_CUSTOMERS,
  MOCK_PRODUCTS,
  INITIAL_ORDERS,
  INITIAL_INVOICES,
  INITIAL_POS_SALES,
  INITIAL_REPRESENTATIVES,
  INITIAL_PETTY_CASH
} from '../data/mockData';

let dbPromise: Promise<IDBPDatabase> | null = null;

export const getDB = async (): Promise<IDBPDatabase> => {
  if (typeof window === 'undefined') {
    throw new Error('IndexedDB is only accessible in browser environment.');
  }

  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // 1. Products Store
        if (!db.objectStoreNames.contains(STORES.PRODUCTS)) {
          const productStore = db.createObjectStore(STORES.PRODUCTS, { keyPath: 'id' });
          productStore.createIndex('code', 'code', { unique: true });
          productStore.createIndex('barcode', 'barcode', { unique: false });
          productStore.createIndex('name', 'name', { unique: false });
          productStore.createIndex('category', 'category', { unique: false });
        }

        // 2. Customers Store
        if (!db.objectStoreNames.contains(STORES.CUSTOMERS)) {
          const customerStore = db.createObjectStore(STORES.CUSTOMERS, { keyPath: 'id' });
          customerStore.createIndex('name', 'name', { unique: false });
          customerStore.createIndex('taxNumber', 'taxNumber', { unique: false });
          customerStore.createIndex('phone', 'phone', { unique: false });
          customerStore.createIndex('cardNumber', 'cardNumber', { unique: false });
        }

        // 3. Orders Store
        if (!db.objectStoreNames.contains(STORES.ORDERS)) {
          const orderStore = db.createObjectStore(STORES.ORDERS, { keyPath: 'id' });
          orderStore.createIndex('orderNumber', 'orderNumber', { unique: true });
          orderStore.createIndex('customerId', 'customerId', { unique: false });
          orderStore.createIndex('salesRep', 'salesRep', { unique: false });
          orderStore.createIndex('date', 'date', { unique: false });
          orderStore.createIndex('status', 'status', { unique: false });
          orderStore.createIndex('syncStatus', 'syncStatus', { unique: false });
        }

        // 4. Invoices Store
        if (!db.objectStoreNames.contains(STORES.INVOICES)) {
          const invoiceStore = db.createObjectStore(STORES.INVOICES, { keyPath: 'id' });
          invoiceStore.createIndex('invoiceNumber', 'invoiceNumber', { unique: true });
          invoiceStore.createIndex('linkedOrderNumber', 'linkedOrderNumber', { unique: false });
          invoiceStore.createIndex('customerId', 'customerId', { unique: false });
          invoiceStore.createIndex('salesRep', 'salesRep', { unique: false });
          invoiceStore.createIndex('date', 'date', { unique: false });
          invoiceStore.createIndex('settlementStatus', 'settlementStatus', { unique: false });
          invoiceStore.createIndex('syncStatus', 'syncStatus', { unique: false });
        }

        // 5. Returns Store
        if (!db.objectStoreNames.contains(STORES.RETURNS)) {
          const returnStore = db.createObjectStore(STORES.RETURNS, { keyPath: 'id' });
          returnStore.createIndex('returnNumber', 'returnNumber', { unique: true });
          returnStore.createIndex('customerId', 'customerId', { unique: false });
          returnStore.createIndex('salesRep', 'salesRep', { unique: false });
          returnStore.createIndex('date', 'date', { unique: false });
          returnStore.createIndex('syncStatus', 'syncStatus', { unique: false });
        }

        // 6. Credit Notes Store
        if (!db.objectStoreNames.contains(STORES.CREDIT_NOTES)) {
          const creditStore = db.createObjectStore(STORES.CREDIT_NOTES, { keyPath: 'id' });
          creditStore.createIndex('creditNoteNumber', 'creditNoteNumber', { unique: true });
          creditStore.createIndex('customerId', 'customerId', { unique: false });
          creditStore.createIndex('salesRep', 'salesRep', { unique: false });
          creditStore.createIndex('date', 'date', { unique: false });
          creditStore.createIndex('syncStatus', 'syncStatus', { unique: false });
        }

        // 7. POS Sales Store
        if (!db.objectStoreNames.contains(STORES.POS_SALES)) {
          const posStore = db.createObjectStore(STORES.POS_SALES, { keyPath: 'id' });
          posStore.createIndex('receiptNumber', 'receiptNumber', { unique: true });
          posStore.createIndex('customerId', 'customerId', { unique: false });
          posStore.createIndex('date', 'date', { unique: false });
          posStore.createIndex('syncStatus', 'syncStatus', { unique: false });
        }

        // 8. Representatives Store
        if (!db.objectStoreNames.contains(STORES.REPRESENTATIVES)) {
          const repStore = db.createObjectStore(STORES.REPRESENTATIVES, { keyPath: 'id' });
          repStore.createIndex('username', 'username', { unique: true });
          repStore.createIndex('badgeNumber', 'badgeNumber', { unique: false });
        }

        // 9. Petty Cash Store
        if (!db.objectStoreNames.contains(STORES.PETTY_CASH)) {
          const pettyStore = db.createObjectStore(STORES.PETTY_CASH, { keyPath: 'id' });
          pettyStore.createIndex('repId', 'repId', { unique: false });
          pettyStore.createIndex('type', 'type', { unique: false });
          pettyStore.createIndex('date', 'date', { unique: false });
        }

        // 10. Sync Queue Store
        if (!db.objectStoreNames.contains(STORES.SYNC_QUEUE)) {
          const syncStore = db.createObjectStore(STORES.SYNC_QUEUE, { keyPath: 'id' });
          syncStore.createIndex('status', 'status', { unique: false });
          syncStore.createIndex('createdAt', 'createdAt', { unique: false });
        }
      }
    });

    // Auto-seed initial data if store is fresh
    await seedInitialData(await dbPromise);
  }

  return dbPromise;
};

/**
 * Seed initial data if empty or migrate from localStorage if present
 */
const seedInitialData = async (db: IDBPDatabase) => {
  try {
    const productCount = await db.count(STORES.PRODUCTS);
    if (productCount === 0) {
      // Check if localStorage has products
      let initialProducts = MOCK_PRODUCTS;
      const savedProducts = localStorage.getItem('eda50_products');
      if (savedProducts) {
        try {
          const parsed = JSON.parse(savedProducts);
          if (Array.isArray(parsed) && parsed.length > 0) initialProducts = parsed;
        } catch {
          // ignore parsing error, use default
        }
      }

      const tx = db.transaction(STORES.PRODUCTS, 'readwrite');
      for (const prod of initialProducts) {
        await tx.store.put(prod);
      }
      await tx.done;
    }

    const customerCount = await db.count(STORES.CUSTOMERS);
    if (customerCount === 0) {
      let initialCustomers = MOCK_CUSTOMERS;
      const savedCustomers = localStorage.getItem('eda50_customers');
      if (savedCustomers) {
        try {
          const parsed = JSON.parse(savedCustomers);
          if (Array.isArray(parsed) && parsed.length > 0) initialCustomers = parsed;
        } catch {}
      }

      const tx = db.transaction(STORES.CUSTOMERS, 'readwrite');
      for (const cust of initialCustomers) {
        await tx.store.put(cust);
      }
      await tx.done;
    }

    const orderCount = await db.count(STORES.ORDERS);
    if (orderCount === 0) {
      const tx = db.transaction(STORES.ORDERS, 'readwrite');
      for (const order of INITIAL_ORDERS) {
        await tx.store.put(order);
      }
      await tx.done;
    }

    const invoiceCount = await db.count(STORES.INVOICES);
    if (invoiceCount === 0) {
      const tx = db.transaction(STORES.INVOICES, 'readwrite');
      for (const inv of INITIAL_INVOICES) {
        await tx.store.put(inv);
      }
      await tx.done;
    }

    const repCount = await db.count(STORES.REPRESENTATIVES);
    if (repCount === 0) {
      const tx = db.transaction(STORES.REPRESENTATIVES, 'readwrite');
      for (const rep of INITIAL_REPRESENTATIVES) {
        await tx.store.put(rep);
      }
      await tx.done;
    }

    const pettyCashCount = await db.count(STORES.PETTY_CASH);
    if (pettyCashCount === 0) {
      const tx = db.transaction(STORES.PETTY_CASH, 'readwrite');
      for (const item of INITIAL_PETTY_CASH) {
        await tx.store.put(item);
      }
      await tx.done;
    }

    const posCount = await db.count(STORES.POS_SALES);
    if (posCount === 0) {
      const tx = db.transaction(STORES.POS_SALES, 'readwrite');
      for (const sale of INITIAL_POS_SALES) {
        await tx.store.put(sale);
      }
      await tx.done;
    }
  } catch (error) {
    console.error('Failed to seed IndexedDB initial data:', error);
  }
};
