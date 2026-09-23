/**
 * Centralized Pricing & Tax Calculations
 * Standardized for Mobile Sales & POS on Honeywell EDA50
 */

export const DEFAULT_VAT_RATE = 0.14; // 14% Value Added Tax
export const DEFAULT_WITHHOLDING_RATE = 0.01; // 1% Withholding Tax (Tax on Sales / خصم وإضافة)

export interface OrderTotals {
  grossTotal: number;
  totalDiscount: number;
  totalAfterDiscount: number;
  totalTax: number;
  totalAfterTax: number;
  withholdingTax: number;
  netDue: number;
}

/**
 * Calculates net line total after discount (fixed amount or percentage)
 */
export function calculateLineTotal(
  qty: number,
  unitPrice: number,
  discount: number = 0,
  discountType: 'percentage' | 'fixed' = 'fixed'
): number {
  const safeQty = Math.max(0, qty);
  const safePrice = Math.max(0, unitPrice);
  const gross = safeQty * safePrice;

  let discountVal = 0;
  if (discountType === 'percentage') {
    discountVal = (gross * Math.max(0, discount)) / 100;
  } else {
    discountVal = Math.max(0, discount);
  }

  const net = Math.max(0, gross - discountVal);
  return Number(net.toFixed(2));
}

/**
 * Calculates VAT for a single line item
 */
export function calculateLineVat(lineTotal: number, vatRate: number = DEFAULT_VAT_RATE): number {
  return Number((Math.max(0, lineTotal) * vatRate).toFixed(2));
}

/**
 * Calculates full document financial totals
 */
export function calculateDocumentTotals(
  items: Array<{
    enteredQty: number;
    unitPrice: number;
    discount?: number;
    discountType?: 'percentage' | 'fixed';
    lineTotal?: number;
  }>,
  vatRate: number = DEFAULT_VAT_RATE,
  applyWithholdingTax: boolean = true,
  withholdingRate: number = DEFAULT_WITHHOLDING_RATE
): OrderTotals {
  const grossTotal = items.reduce(
    (sum, item) => sum + (Math.max(0, item.enteredQty) * Math.max(0, item.unitPrice)),
    0
  );

  const totalDiscount = items.reduce((sum, item) => {
    const gross = Math.max(0, item.enteredQty) * Math.max(0, item.unitPrice);
    const d = item.discount || 0;
    const discountVal = item.discountType === 'percentage' ? (gross * d) / 100 : d;
    return sum + Math.max(0, discountVal);
  }, 0);

  const totalAfterDiscount = Math.max(0, grossTotal - totalDiscount);
  const totalTax = Number((totalAfterDiscount * vatRate).toFixed(2));
  const totalAfterTax = Number((totalAfterDiscount + totalTax).toFixed(2));

  const withholdingTax = applyWithholdingTax
    ? Number((totalAfterDiscount * withholdingRate).toFixed(2))
    : 0;

  const netDue = Number((totalAfterTax - withholdingTax).toFixed(2));

  return {
    grossTotal: Number(grossTotal.toFixed(2)),
    totalDiscount: Number(totalDiscount.toFixed(2)),
    totalAfterDiscount: Number(totalAfterDiscount.toFixed(2)),
    totalTax,
    totalAfterTax,
    withholdingTax,
    netDue
  };
}
