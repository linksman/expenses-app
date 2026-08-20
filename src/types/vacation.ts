import { TravelCompanion } from './companion';

export interface Vacation {
  id: string;
  name: string;
  defaultCurrency: string;
  leadCurrency: string | null;
  companions: TravelCompanion[];
  summaryImageUrl?: string;
  summaryImagePhotographerName?: string;
  summaryImagePhotographerUrl?: string;
  summaryImageUnsplashUrl?: string;
  createdAt: string;
}
