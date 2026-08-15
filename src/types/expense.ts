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
  { key: 'Lodging', icon: 'bed-outline', color: '#7C3AED', tint: '#F1EAFE' },
  { key: 'Activities', icon: 'ticket-outline', color: '#DB5C8C', tint: '#FDECF2' },
  { key: 'Shopping', icon: 'bag-handle-outline', color: '#159C87', tint: '#E7F6F1' },
  { key: 'Groceries', icon: 'cart-outline', color: '#4C9E4C', tint: '#EAF6EA' },
  { key: 'Entertainment', icon: 'film-outline', color: '#D9A21B', tint: '#FBF3DC' },
  { key: 'Other', icon: 'ellipsis-horizontal-circle-outline', color: '#9A9AA5', tint: '#F1F1F5' },
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
