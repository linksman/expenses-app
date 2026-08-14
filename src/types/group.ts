export const GROUP_COLORS: string[] = [
  '#5B9BFF', // blue
  '#0FA3A3', // teal
  '#6D28D9', // purple
  '#FF6B9B', // pink
  '#FF6B6B', // red
  '#FFB300', // amber
  '#8BC34A', // green
  '#8A94A6', // slate
];

export interface ExpenseGroup {
  id: string;
  name: string;
  color: string;
  defaultCurrency: string;
  leadCurrency: string | null;
  createdAt: string;
}
