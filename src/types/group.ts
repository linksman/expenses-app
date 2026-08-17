import { TravelCompanion } from './companion';

export interface ExpenseGroup {
  id: string;
  name: string;
  defaultCurrency: string;
  leadCurrency: string | null;
  companions: TravelCompanion[];
  createdAt: string;
}
