export interface ExpenseGroup {
  id: string;
  name: string;
  defaultCurrency: string;
  leadCurrency: string | null;
  createdAt: string;
}
