import type { IconName } from './icon';

export interface PaymentMethod {
  id: string;
  name: string;
  icon: IconName;
  enabled: boolean;
}

export const DEFAULT_PAYMENT_METHOD_ICON: IconName = 'wallet-outline';

export const DEFAULT_PAYMENT_METHODS: PaymentMethod[] = [
  { id: 'cash', name: 'Cash', icon: 'cash-outline', enabled: true },
  { id: 'credit-card', name: 'Credit Card', icon: 'card-outline', enabled: true },
  { id: 'debit-card', name: 'Debit Card', icon: 'card-outline', enabled: true },
];
