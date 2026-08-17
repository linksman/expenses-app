export interface TravelCompanion {
  id: string;
  name: string;
}

// Pseudo-companion id representing the app user in an expense split. Never
// stored in a vacation's companions list — only used as a key in Expense.split
// and resolved to a translated "Me" label at render time.
export const ME_COMPANION_ID = 'me';
