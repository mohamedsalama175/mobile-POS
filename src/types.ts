export type Language = 'ar' | 'en';
export type Theme = 'dark' | 'light';

export type SyncStatus = 'synced' | 'pending' | 'failed';

export type DocumentType = 'order' | 'return' | 'invoice' | 'credit_note' | 'pos';

export interface Customer {
  id: string;
  name: string;
  taxNumber: string;
  phone: string;
  creditLimit: number;
  currentBalance: number;
  branchName?: string;
  cardNumber?: string;
}

export interface ProductItem {
  id: string;
  code: string;
  barcode: string;
  name: string;
  nameEn: string;
  shelfNumber: string;
  unit: string;
  unitEn: string;
  availableQty: number;
  unitPrice: number;
  defaultDiscount?: number;
  category: string;
  imageUrl?: string;
}

export interface LineItem {
  id: string;
  productId: string;
  code: string;
  name: string;
  nameEn?: string;
  shelfNumber: string;
  unit: string;
  unitEn?: string;
  availableQty: number;
  enteredQty: number;
  unitPrice: number;
  discount: number; // percentage or fixed
  discountType: 'percentage' | 'fixed';
  lineTotal: number;
  maxReturnQty?: number; // for returns and credit notes
  imageUrl?: string;
  category?: string;
  categoryImage?: string;
}

export interface SalesOrder {
  id: string;
  orderNumber: string; // provisional DRAFT-EDA50-... or official SO-2026-...
  date: string;
  customerId: string;
  customerName: string;
  customerTaxNumber: string;
  customerPhone: string;
  creditLimit: number;
  customerBranch: string;
  requesterName?: string;
  requesterPhone?: string;
  subCompany: string;
  itemType: string;
  warehouse: string;
  salesRep: string;
  items: LineItem[];
  // Totals
  grossTotal: number;
  totalDiscount: number;
  totalAfterDiscount: number;
  totalTax: number;
  totalAfterTax: number;
  withholdingTax: number;
  netDue: number;
  status: 'draft' | 'submitted' | 'confirmed' | 'delivered' | 'cancelled';
  syncStatus: SyncStatus;
  syncError?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SalesReturn {
  id: string;
  returnNumber: string;
  linkedOrderNumber: string;
  date: string;
  customerId: string;
  customerName: string;
  customerTaxNumber: string;
  customerPhone: string;
  creditLimit: number;
  customerBranch: string;
  requesterName?: string;
  requesterPhone?: string;
  subCompany: string;
  itemType: string;
  warehouse: string;
  salesRep: string;
  items: LineItem[];
  grossTotal: number;
  totalDiscount: number;
  totalAfterDiscount: number;
  totalTax: number;
  totalAfterTax: number;
  withholdingTax: number;
  netDue: number;
  status: 'draft' | 'pending_approval' | 'accepted' | 'rejected';
  syncStatus: SyncStatus;
  syncError?: string;
  createdAt: string;
}

export interface SalesInvoice {
  id: string;
  invoiceNumber: string;
  linkedOrderNumber?: string;
  date: string;
  invoiceType?: 'cash' | 'credit';
  isTaxSpecific?: boolean;
  isImmediateCash?: boolean;
  customerId: string;
  customerName: string;
  customerTaxNumber: string;
  customerPhone: string;
  buyerName?: string;
  creditLimit: number;
  customerBranch: string;
  requesterName?: string;
  requesterPhone?: string;
  subCompany: string;
  itemType?: string;
  warehouse: string;
  salesRep: string;
  items: LineItem[];
  grossTotal: number;
  totalDiscount: number;
  totalAfterDiscount: number;
  totalTax: number;
  totalAfterTax: number;
  withholdingTax: number;
  netDue: number;
  isCashPayment?: boolean;
  paidAmount?: number;
  remainingBalance?: number;
  cashReceiptDate?: string;
  settlementStatus?: 'unpaid' | 'partial' | 'paid';
  status?: 'draft' | 'issued' | 'cancelled';
  syncStatus: SyncStatus;
  syncError?: string;
  createdAt: string;
}

export interface CreditNote {
  id: string;
  creditNoteNumber: string;
  linkedInvoiceNumber: string;
  linkedOrderNumber?: string;
  date: string;
  customerId: string;
  customerName: string;
  customerTaxNumber: string;
  customerPhone: string;
  buyerName?: string;
  creditLimit: number;
  customerBranch: string;
  requesterName?: string;
  requesterPhone?: string;
  subCompany: string;
  itemType?: string;
  warehouse: string;
  salesRep: string;
  reason?: string;
  items: LineItem[];
  grossTotal: number;
  totalDiscount: number;
  totalAfterDiscount: number;
  totalTax: number;
  totalAfterTax: number;
  withholdingTax: number;
  netDue: number;
  settlementStatus?: 'unsettled' | 'settled';
  status?: 'draft' | 'pending' | 'approved';
  syncStatus: SyncStatus;
  syncError?: string;
  createdAt: string;
}

export interface PosSale {
  id: string;
  receiptNumber: string;
  transactionType?: 'sale' | 'return';
  branch?: string;
  date: string;
  time?: string;
  employeeName?: string;
  cashierName?: string;
  warehouse?: string;
  itemType?: string;
  subCompany?: string;
  isTaxSpecific?: boolean;
  customerId: string;
  customerName: string;
  customerTaxNumber?: string;
  customerCardNumber?: string;
  customerPhone?: string;
  buyerName?: string;
  salesRep?: string;
  terminalId?: string;
  items: LineItem[];
  grossTotal: number;
  totalDiscount: number;
  totalTax: number;
  netDue: number;
  paymentMethod: 'cash' | 'card';
  amountPaid: number;
  changeDue: number;
  status?: 'completed' | 'cancelled';
  syncStatus: SyncStatus;
  syncError?: string;
  createdAt: string;
}

export interface UserSession {
  username: string;
  displayName: string;
  displayNameEn: string;
  badgeNumber: string;
  role: 'super_admin' | 'sales_rep' | 'warehouse_staff';
  defaultBranch: string;
  defaultWarehouse: string;
}

export interface LookupData {
  subCompanies: string[];
  itemTypes: string[];
  warehouses: string[];
  salesReps: string[];
  branches: string[];
}

export interface RepresentativeProfile {
  id: string;
  username: string;
  displayName: string;
  displayNameEn: string;
  badgeNumber: string;
  creditLimit: number; // حد الائتمان
  allocationCeiling: number; // مبلغ التخصيص / سقف التخصيص
  pettyCashBalance: number; // رصيد العهدة / الخزينة الصغيرة
  branch: string;
  phone: string;
}

export interface PettyCashTransaction {
  id: string;
  repId: string;
  repName: string;
  type: 'collection' | 'settlement' | 'deposit';
  amount: number;
  invoiceNumber?: string;
  customerName?: string;
  date: string;
  notes?: string;
  createdAt: string;
}
