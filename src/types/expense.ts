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
}

export const CATEGORIES: CategoryInfo[] = [
  { key: 'Food', icon: 'fast-food-outline' },
  { key: 'Transport', icon: 'car-outline' },
  { key: 'Lodging', icon: 'bed-outline' },
  { key: 'Activities', icon: 'ticket-outline' },
  { key: 'Shopping', icon: 'bag-handle-outline' },
  { key: 'Groceries', icon: 'cart-outline' },
  { key: 'Entertainment', icon: 'film-outline' },
  { key: 'Other', icon: 'ellipsis-horizontal-circle-outline' },
];

export function categoryInfo(key: Category): CategoryInfo {
  return CATEGORIES.find((c) => c.key === key) ?? CATEGORIES[CATEGORIES.length - 1];
}

export interface Expense {
  id: string;
  amount: number;
  category: Category | null;
  description: string;
  createdAt: string; // ISO timestamp
  currencyCode: string;
  paymentMethodId: string;
  groupId: string;
}
