import { currencyInfo } from '../types/currency';
import { Expense } from '../types/expense';

export interface CurrencyTotal {
  currencyCode: string;
  amount: number;
}

export function formatAmount(amount: number, currencyCode: string): string {
  return `${currencyInfo(currencyCode).symbol}${amount.toFixed(2)}`;
}

export function formatTotals(totals: CurrencyTotal[], fallbackCurrency = 'USD'): string {
  if (totals.length === 0) return formatAmount(0, fallbackCurrency);
  return totals.map((t) => formatAmount(t.amount, t.currencyCode)).join('  ·  ');
}

/** Formats each currency's own (unconverted) total one after another — e.g.
 * "$22.00 · €15.00" — with the lead currency's converted grand total appended
 * in brackets, e.g. "$22.00 · €15.00 (₪455.00)". The bracket is omitted when
 * there's no lead currency, its total isn't available, or it would just repeat
 * the lone currency already shown. */
export function formatTotalsWithLead(
  totals: CurrencyTotal[],
  leadCurrency: string | null,
  leadTotal: number | null,
  fallbackCurrency = 'USD'
): string {
  const breakdown = formatTotals(totals, fallbackCurrency);
  const isRedundant = totals.length === 1 && totals[0].currencyCode === leadCurrency;
  if (leadCurrency && leadTotal !== null && !isRedundant) {
    return `${breakdown} (${formatAmount(leadTotal, leadCurrency)})`;
  }
  return breakdown;
}

export function totalsByCurrencyFor(list: Expense[]): CurrencyTotal[] {
  const order: string[] = [];
  const sums = new Map<string, number>();
  for (const e of list) {
    if (!sums.has(e.currencyCode)) order.push(e.currencyCode);
    sums.set(e.currencyCode, (sums.get(e.currencyCode) ?? 0) + e.amount);
  }
  return order.map((currencyCode) => ({ currencyCode, amount: sums.get(currencyCode)! }));
}

/** Sums a list of expenses into a single currency. Returns null if any expense
 * can't be converted (e.g. exchange rate unavailable), signaling the caller to
 * fall back to a per-currency breakdown instead. */
export function convertedTotal(
  list: Expense[],
  convert: (amount: number, fromCode: string) => number | null
): number | null {
  let sum = 0;
  for (const e of list) {
    const converted = convert(e.amount, e.currencyCode);
    if (converted === null) return null;
    sum += converted;
  }
  return sum;
}
