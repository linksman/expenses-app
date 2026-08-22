import { TravelCompanion } from './companion';
import { ExpenseGrouping } from './expenseGrouping';

export interface VacationCurrency {
  code: string;
  // Exactly one currency in a vacation's `currencies` list has isDefault:
  // true — it pre-fills new expenses and is the "hero" total shown big.
  isDefault: boolean;
  // How many units of the vacation's leadCurrency equal 1 unit of `code`.
  // When set, this overrides the live exchange rate for converting this
  // currency's amounts to leadCurrency — for this vacation only, existing
  // expenses included — so a trip's totals stop drifting with the market
  // rate. null/undefined means "use the automatic rate" (the default).
  fixedRate?: number | null;
}

export interface Vacation {
  id: string;
  name: string;
  // The currencies this vacation's expenses are logged in. Always at least
  // one entry, with exactly one marked isDefault.
  currencies: VacationCurrency[];
  leadCurrency: string | null;
  groupBy: ExpenseGrouping;
  companions: TravelCompanion[];
  summaryImageUrl?: string;
  summaryImagePhotographerName?: string;
  summaryImagePhotographerUrl?: string;
  summaryImageUnsplashUrl?: string;
  createdAt: string;
}
