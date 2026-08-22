import type { IconName } from './icon';

export type Category =
  | 'Food'
  | 'Transport'
  | 'Lodging'
  | 'Activities'
  | 'Shopping'
  | 'Groceries'
  | 'Entertainment'
  | 'Other';

export interface CategoryInfo {
  key: Category;
  icon: IconName;
  color: string;
  tint: string;
}

export const CATEGORIES: CategoryInfo[] = [
  { key: 'Food', icon: 'fast-food-outline', color: '#EA8C3A', tint: '#FFF4E8' },
  { key: 'Transport', icon: 'car-outline', color: '#3B82D6', tint: '#E9F1FF' },
  { key: 'Lodging', icon: 'bed-outline', color: '#3F3F46', tint: '#F0F0F1' },
  { key: 'Activities', icon: 'ticket-outline', color: '#DB5C8C', tint: '#FDECF2' },
  { key: 'Shopping', icon: 'bag-handle-outline', color: '#159C87', tint: '#E7F6F1' },
  { key: 'Groceries', icon: 'cart-outline', color: '#4C9E4C', tint: '#EAF4EA' },
  { key: 'Entertainment', icon: 'film-outline', color: '#D9A21B', tint: '#FBF0DA' },
  { key: 'Other', icon: 'ellipsis-horizontal-circle-outline', color: '#9A9AA5', tint: '#F1F1F5' },
];

export function categoryInfo(key: Category): CategoryInfo {
  return CATEGORIES.find((c) => c.key === key) ?? CATEGORIES[CATEGORIES.length - 1];
}

// One companion's cut of an expense's amount. Entries only exist for
// companions actually assigned a share — the "me" share is never stored
// here, it's always derived as (amount - sum of these shares) so it can't
// drift out of sync if the expense amount is edited later.
export interface ExpenseSplitShare {
  companionId: string;
  amount: number;
}

export interface Expense {
  id: string;
  amount: number;
  category: Category | null;
  description: string;
  createdAt: string; // ISO timestamp
  currencyCode: string;
  paymentMethodId: string;
  vacationId: string;
  split: ExpenseSplitShare[];
  excludedFromStatistics: boolean;
}
