export const EXPENSE_GROUPINGS = [
  'date',
  'paymentMethod',
  'collaborators',
  'category',
  'currency',
] as const;

export type ExpenseGrouping = (typeof EXPENSE_GROUPINGS)[number];

export function isExpenseGrouping(value: unknown): value is ExpenseGrouping {
  return EXPENSE_GROUPINGS.some((option) => option === value);
}
