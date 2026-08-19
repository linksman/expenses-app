// Hands the id of a just-created expense back to ManageExpensesScreen across a
// plain goBack() from AddExpenseScreen, so the list can briefly highlight the
// new row. Mirrors the pendingVacationSync/pendingSplit module-level-ref
// pattern used elsewhere in this app for the same reason: route params can't
// carry transient, one-shot signals like this across navigation.
let pendingHighlightId: string | null = null;

export function setPendingNewExpenseHighlight(id: string) {
  pendingHighlightId = id;
}

export function takePendingNewExpenseHighlight(): string | null {
  const value = pendingHighlightId;
  pendingHighlightId = null;
  return value;
}
