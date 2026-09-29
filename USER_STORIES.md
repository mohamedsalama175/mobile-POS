# Honeywell EDA50 Mobile POS & Sales Van - Complete User Story Specification

**Document Version:** 1.0.0  
**Application Target:** Mobile Sales Van, Warehouse Distribution & Retail POS (Honeywell ScanPal EDA50 / Mobile Handheld)  
**Architecture:** Offline-First Progressive Web App (React 18, TypeScript, Tailwind CSS, IndexedDB, ESC/POS Thermal Printing, Web Bluetooth)  
**Context:** Multi-Currency / Multi-Company ERP Extension with Tax Compliance (14% VAT, 1% WHT, ZATCA / Egyptian Tax Authority Compatible)

---

## Table of Contents
1. [Module 1: Sales Orders Management (طلبات البيع)](#module-1-sales-orders-management)
   - [US-ORD-01: Create Sales Order with Customer Selection & Wizard](#us-ord-01-create-sales-order-with-customer-selection--wizard)
   - [US-ORD-02: Manage Order Line Items, Pricing & Line Discounts](#us-ord-02-manage-order-line-items-pricing--line-discounts)
   - [US-ORD-03: Real-Time Tax (VAT 14%), Withholding Tax (WHT 1%) & Financial Calculations](#us-ord-03-real-time-tax-vat-14-withholding-tax-wht-1--financial-calculations)
   - [US-ORD-04: Decoupled One-Click Direct Invoicing from Sales Order](#us-ord-04-decoupled-one-click-direct-invoicing-from-sales-order)
   - [US-ORD-05: Filter, Search & View Detailed Sales Order History](#us-ord-05-filter-search--view-detailed-sales-order-history)
2. [Module 2: Sales Invoices & Immediate Cash Settlement (فواتير المبيعات والتحصيل)](#module-2-sales-invoices--immediate-cash-settlement)
   - [US-INV-01: Convert Sales Order to Official Sales Invoice](#us-inv-01-convert-sales-order-to-official-sales-invoice)
   - [US-INV-02: Direct Sales Invoice Creation (Cash vs. Credit)](#us-inv-02-direct-sales-invoice-creation-cash-vs-credit)
   - [US-INV-03: Immediate Cash Settlement with AuthGate PIN Verification](#us-inv-03-immediate-cash-settlement-with-authgate-pin-verification)
   - [US-INV-04: Automatic Customer AR & Representative Petty Cash Custody Update](#us-inv-04-automatic-customer-ar--representative-petty-cash-custody-update)
   - [US-INV-05: Invoice History, Payment Status Tracking & Printing](#us-inv-05-invoice-history-payment-status-tracking--printing)
3. [Module 3: Direct Point of Sale (POS) Fast Terminal (نقطة البيع المباشر)](#module-3-direct-point-of-sale-pos-fast-terminal)
   - [US-POS-01: Fast Barcode Scanning & Quick Cart Building](#us-pos-01-fast-barcode-scanning--quick-cart-building)
   - [US-POS-02: POS Checkout with Cash / Card & Change Due Calculation](#us-pos-02-pos-checkout-with-cash--card--change-due-calculation)
   - [US-POS-03: Cash Authentication Gate & Shift Cash Accountability](#us-pos-03-cash-authentication-gate--shift-cash-accountability)
   - [US-POS-04: POS Transaction History, Receipt Reprinting & Filtering](#us-pos-04-pos-transaction-history-receipt-reprinting--filtering)
4. [Module 4: Sales Returns & Reverse Logistics (مرتجعات المبيعات)](#module-4-sales-returns--reverse-logistics)
   - [US-RET-01: Create Sales Return Linked to Original Sales Order](#us-ret-01-create-sales-return-linked-to-original-sales-order)
   - [US-RET-02: Strict Return Quantity Validation & Approval Workflow](#us-ret-02-strict-return-quantity-validation--approval-workflow)
5. [Module 5: Credit Notes (مذكرات الائتمان والإشعارات الدائنة)](#module-5-credit-notes)
   - [US-CRN-01: Issue Tax Credit Note Linked to Sales Invoice](#us-crn-01-issue-tax-credit-note-linked-to-sales-invoice)
   - [US-CRN-02: Credit Note Settlement Tracking & Ledger Reversal](#us-crn-02-credit-note-settlement-tracking--ledger-reversal)
6. [Module 6: Representative Custody & Petty Cash Management (حساب المندوب والتحصيل)](#module-6-representative-custody--petty-cash-management)
   - [US-REP-01: Representative Dashboard, KPI Metrics & Custody Ceiling Monitoring](#us-rep-01-representative-dashboard-kpi-metrics--custody-ceiling-monitoring)
   - [US-REP-02: FIFO Auto-Settlement of Representative Unpaid Invoices](#us-rep-02-fifo-auto-settlement-of-representative-unpaid-invoices)
   - [US-REP-03: Petty Cash Ledger, Cash Collections & Bank Deposit Logging](#us-rep-03-petty-cash-ledger-cash-collections--bank-deposit-logging)
7. [Module 7: Customer Directory & Offline Ledger (دليل العملاء والحسابات)](#module-7-customer-directory--offline-ledger)
   - [US-CUST-01: Offline Customer Directory Browsing & Multi-Attribute Search](#us-cust-01-offline-customer-directory-browsing--multi-attribute-search)
   - [US-CUST-02: Create & Edit Customer Accounts with Credit Limits](#us-cust-02-create--edit-customer-accounts-with-credit-limits)
8. [Module 8: Product Catalog & Warehouse Inventory (كتالوج الأصناف والمخزن)](#module-8-product-catalog--warehouse-inventory)
   - [US-PROD-01: Offline Product Catalog with Multi-Category Filtering & View Modes](#us-prod-01-offline-product-catalog-with-multi-category-filtering--view-modes)
   - [US-PROD-02: Real-Time Stock Availability, Shelf Locations & Master Editing](#us-prod-02-real-time-stock-availability-shelf-locations--master-editing)
9. [Module 9: Offline Synchronization & Outbox Engine (المزامنة وصندوق الصادر)](#module-9-offline-synchronization--outbox-engine)
   - [US-SYNC-01: Offline Transaction Queueing with Provisional Numbers](#us-sync-01-offline-transaction-queueing-with-provisional-numbers)
   - [US-SYNC-02: Automated & Manual Cloud Synchronization Engine](#us-sync-02-automated--manual-cloud-synchronization-engine)
   - [US-SYNC-03: Server Rejection Handling & Supervisor Credit Limit Override](#us-sync-03-server-rejection-handling--supervisor-credit-limit-override)
10. [Module 10: Device Hardware, Printing, Security & UI System (الهاردوير والأمان)](#module-10-device-hardware-printing-security--ui-system)
    - [US-HW-01: Honeywell EDA50 Physical Barcode Scanner & Camera Integration](#us-hw-01-honeywell-eda50-physical-barcode-scanner--camera-integration)
    - [US-HW-02: ESC/POS Thermal Printing (58mm/80mm & Bluetooth Direct) with Tax QR](#us-hw-02-escpos-thermal-printing-58mm80mm--bluetooth-direct-with-tax-qr)
    - [US-HW-03: Shift Handover PIN Lock & Multi-User Role Switching](#us-hw-03-shift-handover-pin-lock--multi-user-role-switching)
    - [US-HW-04: Sunlight-Readable Dual Themes & Full Arabic/English Localization](#us-hw-04-sunlight-readable-dual-themes--full-arabicenglish-localization)

---

# Module 1: Sales Orders Management

## US-ORD-01: Create Sales Order with Customer Selection & Wizard

User Story Card:  
AS A Field Sales Representative / Van Driver  
I WANT TO initiate and configure a new Sales Order using a structured 3-step wizard with customer verification  
SO THAT I can accurately record wholesale customer demand on my Honeywell EDA50 handheld while verifying credit limits in the field.

________________________________________
Story Dependencies
•	Customer Directory & Local Database (IndexedDB / LocalStorage)  
•	Lookup Master Data (Sub-companies, Item Types, Warehouses, Sales Reps)  
•	Audio Feedback Service (Clicks, Scan Success, Error Alerts)  
•	WizardHeader & StickyBottomBar UI Components  
________________________________________
Story Inputs
Field / Item | Data Type | Format / Example | Remarks
--- | --- | --- | ---
Customer Selection | Object / ID | `cust-1` / "مؤسسة الأمل للتجارة" | Required; triggers auto-fill of tax number, phone, credit limit, and branch.
Order Date | String (ISO Date) | `YYYY-MM-DD` (e.g., `2026-09-29`) | Defaults to current date; editable.
Sub-Company | String / Enum | `INITIAL_LOOKUP_DATA.subCompanies[0]` (e.g., "شركة دار السلام للتوزيع") | Dropdown selection from system lookup.
Item Type | String / Enum | `INITIAL_LOOKUP_DATA.itemTypes[0]` (e.g., "بضاعة تجارية - أغذية") | Dropdown selection from system lookup.
Warehouse | String / Enum | `INITIAL_LOOKUP_DATA.warehouses[0]` (e.g., "المستودع الرئيسي") | Assigned source warehouse for fulfillment.
Sales Rep | String | "SA (Super Admin)" / "Ahmed Mostafa" | Auto-populated from active authenticated session.
Order Notes | String | Free text (e.g., "تسليم صباحي قبل الساعة 11") | Optional field for delivery instructions.
________________________________________
Logic Workflow
1. User taps the "+" Floating Action Button or "طلب بيع جديد" on the Orders Screen.
2. System toggles the screen view to `'create'`, sets wizard step to `1`, and hides the bottom navigation bar (`setHideBottomNav(true)`) to maximize screen estate on 5-inch EDA50 devices.
3. System loads active customer accounts and prompts user to pick a customer using the `CustomerPicker` modal or autocomplete list.
4. When a customer is picked, the system displays financial guardrails: Credit Limit, Current Balance, and Available Credit balance.
5. User selects Sub-Company, Warehouse, and Order Date.
6. User taps "التالي: اختيار الأصناف" (Next: Select Items).
7. System validates that `selectedCustomer !== null`. If null, plays error audio tone and displays error toast. If valid, proceeds to Step 2.
________________________________________
Business Rules
Case | Input | Expected Result
--- | --- | ---
Customer selected properly | Valid customer ID (`cust-1`) | Step 1 completes; screen advances to Step 2 (Line Items); Customer header cards display tax number and credit limit.
Customer omitted on Next | `selectedCustomer = null` | Step transition blocked; plays sound `soundService.playError()`; displays toast "يرجى اختيار العميل أولاً للمتابعة".
Customer has credit ceiling exceeded | `currentBalance > creditLimit` | Warning badge displayed on Customer Card; sales rep can proceed with order creation but offline/online sync will flag credit threshold warnings.
Cancel or Back from Step 1 | User taps "رجوع" (Back) on step 1 | Wizard closes; view resets to `'list'`; bottom navigation bar reappears.
________________________________________
Story Output
Case | Input | Expected Result
--- | --- | ---
Wizard Step 1 Completed | Valid customer & metadata selected | Order draft created in component memory; wizard step advanced to `2`; line item interface initialized.
Step 1 Validation Failure | Missing customer selection | Error toast rendered; wizard remains on Step 1; focus set to customer search input.
________________________________________
Use Case
•	Sales van driver arrives at a client grocery store, selects the customer record, checks credit limit status, and begins taking replenishment orders.
________________________________________
UI/UX
•	Full-width mobile layout optimized for 480x854 / 720x1280 screen resolutions.
•	Sticky step indicator header (`WizardHeader`) showing: 1. بيانات العميل (Customer), 2. إضافة الأصناف (Items), 3. مراجعة وحفظ (Review).
•	High-contrast touch targets (minimum 48px height) for gloved/rugged usage.
•	Audio cues on all interactions.
________________________________________
Non-Functional Requirements
•	Screen transition under 100ms.
•	Zero network dependency: 100% offline functionality using local storage.
•	State retained in memory if user toggles device screen or switches app tabs accidentally.
________________________________________
Definition of Done
•	[x] User can initiate a new order from Orders list.
•	[x] CustomerPicker correctly populates customer name, tax number, phone, and branch.
•	[x] Next button validates customer presence before advancing to Step 2.
•	[x] Bottom navigation bar is hidden during wizard and restored upon exit.

---

## US-ORD-02: Manage Order Line Items, Pricing & Line Discounts

User Story Card:  
AS A Field Sales Representative  
I WANT TO scan barcodes, adjust product quantities, and apply line discounts in the order wizard  
SO THAT I can build an accurate bill of items according to customer negotiated terms and warehouse availability.

________________________________________
Story Dependencies
•	US-ORD-01 (Step 1 Customer Selection completed)  
•	Product Catalog (IndexedDB / Mock Products)  
•	LineItemEditor & ItemThumbnail components  
•	Hardware Barcode Scanner Listener  
________________________________________
Story Inputs
Field / Item | Data Type | Format / Example | Remarks
--- | --- | --- | ---
Product Barcode / Code | String | `622300000101` / `ITEM-101` | Scanned via laser scanner or chosen from item picker.
Entered Quantity | Number | Positive Integer/Decimal (e.g., `12`) | Validated against `availableQty` in current van inventory.
Unit Price | Number (Currency) | `45.50` EGP/SAR | Defaulted to product master price; editable if user permissions allow.
Discount Value | Number | `5` or `10.00` | Discount magnitude applied directly to this line item.
Discount Type | String / Enum | `'percentage'` \| `'fixed'` | Controls formula: percentage of line total or fixed monetary deduction.
Line Item Notes | String | "هدية ترويجية" (Bonus) | Optional remarks per item line.
________________________________________
Logic Workflow
1. User enters Step 2 of the Order Wizard.
2. User taps the physical yellow scan button on the Honeywell EDA50 or the virtual "مسح باركود" button.
3. System captures barcode string, searches Product Master by `code` or `barcode`.
4. If found:
   a. If item already exists in the order: increments `enteredQty` by 1.
   b. If item is new: appends item with default `unitPrice`, `discount: 0`, and `enteredQty: 1`.
   c. Plays `soundService.playScanSuccess()`.
5. User can manually adjust quantity using numeric inputs, "+" / "-" steppers, or delete line items with swipe/tap.
6. User can switch discount type between `%` and `EGP/SAR` and enter discount values.
7. System dynamically executes `calculateLineTotal(qty, unitPrice, discount, discountType)` on every keystroke.
8. User taps "التالي: المراجعة والحفظ" (Next: Review & Save).
________________________________________
Business Rules
Case | Input | Expected Result
--- | --- | ---
Add Item via Barcode | Valid barcode `622300000101` | Line item added with net line total = `qty * unitPrice`; success audio chime.
Quantity set to zero or negative | `enteredQty <= 0` | Line total evaluates to `0.00`; Next step blocks if total items count is zero.
Percentage Discount entered | `discount = 10`, `discountType = 'percentage'`, `qty = 2`, `unitPrice = 100` | Line Gross = 200, Discount Amount = 20, Line Total = 180.00.
Fixed Discount entered | `discount = 25`, `discountType = 'fixed'`, `qty = 2`, `unitPrice = 100` | Line Gross = 200, Discount Amount = 25, Line Total = 175.00.
Discount exceeds line gross | `discount = 250`, `gross = 200` | Discount capped at gross total; `calculateLineTotal` returns `0.00` (no negative line totals allowed).
Load Sample 35 Items | User taps "تحميل 35 صنف تجريبي" | Fast test helper injects 35 pre-configured items into cart with success toast.
Advance without items | `items.length === 0` | Advance blocked; audio error tone; toast: "يرجى إضافة صنف واحد على الأقل".
________________________________________
Story Output
Case | Input | Expected Result
--- | --- | ---
Items successfully added | 1 or more line items in table | Wizard advances to Step 3 (Review & Summary); table rows reflect line calculations.
Zero items in order | Empty items array | Step remains at 2; validation error banner displayed.
________________________________________
Use Case
•	Sales representative scans 10 boxes of chips, applies a 5% promotional discount to 3 boxes of juice, and verifies totals before submitting.
________________________________________
UI/UX
•	Interactive card list with thumbnail images, stock availability badges, and inline stepper controls.
•	Sticky totals ribbon showing live items count and gross subtotal.
•	Quick-delete icon with confirm action to prevent accidental removal.
________________________________________
Non-Functional Requirements
•	Barcode scan response and DOM update under 50ms.
•	Smooth scrolling through 50+ line items without frame drops.
________________________________________
Definition of Done
•	[x] Barcode scanning finds products and updates cart lines.
•	[x] Steppers increment and decrement quantities accurately.
•	[x] Percentage and fixed discounts calculate correct net line totals.
•	[x] System forbids advancing to Step 3 with an empty items array.

---

## US-ORD-03: Real-Time Tax (VAT 14%), Withholding Tax (WHT 1%) & Financial Calculations

User Story Card:  
AS A Sales Representative / Accounting Auditor  
I WANT TO review an accurate, real-time financial breakdown (Gross, Total Discount, Taxable Total, 14% VAT, 1% WHT, and Net Due)  
SO THAT all generated sales orders comply with regional fiscal laws and reflect the exact legal liability of the customer.

________________________________________
Story Dependencies
•	`calculateDocumentTotals` in `src/utils/pricing.ts`  
•	Line items from Step 2  
•	`TotalsSummary` presentation component  
________________________________________
Story Inputs
Field / Item | Data Type | Format / Example | Remarks
--- | --- | --- | ---
Line Items List | Array<LineItem> | Array of items with `enteredQty`, `unitPrice`, `discount`, `discountType` | Source data for document-level reduction.
VAT Rate | Number (Decimal) | `0.14` (14%) | Standard Value Added Tax rate.
Withholding Tax Rate | Number (Decimal) | `0.01` (1%) | Regional tax deduction on sales (خصم وإضافة).
Apply WHT Flag | Boolean | `true` (default) | Determines whether withholding tax deduction is applicable.
________________________________________
Logic Workflow
1. User advances to Step 3 (Review & Save) of the Order Wizard.
2. The system triggers `calculateDocumentTotals(items, vatRate, applyWithholdingTax, withholdingRate)`:
   - `Gross Total = ∑ (enteredQty * unitPrice)`
   - `Total Discount = ∑ (line discounts in currency)`
   - `Total After Discount = Gross Total - Total Discount`
   - `Total Tax (VAT 14%) = Total After Discount * 0.14`
   - `Total After Tax = Total After Discount + Total Tax`
   - `Withholding Tax (WHT 1%) = Total After Discount * 0.01`
   - `Net Due = Total After Tax - Withholding Tax`
3. All intermediate numbers are rounded to 2 decimal places using `Number(val.toFixed(2))`.
4. Values are rendered in the `TotalsSummary` card with distinct visual hierarchy (Subtotal, Tax, Deduction, Net).
________________________________________
Business Rules
Case | Input | Expected Result
--- | --- | ---
Standard Calculation | Gross = 1,000.00, Discount = 100.00 | Total After Discount = 900.00; VAT 14% = 126.00; Total After Tax = 1,026.00; WHT 1% = 9.00; Net Due = 1,017.00.
Zero Discount | Gross = 500.00, Discount = 0 | Total After Discount = 500.00; VAT = 70.00; Total After Tax = 570.00; WHT = 5.00; Net Due = 565.00.
100% Discount (Promotional Sample) | Gross = 200.00, Discount = 200.00 | Total After Discount = 0.00; VAT = 0.00; Total After Tax = 0.00; WHT = 0.00; Net Due = 0.00.
Rounding Precision | Values with fractional cents (e.g. 15.333) | Strict rounding to 2 decimal places preventing fractional penny drift.
________________________________________
Story Output
Case | Input | Expected Result
--- | --- | ---
Step 3 Screen Rendered | Valid items in order | Financial summary table renders exact matching figures; Net Due highlighted in bold accent color.
Save Button Triggered | Calculated totals | Totals persisted into `SalesOrder` record object in storage.
________________________________________
Use Case
•	Sales representative shows the customer the exact net due amount including mandatory VAT and withholding tax deductions before the customer signs off.
________________________________________
UI/UX
•	Prominent `TotalsSummary` component with dark theme support (`bg-[#262A31]` / `bg-white`).
•	Green/amber color highlights for net payable amount.
•	Clear labels in selected language (AR: الإجمالي قبل الضريبة، ضريبة القيمة المضافة 14%، ضريبة الخصم 1%، صافي المستحق).
________________________________________
Non-Functional Requirements
•	Sub-millisecond recalculation on every item quantity change.
•	Float precision math safety preventing `0.1 + 0.2 = 0.30000000000000004` errors.
________________________________________
Definition of Done
•	[x] Financial formulas strictly match `src/utils/pricing.ts`.
•	[x] VAT 14% and WHT 1% calculate against total after discount.
•	[x] Net due equals `totalAfterTax - withholdingTax`.
•	[x] Summary card displays formatted values with two decimal digits.

---

## US-ORD-04: Decoupled One-Click Direct Invoicing from Sales Order

User Story Card:  
AS A Van Sales Representative  
I WANT TO toggle "إصدار فاتورة مبيعات مباشرة" (Direct Invoice) when saving a Sales Order  
SO THAT an official Sales Invoice is instantaneously generated from the order while ensuring that any invoice generation errors never roll back or lose my saved Sales Order.

________________________________________
Story Dependencies
•	US-ORD-01, US-ORD-02, US-ORD-03  
•	`storageService.saveOrder`  
•	`storageService.saveInvoice`  
•	Tab navigation to Invoices Screen (`setActiveTab(1)`)  
________________________________________
Story Inputs
Field / Item | Data Type | Format / Example | Remarks
--- | --- | --- | ---
Direct Invoice Checkbox | Boolean | `true` \| `false` (default: `false`) | Toggled on Review Step 3.
Saved Sales Order Object | SalesOrder | Order with `orderNumber: "SO-2026-1044"` or `"DRAFT-EDA50-1044"` | Passed to invoice generator as linked reference.
Initial Payment Status | String / Enum | `isCashPayment: false`, `paidAmount: 0`, `remainingBalance: netDue` | Direct invoice from order is created as credit invoice initially.
Invoice Status | String / Enum | `'issued'` | Instant issuance status.
________________________________________
Logic Workflow
1. User inspects review screen on Step 3 and checks the toggle "إصدار فاتورة مبيعات مباشرة للطلب".
2. User taps "حفظ الطلب" (Save Order).
3. Primary Action: System calls `storageService.saveOrder()`. The order is saved to local database with a generated order number (`SO-...` if online or `DRAFT-EDA50-...` if offline).
4. System reloads the orders list.
5. Secondary Action: If `directInvoice === true`:
   - System wraps the secondary invoice creation in an isolated `try / catch` block.
   - System copies customer, items, and financial totals into `storageService.saveInvoice({ linkedOrderNumber: newOrder.orderNumber, ... })`.
   - On success: Plays success sound, displays toast confirming order and invoice numbers, resets form, and automatically switches active tab to `1` (Invoices) so the rep can collect cash.
   - On catch (failure): Order remains safely saved; system shows a warning toast ("Order saved, but direct invoice failed") and returns to orders list without crashing.
________________________________________
Business Rules
Case | Input | Expected Result
--- | --- | ---
Direct Invoice Enabled & Success | `directInvoice = true`, valid order | Order saved; Invoice saved with `linkedOrderNumber = order.orderNumber`; toast shows both IDs; screen navigates to Invoices Tab.
Direct Invoice Disabled | `directInvoice = false`, valid order | Order saved; no invoice created; toast confirms order creation; stays on Orders list.
Invoice Creation Error | `directInvoice = true`, invoice creation throws exception | Order is preserved in storage; error is caught; warning toast displayed; order is not rolled back.
Offline Mode Direct Invoice | Device offline (`isOnline = false`) | Both Order and Invoice are assigned provisional IDs (`DRAFT-EDA50-XXXX`); both queued in Outbox with `syncStatus: 'pending'`.
________________________________________
Story Output
Case | Input | Expected Result
--- | --- | ---
Order + Invoice Created | Valid submission | Orders array length incremented by 1; Invoices array length incremented by 1; Tab switched to Invoices.
Order Created Only | `directInvoice = false` | Orders array incremented by 1; Invoices untouched; Tab remains Orders.
________________________________________
Use Case
•	Van salesperson sells goods on the spot, saves the order, and automatically transitions to the invoice to print the fiscal tax receipt and take payment.
________________________________________
UI/UX
•	Distinct toggle switch with receipt icon and descriptive subtitle.
•	Seamless screen transition to Invoices tab with imported totals ready for cash collection.
________________________________________
Non-Functional Requirements
•	Atomic isolation: Failure in invoice creation must NEVER corrupt or delete the saved order.
•	Execution time for dual save under 250ms on mobile storage.
________________________________________
Definition of Done
•	[x] Toggle checkbox exists on Step 3.
•	[x] Order is saved first before invoice attempt.
•	[x] Invoices tab is opened automatically upon successful dual save.
•	[x] Exception isolation tested and verified.

---

## US-ORD-05: Filter, Search & View Detailed Sales Order History

User Story Card:  
AS A Sales Representative or Warehouse Supervisor  
I WANT TO search, filter, and inspect past sales orders by order number, customer name, date range, and sync status  
SO THAT I can track order progress, review line items, and reprint order vouchers in the field.

________________________________________
Story Dependencies
•	`OrdersScreen.tsx` list view  
•	`ReceiptModal` for order voucher preview and print  
•	Outbox / Sync status indicators  
________________________________________
Story Inputs
Field / Item | Data Type | Format / Example | Remarks
--- | --- | --- | ---
Filter Search Query | String | "الأمل" or "SO-2026" | Text search against customer name and order number.
Filter Date From | String (Date) | `YYYY-MM-DD` | Start date filter.
Filter Date To | String (Date) | `YYYY-MM-DD` | End date filter.
Filter Status | String / Enum | `'all'` \| `'draft'` \| `'confirmed'` \| `'delivered'` \| `'cancelled'` | Status dropdown filter.
Filter Customer | String | "cust-1" or name | Customer specific filter.
________________________________________
Logic Workflow
1. User opens Orders tab (Tab 0).
2. System fetches all orders from `storageService.getOrders()`.
3. User toggles the filter panel using the "تصفية" (Filter) button.
4. User enters criteria (e.g. search string or status).
5. Orders list immediately filters in real-time.
6. User taps an order card to expand line items, totals, and requester information.
7. User taps "طباعة السند" (Print Voucher): opens `ReceiptModal` with type `'order'`.
________________________________________
Business Rules
Case | Input | Expected Result
--- | --- | ---
Search by Order Number | Query = "SO-2026-1044" | Displays exact matching order; non-matching orders hidden.
Search by Customer Name | Query = "الأمل" | Displays all orders where customer name includes substring.
Filter by Status | Status = "confirmed" | Displays only confirmed orders; pending drafts hidden.
Date Range Filter | Date from `2026-09-01` to `2026-09-30` | Displays only orders created within September 2026.
Outbox Status Badge | Order sync status `'pending'` | Displays amber clock icon with "قيد المزامنة" badge.
Order Details Modal | Tap card | Opens comprehensive details sheet showing customer info, warehouse, rep, items table, and tax calculations.
________________________________________
Story Output
Case | Input | Expected Result
--- | --- | ---
Matching orders exist | Matching filter query | Filtered list rendered with count badge.
No matching orders | Query = "NonExistent999" | Displays `EmptyState` component with "لا توجد طلبات مطابقة" and reset filters button.
________________________________________
Use Case
•	Sales rep checks previous orders placed yesterday for a grocery store to avoid duplicate item ordering.
________________________________________
UI/UX
•	Collapsible filter drawer with clear all filters action.
•	Card-based list items showing order number, customer name, date, net due, and sync badge.
•	Receipt action button on each card for quick printing.
________________________________________
Non-Functional Requirements
•	Filter responsiveness under 16ms (60 FPS feel) for lists up to 500 orders.
________________________________________
Definition of Done
•	[x] Real-time text search operates on order numbers and customer names.
•	[x] Date range and status dropdown filters function correctly.
•	[x] Order card opens detail view.
•	[x] Receipt modal opens with formatted order voucher.

---

# Module 2: Sales Invoices & Immediate Cash Settlement

## US-INV-01: Convert Sales Order to Official Sales Invoice

User Story Card:  
AS A Sales Representative  
I WANT TO import an existing confirmed Sales Order into the Invoice Creation Wizard  
SO THAT all items, customer billing details, and pricing structures are carried over without manual re-entry.

________________________________________
Story Dependencies
•	`OrdersScreen` confirmed orders in storage  
•	`InvoicesScreen.tsx` Wizard Step 1  
•	Audio feedback service  
________________________________________
Story Inputs
Field / Item | Data Type | Format / Example | Remarks
--- | --- | --- | ---
Confirmed Sales Order Selection | Object (SalesOrder) | Order `SO-2026-1001` selected from order list drawer | Source order for invoice generation.
Invoice Date | String (Date) | `YYYY-MM-DD` | Date of invoice issuance.
Invoice Type | String / Enum | `'credit'` (default) \| `'cash'` | Determines default settlement expectation.
________________________________________
Logic Workflow
1. User navigates to Invoices Tab (Tab 1) and taps "فاتورة جديدة" (New Invoice).
2. On Step 1 (Order/Customer Selection), user clicks "ربط بطلب بيع موجود" (Link Existing Sales Order).
3. System displays a modal with confirmed sales orders.
4. User selects a target order.
5. System executes `handleLinkOrder(order)`:
   - Sets `selectedOrder = order`
   - Populates `selectedCustomer` with order's customer details.
   - Populates `warehouse` and `subCompany` from order.
   - Copies all `items` from order into invoice line items.
   - Plays scan success sound and displays toast: "تم استيراد X أصناف من الطلب: Y".
6. User reviews items and advances through the invoice wizard.
________________________________________
Business Rules
Case | Input | Expected Result
--- | --- | ---
Valid Order Linked | Confirmed order selected | All fields populated; items table populated; `linkedOrderNumber` recorded in invoice.
Manual Customer Override after link | User changes customer | Warns user that changing customer will detach the linked order reference.
Items Modification | User modifies quantities on Step 2 | Allowed; invoice reflects actual delivered quantities; totals recalculated.
________________________________________
Story Output
Case | Input | Expected Result
--- | --- | ---
Order Linked | Order `SO-2026-1001` | Invoice draft populated; Step 1 marked complete; line items populated in Step 2.
________________________________________
Use Case
•	Driver delivers goods ordered yesterday, pulls up the confirmed sales order on the handheld, converts it to an invoice, and presents it to the store manager.
________________________________________
UI/UX
•	Badge showing "مرتبط بطلب: SO-2026-XXXX" with a button to unlink if needed.
•	Automatic step progression to Step 2 once an order is selected.
________________________________________
Non-Functional Requirements
•	Immediate data mapping with zero latency.
________________________________________
Definition of Done
•	[x] User can browse and select confirmed orders from invoice screen.
•	[x] Items, customer, and warehouse are copied correctly.
•	[x] Linked order number is saved in the generated invoice.

---

## US-INV-02: Direct Sales Invoice Creation (Cash vs. Credit)

User Story Card:  
AS A Sales Representative / Cashier  
I WANT TO create a direct sales invoice without an existing sales order and specify its billing type (Cash vs. Credit)  
SO THAT I can serve walk-in wholesale clients and on-the-spot delivery customers quickly.

________________________________________
Story Dependencies
•	`CustomerPicker` component  
•	`LineItemEditor` component  
•	Lookup data (Warehouses, Sub-companies)  
________________________________________
Story Inputs
Field / Item | Data Type | Format / Example | Remarks
--- | --- | --- | ---
Customer | Customer Object | `cust-2` / "شركة النور للمواد الغذائية" | Selected customer account.
Invoice Type | String / Enum | `'cash'` \| `'credit'` | Sets legal invoice type classification.
Warehouse | String | "المستودع الرئيسي" | Inventory deduction source.
Line Items | Array<LineItem> | Array of scanned items with pricing | Items sold on the invoice.
________________________________________
Logic Workflow
1. User taps "فاتورة جديدة" on Invoices screen.
2. Step 1: User skips order linking and selects a customer directly via `CustomerPicker`.
3. User toggles Invoice Type between "فاتورة نقدية" (Cash) and "فاتورة آجلة" (Credit).
4. Step 2: User adds line items via barcode scanning or manual search.
5. Step 3: User reviews document financial totals (Gross, Discount, Tax 14%, WHT 1%, Net Due).
6. User proceeds to settlement configuration.
________________________________________
Business Rules
Case | Input | Expected Result
--- | --- | ---
Credit Invoice Selected | `invoiceType = 'credit'` | Invoice generated with status `'issued'`, `isCashPayment: false`, `settlementStatus: 'unpaid'`. Customer AR balance increased by Net Due.
Cash Invoice Selected | `invoiceType = 'cash'` | Enables immediate cash payment inputs and prompts user to collect cash.
Empty Customer | `selectedCustomer = null` | Advance blocked with error message.
Empty Items | `items.length = 0` | Advance blocked with error message.
________________________________________
Story Output
Case | Input | Expected Result
--- | --- | ---
Credit Invoice Saved | `invoiceType = 'credit'` | Invoice stored with `INV-...` or `DRAFT-...`; customer balance updated; outbox updated.
________________________________________
Use Case
•	Sales representative visits a regular credit customer, scans items left at the store, and issues a credit invoice payable in 30 days.
________________________________________
UI/UX
•	Toggle buttons for "نقدي" (Cash) and "آجل" (Credit) with visual icon highlights.
•	Clear balance and credit limit indicators.
________________________________________
Non-Functional Requirements
•	Immediate local persistence in IndexedDB / LocalStorage.
________________________________________
Definition of Done
•	[x] User can create an invoice without a source order.
•	[x] Cash vs Credit selection switches invoice workflow appropriately.
•	[x] Credit limit and current balance display for selected customer.

---

## US-INV-03: Immediate Cash Settlement with AuthGate PIN Verification

User Story Card:  
AS A Sales Representative and Company Cashier  
I WANT TO collect cash payments at the time of invoice issuance, enter the collected amount using a touchscreen numeric keypad, and verify my 4-digit PIN  
SO THAT cash collections are authenticated, securely logged into company records, and protected against unauthorized tampering.

________________________________________
Story Dependencies
•	`NumericKeypad` custom component  
•	`AuthGate` PIN modal component  
•	Audio feedback service (`soundService`)  
•	`storageService.saveInvoice` cash settlement logic  
________________________________________
Story Inputs
Field / Item | Data Type | Format / Example | Remarks
--- | --- | --- | ---
Immediate Cash Payment Toggle | Boolean | `true` \| `false` | Enables cash payment flow on Step 3.
Paid Amount Input | String / Number | `"1500.00"` | Amount physically collected in cash; entered via `NumericKeypad`.
Supervisor / Rep 4-digit PIN | String | `"1234"` / `"0000"` | Security authentication code required for cash transactions.
Cash Receipt Date | String (Date) | `YYYY-MM-DD` | Timestamp of physical cash handover.
________________________________________
Logic Workflow
1. On Step 3 of the Invoice Wizard, user checks "تحصيل نقدي فوري" (Immediate Cash Payment).
2. A high-contrast `NumericKeypad` appears with quick denomination buttons (Exact Amount, 100, 200, 500).
3. User enters the cash collected amount. System dynamically calculates:
   - `numericPaidAmount = min(paidAmountInput, netDue)`
   - `remainingAmount = max(0, netDue - paidAmountInput)`
   - Displays real-time settlement status: "سداد كامل" (Full Paid) if remaining is 0, or "سداد جزئي" (Partial) if remaining > 0.
4. User taps "حفظ وإصدار الفاتورة" or "حفظ وطباعة الفاتورة".
5. Validation:
   - If `paidAmountInput <= 0`: throws error "يرجى إدخال مبلغ محصل أكبر من صفر".
   - If `paidAmountInput > netDue`: throws error "المبلغ المحصل لا يمكن أن يتجاوز إجمالي الفاتورة".
6. System opens the `AuthGate` PIN modal: "تأكيد حركة نقدية - أدخل الرقم السري للمندوب".
7. User enters the 4-digit PIN.
8. Upon valid PIN entry:
   - System commits the invoice to storage with cash flags.
   - Triggers customer and representative ledger balance updates.
   - If user selected "Save & Print", opens the `ReceiptModal`.
________________________________________
Business Rules
Case | Input | Expected Result
--- | --- | ---
Full Cash Payment | Net Due = 1,017.00, Paid = 1,017.00 | AuthGate opens; upon PIN verification, invoice saved with `settlementStatus: 'paid'`, `remainingBalance: 0.00`.
Partial Cash Payment | Net Due = 1,017.00, Paid = 500.00 | AuthGate opens; upon PIN verification, invoice saved with `settlementStatus: 'partial'`, `remainingBalance: 517.00`.
Zero or Negative Cash | Paid = 0 | Error toast; audio error tone; blocks AuthGate.
Cash Exceeds Net Due | Net Due = 1,000, Paid = 1,200 | Error toast: collected cash cannot exceed invoice net total; blocks AuthGate.
Incorrect PIN in AuthGate | PIN ≠ authorized PIN | AuthGate displays "الرمز السري غير صحيح"; vibrates/plays error tone; prevents invoice commit.
________________________________________
Story Output
Case | Input | Expected Result
--- | --- | ---
Authenticated Cash Invoice | Valid PIN & valid paid amount | Invoice saved as issued; cash receipt recorded; receipt modal opened.
AuthGate Cancelled | User clicks "X" on AuthGate | Returns to Step 3 review screen; no changes committed.
________________________________________
Use Case
•	Sales representative collects 2,500 EGP cash from a merchant for an invoice, types 2500 on the keypad, enters PIN 1234, and hands the printed receipt to the customer.
________________________________________
UI/UX
•	Large touch-friendly numeric keypad buttons (0-9, backspace, clear) designed for fast single-hand thumb typing on mobile handhelds.
•	Visual color badges: Green for full settlement, Amber for partial payment.
•	Security AuthGate modal with obscured PIN dots.
________________________________________
Non-Functional Requirements
•	PIN verification executed locally in under 10ms.
•	No plain-text PIN logging in browser console.
________________________________________
Definition of Done
•	[x] Numeric keypad inputs cash amounts accurately.
•	[x] Dynamic calculation of remaining balance and settlement status.
•	[x] AuthGate PIN prompt intercepts cash save action.
•	[x] Valid PIN commits transaction; invalid PIN halts flow.

---

## US-INV-04: Automatic Customer AR & Representative Petty Cash Custody Update

User Story Card:  
AS AN Accounting Controller & Sales Representative  
I WANT TO have the system automatically credit the customer's account receivable balance and debit my personal petty cash custody (رصيد العهدة) when cash is collected  
SO THAT financial balances, cash-on-hand liability, and customer account statements are always synchronized and audit-ready.

________________________________________
Story Dependencies
•	US-INV-03 (Immediate Cash Collection committed)  
•	`storageService.updateCustomerBalance`  
•	`storageService.updateRepPettyCashBalance`  
•	`storageService.recordPettyCashTransaction`  
________________________________________
Story Inputs
Field / Item | Data Type | Format / Example | Remarks
--- | --- | --- | ---
Customer ID | String | `"cust-1"` | Customer whose debt is reduced.
Representative ID / Name | String | `"rep-sa"` / `"Ahmed Mostafa"` | Representative who received the physical cash.
Collected Cash Amount | Number | `1500.00` | Net cash received.
Invoice Number | String | `"INV-2026-1002"` | Audit reference linking the cash transaction.
Transaction Date | String (ISO) | `2026-09-29T11:20:00Z` | Timestamp of custody update.
________________________________________
Logic Workflow
1. Inside `storageService.saveInvoice()`, system detects `paidAmount > 0`:
2. Action A (Customer Ledger): Calls `updateCustomerBalance(inv.customerId, -paidAmount)`. The customer's `currentBalance` in storage is decremented by the collected amount (reducing customer debt).
3. Action B (Representative Custody): Calls `updateRepPettyCashBalance(inv.salesRep, paidAmount)`. The representative's `pettyCashBalance` is incremented by the collected amount (increasing the rep's cash liability).
4. Action C (Audit Log): Calls `recordPettyCashTransaction()` creating a transaction with:
   - `type: 'collection'`
   - `amount: paidAmount`
   - `invoiceNumber: newInvoice.invoiceNumber`
   - `customerName: inv.customerName`
   - `notes: "تحصيل نقدي عند إصدار الفاتورة (INV-...)"`
5. The transaction is prepended to the petty cash ledger array.
________________________________________
Business Rules
Case | Input | Expected Result
--- | --- | ---
Cash Collected on Invoice | Invoice Net Due = 1,000, Paid = 1,000 | Customer balance reduced by 1,000; Rep petty cash increased by 1,000; Collection transaction created in petty cash ledger.
Credit Invoice (No Cash) | Paid = 0 | Customer balance not decreased; Rep petty cash unchanged; No petty cash transaction logged.
Customer Balance Floor | Customer balance = 300, Paid = 500 | `Math.max(0, currentBalance - paid)` prevents negative customer balance in cash sales.
Rep Custody Attribution | Rep identifier match | System matches rep by `id`, `username`, `displayName`, or `badgeNumber`; falls back to active session rep.
________________________________________
Story Output
Case | Input | Expected Result
--- | --- | ---
Cash Invoice Executed | Paid = 1,500.00 | Customer AR updated; Rep custody card reflects +1,500.00; Ledger displays new collection entry.
________________________________________
Use Case
•	At the end of the shift, the supervisor inspects the representative's screen and confirms that the physical cash in the driver's money bag exactly matches the "رصيد العهدة" (Custody Balance).
________________________________________
UI/UX
•	Toast notification explicitly states: "تم إصدار الفاتورة: INV-... (تحصيل: X ج.م)".
•	Representative screen immediately updates metrics without requiring a manual refresh.
________________________________________
Non-Functional Requirements
•	Atomic local data updates to prevent desynchronization between invoice table and ledger table.
________________________________________
Definition of Done
•	[x] Customer balance decremented by paid amount.
•	[x] Representative petty cash balance incremented by paid amount.
•	[x] Collection record written to `PettyCashTransaction` ledger.

---

## US-INV-05: Invoice History, Payment Status Tracking & Printing

User Story Card:  
AS A Sales Representative  
I WANT TO search, filter by settlement status, inspect line items, and print ESC/POS simplified tax receipts for past invoices  
SO THAT I can verify sales transactions, provide duplicate receipts, and audit open customer invoices.

________________________________________
Story Dependencies
•	`InvoicesScreen.tsx` list view  
•	`ReceiptModal.tsx` ESC/POS thermal printing service  
•	Invoice storage records  
________________________________________
Story Inputs
Field / Item | Data Type | Format / Example | Remarks
--- | --- | --- | ---
Search Query | String | "INV-2026" or "مؤسسة الأمل" | Keyword filter.
Filter Status | String / Enum | `'all'` \| `'unpaid'` \| `'partial'` \| `'paid'` | Settlement filter.
Filter Type | String / Enum | `'all'` \| `'cash'` \| `'credit'` | Invoice type filter.
________________________________________
Logic Workflow
1. User opens Invoices Tab (Tab 1).
2. System loads invoices from `storageService.getInvoices()`.
3. Filter chips allow fast segmentation: "الكل" (All), "غير مسدد" (Unpaid), "مسدد جزئياً" (Partial), "مسدد بالكامل" (Paid).
4. Each invoice card displays:
   - Invoice number and linked order number (if applicable).
   - Customer name, branch, and date.
   - Net Due, Paid Amount, and Remaining Balance.
   - Sync status badge (synced / pending).
5. User taps "طباعة الفاتورة" (Print Invoice): opens `ReceiptModal` with type `'invoice'`.
6. User taps the card body: opens full-screen invoice details modal showing complete line items and tax breakdown.
________________________________________
Business Rules
Case | Input | Expected Result
--- | --- | ---
Filter by 'unpaid' | Status = 'unpaid' | Displays only invoices where `remainingBalance == netDue`.
Filter by 'paid' | Status = 'paid' | Displays only invoices where `remainingBalance == 0`.
Filter by 'partial' | Status = 'partial' | Displays invoices where `0 < paidAmount < netDue`.
Print Invoice | User taps receipt button | Modal launches; renders 58mm or 80mm ESC/POS layout with ZATCA compliant QR code.
Share Invoice | User taps share button | Invokes Web Share API (or copies invoice summary to clipboard) for WhatsApp sharing with customer.
________________________________________
Story Output
Case | Input | Expected Result
--- | --- | ---
Invoice List Loaded | 10 invoices in storage | List rendered with status tags, totals, and action buttons.
Receipt Triggered | Selected invoice | Thermal print modal active with receipt layout.
________________________________________
Use Case
•	Customer asks for a duplicate receipt of an invoice issued 3 hours ago. Rep searches by invoice number and re-prints the receipt instantly.
________________________________________
UI/UX
•	High-contrast badges: Green (`bg-emerald-500/10 text-emerald-500`) for Paid, Amber (`bg-amber-500/10 text-amber-500`) for Partial, Rose (`bg-rose-500/10 text-rose-500`) for Unpaid.
•	Quick-action icon buttons for Print, Share, and Details.
________________________________________
Non-Functional Requirements
•	Modal render time under 100ms.
________________________________________
Definition of Done
•	[x] Filtering by unpaid, partial, and paid accurately partitions the invoices.
•	[x] Invoice details modal presents complete itemized lines.
•	[x] Print button opens ReceiptModal with accurate invoice data.

---

# Module 3: Direct Point of Sale (POS) Fast Terminal

## US-POS-01: Fast Barcode Scanning & Quick Cart Building

User Story Card:  
AS A Van Salesperson / Retail Cashier  
I WANT TO rapidly scan item barcodes and add items to a live point-of-sale cart with instant quantity increments  
SO THAT I can serve walk-in customers and high-velocity retail sales with minimal screen touches.

________________________________________
Story Dependencies
•	`PosScreen.tsx` Terminal View  
•	Hardware Scanner Listener / Camera Barcode Scanner  
•	`storageService.getProducts`  
•	Audio feedback service (`playScanSuccess`, `playError`)  
________________________________________
Story Inputs
Field / Item | Data Type | Format / Example | Remarks
--- | --- | --- | ---
Scanned Barcode / Code | String | `"622300000101"` or `"ITEM-101"` | Scanned via Honeywell physical button or on-screen camera modal.
Customer (Walk-in) | Customer Object | Default: `cust-walkin` ("عميل نقدي / عام") | Defaulted to general cash customer; editable.
Cart Items | Array<LineItem> | Scanned line items list | Live cart items.
________________________________________
Logic Workflow
1. User opens POS Tab (Tab 2 - Central FAB button on Bottom Navigation).
2. POS Terminal view is displayed with customer bar, cart table, and action bottom ribbon.
3. User scans a product barcode:
   - System executes `handleProcessCode(scannedCode)`.
   - Searches Product Catalog by `code === trimmed || barcode === trimmed`.
4. If found:
   - If item already in cart: increments `enteredQty` by 1 and updates `lineTotal`.
   - If item not in cart: creates new line item with `enteredQty: 1`, default price, zero discount, and appends to cart.
   - Plays `soundService.playScanSuccess()`.
   - Shows feedback indicator.
5. If not found:
   - Plays `soundService.playError()`.
   - Displays toast: "الصنف غير موجود في قاعدة البيانات المحلية".
6. User can also tap "تحميل أصناف تجريبية" for quick load testing of 20 sample items.
________________________________________
Business Rules
Case | Input | Expected Result
--- | --- | ---
Scan Existing Item | Barcode for item already in cart | Item quantity increases by 1; line total updates; cart gross total updates; success chime.
Scan New Item | Barcode for item not yet in cart | Item appended to cart with quantity 1; success chime.
Unknown Barcode | Barcode `999999999999` | Item not found; error sound played; toast notification displayed.
Empty Cart Guard | User taps "دفع" (Pay) with 0 items | Action rejected; error sound; toast: "سلة المشتريات فارغة!".
Change Customer | Tap customer banner | Opens `CustomerPicker`; allows selecting specific account instead of Walk-in.
________________________________________
Story Output
Case | Input | Expected Result
--- | --- | ---
Product Scanned | Valid product code | Cart list updated; item count badge incremented; subtotal recalculated.
________________________________________
Use Case
•	Cashier at a mobile sales van scans 3 bags of potato chips in 2 seconds; each beep increments the quantity on the display without any typing.
________________________________________
UI/UX
•	Compact, high-density line item rows displaying item thumbnail, name, unit price, quantity steppers, and line total.
•	Sticky bottom checkout bar showing: Total Items, Net Total, and large "الدفع" (Checkout) button.
________________________________________
Non-Functional Requirements
•	Scan-to-cart latency < 40ms.
•	Zero UI freeze when rapidly scanning consecutive barcodes.
________________________________________
Definition of Done
•	[x] Barcode scanning finds products and adds them to cart.
•	[x] Repeated scans increment quantity.
•	[x] Sound feedback on scan success and error.
•	[x] Subtotal updates dynamically.

---

## US-POS-02: POS Checkout with Cash / Card & Change Due Calculation

User Story Card:  
AS A Retail Cashier / Sales Rep  
I WANT TO select Cash or Card payment, enter the customer's cash tender, and automatically view the change due (الباقي)  
SO THAT I can accurately collect money, give correct change, and finalize the sale within seconds.

________________________________________
Story Dependencies
•	US-POS-01 (Cart built with items)  
•	`calculateDocumentTotals` (VAT 14%, no WHT on direct retail POS)  
•	`PosPaymentSheet` / Payment Bottom Sheet  
________________________________________
Story Inputs
Field / Item | Data Type | Format / Example | Remarks
--- | --- | --- | ---
Payment Method | String / Enum | `'cash'` \| `'card'` | Toggle between Cash and Credit Card / Mada.
Amount Paid | Number | `200.00` | Cash tendered by customer; defaults to `netDue` for Card.
Net Due | Number | `175.50` | Total payable amount including 14% VAT.
Change Due | Number (Computed) | `Math.max(0, amountPaid - netDue)` | Change to be returned to customer.
________________________________________
Logic Workflow
1. User taps "الدفع" (Pay) from the POS Terminal screen.
2. System validates cart is not empty. Opens the Payment Bottom Sheet (`setHideBottomNav(true)`).
3. If user selects "بطاقة بنكية" (Card):
   - System automatically sets `amountPaid = netDue`.
   - `changeDue` evaluates to `0.00`.
   - User taps "تأكيد الدفع بالبطاقة" to commit immediately.
4. If user selects "نقداً" (Cash):
   - Quick denomination chips are provided (Exact Amount, 50, 100, 200, 500).
   - User types the cash tendered using keypad.
   - System calculates `changeDue = max(0, amountPaid - netDue)`.
   - If `amountPaid < netDue`: Pay button displays warning "المبلغ غير كافي" and blocks commit.
   - If `amountPaid >= netDue`: Pay button enables and highlights change due in emerald green.
5. User taps "إتمام البيع واستخراج الإيصال" (Complete Sale & Print).
________________________________________
Business Rules
Case | Input | Expected Result
--- | --- | ---
Exact Cash Payment | Net Due = 150.00, Paid = 150.00 | Change Due = 0.00; proceeds to AuthGate.
Overpayment (Change Due) | Net Due = 175.00, Paid = 200.00 | Change Due = 25.00 prominently displayed; proceeds to AuthGate.
Underpayment | Net Due = 175.00, Paid = 150.00 | Pay button disabled; error toast: "المبلغ المدفوع أقل من الإجمالي المستحق".
Card Payment | Net Due = 175.00, Method = 'card' | Paid = 175.00, Change = 0.00; bypasses AuthGate and commits sale directly.
________________________________________
Story Output
Case | Input | Expected Result
--- | --- | ---
Cash Checkout Validated | Paid >= Net Due | Triggers US-POS-03 AuthGate for final commit.
Card Checkout Validated | Card method selected | Commits sale immediately, generates `POS-2026-XXXX`, opens ReceiptModal.
________________________________________
Use Case
•	Customer purchases 135 SAR worth of items, hands the cashier a 200 SAR bill. System calculates 65 SAR change; cashier gives change and completes checkout.
________________________________________
UI/UX
•	Large emerald change due indicator: "الباقي للعميل: 65.00 ج.م / ر.س".
•	Quick buttons for one-tap cash entry.
________________________________________
Non-Functional Requirements
•	Real-time change calculation with zero lag.
________________________________________
Definition of Done
•	[x] Payment method toggle between Cash and Card.
•	[x] Change due computes accurately.
•	[x] Insufficient payment is prevented from completing.

---

## US-POS-03: Cash Authentication Gate & Shift Cash Accountability

User Story Card:  
AS A Sales Representative / Cashier  
I WANT TO authenticate cash sales with my security PIN and have the sale recorded in my terminal ledger  
SO THAT my cash intake during the shift is verified and matched to the terminal drawer balance.

________________________________________
Story Dependencies
•	US-POS-02  
•	`AuthGate` component  
•	`storageService.savePosSale`  
•	`openReceipt` (ReceiptModal trigger)  
________________________________________
Story Inputs
Field / Item | Data Type | Format / Example | Remarks
--- | --- | --- | ---
Cashier PIN | String | `"1234"` | 4-digit security PIN.
POS Sale Data | Object (PosSale) | Items, Totals, Customer, Terminal ID | Transaction payload.
Terminal ID | String | `"EDA50-01"` | Identifier of physical handheld unit.
Cashier Name | String | `"SA (Super Admin)"` | Authenticated session username.
________________________________________
Logic Workflow
1. When Cash payment is submitted from the Payment Sheet, `handleInitiatePayment` triggers `setIsAuthGateOpen(true)`.
2. AuthGate modal overlays the screen.
3. User enters the 4-digit PIN.
4. On success:
   - System calls `commitSale()`.
   - `storageService.savePosSale()` generates a receipt number (`POS-2026-XXXX` online or `DRAFT-EDA50-XXXX` offline).
   - System plays success chime: `soundService.playScanSuccess()`.
   - Displays toast: "تم إتمام عملية البيع بنجاح: POS-...".
   - Automatically opens `ReceiptModal` with `receiptType: 'pos'`.
   - Closes the payment sheet, resets terminal to empty cart with Walk-in customer, and reloads sales history.
________________________________________
Business Rules
Case | Input | Expected Result
--- | --- | ---
Valid PIN entered | Correct PIN | Sale committed; receipt modal opens; terminal resets for next customer.
Incorrect PIN | Wrong PIN | AuthGate remains open; displays error; sale is not saved.
Cancel AuthGate | User cancels | Returns to payment sheet; cart and tender amounts preserved.
Auto-Print on Checkout | `printerSettings.autoPrintOnCheckout = true` | Receipt modal immediately sends print command to thermal/bluetooth printer upon opening.
________________________________________
Story Output
Case | Input | Expected Result
--- | --- | ---
Completed POS Sale | Valid checkout | Saved to `eda50_pos_sales` in local storage; Outbox updated; ReceiptModal rendered.
________________________________________
Use Case
•	Cashier finishes transaction, enters PIN, the Bluetooth belt printer prints the tax receipt automatically, and the screen resets ready for the next customer in line.
________________________________________
UI/UX
•	Smooth transition from Payment Bottom Sheet -> AuthGate -> Receipt Modal -> Fresh Terminal.
________________________________________
Non-Functional Requirements
•	Total completion and receipt launch cycle under 300ms.
________________________________________
Definition of Done
•	[x] AuthGate enforces PIN on cash transactions.
•	[x] Sale saved with date, time, cashier name, and terminal ID.
•	[x] Terminal resets to empty cart after completion.
•	[x] Receipt modal opens automatically.

---

## US-POS-04: POS Transaction History, Receipt Reprinting & Filtering

User Story Card:  
AS A Cashier or Auditor  
I WANT TO view historical POS sales transactions, filter them by receipt number or payment method, and reprint receipts  
SO THAT I can audit daily shift revenue, resolve customer receipt disputes, and monitor terminal performance.

________________________________________
Story Dependencies
•	`PosScreen.tsx` (View mode `'history'`)  
•	`storageService.getPosSales`  
•	`ReceiptModal.tsx`  
________________________________________
Story Inputs
Field / Item | Data Type | Format / Example | Remarks
--- | --- | --- | ---
Filter Receipt No | String | `"POS-2026"` | Filter by receipt number.
Filter Payment Method | String / Enum | `'all'` \| `'cash'` \| `'card'` | Filter by payment tender.
View Toggle | String / Enum | `'terminal'` \| `'history'` | Header tab toggle.
________________________________________
Logic Workflow
1. User taps "سجل العمليات" (History) on the POS screen header.
2. System renders historical POS transactions.
3. User filters by Cash or Card transactions.
4. Each row displays receipt number, timestamp, cashier name, customer, total net due, and payment badge.
5. User taps "إعادة طباعة" (Reprint): opens `ReceiptModal` with the historical sale data.
________________________________________
Business Rules
Case | Input | Expected Result
--- | --- | ---
Filter Cash Sales | Method = 'cash' | Shows only sales paid in cash.
Filter Card Sales | Method = 'card' | Shows only sales processed via card terminal.
Reprint Receipt | Tap reprint icon | Launches ReceiptModal with original receipt number, timestamp, and itemized lines.
Toggle back to Terminal | Tap 'terminal' tab | Returns to active POS cart without losing any in-progress cart data.
________________________________________
Story Output
Case | Input | Expected Result
--- | --- | ---
History View Active | Sales exist in storage | Transaction list rendered with totals and status indicators.
________________________________________
Use Case
•	Customer returns to the van asking for a copy of their receipt from 20 minutes ago. Cashier searches history, locates the sale, and reprints the thermal voucher.
________________________________________
UI/UX
•	Clean list view with payment method icons (Banknote for cash, CreditCard for card).
•	Direct reprint action button on every card.
________________________________________
Non-Functional Requirements
•	Instant toggle between Terminal and History views without state loss.
________________________________________
Definition of Done
•	[x] User can switch between Terminal and History views.
•	[x] History list renders all POS transactions.
•	[x] Payment method filter functions properly.
•	[x] Reprint button opens ReceiptModal with exact transaction details.

---

# Module 4: Sales Returns & Reverse Logistics

## US-RET-01: Create Sales Return Linked to Original Sales Order

User Story Card:  
AS A Field Sales Representative  
I WANT TO create a Sales Return voucher by referencing an original Sales Order and selecting returned items  
SO THAT returned goods are officially logged against the customer's order history with full tax reversal.

________________________________________
Story Dependencies
•	`ReturnsScreen.tsx` Return Wizard  
•	`storageService.getOrders`  
•	`storageService.saveReturn`  
•	LineItemEditor with `maxReturnQty` validation  
________________________________________
Story Inputs
Field / Item | Data Type | Format / Example | Remarks
--- | --- | --- | ---
Source Sales Order | SalesOrder Object | `SO-2026-1001` | Selected original order to return from.
Return Date | String (Date) | `YYYY-MM-DD` | Date of physical return handover.
Return Reason | String / Selection | "إرجاع بضاعة تالفة أو غير مطابقة للمواصفات" | Business reason code for return.
Return Items | Array<LineItem> | Items with `enteredQty <= maxReturnQty` | Quantities of goods returned.
________________________________________
Logic Workflow
1. User navigates to Returns Tab (Tab 3) and taps "مرتجع جديد" (New Return).
2. Step 1 (Select Order): System displays a list of confirmed sales orders.
3. User selects the original sales order.
4. System executes `handleSelectOrder(order)`:
   - Sets `selectedOrder = order`.
   - Sets `returnItems = order.items.map(it => ({ ...it, maxReturnQty: it.enteredQty, enteredQty: it.enteredQty }))`.
   - Advances wizard to Step 2 (Return Items).
5. User adjusts the returned quantities for each item (items not returned can be set to 0 or removed).
6. System calculates return financial totals:
   - Return Gross Total
   - Return VAT 14%
   - Return WHT 1%
   - Return Net Due
7. User selects or types the Return Reason.
8. User taps "حفظ سند الإرجاع" (Save Return).
________________________________________
Business Rules
Case | Input | Expected Result
--- | --- | ---
Source Order Selected | Order `SO-2026-1001` | Order items imported; `maxReturnQty` set to original ordered quantity for each line.
No Order Selected | `selectedOrder = null` | Advance blocked; toast: "يرجى اختيار طلب البيع الأصلي أولاً".
Quantity Exceeds Max Return | `enteredQty = 15`, `maxReturnQty = 10` | Input clamped or rejected; user cannot return more than what was delivered.
Zero Total Return Items | All items `enteredQty = 0` | Save blocked; toast: "يرجى تحديد كميات مرتجعة أكبر من صفر".
Provisional Offline Return | `isOnline = false` | Return saved with `DRAFT-EDA50-XXXX` and `syncStatus: 'pending'`.
________________________________________
Story Output
Case | Input | Expected Result
--- | --- | ---
Return Successfully Saved | Valid return | Saved to `eda50_returns`; return number generated; initial status `'draft'`; toast confirmation.
________________________________________
Use Case
•	Merchant discovers 2 cartons of expired yogurt delivered last week. Rep selects the original order, sets returned quantity to 2, records "بضاعة منتهية الصلاحية", and saves the return voucher.
________________________________________
UI/UX
•	2-step wizard with header indicating source order reference.
•	Quantity stepper showing maximum allowed limit: "الحد الأقصى للإرجاع: X".
________________________________________
Non-Functional Requirements
•	Validation logic prevents quantity overflow before network submission.
________________________________________
Definition of Done
•	[x] User selects source order to populate return lines.
•	[x] `maxReturnQty` enforcement prevents over-returning.
•	[x] Return totals calculate VAT 14% and WHT 1% correctly.
•	[x] Return voucher saved with linked order reference.

---

## US-RET-02: Strict Return Quantity Validation & Approval Workflow

User Story Card:  
AS A Sales Supervisor or Branch Manager  
I WANT TO review pending sales returns and track their approval status (Draft, Pending Approval, Accepted, Rejected)  
SO THAT damaged inventory returns and credit refunds are audited before warehouse restocking.

________________________________________
Story Dependencies
•	`ReturnsScreen.tsx` list and segment filter  
•	`SalesReturn` status transitions  
•	`ReceiptModal` for return voucher printing  
________________________________________
Story Inputs
Field / Item | Data Type | Format / Example | Remarks
--- | --- | --- | ---
Return Status Filter | String / Enum | `'all'` \| `'draft'` \| `'pending_approval'` \| `'accepted'` \| `'rejected'` | Filter return records.
Active Segment | String / Enum | `'all'` \| `'returns'` \| `'credit_notes'` | Segmented control at top of screen.
Selected Return | SalesReturn Object | Return voucher details | Selected for detail inspection.
________________________________________
Logic Workflow
1. User opens Returns screen (Tab 3).
2. Segment control allows switching between "الكل" (All), "مرتجعات البيع" (Returns), and "مذكرات الائتمان" (Credit Notes).
3. System lists all return records with status badges:
   - `draft` (مسودة) - Slate
   - `pending_approval` (قيد الاعتماد) - Amber
   - `accepted` (معتمد) - Emerald
   - `rejected` (مرفوض) - Red
4. Tapping a return card opens its details modal showing linked order, return reason, returned items, and refund amount.
5. Rep can print the return voucher using the print button.
________________________________________
Business Rules
Case | Input | Expected Result
--- | --- | ---
View Accepted Returns | Filter = 'accepted' | Shows only approved returns where inventory was received back into warehouse.
View Pending Approval | Filter = 'pending_approval' | Displays returns awaiting supervisor sign-off.
Print Return Voucher | Tap print button | Opens ReceiptModal with return document format and QR code.
________________________________________
Story Output
Case | Input | Expected Result
--- | --- | ---
Segment Toggled | User selects 'returns' | Credit notes are filtered out; returns only are displayed.
________________________________________
Use Case
•	Warehouse clerk inspects physical boxes returned by the driver, compares them against the return voucher on the handheld, and accepts the return.
________________________________________
UI/UX
•	Prominent segmented switch at top of screen.
•	Clear reason description displayed on each return card.
________________________________________
Non-Functional Requirements
•	List filtering execution time < 10ms.
________________________________________
Definition of Done
•	[x] Segment toggle filters returns vs credit notes.
•	[x] Status badges accurately represent return state.
•	[x] Return voucher can be reviewed and printed.

---

# Module 5: Credit Notes

## US-CRN-01: Issue Tax Credit Note Linked to Sales Invoice

User Story Card:  
AS A Sales Representative / Accountant  
I WANT TO issue an official Tax Credit Note (إشعار دائن) referencing an issued Sales Invoice  
SO THAT customer debts are credited and fiscal tax authorities are informed of price adjustments or returned goods.

________________________________________
Story Dependencies
•	`ReturnsScreen.tsx` (Credit Note Wizard mode)  
•	`storageService.getInvoices`  
•	`storageService.saveCreditNote`  
•	Pricing tax utility for credit notes  
________________________________________
Story Inputs
Field / Item | Data Type | Format / Example | Remarks
--- | --- | --- | ---
Source Invoice | SalesInvoice Object | `INV-2026-1002` | Issued sales invoice being credited.
Credit Reason | String / Selection | "خصم تسوية / إرجاع بضاعة" | Reason for issuing credit note.
Credit Note Date | String (Date) | `YYYY-MM-DD` | Date of credit note issuance.
Credit Items | Array<LineItem> | Items credited with quantities and prices | Credited items list.
________________________________________
Logic Workflow
1. On the Returns screen, user taps the "+" button and selects "مذكرة ائتمان جديدة (إشعار دائن)".
2. System sets `createMode = 'credit_note'` and opens the Credit Note Wizard.
3. Step 1: User selects the original sales invoice from a list of issued invoices.
4. System executes `handleSelectInvoice(inv)`:
   - Sets `selectedInvoice = inv`.
   - Imports items with `maxReturnQty = it.enteredQty`.
   - Advances to Step 2.
5. User enters credited quantities and credit reason.
6. System calculates credit totals: Gross, VAT 14%, WHT 1%, Net Credit Amount.
7. User taps "إصدار مذكرة الائتمان" (Issue Credit Note).
8. System generates credit note number (`CR-2026-XXXX` or `DRAFT-EDA50-XXXX`), saves to storage, and shows success toast.
________________________________________
Business Rules
Case | Input | Expected Result
--- | --- | ---
Valid Invoice Linked | Invoice `INV-2026-1002` | Credit note created with `linkedInvoiceNumber: "INV-2026-1002"`; initial status `'approved'`.
No Items Credited | All items qty = 0 | Save blocked; toast: "يرجى تحديد كميات للإشعار الدائن".
Offline Issuance | `isOnline = false` | Issued with provisional ID `DRAFT-EDA50-XXXX`; sync status `'pending'`.
Print Credit Note | Save & Print or tap print | Opens ReceiptModal with official title "إشعار دائن ضريبي" (Tax Credit Note).
________________________________________
Story Output
Case | Input | Expected Result
--- | --- | ---
Credit Note Created | Valid payload | Appended to `eda50_credit_notes`; Outbox count updated; visible under Credit Notes segment.
________________________________________
Use Case
•	Customer was overcharged on an invoice due to a missing promotional discount. Sales rep issues a credit note against the invoice to adjust the balance.
________________________________________
UI/UX
•	Dedicated credit note wizard styling with purple accent colors distinguishing it from standard orders.
•	Source invoice badge and credit total display.
________________________________________
Non-Functional Requirements
•	Compliant with ZATCA and Egyptian Tax Authority credit note linkage requirements (must link to original invoice number).
________________________________________
Definition of Done
•	[x] User can create credit note linked to existing invoice.
•	[x] Line quantities cannot exceed invoiced quantities.
•	[x] Net credit note amount calculated accurately.
•	[x] Saved with `linkedInvoiceNumber`.

---

## US-CRN-02: Credit Note Settlement Tracking & Ledger Reversal

User Story Card:  
AS A Sales Representative / Credit Controller  
I WANT TO track whether a Credit Note has been financially settled against customer balance or remains open  
SO THAT customer account statements accurately reflect unapplied credit balances.

________________________________________
Story Dependencies
•	`CreditNotesScreen.tsx` / `ReturnsScreen.tsx`  
•	`CreditNote.settlementStatus` ('unsettled' | 'settled')  
•	Customer AR balance adjustments  
________________________________________
Story Inputs
Field / Item | Data Type | Format / Example | Remarks
--- | --- | --- | ---
Settlement Status | String / Enum | `'unsettled'` \| `'settled'` | Status of financial application.
Credit Note ID | String | `"cr-1727599000"` | Identifier of credit note.
________________________________________
Logic Workflow
1. User views Credit Notes list in the Returns/Credit Notes screen.
2. System displays settlement badges for each credit note:
   - "غير مسوى" (Unsettled) - Amber badge
   - "تمت التسوية" (Settled) - Emerald badge
3. When an unsettled credit note is applied during account reconciliation, its status transitions to `'settled'`.
4. User can inspect the detailed settlement history on the credit note detail sheet.
________________________________________
Business Rules
Case | Input | Expected Result
--- | --- | ---
New Credit Note | Just created | Defaults to `settlementStatus: 'unsettled'`.
Applied to Invoice | Matched against customer AR | Transitions to `settlementStatus: 'settled'`.
Customer Balance Impact | Credit Note Approved | Reduces customer's outstanding balance in customer directory.
________________________________________
Story Output
Case | Input | Expected Result
--- | --- | ---
Filter by Credit Notes | User selects 'credit_notes' tab | Displays list of credit notes with settlement status and net credit amounts.
________________________________________
Use Case
•	Sales rep reconciles customer account at month-end and applies an unsettled credit note of 500 EGP against an open unpaid invoice.
________________________________________
UI/UX
•	Purple badge for credit note type; colored pill for settlement status.
________________________________________
Non-Functional Requirements
•	Instant filtering and state persistence.
________________________________________
Definition of Done
•	[x] Settlement status clearly displayed on credit note cards.
•	[x] Credit note details viewable in modal.

---

# Module 6: Representative Custody & Petty Cash Management

## US-REP-01: Representative Dashboard, KPI Metrics & Custody Ceiling Monitoring

User Story Card:  
AS A Field Sales Representative  
I WANT TO monitor my real-time KPI metrics (Custody Balance, Allocation Ceiling, Ceiling Usage %, Invoiced Sales, and Collection Rate)  
SO THAT I always know how much company cash I am holding and never breach my authorized custody limit.

________________________________________
Story Dependencies
•	`RepresentativeScreen.tsx` (Overview View)  
•	`storageService.getRepresentatives`  
•	`storageService.getInvoices`  
•	`storageService.getPettyCashTransactions`  
________________________________________
Story Inputs
Field / Item | Data Type | Format / Example | Remarks
--- | --- | --- | ---
Representative Selector | String (ID) | `"rep-sa"` or `"rep-ahmed"` | Select active rep profile (if super admin).
Invoices Dataset | Array<SalesInvoice> | Invoices filtered for this rep | Used to calculate sales and collection metrics.
Petty Cash Balance | Number (Currency) | `14,500.00` EGP | Current physical cash in rep's possession (رصيد العهدة).
Allocation Ceiling | Number (Currency) | `50,000.00` EGP | Maximum allowable cash custody (سقف التخصيص).
Credit Limit | Number (Currency) | `150,000.00` EGP | Representative credit allowance.
________________________________________
Logic Workflow
1. User taps "حسابي" (My Account - Tab 4) on the bottom navigation bar.
2. System loads representative profile and associated sales invoices.
3. System executes KPI calculations:
   - `totalInvoicesCount = repInvoices.length`
   - `totalInvoicesValue = ∑ inv.netDue`
   - `paidAmount = ∑ inv.paidAmount`
   - `unpaidAmount = ∑ inv.remainingBalance`
   - `pettyCash = currentRep.pettyCashBalance`
   - `ceilingUsageRatio = (pettyCash / allocationCeiling) * 100`
   - `collectionRate = (paidAmount / totalInvoicesValue) * 100`
4. The system renders 4 KPI Carousel / Metrics Cards:
   - Card 1: **رصيد العهدة النقدية** (Petty Cash Balance) with ceiling progress bar.
   - Card 2: **إجمالي المبيعات والفواتير** (Total Sales & Invoices Count).
   - Card 3: **المتحصلات النقدية** (Cash Collections & Collection Rate %).
   - Card 4: **المستحقات غير المسددة** (Outstanding Unpaid Invoices).
5. If `ceilingUsageRatio >= 80%`, the progress bar turns amber/red with an alert: "تنبيه: اقتراب رصيد العهدة من سقف التخصيص المعتمد".
________________________________________
Business Rules
Case | Input | Expected Result
--- | --- | ---
Normal Custody | Petty Cash = 10,000, Ceiling = 50,000 | Usage = 20%; progress bar green; status safe.
High Custody Warning | Petty Cash = 42,000, Ceiling = 50,000 | Usage = 84%; progress bar amber/red; warning banner displayed advising bank deposit.
Custody Exceeded | Petty Cash > 50,000 | Usage > 100%; alert prompts immediate handover to branch cashier before taking further cash.
Collection Rate Metric | Total Invoiced = 100,000, Paid = 65,000 | Collection Rate = 65.0%; progress indicator displays collection efficiency.
________________________________________
Story Output
Case | Input | Expected Result
--- | --- | ---
Representative Screen Loaded | Valid rep data | KPI dashboard rendered with real-time figures matching active invoices and transactions.
________________________________________
Use Case
•	Sales rep checks the dashboard after a day of van sales, observes a custody balance of 38,500 EGP (77% of ceiling), and plans a midday bank deposit.
________________________________________
UI/UX
•	Modern card layout with micro-animations, gradient progress bars, and high-visibility typography.
•	Tab switcher between: "نظرة عامة" (Overview), "الفواتير والتحصيل" (Invoices), and "سجل حركات العهدة" (Custody Ledger).
________________________________________
Non-Functional Requirements
•	Metric recalculation completes in < 5ms upon screen focus.
________________________________________
Definition of Done
•	[x] Dashboard displays Petty Cash, Ceiling, Total Sales, and Collection Rate.
•	[x] Ceiling usage progress bar reflects real ratio.
•	[x] Warning triggered when usage exceeds threshold.
•	[x] Representative selector allows switching profiles for admin audit.

---

## US-REP-02: FIFO Auto-Settlement of Representative Unpaid Invoices

User Story Card:  
AS A Sales Representative / Credit Controller  
I WANT TO enter a lump-sum cash amount and execute an automated FIFO (First-In, First-Out) settlement  
SO THAT my oldest unpaid and partially paid customer invoices are systematically settled using available custody funds.

________________________________________
Story Dependencies
•	`storageService.applyFifoSettlement`  
•	`RepresentativeScreen.tsx` FIFO Modal  
•	`AuthGate` component for cash verification  
•	`NumericKeypad` for settlement amount input  
________________________________________
Story Inputs
Field / Item | Data Type | Format / Example | Remarks
--- | --- | --- | ---
Settlement Amount | Number | `5000.00` EGP | Lump-sum cash to distribute across oldest open invoices.
Representative ID | String | `"rep-sa"` | Active representative whose custody is deducted.
Settlement Notes | String | "تسوية متحصلات نقدية للفرع الجنوبي" | Optional remarks.
Security PIN | String | `"1234"` | Required to authorize the financial settlement.
________________________________________
Logic Workflow
1. From Representative Dashboard, user taps "تسوية تلقائية بمبلغ (FIFO)" (Auto FIFO Settlement).
2. FIFO Settlement modal opens with `NumericKeypad`.
3. User enters the settlement amount (e.g., 5,000 EGP).
4. System validates:
   - `settlementAmount > 0`
   - `settlementAmount <= currentRep.pettyCashBalance`. (If greater, displays error: "مبلغ التسوية يتجاوز رصيد العهدة الحالي").
5. User taps "متابعة لتأكيد التسوية".
6. System opens `AuthGate` PIN modal.
7. Upon successful PIN entry, `storageService.applyFifoSettlement()` executes:
   - Fetches all invoices belonging to this rep where `settlementStatus !== 'paid'`.
   - Sorts invoices by `date` ascending (Oldest First - FIFO).
   - Iterates through invoices sequentially:
     * Calculates `remainingOnInvoice = netDue - paidAmount`.
     * `payNow = min(remainingOnInvoice, remainingToSettle)`.
     * Updates invoice `paidAmount += payNow`, `remainingBalance -= payNow`.
     * Updates invoice `settlementStatus` to `'paid'` if balance is 0, or `'partial'` if balance > 0.
     * Decrements `remainingToSettle -= payNow`.
     * Stops when `remainingToSettle === 0` or all invoices settled.
   - Deducts the actual settled amount from the representative's `pettyCashBalance`.
   - Logs a new `PettyCashTransaction` of type `'settlement'` in the custody ledger.
8. Displays success modal/toast: "تمت التسوية بنجاح: تم سداد X فواتير بقيمة Y ج.م".
________________________________________
Business Rules
Case | Input | Expected Result
--- | --- | ---
FIFO Settlement Amount <= Custody | Amount = 3,000, Custody = 10,000 | Oldest invoices settled sequentially up to 3,000; Custody becomes 7,000; Invoices updated; Ledger transaction logged.
Settlement Amount > Custody | Amount = 12,000, Custody = 10,000 | Action blocked; error toast: "مبلغ التسوية يتجاوز رصيد العهدة الحالي (10,000 ج.م)".
Settlement Amount <= 0 | Amount = 0 | Action blocked; error: "يجب أن يكون مبلغ التسوية أكبر من صفر".
No Unpaid Invoices Available | All invoices paid | Action rejected; error: "لا توجد فواتير غير مسددة أو جزئية لهذا المندوب".
Partial Remainder | Invoice 1 needs 2,000, Invoice 2 needs 4,000, Settle = 3,000 | Invoice 1 becomes 'paid' (2,000); Invoice 2 becomes 'partial' (1,000 paid, 3,000 remaining); Settle amount depleted.
________________________________________
Story Output
Case | Input | Expected Result
--- | --- | ---
FIFO Executed | 5,000 EGP settled | Return `{ success: true, settledAmount: 5000, settledInvoicesCount: 3 }`; Invoices updated in storage; Custody reduced by 5,000.
________________________________________
Use Case
•	Representative receives a 10,000 EGP direct deposit from a wholesale client with multiple open past bills; rep runs FIFO Auto-Settlement to automatically clear the 3 oldest invoices.
________________________________________
UI/UX
•	Step-by-step modal with numeric keypad and visual calculation preview.
•	Summary dialogue showing list of invoices affected and remaining custody balance.
________________________________________
Non-Functional Requirements
•	FIFO iteration and persistence executed within 50ms.
•	Atomic transaction guarantee: all updated invoices and custody ledger saved in a single write operation.
________________________________________
Definition of Done
•	[x] Invoices sorted strictly ascending by date (oldest first).
•	[x] Custody balance verified before allowing settlement.
•	[x] Rep petty cash balance decremented by actual settled amount.
•	[x] Ledger logs a 'settlement' transaction.

---

## US-REP-03: Petty Cash Ledger, Cash Collections & Bank Deposit Logging

User Story Card:  
AS A Sales Representative or Branch Cashier  
I WANT TO inspect the itemized petty cash ledger and log physical cash deposits (توريد بنكي / خزينة)  
SO THAT all cash inflows and outflows are accounted for with dates, invoice numbers, and receipts.

________________________________________
Story Dependencies
•	`RepresentativeScreen.tsx` ('ledger' tab)  
•	`storageService.getPettyCashTransactions`  
•	`storageService.recordPettyCashTransaction`  
________________________________________
Story Inputs
Field / Item | Data Type | Format / Example | Remarks
--- | --- | --- | ---
Transaction Type | String / Enum | `'collection'` \| `'settlement'` \| `'deposit'` | Inflow (collection) vs Outflow (settlement, bank deposit).
Transaction Amount | Number | `7500.00` | Monetary value of movement.
Reference / Invoice No | String | `"INV-2026-1004"` or `"DEP-BANK-901"` | Associated invoice or bank deposit slip number.
Notes | String | "إيداع نقدي ببنك الأهلي فرع المعادي" | Reason and bank voucher notes.
________________________________________
Logic Workflow
1. User navigates to Representative screen and clicks the "سجل حركات العهدة" (Custody Ledger) tab.
2. System displays a chronological ledger of all cash movements for this representative.
3. Each entry shows:
   - Movement type icon: Green arrow down for `collection` (+), Red arrow up for `settlement` or `deposit` (-).
   - Amount in EGP/SAR.
   - Timestamp and date.
   - Reference invoice number and customer name.
   - Detailed notes.
4. User can tap "طباعة كشف العهدة" (Print Ledger Report) to generate an 80mm summary receipt of all shift transactions.
________________________________________
Business Rules
Case | Input | Expected Result
--- | --- | ---
Collection Entry | Invoice created with cash | Added to ledger with type `'collection'`; positive sign (+); references invoice.
Settlement Entry | FIFO auto-settlement executed | Added to ledger with type `'settlement'`; negative sign (-); references settled count.
Deposit Entry | Rep transfers cash to main bank | Added to ledger with type `'deposit'`; negative sign (-); reduces rep custody balance.
Rep Filter | Rep = "Ahmed" | Filters ledger to only display transactions belonging to Ahmed.
________________________________________
Story Output
Case | Input | Expected Result
--- | --- | ---
Ledger View Rendered | Transactions in storage | Timeline list rendered with formatted currencies and dates.
Print Ledger Triggered | User taps print | Thermal receipt generated with opening balance, movements, and closing balance.
________________________________________
Use Case
•	Driver drops off 15,000 EGP at the central warehouse cashier at 5 PM. Cashier stamps the deposit, and rep verifies that the ledger records the deposit and clears the custody balance.
________________________________________
UI/UX
•	Financial ledger table with color-coded transaction badges.
•	Print and share actions in top toolbar.
________________________________________
Non-Functional Requirements
•	Scrollable list optimized for 200+ daily transactions.
________________________________________
Definition of Done
•	[x] Ledger lists collections, settlements, and deposits chronologically.
•	[x] Financial signs (+/-) match transaction types.
•	[x] Print report generates consolidated custody summary.

---

# Module 7: Customer Directory & Offline Ledger

## US-CUST-01: Offline Customer Directory Browsing & Multi-Attribute Search

User Story Card:  
AS A Field Sales Representative  
I WANT TO search and browse customer accounts offline using IndexedDB, searching by name, tax number, phone, or membership card  
SO THAT I can immediately look up customer details, balances, and credit limits without cellular coverage.

________________________________________
Story Dependencies
•	`CustomerDirectoryScreen.tsx`  
•	`customerRepository.ts` / IndexedDB  
•	`useCustomers` custom hook  
________________________________________
Story Inputs
Field / Item | Data Type | Format / Example | Remarks
--- | --- | --- | ---
Search Query | String | "الأمل" or "3001234567" or "0501234567" | Live search query.
IndexedDB Database | IDBObjectStore | `customers` store | Local high-capacity persistent storage.
________________________________________
Logic Workflow
1. User opens Customer Directory via Top App Bar menu ("دليل حسابات العملاء").
2. System initializes `useCustomers()` hook and loads customer records from IndexedDB.
3. User types in the search input.
4. System executes query matching across:
   - `customer.name.toLowerCase().includes(q)`
   - `customer.taxNumber.includes(q)`
   - `customer.phone.includes(q)`
   - `customer.cardNumber?.includes(q)`
5. Matching customers are rendered as list cards.
6. Each customer card displays:
   - Avatar with initials.
   - Business name and branch name.
   - Tax ID and phone number.
   - Financial badges: **حد الائتمان** (Credit Limit) and **الرصيد الحالي** (Current Debt).
   - Remaining credit calculation: `creditLimit - currentBalance`.
________________________________________
Business Rules
Case | Input | Expected Result
--- | --- | ---
Search by Business Name | Query = "النور" | Returns all customers whose name contains "النور".
Search by Tax Number | Query = "300" | Returns customers whose tax number matches substring.
Search by Phone | Query = "050" | Returns customers whose phone number matches substring.
Customer Exceeds Credit | `currentBalance > creditLimit` | Badge highlighted in warning amber/red indicating overdue or over-limit account.
Offline Availability | Network offline (`isOnline = false`) | 100% of customer data remains searchable from IndexedDB.
________________________________________
Story Output
Case | Input | Expected Result
--- | --- | ---
Customer Query Entered | Valid search string | Real-time filtered customer list rendered; result count badge updated.
________________________________________
Use Case
•	Sales rep reaches a remote desert warehouse with zero internet connectivity, searches customer tax number, and reviews their credit limit before unloading products.
________________________________________
UI/UX
•	Clean list item cards with phone dial shortcut button and edit button.
•	Empty state with "لا توجد نتائج مطابقة" if no customer matches search.
________________________________________
Non-Functional Requirements
•	IndexedDB search query latency < 15ms for datasets up to 5,000 customers.
________________________________________
Definition of Done
•	[x] Customer directory loads from IndexedDB.
•	[x] Multi-attribute search (name, tax number, phone, card number) functions in real-time.
•	[x] Credit limit and current balance rendered accurately.

---

## US-CUST-02: Create & Edit Customer Accounts with Credit Limits

User Story Card:  
AS A Sales Representative  
I WANT TO register a new customer or edit an existing customer profile with credit limit, tax number, and branch data  
SO THAT new accounts opened in the field are persisted locally in IndexedDB and queued for ERP synchronization.

________________________________________
Story Dependencies
•	`CustomerFormDrawer.tsx`  
•	`customerRepository.create` & `customerRepository.update`  
•	Form validation  
________________________________________
Story Inputs
Field / Item | Data Type | Format / Example | Remarks
--- | --- | --- | ---
Customer Name | String | "سوبرماركت التحرير" | Required; legal trade name.
Tax Number | String | "300987654300003" | 15-digit ZATCA / Tax ID.
Phone Number | String | "01099887766" | Customer contact phone.
Credit Limit | Number | `75000.00` | Authorized maximum credit debt ceiling.
Branch Name | String | "فرع وسط البلد" | Branch location.
Card / Member Number | String | "CARD-8801" | Loyalty / membership identifier.
________________________________________
Logic Workflow
1. User taps "عميل جديد +" (New Customer) or the edit icon on an existing customer card.
2. System opens `CustomerFormDrawer` bottom/side sheet.
3. User fills in customer fields.
4. User taps "حفظ بيانات العميل" (Save Customer).
5. Validation:
   - Name must not be empty.
   - Phone must be valid.
   - Credit limit must be >= 0.
6. System calls `createCustomer(data)` or `updateCustomer(data)` via IndexedDB repository.
7. System plays scan success sound, shows toast ("تمت إضافة العميل بنجاح في IndexedDB"), and refreshes customer directory list.
________________________________________
Business Rules
Case | Input | Expected Result
--- | --- | ---
New Customer Valid | Valid fields | Customer saved with unique ID; persisted in IndexedDB; appears in Customer Directory.
Edit Existing Customer | Updated phone or credit limit | Record updated in IndexedDB; modified timestamp updated; changes reflected across Order/Invoice pickers.
Missing Customer Name | Name = "" | Save blocked; error toast: "يرجى إدخال اسم العميل".
Negative Credit Limit | Credit Limit = -500 | Form validation clamps value to `0.00`.
________________________________________
Story Output
Case | Input | Expected Result
--- | --- | ---
Customer Saved | Form data submitted | Drawer closes; customer directory updates; success toast displayed.
________________________________________
Use Case
•	Sales rep signs a new retail outlet on the delivery route, enters the merchant's commercial registration, tax number, and initial 25,000 credit limit directly on the EDA50.
________________________________________
UI/UX
•	Slide-over drawer component with smooth animations.
•	High-contrast input fields with floating labels and clear touch targets.
________________________________________
Non-Functional Requirements
•	IndexedDB read/write completes in < 30ms.
________________________________________
Definition of Done
•	[x] User can open customer creation drawer.
•	[x] User can edit existing customer records.
•	[x] Data persists in IndexedDB across app relaunches.

---

# Module 8: Product Catalog & Warehouse Inventory

## US-PROD-01: Offline Product Catalog with Multi-Category Filtering & View Modes

User Story Card:  
AS A Field Sales Representative / Van Driver  
I WANT TO browse products with category filters, switch between Grid and List views, and check stock availability  
SO THAT I can quickly present product offerings to retail store managers and verify available quantities in my van.

________________________________________
Story Dependencies
•	`ProductCatalogScreen.tsx`  
•	`productRepository.ts` / IndexedDB  
•	`ProductCardGrid` & `ListItem` components  
•	`useProducts` custom hook  
________________________________________
Story Inputs
Field / Item | Data Type | Format / Example | Remarks
--- | --- | --- | ---
Category Filter | String / Enum | `'all'` \| `'أغذية'` \| `'مشروبات'` \| `'زيوت'` | Category chips.
Search Query | String | "شيبسي" or "ITEM-101" | Keyword search across name and code.
View Mode | String / Enum | `'grid'` \| `'list'` | Display layout toggle.
________________________________________
Logic Workflow
1. User opens Product Catalog (Tab 5 via Top App Bar).
2. System loads products from IndexedDB through `useProducts()`.
3. Category filter bar displays horizontal scrolling pills ("الكل", "شيبسي ومقرمشات", "عصائر ومشروبات", "زيوت وشحوم").
4. User taps a category chip: system filters product list instantly.
5. User toggles View Mode between:
   - **Grid View** (`LayoutGrid`): Multi-column visual cards with product images, badges, and prices.
   - **List View** (`List`): High-density rows showing shelf location, code, barcode, stock quantity, and price.
6. Each product card displays:
   - Product code and shelf location (e.g. "رف: A-12").
   - Available quantity (`availableQty`) with color indicators (Green for > 20, Amber for 1-20, Red for 0).
   - Unit price and default discount percentage.
________________________________________
Business Rules
Case | Input | Expected Result
--- | --- | ---
Filter by Category | Category = "عصائر ومشروبات" | Only beverage products rendered; other categories filtered out.
Search Query Filter | Query = "شل هيلكس" | Returns products whose Arabic or English name includes query.
View Mode Toggle | Tap 'grid' / 'list' icon | Layout shifts seamlessly between 2-column grid and dense list without reloading data.
Out of Stock Product | `availableQty = 0` | Displays red badge "نفذت الكمية" (Out of Stock).
IndexedDB Offline Store | Device in airplane mode | Entire catalog with images and prices remains 100% accessible.
________________________________________
Story Output
Case | Input | Expected Result
--- | --- | ---
Catalog Rendered | Products in database | Grid/list view populated with thumbnails, stock numbers, and category tags.
________________________________________
Use Case
•	Sales rep shows the store owner a visual picture grid of new snack items on the handheld screen to convince them to add them to their store shelf.
________________________________________
UI/UX
•	Smooth view switching with preserved scroll position.
•	Sticky category chips bar with active indicator.
________________________________________
Non-Functional Requirements
•	Smooth scrolling through 500+ items with lazy-loaded thumbnails.
•	Category filtering time < 10ms.
________________________________________
Definition of Done
•	[x] Category pills filter products immediately.
•	[x] Grid and List view modes toggle cleanly.
•	[x] Stock availability badge reflects real warehouse inventory.

---

## US-PROD-02: Real-Time Stock Availability, Shelf Locations & Master Editing

User Story Card:  
AS A Warehouse Manager or Van Driver  
I WANT TO view warehouse shelf numbers and edit product master data (prices, barcodes, available stock)  
SO THAT van inventory counts and retail shelf locations remain updated during daily distribution.

________________________________________
Story Dependencies
•	`ProductFormDrawer.tsx`  
•	`productRepository.update`  
•	Barcode scanner integration  
________________________________________
Story Inputs
Field / Item | Data Type | Format / Example | Remarks
--- | --- | --- | ---
Product Code | String | `"ITEM-204"` | Unique SKU code.
Barcode | String | `"622300000204"` | Scannable EAN-13 barcode.
Name (Arabic / English) | String | "عصير تفاح راني 250 مل" | Product trade name.
Shelf Number | String | `"B-04-2"` | Physical rack / shelf identifier.
Available Quantity | Number | `140` | Stock on hand in vehicle or warehouse.
Unit Price | Number | `18.50` | Selling price.
________________________________________
Logic Workflow
1. User taps "صنف جديد +" or the edit button on an existing product card in the Catalog.
2. System opens `ProductFormDrawer`.
3. User edits pricing, shelf number, or scans a new barcode into the barcode field.
4. User taps "حفظ بيانات الصنف" (Save Product).
5. System validates inputs and updates the record in IndexedDB (`productRepository.update(data)`).
6. Success toast confirms: "تم تحديث بيانات الصنف في IndexedDB بنجاح".
7. Catalog UI updates immediately.
________________________________________
Business Rules
Case | Input | Expected Result
--- | --- | ---
Update Shelf Location | Shelf = "C-12-1" | Product card displays new shelf location; aids picker in warehouse.
Update Unit Price | Price = 25.00 | New price takes effect immediately for new orders and POS transactions.
Scan Barcode into Form | Physical scan button | Barcode field receives scanned numbers automatically.
Negative Stock Guard | Qty = -5 | Clamped to `0`.
________________________________________
Story Output
Case | Input | Expected Result
--- | --- | ---
Product Saved | Form submitted | IndexedDB updated; list reloaded; success toast displayed.
________________________________________
Use Case
•	Van driver reorganizes the back of the van, updates the shelf code of juice cartons to "VAN-RACK-02", and updates damaged stock counts.
________________________________________
UI/UX
•	Drawer form with dedicated barcode scan button next to the barcode input.
________________________________________
Non-Functional Requirements
•	Local update completed in < 25ms.
________________________________________
Definition of Done
•	[x] Product editing drawer opens with current values.
•	[x] Barcode scanning into product form works.
•	[x] Shelf number and available stock persist in IndexedDB.

---

# Module 9: Offline Synchronization & Outbox Engine

## US-SYNC-01: Offline Transaction Queueing with Provisional Numbers

User Story Card:  
AS A Van Sales Representative  
I WANT TO create orders, invoices, returns, and POS sales when completely offline without blocking or delays  
SO THAT the app automatically assigns provisional identification numbers (`DRAFT-EDA50-XXXX`) and queues them in the Outbox.

________________________________________
Story Dependencies
•	`storageService.generateProvisionalNumber`  
•	`storageService.getNetworkStatus`  
•	`OutboxModal.tsx`  
•	`AppContext.pendingSyncCount`  
________________________________________
Story Inputs
Field / Item | Data Type | Format / Example | Remarks
--- | --- | --- | ---
Network Status | Boolean | `false` (Offline) | Simulated or real network disconnection.
Document Type | String / Enum | `'order'` \| `'invoice'` \| `'return'` \| `'credit_note'` \| `'pos'` | Queued transaction type.
Provisional Number | String | `"DRAFT-EDA50-7812"` | Temporary unique document identifier generated offline.
Sync Status | String / Enum | `'pending'` | Initial queue status.
________________________________________
Logic Workflow
1. Device loses Wi-Fi / cellular connectivity (`isOnline = false`).
2. User performs any transaction (e.g., Saves an Order or Issues an Invoice).
3. The storage service detects `isOnline === false`:
   - Calls `generateProvisionalNumber(prefix)` -> Generates `DRAFT-EDA50-XXXX` with random 4-digit suffix.
   - Sets document `syncStatus = 'pending'`.
   - Saves document into local storage array (`eda50_orders`, `eda50_invoices`, etc.).
4. The system increments `pendingSyncCount`.
5. Top App Bar displays the offline cloud icon (`CloudOff` in amber) with an amber badge showing the count of pending documents (e.g. "3").
6. Audio feedback plays success tone without network-timeout delay.
________________________________________
Business Rules
Case | Input | Expected Result
--- | --- | ---
Create Order Offline | `isOnline = false` | Order assigned `orderNumber: "DRAFT-EDA50-XXXX"`, `syncStatus: 'pending'`; saved locally; Outbox count incremented.
Create Invoice Offline | `isOnline = false` | Invoice assigned `invoiceNumber: "DRAFT-EDA50-XXXX"`, `syncStatus: 'pending'`; saved locally; Outbox count incremented.
Create POS Sale Offline | `isOnline = false` | POS assigned `receiptNumber: "DRAFT-EDA50-XXXX"`, `syncStatus: 'pending'`; printed locally with provisional ID.
Simulated Offline Mode | User toggles "Simulate Offline Mode" in TopBar menu | `isOnline` set to `false`; all subsequent transactions enter outbox queue.
________________________________________
Story Output
Case | Input | Expected Result
--- | --- | ---
Offline Document Created | Transaction saved while offline | Pending outbox badge increments; document saved with DRAFT ID; printable on thermal receipt.
________________________________________
Use Case
•	Sales van drives into a basement grocery store with zero signal. Rep creates 3 invoices and prints receipts with provisional numbers without a single hitch.
________________________________________
UI/UX
•	Prominent TopBar sync status button with amber badge.
•	Provisional IDs rendered in monospace font with "مسودة مؤقتة" label on receipts.
________________________________________
Non-Functional Requirements
•	Zero UI delay: offline document creation takes < 15ms.
________________________________________
Definition of Done
•	[x] System generates `DRAFT-EDA50-XXXX` when offline.
•	[x] Outbox count increments for all document types.
•	[x] Amber cloud icon indicates offline status.

---

## US-SYNC-02: Automated & Manual Cloud Synchronization Engine

User Story Card:  
AS A Sales Representative or System Administrator  
I WANT TO synchronize all pending Outbox transactions to the central ERP when internet connectivity is restored  
SO THAT provisional draft numbers are replaced with official sequential server numbers (`SO-2026-XXXX`, `INV-2026-XXXX`) and recorded in the central database.

________________________________________
Story Dependencies
•	US-SYNC-01  
•	`storageService.syncAll`  
•	`storageService.generateServerNumber`  
•	`OutboxModal.tsx` manual sync trigger  
________________________________________
Story Inputs
Field / Item | Data Type | Format / Example | Remarks
--- | --- | --- | ---
Pending Documents | Array<Document> | Orders, Invoices, Returns, Credit Notes, POS sales with `syncStatus: 'pending'` | Outbox payload.
Network Status | Boolean | `true` (Online) | Verified internet connectivity.
Server Sequence Number | String | `"SO-2026-4512"` / `"INV-2026-8812"` | Official central ERP sequence ID.
________________________________________
Logic Workflow
1. User regains cellular/Wi-Fi connection (`isOnline = true`) or taps "مزامنة الآن" (Sync Now) in the Top App Bar.
2. System calls `storageService.syncAll()`:
   - If `!isOnline`: aborts and returns `{ success: 0, failed: 0 }`.
   - Iterates through pending orders, returns, invoices, credit notes, and POS sales:
     * Validates business rules (e.g. credit limit thresholds).
     * Replaces provisional `DRAFT-EDA50-XXXX` with server official numbers:
       - Orders: `SO-YYYY-XXXX`
       - Returns: `RET-YYYY-XXXX`
       - Invoices: `INV-YYYY-XXXX`
       - Credit Notes: `CR-YYYY-XXXX`
       - POS Sales: `POS-YYYY-XXXX`
     * Updates document `syncStatus = 'synced'`.
     * Clears `syncError`.
3. System saves updated collections to local storage.
4. Decrements `pendingSyncCount`.
5. Plays sync success chime; displays toast: "تمت مزامنة X عمليات بنجاح مع الخادم المركزي".
6. Cloud icon turns emerald green with checkmark.
________________________________________
Business Rules
Case | Input | Expected Result
--- | --- | ---
All Documents Valid | 5 pending items, valid customer credit | All 5 items converted from DRAFT to server sequence numbers; status becomes `'synced'`; pending count becomes `0`.
Sync while Offline | `isOnline = false` | Sync aborted; toast: "لا يوجد اتصال بالإنترنت حالياً".
Mixed Results | 4 valid items, 1 credit limit breach | 4 items become `'synced'`; 1 item becomes `'failed'` with server error message; pending count reflects 1.
Auto-Sync on Online Restoration | Network toggles from false to true | System automatically triggers background sync cycle.
________________________________________
Story Output
Case | Input | Expected Result
--- | --- | ---
Sync Completed | Pending items in Outbox | Documents updated in local storage with official server numbers; Outbox badge clears.
________________________________________
Use Case
•	Sales van emerges from an underground garage back onto the highway; handheld connects to 4G and automatically syncs all 6 queued invoices to head office.
________________________________________
UI/UX
•	Spinning refresh icon animation during active sync.
•	Outbox drawer shows real-time progress bar.
________________________________________
Non-Functional Requirements
•	Batch sync of 50 items completes in < 500ms.
________________________________________
Definition of Done
•	[x] `syncAll` converts provisional numbers to official server numbers.
•	[x] Sync status updates from 'pending' to 'synced'.
•	[x] Outbox count badge updates dynamically.

---

## US-SYNC-03: Server Rejection Handling & Supervisor Credit Limit Override

User Story Card:  
AS A Sales Representative and Area Supervisor  
I WANT TO view detailed server rejection errors in the Outbox (such as exceeded credit limits) and apply an authenticated Supervisor Override  
SO THAT critical orders rejected by the server can be unblocked and successfully synced without recreating the order.

________________________________________
Story Dependencies
•	`OutboxModal.tsx`  
•	`storageService.overrideOrderCreditLimit`  
•	`storageService.syncAll` server validation simulation  
________________________________________
Story Inputs
Field / Item | Data Type | Format / Example | Remarks
--- | --- | --- | ---
Server Rejection Condition | Rule | `creditLimit < 50000 && netDue > 10000` | Simulated ERP business rejection rule.
Sync Status | String / Enum | `'failed'` | Rejection status.
Sync Error Message | String | "رفض من الخادم: تجاوز الحد الائتماني المعتمد للعميل (الحد: 25,000)" | Server error explanation.
Supervisor Override Action | Button / Function | `handleOverrideCredit(orderId)` | Bumps customer limit to 150,000 and re-queues.
________________________________________
Logic Workflow
1. During sync, if an order has `creditLimit < 50,000` and `netDue > 10,000`:
   - System flags `syncStatus = 'failed'`.
   - Stores `syncError = "رفض من الخادم: تجاوز الحد الائتماني المعتمد..."`.
2. Outbox badge turns red/amber.
3. User opens Outbox Modal (`setIsOutboxOpen(true)`).
4. System displays the failed order with a red warning box, alert icon, and the exact server error message.
5. An action button appears: "اعتماد رفع الحد الائتماني (مشرف)" (Supervisor Credit Override).
6. Supervisor inspects the order and taps the override button.
7. System executes `storageService.overrideOrderCreditLimit(orderId)`:
   - Sets order `creditLimit = 150,000`.
   - Resets `syncStatus = 'pending'`.
   - Clears `syncError`.
8. System automatically re-triggers `triggerSync()`.
9. Order now passes server validation and successfully syncs as `'synced'`.
________________________________________
Business Rules
Case | Input | Expected Result
--- | --- | ---
Credit Limit Exceeded | Limit = 25,000, Net Due = 12,000 | Order marked `'failed'`; server error displayed in Outbox; order preserved.
Supervisor Override Triggered | Tap override button | Credit limit elevated to 150,000; status becomes `'pending'`; immediate re-sync converts order to `'synced'`.
User Dismissal | User closes outbox without override | Order remains in `'failed'` state; continues to alert user on top bar until resolved.
________________________________________
Story Output
Case | Input | Expected Result
--- | --- | ---
Override Executed | Supervisor taps override | Order sync error cleared; status changed to synced; success toast displayed.
________________________________________
Use Case
•	A large supermarket places an urgent 18,000 EGP order, exceeding their 15,000 EGP credit line. The driver calls the sales manager; manager enters PIN/override, and the order syncs immediately.
________________________________________
UI/UX
•	Red highlighted card in Outbox drawer with shield check icon for supervisor override.
•	Audio cues on error and on override resolution.
________________________________________
Non-Functional Requirements
•	No transaction data loss during sync failure or retry.
________________________________________
Definition of Done
•	[x] Server rejection rules correctly flag failed sync items.
•	[x] Error message is clearly visible in Outbox modal.
•	[x] Supervisor override button updates credit limit and re-syncs successfully.

---

# Module 10: Device Hardware, Printing, Security & UI System

## US-HW-01: Honeywell EDA50 Physical Barcode Scanner & Camera Integration

User Story Card:  
AS A Sales Representative / Warehouse Worker  
I WANT TO use the physical yellow hardware trigger buttons on the Honeywell EDA50 or the device camera  
SO THAT barcodes are instantly captured into whichever active screen I am on (Orders, Invoices, POS, or Products).

________________________________________
Story Dependencies
•	`registerScannerHandler` in `AppContext.tsx`  
•	`BarcodeScannerModal.tsx` (html5-qrcode camera fallback)  
•	Honeywell hardware broadcast intent listener / keyboard wedge simulation  
•	`soundService` audio feedback  
________________________________________
Story Inputs
Field / Item | Data Type | Format / Example | Remarks
--- | --- | --- | ---
Hardware Keystroke / Intent | String | `"622300000101\n"` | Scanned barcode string received via hardware laser engine.
Camera Scan Stream | Image / Video | Barcode video feed | Fallback for devices without dedicated laser scanners.
Registered Active Handler | Function | `(code: string) => void` | Context-aware callback of the currently active screen.
________________________________________
Logic Workflow
1. App initializes global keydown and hardware broadcast listeners on mount.
2. When the user navigates to a screen (e.g. POS Screen), the screen calls:
   `registerScannerHandler((code) => handleProcessCode(code))`
3. When the user presses the physical side scan button on the Honeywell EDA50:
   - The hardware scanner decodes the barcode and emits the code.
   - The global listener intercepts the code, plays `soundService.playScanSuccess()`, and routes it directly to the registered active screen handler.
4. If running on a phone/tablet without a laser scanner:
   - User taps the "كاميرا" (Camera) icon.
   - `BarcodeScannerModal` opens with live video viewfinder.
   - Built-in scanner decodes barcode from video frames and invokes the same handler.
________________________________________
Business Rules
Case | Input | Expected Result
--- | --- | ---
Physical Laser Trigger | User presses EDA50 side trigger | Active screen receives barcode instantly; item added to cart; laser beam active.
Virtual Camera Scan | User taps camera icon | Camera modal opens; scanning barcode passes code to handler and closes modal.
Audio Cue | Barcode successfully captured | Plays pleasant high-pitch beep (`playScanSuccess`).
Error Cue | Empty or unreadable barcode | Plays low-pitch error tone (`playError`).
Screen Unmount | User leaves POS screen | Scanner handler unregisters cleanly; prevents ghost callbacks.
________________________________________
Story Output
Case | Input | Expected Result
--- | --- | ---
Barcode Scanned | Barcode string decoded | Active screen processes item; toast feedback displayed.
________________________________________
Use Case
•	Worker in a cold storage warehouse scans 40 boxes in 1 minute using the physical side triggers with thick gloves on.
________________________________________
UI/UX
•	On-screen simulation button for EDA50 physical trigger when running in development simulator mode.
•	Visual viewfinder with scanning line laser animation for camera modal.
________________________________________
Non-Functional Requirements
•	Laser scanner capture to UI response under 30ms.
________________________________________
Definition of Done
•	[x] Global scanner handler registration mechanism in AppContext.
•	[x] Camera barcode scanner modal works with device webcam/camera.
•	[x] Hardware trigger listener routes codes to active screen.

---

## US-HW-02: ESC/POS Thermal Printing (58mm/80mm & Bluetooth Direct) with Tax QR

User Story Card:  
AS A Field Sales Representative / Van Driver  
I WANT TO print official fiscal receipts, sales orders, and invoices via portable Bluetooth thermal printers (58mm & 80mm) or system print  
SO THAT customers receive immediate paper tax receipts compliant with ZATCA and regional tax authority specifications.

________________________________________
Story Dependencies
•	`ReceiptModal.tsx`  
•	`src/services/printerService.ts`  
•	Web Bluetooth API (`navigator.bluetooth`)  
•	ESC/POS command generation engine  
•	ZATCA / Regional Tax QR Code generator  
________________________________________
Story Inputs
Field / Item | Data Type | Format / Example | Remarks
--- | --- | --- | ---
Printer Type | String / Enum | `'bluetooth'` \| `'system'` | Bluetooth thermal ESC/POS or browser `window.print()`.
Paper Width | String / Enum | `'58mm'` (32 chars/line) \| `'80mm'` (48 chars/line) | Mobile belt printer roll format.
Store Metadata | Object (PrinterSettings) | Store name, Tax No, CR No, Address, Phone, Footer note | Configured via printer settings drawer.
Document Payload | Object | Order, Invoice, Return, Credit Note, or POS Sale | Source transaction data.
Auto-Print on Checkout | Boolean | `true` \| `false` | Automatically sends print bytes on checkout.
________________________________________
Logic Workflow
1. User taps "طباعة" on any document or completes a POS sale.
2. `ReceiptModal` opens displaying a pixel-perfect thermal receipt preview matching the selected paper width (58mm vs 80mm).
3. The receipt renders:
   - Header with Store Trade Name (AR/EN), Tax ID, CR Number, and Phone.
   - Document Type title and Document Number.
   - Date, Time, Cashier / Rep Name, Customer Name, and Tax ID.
   - Itemized table: Name, Qty, Unit Price, Line Total.
   - Financial Summary: Subtotal, Discount, VAT 14%, WHT 1%, Net Due, Cash Paid, Change Due.
   - ZATCA Compliant QR Code encoding Seller Name, VAT Number, Timestamp, Total, and VAT Amount.
   - Footer note (e.g. "شكراً لتعاملكم معنا - البضاعة المباعة لا ترد بعد 14 يوم").
4. If `printerType === 'bluetooth'`:
   - System checks Web Bluetooth connection.
   - If not connected: requests Bluetooth device pair (service `000018f0-0000-1000-8000-00805f9b34fb`).
   - Generates raw ESC/POS binary buffer:
     * `ESC @` (Initialize)
     * `ESC a 1` (Center align)
     * Text formatting, line feeds, and `GS V 0` (Cut paper).
   - Transmits binary chunks via GATT characteristic.
5. If `printerType === 'system'`:
   - Invokes optimized CSS print stylesheet and `window.print()`.
________________________________________
Business Rules
Case | Input | Expected Result
--- | --- | ---
Bluetooth Print Success | Connected mobile printer | Sends ESC/POS byte stream; paper prints; toast confirms printing.
Bluetooth Disconnected | Printer turned off | Alerts user to turn on printer and retry Bluetooth pairing.
58mm Paper Width Mode | `paperWidth = '58mm'` | Thermal layout formats to 32 characters per line with compact fonts.
80mm Paper Width Mode | `paperWidth = '80mm'` | Thermal layout formats to 48 characters per line with expanded columns.
Update Store Header | User modifies tax number in settings | New receipts reflect updated tax number and store name immediately.
________________________________________
Story Output
Case | Input | Expected Result
--- | --- | ---
Print Action Completed | Valid printer connection | Physical thermal receipt ejected with clear text, tax summary, and scannable QR code.
________________________________________
Use Case
•	Van driver issues an invoice on a portable 58mm Rongta/Xprinter belt printer clipped to their waist; receipt prints in 3 seconds with legible Arabic and QR code.
________________________________________
UI/UX
•	Authentic thermal receipt paper styling with jagged tear edges, monospace font, and paper width selector pills (58mm / 80mm).
•	Quick settings cog to edit store name, tax number, and Bluetooth pairing.
________________________________________
Non-Functional Requirements
•	ESC/POS generation and byte streaming completed in < 1 second.
•	Print preview renders identically to physical printout.
________________________________________
Definition of Done
•	[x] ReceiptModal renders formatted receipts for all 5 document types.
•	[x] Web Bluetooth ESC/POS byte transmission implemented.
•	[x] 58mm and 80mm width toggle adjusts styling appropriately.
•	[x] QR code conforms to simplified tax invoice specifications.

---

## US-HW-03: Shift Handover PIN Lock & Multi-User Role Switching

User Story Card:  
AS A Sales Representative or Supervisor  
I WANT TO lock the device with a 4-digit PIN between shifts and switch between user profiles (Super Admin, Sales Rep 1, Wholesale Rep)  
SO THAT access to financial transactions is secured and sales are attributed to the correct employee.

________________________________________
Story Dependencies
•	`PinLockModal.tsx`  
•	`AppContext.currentUser` & `setCurrentUser`  
•	`UserSession` interface  
________________________________________
Story Inputs
Field / Item | Data Type | Format / Example | Remarks
--- | --- | --- | ---
PIN Entry | String | `"1234"` | 4 numeric digits.
User Profiles | Array<UserSession> | SA, Ahmed Mostafa, Mahmoud El-Sherif | Pre-configured employee accounts with default branches and warehouses.
Active User Session | UserSession Object | Active logged-in representative | Controls attribution across all documents.
________________________________________
Logic Workflow
1. User taps the Overflow Menu in Top App Bar and selects "تبديل وردية / قفل بكلمة مرور" (Shift Handover / PIN).
2. `PinLockModal` overlays the entire viewport with backdrop blur (`z-index: 50`).
3. User selects the incoming shift employee card (e.g. "أحمد مصطفى - مندوب توزيع 1").
4. System sets the selected user as the target user.
5. User enters their 4-digit PIN on the touch keypad.
6. Upon the 4th digit:
   - Plays success chime `soundService.playScanSuccess()`.
   - Calls `setCurrentUser(u)`.
   - Closes modal.
   - Shows greeting toast: "مرحباً بك: أحمد مصطفى".
7. All subsequent sales orders, invoices, and POS sales automatically attribute `salesRep` to Ahmed Mostafa with his default warehouse and branch.
________________________________________
Business Rules
Case | Input | Expected Result
--- | --- | ---
Switch User Profile | Select Ahmed + Enter 4-digit PIN | Active user session updated; new sales tag Ahmed as sales rep; toast confirms switch.
Shift Lock Screen | PIN Modal open | Background interactions disabled; user cannot create or view transactions without unlocking.
Default Branch & Warehouse | User switched to Rep 1 | Orders automatically default to "مستودع التوزيع السريع - الفرع الجنوبي".
Admin Role | User switched to 'sa' | Full supervisor override permissions granted.
________________________________________
Story Output
Case | Input | Expected Result
--- | --- | ---
Shift Handover Complete | New user authenticated | Context user updated; TopBar and orders reflect new employee name.
________________________________________
Use Case
•	Morning shift driver finishes route at 2 PM, opens Shift Handover modal, selects Evening driver Mahmoud; Mahmoud types his PIN and takes over the EDA50.
________________________________________
UI/UX
•	Clean keypad modal with masked PIN dots.
•	Card selector with user avatars, badge numbers, and assigned warehouses.
________________________________________
Non-Functional Requirements
•	Zero-delay session switch; state persists in local memory.
________________________________________
Definition of Done
•	[x] PIN lock modal blocks background interactions.
•	[x] User selection updates active user session.
•	[x] Documents created afterwards attribute the new user as salesRep.

---

## US-HW-04: Sunlight-Readable Dual Themes & Full Arabic/English Localization

User Story Card:  
AS A Field Van Salesperson Working Outdoors  
I WANT TO switch between a High-Contrast Light Theme for bright sunlight and a Sleek Dark Theme, with full Arabic (RTL) and English (LTR) language support  
SO THAT I can clearly read screens under harsh desert sunlight and operate in my preferred native language.

________________________________________
Story Dependencies
•	`TopAppBar.tsx` menu actions  
•	`AppContext.theme` & `AppContext.language`  
•	Tailwind CSS dark mode classes (`dark:...`)  
•	HTML `dir="rtl"` vs `dir="ltr"`  
________________________________________
Story Inputs
Field / Item | Data Type | Format / Example | Remarks
--- | --- | --- | ---
Active Theme | String / Enum | `'dark'` (Default) \| `'light'` (High Contrast) | Persisted in `localStorage.eda50_theme`.
Active Language | String / Enum | `'ar'` (Arabic RTL) \| `'en'` (English LTR) | Persisted in `localStorage.eda50_language`.
Handheld Frame Toggle | Boolean | `true` \| `false` | Toggles EDA50 simulator bezel vs full-bleed screen.
________________________________________
Logic Workflow
1. User taps the menu icon in Top App Bar.
2. **Theme Switch**:
   - User taps "الوضع الفاتح (عالي التباين)" or "الوضع الليلي".
   - System updates `theme` state and saves to `localStorage`.
   - Light theme applies crisp white backgrounds (`#FFFFFF`), solid borders (`#E5E7EB`), and dark text (`#111827`) optimized for high outdoor ambient light.
   - Dark theme applies deep slate backgrounds (`#1C1F24`, `#262A31`) saving battery on mobile LCD/OLED screens.
3. **Language Switch**:
   - User taps "اللغة: English / العربية".
   - System toggles between `'ar'` and `'en'`.
   - HTML document direction toggles dynamically between `dir="rtl"` and `dir="ltr"`.
   - All text labels, wizard buttons, tables, and receipts adapt to the selected language.
4. **Handheld Device Bezel Mode**:
   - User can toggle between simulated EDA50 device frame (useful for desktop demos) and borderless full-screen view (optimized for actual physical EDA50 units).
________________________________________
Business Rules
Case | Input | Expected Result
--- | --- | ---
Switch to Light Theme | Select Light Theme | UI immediately changes to high-contrast white/slate; text readability in sunlight verified; choice saved in localStorage.
Switch to English | Select English | UI flips direction to LTR; navigation tabs show "Orders, Invoices, POS, Returns, My Account"; choice saved in localStorage.
Switch to Arabic | Select Arabic | UI flips direction to RTL; navigation tabs show "الطلبات، الفواتير، نقطة بيع، المرتجعات، حسابي".
App Reload | Page refreshed | Saved theme and language preferences rehydrated from localStorage without reverting to defaults.
________________________________________
Story Output
Case | Input | Expected Result
--- | --- | ---
Theme/Language Toggled | Menu item clicked | Whole application re-renders with new palette and orientation; active forms retain input data.
________________________________________
Use Case
•	Sales rep steps out of the van into direct 40°C noon sunlight, switches to High-Contrast Light theme to read customer balances clearly, and switches language to English for a foreign store supervisor.
________________________________________
UI/UX
•	Instant CSS transition without full page reload.
•	Direction-aware icons (ChevronLeft vs ChevronRight).
________________________________________
Non-Functional Requirements
•	Theme and language switch executed in < 16ms with zero layout thrashing.
________________________________________
Definition of Done
•	[x] Theme switch alternates between Dark and Light mode across all 10 modules.
•	[x] Language switch alternates between Arabic (RTL) and English (LTR).
•	[x] User preferences persist across app sessions in localStorage.
•	[x] Handheld frame toggle works for real-device vs simulator presentation.

---

## Complete Traceability Matrix

Story ID | Module | Primary Screen / Component | Offline Safe? | Hardware Touchpoint
--- | --- | --- | --- | ---
**US-ORD-01** | Sales Orders | `OrdersScreen.tsx` (Step 1) | Yes (IndexedDB) | Touch UI
**US-ORD-02** | Sales Orders | `LineItemEditor.tsx` (Step 2) | Yes (Local) | Barcode Laser / Camera
**US-ORD-03** | Sales Orders | `TotalsSummary.tsx` (Step 3) | Yes (Local) | Calculation Engine
**US-ORD-04** | Sales Orders | `OrdersScreen.tsx` (Save) | Yes (Outbox) | Screen Transition
**US-ORD-05** | Sales Orders | `OrdersScreen.tsx` (List) | Yes (Local) | Receipt Printing
**US-INV-01** | Sales Invoices | `InvoicesScreen.tsx` (Step 1) | Yes (Local) | Order Linker
**US-INV-02** | Sales Invoices | `InvoicesScreen.tsx` (Direct) | Yes (Local) | Touch UI
**US-INV-03** | Sales Invoices | `NumericKeypad` & `AuthGate` | Yes (Local) | Numeric Touchpad & PIN
**US-INV-04** | Sales Invoices | `storageService.saveInvoice` | Yes (Local) | Financial Ledger
**US-INV-05** | Sales Invoices | `InvoicesScreen.tsx` (List) | Yes (Local) | Thermal Print & Share
**US-POS-01** | Point of Sale | `PosScreen.tsx` (Terminal) | Yes (Local) | Barcode Laser Engine
**US-POS-02** | Point of Sale | `PosPaymentSheet` | Yes (Local) | Touch & Tender Calc
**US-POS-03** | Point of Sale | `AuthGate` & `ReceiptModal` | Yes (Outbox) | PIN & ESC/POS Print
**US-POS-04** | Point of Sale | `PosScreen.tsx` (History) | Yes (Local) | History & Reprint
**US-RET-01** | Sales Returns | `ReturnsScreen.tsx` (Wizard) | Yes (Outbox) | Stepper Validation
**US-RET-02** | Sales Returns | `ReturnsScreen.tsx` (List) | Yes (Local) | Status Workflow
**US-CRN-01** | Credit Notes | `ReturnsScreen.tsx` (Credit Note) | Yes (Outbox) | Invoice Linker
**US-CRN-02** | Credit Notes | `CreditNotesScreen.tsx` | Yes (Local) | Ledger Settlement
**US-REP-01** | Representative | `RepresentativeScreen.tsx` | Yes (Local) | KPI Dashboard
**US-REP-02** | Representative | FIFO Modal & `AuthGate` | Yes (Local) | Auto-Settlement Engine
**US-REP-03** | Representative | Custody Ledger Tab | Yes (Local) | Ledger Audit & Print
**US-CUST-01** | Customer Directory | `CustomerDirectoryScreen.tsx` | Yes (IndexedDB) | Multi-Search
**US-CUST-02** | Customer Directory | `CustomerFormDrawer.tsx` | Yes (IndexedDB) | Form Input
**US-PROD-01** | Product Catalog | `ProductCatalogScreen.tsx` | Yes (IndexedDB) | Grid / List Toggle
**US-PROD-02** | Product Catalog | `ProductFormDrawer.tsx` | Yes (IndexedDB) | Stock & Shelf Master
**US-SYNC-01** | Offline & Sync | `storageService` (Provisional) | Yes (Outbox) | DRAFT ID Generator
**US-SYNC-02** | Offline & Sync | `storageService.syncAll` | Online Sync | Cloud Sequence Engine
**US-SYNC-03** | Offline & Sync | `OutboxModal.tsx` | Offline/Online | Supervisor Override
**US-HW-01** | Device Hardware | `AppContext` Scanner Handler | Yes (Local) | EDA50 Physical Triggers
**US-HW-02** | Device Hardware | `printerService` (ESC/POS) | Yes (Bluetooth) | Bluetooth / System Thermal
**US-HW-03** | Device Security | `PinLockModal.tsx` | Yes (Local) | 4-Digit Shift PIN
**US-HW-04** | Device UI/UX | `TopAppBar.tsx` & Theme Engine | Yes (Local) | Sunlight High-Contrast / RTL

---
*End of User Story Specification Document.*
