import { TravelCompanion } from './companion';
import { ExpenseGrouping } from './expenseGrouping';

export interface Vacation {
  id: string;
  name: string;
  defaultCurrency: string;
  leadCurrency: string | null;
  groupBy: ExpenseGrouping;
  // How many units of leadCurrency equal 1 unit of defaultCurrency. When set,
  // this overrides the live exchange rate for converting defaultCurrency
  // amounts to leadCurrency — for this vacation only, existing expenses
  // included — so a trip's totals stop drifting with the market rate.
  // null/undefined means "use the automatic rate" (the default).
  fixedExchangeRate?: number | null;
  companions: TravelCompanion[];
  summaryImageUrl?: string;
  summaryImagePhotographerName?: string;
  summaryImagePhotographerUrl?: string;
  summaryImageUnsplashUrl?: string;
  createdAt: string;
}
