import {
  ProductItem,
  Customer,
  SalesOrder,
  SalesInvoice,
  SalesReturn,
  CreditNote,
  PosSale,
  RepresentativeProfile,
  PettyCashTransaction,
  SyncStatus
} from '../types';

export const DB_NAME = 'eda50_mobile_pos_db';
export const DB_VERSION = 1;

export const STORES = {
  PRODUCTS: 'products',
  CUSTOMERS: 'customers',
  ORDERS: 'orders',
  INVOICES: 'invoices',
  RETURNS: 'returns',
  CREDIT_NOTES: 'credit_notes',
  POS_SALES: 'pos_sales',
  REPRESENTATIVES: 'representatives',
  PETTY_CASH: 'petty_cash',
  SYNC_QUEUE: 'sync_queue'
} as const;

export type StoreName = typeof STORES[keyof typeof STORES];

export interface SyncQueueItem {
  id: string;
  entityType: 'order' | 'invoice' | 'return' | 'credit_note' | 'pos_sale' | 'customer' | 'product';
  entityId: string;
  operation: 'create' | 'update' | 'delete';
  payload: any;
  status: SyncStatus;
  retryCount: number;
  lastAttempt?: string;
  errorMessage?: string;
  createdAt: string;
}

export interface DBSchemaMap {
  products: ProductItem;
  customers: Customer;
  orders: SalesOrder;
  invoices: SalesInvoice;
  returns: SalesReturn;
  credit_notes: CreditNote;
  pos_sales: PosSale;
  representatives: RepresentativeProfile;
  petty_cash: PettyCashTransaction;
  sync_queue: SyncQueueItem;
}
