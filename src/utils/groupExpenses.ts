import { Translations } from '../i18n/translations';
import { ExpenseGrouping } from '../storage/ExpenseGroupingContext';
import { ME_COMPANION_ID } from '../types/companion';
import { Expense } from '../types/expense';
import { PaymentMethod } from '../types/paymentMethod';
import { Vacation } from '../types/vacation';
import { CurrencyTotal, companionCurrencyTotals, totalsByCurrencyFor } from './formatCurrency';
import { companionName } from './companionName';
import { dayLabel } from './dateLabel';
import { paymentMethodName } from './paymentMethodName';

export interface ExpenseSection {
  key: string;
  title: string;
  totals: CurrencyTotal[];
  shareTotals?: CurrencyTotal[];
  data: Expense[];
}

function localDateKey(iso: string): string {
  const date = new Date(iso);
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

export function groupExpenses(
  expenses: Expense[],
  groupBy: ExpenseGrouping,
  methods: PaymentMethod[],
  vacation: Vacation | null,
  t: Translations,
  locale: string
): ExpenseSection[] {
  const grouped = new Map<string, { title: string; data: Expense[] }>();
  const add = (key: string, title: string, expense: Expense) => {
    if (!grouped.has(key)) grouped.set(key, { title, data: [] });
    grouped.get(key)!.data.push(expense);
  };

  const newestFirst = [...expenses].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  for (const expense of newestFirst) {
    if (groupBy === 'date') {
      add(localDateKey(expense.createdAt), dayLabel(expense.createdAt, t, locale), expense);
    } else if (groupBy === 'paymentMethod') {
      const method = methods.find((item) => item.id === expense.paymentMethodId);
      add(expense.paymentMethodId, method ? paymentMethodName(method, t) : expense.paymentMethodId, expense);
    } else if (groupBy === 'category') {
      const category = expense.category ?? 'Other';
      add(category, t.categories[category], expense);
    } else if (groupBy === 'currency') {
      add(expense.currencyCode, expense.currencyCode, expense);
    } else {
      for (const participantId of [ME_COMPANION_ID, ...expense.split.map((share) => share.companionId)]) {
        add(participantId, companionName(participantId, vacation?.companions ?? [], t), expense);
      }
    }
  }

  return Array.from(grouped.entries()).map(([key, section]) => {
    const data = [...section.data].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    return {
      key,
      title: section.title,
      data,
      totals: totalsByCurrencyFor(data),
      shareTotals: groupBy === 'collaborators' ? companionCurrencyTotals(data, key) : undefined,
    };
  });
}
