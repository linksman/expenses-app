import { Translations } from '../i18n/translations';
import { PaymentMethod } from '../types/paymentMethod';

const DEFAULT_NAME_KEYS: Record<string, keyof Translations['paymentMethods']> = {
  cash: 'cash',
  'credit-card': 'creditCard',
  'debit-card': 'debitCard',
};

export function paymentMethodName(method: PaymentMethod, t: Translations): string {
  const key = DEFAULT_NAME_KEYS[method.id];
  return key ? t.paymentMethods[key] : method.name;
}
