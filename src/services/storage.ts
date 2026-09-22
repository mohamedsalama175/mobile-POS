import {
  SalesOrder,
  SalesReturn,
  SalesInvoice,
  CreditNote,
  PosSale,
  Customer,
  ProductItem,
  SyncStatus
} from '../types';
import {
  MOCK_CUSTOMERS,
  MOCK_PRODUCTS,
  INITIAL_ORDERS,
  INITIAL_INVOICES,
  INITIAL_POS_SALES
} from '../data/mockData';

const STORAGE_KEYS = {
  ORDERS: 'eda50_orders',
  RETURNS: 'eda50_returns',
  INVOICES: 'eda50_invoices',
  CREDIT_NOTES: 'eda50_credit_notes',
  POS_SALES: 'eda50_pos_sales',
  CUSTOMERS: 'eda50_customers',
  PRODUCTS: 'eda50_products',
  IS_ONLINE: 'eda50_is_online',
  ACTIVE_LANGUAGE: 'eda50_language',
  ACTIVE_THEME: 'eda50_theme',
  HANDHELD_VIEW: 'eda50_handheld_frame'
};

class StorageService {
  private isOnline: boolean = true;

  constructor() {
    this.init();
  }

  private init() {
    if (typeof window === 'undefined') return;

    if (!localStorage.getItem(STORAGE_KEYS.ORDERS)) {
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(INITIAL_ORDERS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.RETURNS)) {
      localStorage.setItem(STORAGE_KEYS.RETURNS, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.INVOICES)) {
      localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(INITIAL_INVOICES));
    }
    if (!localStorage.getItem(STORAGE_KEYS.CREDIT_NOTES)) {
      localStorage.setItem(STORAGE_KEYS.CREDIT_NOTES, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.POS_SALES)) {
      localStorage.setItem(STORAGE_KEYS.POS_SALES, JSON.stringify(INITIAL_POS_SALES));
    }
    if (!localStorage.getItem(STORAGE_KEYS.CUSTOMERS)) {
      localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(MOCK_CUSTOMERS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.PRODUCTS)) {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(MOCK_PRODUCTS));
    }

    const savedOnline = localStorage.getItem(STORAGE_KEYS.IS_ONLINE);
    this.isOnline = savedOnline !== null ? savedOnline === 'true' : true;
  }

  // Network state
  getNetworkStatus(): boolean {
    return this.isOnline;
  }

  setNetworkStatus(online: boolean) {
    this.isOnline = online;
    localStorage.setItem(STORAGE_KEYS.IS_ONLINE, String(online));
  }

  // Provisional ID generator
  generateProvisionalNumber(prefix: string): string {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    return `DRAFT-EDA50-${randomSuffix}`;
  }

  // Official server sequential number simulation
  generateServerNumber(docType: 'order' | 'return' | 'invoice' | 'credit_note' | 'pos'): string {
    const year = new Date().getFullYear();
    const num = Math.floor(1000 + Math.random() * 9000);
    switch (docType) {
      case 'order': return `SO-${year}-${num}`;
      case 'return': return `RET-${year}-${num}`;
      case 'invoice': return `INV-${year}-${num}`;
      case 'credit_note': return `CR-${year}-${num}`;
      case 'pos': return `POS-${year}-${num}`;
    }
  }

  // Orders
  getOrders(): SalesOrder[] {
    const data = localStorage.getItem(STORAGE_KEYS.ORDERS);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(INITIAL_ORDERS));
      return INITIAL_ORDERS;
    }
    try {
      const parsed = JSON.parse(data);
      if (parsed.length < INITIAL_ORDERS.length) {
        localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(INITIAL_ORDERS));
        return INITIAL_ORDERS;
      }
      return parsed;
    } catch {
      return INITIAL_ORDERS;
    }
  }

  saveOrder(order: Omit<SalesOrder, 'id' | 'orderNumber' | 'syncStatus' | 'createdAt' | 'updatedAt'>): SalesOrder {
    const orders = this.getOrders();
    const isOnline = this.getNetworkStatus();
    const provisionalNumber = this.generateProvisionalNumber('SO');
    const now = new Date().toISOString();

    const newOrder: SalesOrder = {
      ...order,
      id: `so-${Date.now()}`,
      orderNumber: isOnline ? this.generateServerNumber('order') : provisionalNumber,
      syncStatus: isOnline ? 'synced' : 'pending',
      createdAt: now,
      updatedAt: now
    };

    orders.unshift(newOrder);
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
    return newOrder;
  }

  updateOrder(updated: SalesOrder) {
    const orders = this.getOrders().map(o => o.id === updated.id ? updated : o);
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
  }

  // Returns
  getReturns(): SalesReturn[] {
    const data = localStorage.getItem(STORAGE_KEYS.RETURNS);
    return data ? JSON.parse(data) : [];
  }

  saveReturn(ret: Omit<SalesReturn, 'id' | 'returnNumber' | 'syncStatus' | 'createdAt'>): SalesReturn {
    const returns = this.getReturns();
    const isOnline = this.getNetworkStatus();
    const provisionalNumber = this.generateProvisionalNumber('RET');
    const now = new Date().toISOString();

    const newReturn: SalesReturn = {
      ...ret,
      id: `ret-${Date.now()}`,
      returnNumber: isOnline ? this.generateServerNumber('return') : provisionalNumber,
      syncStatus: isOnline ? 'synced' : 'pending',
      createdAt: now
    };

    returns.unshift(newReturn);
    localStorage.setItem(STORAGE_KEYS.RETURNS, JSON.stringify(returns));
    return newReturn;
  }

  // Invoices
  getInvoices(): SalesInvoice[] {
    const data = localStorage.getItem(STORAGE_KEYS.INVOICES);
    return data ? JSON.parse(data) : [];
  }

  saveInvoice(inv: Omit<SalesInvoice, 'id' | 'invoiceNumber' | 'syncStatus' | 'createdAt'>): SalesInvoice {
    const invoices = this.getInvoices();
    const isOnline = this.getNetworkStatus();
    const provisionalNumber = this.generateProvisionalNumber('INV');
    const now = new Date().toISOString();

    const newInvoice: SalesInvoice = {
      ...inv,
      id: `inv-${Date.now()}`,
      invoiceNumber: isOnline ? this.generateServerNumber('invoice') : provisionalNumber,
      syncStatus: isOnline ? 'synced' : 'pending',
      createdAt: now
    };

    invoices.unshift(newInvoice);
    localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(invoices));
    return newInvoice;
  }

  // Credit Notes
  getCreditNotes(): CreditNote[] {
    const data = localStorage.getItem(STORAGE_KEYS.CREDIT_NOTES);
    return data ? JSON.parse(data) : [];
  }

  saveCreditNote(cn: Omit<CreditNote, 'id' | 'creditNoteNumber' | 'syncStatus' | 'createdAt'>): CreditNote {
    const creditNotes = this.getCreditNotes();
    const isOnline = this.getNetworkStatus();
    const provisionalNumber = this.generateProvisionalNumber('CR');
    const now = new Date().toISOString();

    const newCN: CreditNote = {
      ...cn,
      id: `cr-${Date.now()}`,
      creditNoteNumber: isOnline ? this.generateServerNumber('credit_note') : provisionalNumber,
      syncStatus: isOnline ? 'synced' : 'pending',
      createdAt: now
    };

    creditNotes.unshift(newCN);
    localStorage.setItem(STORAGE_KEYS.CREDIT_NOTES, JSON.stringify(creditNotes));
    return newCN;
  }

  // POS Sales
  getPosSales(): PosSale[] {
    const data = localStorage.getItem(STORAGE_KEYS.POS_SALES);
    return data ? JSON.parse(data) : [];
  }

  savePosSale(pos: Omit<PosSale, 'id' | 'receiptNumber' | 'syncStatus' | 'createdAt'>): PosSale {
    const sales = this.getPosSales();
    const isOnline = this.getNetworkStatus();
    const provisionalNumber = this.generateProvisionalNumber('POS');
    const now = new Date().toISOString();

    const newSale: PosSale = {
      ...pos,
      id: `pos-${Date.now()}`,
      receiptNumber: isOnline ? this.generateServerNumber('pos') : provisionalNumber,
      syncStatus: isOnline ? 'synced' : 'pending',
      createdAt: now
    };

    sales.unshift(newSale);
    localStorage.setItem(STORAGE_KEYS.POS_SALES, JSON.stringify(sales));
    return newSale;
  }

  // Reference data
  getCustomers(): Customer[] {
    const data = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
    return data ? JSON.parse(data) : MOCK_CUSTOMERS;
  }

  getProducts(): ProductItem[] {
    const data = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(MOCK_PRODUCTS));
      return MOCK_PRODUCTS;
    }
    try {
      const parsed = JSON.parse(data);
      if (parsed.length < MOCK_PRODUCTS.length) {
        localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(MOCK_PRODUCTS));
        return MOCK_PRODUCTS;
      }
      return parsed;
    } catch {
      return MOCK_PRODUCTS;
    }
  }

  // Outbox / Pending sync count across all modules
  getPendingCount(): number {
    const orders = this.getOrders().filter(x => x.syncStatus === 'pending' || x.syncStatus === 'failed');
    const returns = this.getReturns().filter(x => x.syncStatus === 'pending' || x.syncStatus === 'failed');
    const invoices = this.getInvoices().filter(x => x.syncStatus === 'pending' || x.syncStatus === 'failed');
    const creditNotes = this.getCreditNotes().filter(x => x.syncStatus === 'pending' || x.syncStatus === 'failed');
    const pos = this.getPosSales().filter(x => x.syncStatus === 'pending' || x.syncStatus === 'failed');
    return orders.length + returns.length + invoices.length + creditNotes.length + pos.length;
  }

  // Perform full sync
  syncAll(): { success: number; failed: number } {
    if (!this.getNetworkStatus()) {
      return { success: 0, failed: 0 };
    }

    let success = 0;
    let failed = 0;

    // Sync Orders
    const orders = this.getOrders().map(o => {
      if (o.syncStatus === 'pending' || o.syncStatus === 'failed') {
        // Simulation check: if customer exceeds credit limit by large margin, trigger a realistic server rejection
        if (o.creditLimit < 50000 && o.netDue > 10000) {
          failed++;
          return {
            ...o,
            syncStatus: 'failed' as SyncStatus,
            syncError: 'رفض من الخادم: تجاوز الحد الائتماني المعتمد للعميل (الحد: ' + o.creditLimit.toLocaleString() + ')'
          };
        }
        success++;
        return {
          ...o,
          orderNumber: o.orderNumber.startsWith('DRAFT') ? this.generateServerNumber('order') : o.orderNumber,
          syncStatus: 'synced' as SyncStatus,
          syncError: undefined
        };
      }
      return o;
    });
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));

    // Sync Returns
    const returns = this.getReturns().map(r => {
      if (r.syncStatus === 'pending' || r.syncStatus === 'failed') {
        success++;
        return {
          ...r,
          returnNumber: r.returnNumber.startsWith('DRAFT') ? this.generateServerNumber('return') : r.returnNumber,
          syncStatus: 'synced' as SyncStatus,
          syncError: undefined
        };
      }
      return r;
    });
    localStorage.setItem(STORAGE_KEYS.RETURNS, JSON.stringify(returns));

    // Sync Invoices
    const invoices = this.getInvoices().map(i => {
      if (i.syncStatus === 'pending' || i.syncStatus === 'failed') {
        success++;
        return {
          ...i,
          invoiceNumber: i.invoiceNumber.startsWith('DRAFT') ? this.generateServerNumber('invoice') : i.invoiceNumber,
          syncStatus: 'synced' as SyncStatus,
          syncError: undefined
        };
      }
      return i;
    });
    localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(invoices));

    // Sync Credit Notes
    const creditNotes = this.getCreditNotes().map(c => {
      if (c.syncStatus === 'pending' || c.syncStatus === 'failed') {
        success++;
        return {
          ...c,
          creditNoteNumber: c.creditNoteNumber.startsWith('DRAFT') ? this.generateServerNumber('credit_note') : c.creditNoteNumber,
          syncStatus: 'synced' as SyncStatus,
          syncError: undefined
        };
      }
      return c;
    });
    localStorage.setItem(STORAGE_KEYS.CREDIT_NOTES, JSON.stringify(creditNotes));

    // Sync POS Sales
    const pos = this.getPosSales().map(p => {
      if (p.syncStatus === 'pending' || p.syncStatus === 'failed') {
        success++;
        return {
          ...p,
          receiptNumber: p.receiptNumber.startsWith('DRAFT') ? this.generateServerNumber('pos') : p.receiptNumber,
          syncStatus: 'synced' as SyncStatus,
          syncError: undefined
        };
      }
      return p;
    });
    localStorage.setItem(STORAGE_KEYS.POS_SALES, JSON.stringify(pos));

    return { success, failed };
  }

  // Reset to fresh demo data
  resetDemoData() {
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(INITIAL_ORDERS));
    localStorage.setItem(STORAGE_KEYS.RETURNS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(INITIAL_INVOICES));
    localStorage.setItem(STORAGE_KEYS.CREDIT_NOTES, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.POS_SALES, JSON.stringify(INITIAL_POS_SALES));
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(MOCK_CUSTOMERS));
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(MOCK_PRODUCTS));
  }
}

export const storageService = new StorageService();
