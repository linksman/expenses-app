import { ExpenseSplitShare } from '../types/expense';

// Hands the result of ExpenseSplitScreen back to AddExpenseScreen across a plain
// goBack(). Route params can't carry this: navigating back to an already-mounted
// AddExpense screen replaces its params rather than merging them, which would
// wipe the in-progress amount/description/etc. the user hasn't saved yet. This
// mirrors the pendingVacationSync ref pattern ManageExpensesScreen uses for the
// same reason (see CLAUDE.md's navigation-shape notes).
let pendingSplit: ExpenseSplitShare[] | null = null;

export function setPendingSplit(split: ExpenseSplitShare[]) {
  pendingSplit = split;
}

export function takePendingSplit(): ExpenseSplitShare[] | null {
  const value = pendingSplit;
  pendingSplit = null;
  return value;
}
