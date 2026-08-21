import { Vacation } from '../types/vacation';

// Wraps ExchangeRatesContext's convert() with a vacation's fixed rate
// override, if it has one: defaultCurrency amounts convert via the frozen
// rate instead of the live one, so every screen that shows converted totals
// for a vacation stays consistent without duplicating this check.
export function convertForVacation(
  vacation: Pick<Vacation, 'defaultCurrency' | 'leadCurrency' | 'fixedExchangeRate'>,
  rawConvert: (amount: number, fromCode: string, toCode: string | null) => number | null,
  amount: number,
  fromCode: string
): number | null {
  if (vacation.fixedExchangeRate && vacation.leadCurrency && fromCode === vacation.defaultCurrency) {
    return amount * vacation.fixedExchangeRate;
  }
  return rawConvert(amount, fromCode, vacation.leadCurrency);
}
