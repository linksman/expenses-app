import { RateSnapshot } from '../types/expense';
import { Vacation } from '../types/vacation';

type RawConvert = (amount: number, fromCode: string, toCode: string | null) => number | null;

// The one place that knows the precedence order for turning an amount in
// `fromCode` into the vacation's lead currency:
//   1. A fixed rate currently configured for `fromCode` on the vacation —
//      dynamic, so editing it later retroactively changes historical totals
//      for that currency (matches how a single fixedExchangeRate behaved
//      before per-currency rates existed).
//   2. Otherwise, the rate frozen in the amount's own `rateSnapshot` (from
//      whichever expense it came from), re-triangulated against whatever the
//      vacation's CURRENT lead currency is — so changing the lead currency
//      later doesn't require touching old expenses.
//   3. Otherwise (legacy expense with no snapshot, or the snapshot fetch
//      failed at creation time, or `rateSnapshot` is deliberately omitted
//      for a not-yet-saved draft amount), fall back to the live rate.
export function convertForVacationCurrency(
  vacation: Pick<Vacation, 'currencies' | 'leadCurrency'>,
  rawConvert: RawConvert,
  fromCode: string,
  rateSnapshot: RateSnapshot | null | undefined,
  amount: number
): number | null {
  if (!vacation.leadCurrency) return null;
  if (fromCode === vacation.leadCurrency) return amount;

  const fixedRate = vacation.currencies.find((c) => c.code === fromCode)?.fixedRate;
  if (fixedRate != null) return amount * fixedRate;

  if (rateSnapshot) {
    const fromRate = rateSnapshot.rates[fromCode];
    const toRate = rateSnapshot.rates[vacation.leadCurrency];
    if (fromRate && toRate) return (amount / fromRate) * toRate;
  }

  return rawConvert(amount, fromCode, vacation.leadCurrency);
}
