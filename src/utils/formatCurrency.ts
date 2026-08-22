import { currencyInfo } from '../types/currency';
import { Expense } from '../types/expense';
import { ME_COMPANION_ID } from '../types/companion';

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
 * fall back to a per-currency breakdown instead. `convert` takes the whole
 * expense (not just its amount/currency) since each expense may carry its own
 * frozen rate snapshot — two expenses in the same currency can convert
 * differently depending on when they were created. */
export function convertedTotal(
  list: Expense[],
  convert: (expense: Expense, amount: number) => number | null
): number | null {
  let sum = 0;
  for (const e of list) {
    const converted = convert(e, e.amount);
    if (converted === null) return null;
    sum += converted;
  }
  return sum;
}

/** A companion's cut of one expense. The "me" share is never stored — it's
 * always the remainder after every assigned companion share, so it can't go
 * stale if the expense amount is edited after the split was set. */
export function companionShare(expense: Expense, companionId: string): number {
  if (companionId === ME_COMPANION_ID) {
    return expense.amount - expense.split.reduce((sum, s) => sum + s.amount, 0);
  }
  return expense.split.find((s) => s.companionId === companionId)?.amount ?? 0;
}

export function companionCurrencyTotals(list: Expense[], companionId: string): CurrencyTotal[] {
  const order: string[] = [];
  const sums = new Map<string, number>();
  for (const e of list) {
    const share = companionShare(e, companionId);
    if (share === 0) continue;
    if (!sums.has(e.currencyCode)) order.push(e.currencyCode);
    sums.set(e.currencyCode, (sums.get(e.currencyCode) ?? 0) + share);
  }
  return order.map((currencyCode) => ({ currencyCode, amount: sums.get(currencyCode)! }));
}

/** Same as convertedTotal, but for one companion's shares only. */
export function companionConvertedTotal(
  list: Expense[],
  companionId: string,
  convert: (expense: Expense, amount: number) => number | null
): number | null {
  let sum = 0;
  for (const e of list) {
    const share = companionShare(e, companionId);
    if (share === 0) continue;
    const converted = convert(e, share);
    if (converted === null) return null;
    sum += converted;
  }
  return sum;
}
