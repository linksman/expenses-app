# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Vacation Expenses — an Expo (React Native + react-native-web) app for tracking trip expenses, grouped by trip ("expense groups"), with multi-currency support and live exchange-rate conversion. No backend: everything persists to `AsyncStorage` on-device.

## Commands

```bash
npm install              # install deps
npx expo start           # start Metro, scan QR with Expo Go
npx expo start --web     # run in a browser — fastest way to iterate/verify UI changes
npx expo start -c        # same as above, clearing the Metro cache (use after dependency/SDK changes)
npx tsc --noEmit         # typecheck the whole project — there is no separate lint or test script/framework
```

There is no automated test suite. Verification during development is: `npx tsc --noEmit` for type safety, then driving the app in the web preview (or a simulator/device) to confirm behavior — there's no other way to catch runtime/UI regressions here.

### Expo SDK version — do not bump casually

The `expo` package is pinned to SDK 54 in `package.json` deliberately. **Expo Go (the app-store app) supports only one SDK version at a time**, and its store release regularly lags weeks/months behind a new SDK due to Apple/Google review delays. Bumping `expo` to the latest version without checking whether the *currently published* Expo Go app supports it will break "scan the QR code" for real users. If a bump is ever needed, verify current Expo Go store support first.

## Architecture

### Navigation shape (`App.tsx`)

A single `RootStack` (native-stack) holds:
- `Tabs` — a bottom-tab navigator (`MainTabs`) with exactly two tabs: **Expenses** (`ManageExpensesScreen`, the list/manage view and app entry point) and **Settings** (`SettingsScreen`, language only).
- `AddExpense` — full-screen modal-presented route, shared by both "add" and "edit" flows for a single expense. Mode is determined by route params: `{ groupId }` = add, `{ groupId, expenseId }` = edit. The group is fixed for the lifetime of this screen — there is no group picker here; the group comes from wherever the user navigated from.
- `GroupForm` — full-screen modal-presented route, shared by "create" and "edit" for a group. `{}` = create, `{ groupId }` = edit (adds a destructive "Delete Group" flow that cascades to delete the group's expenses).

Provider nesting in `App.tsx` (outer → inner): `SafeAreaProvider` → `LanguageProvider` → `GroupsProvider` → `ExchangeRatesProvider` → `PaymentMethodsProvider` → `ExpensesProvider` → navigation tree.

There's no `onSaved`/`onDeleted` callback plumbing through route params (React Navigation warns on non-serializable params). Instead, `ManageExpensesScreen` sets a `pendingGroupSync` ref before navigating to `GroupForm`, and on refocus (`useFocusEffect`) re-syncs its group filter from `GroupsContext.activeGroupId` — which `addGroup`/`updateGroup`/`deleteGroup` keep current. Follow this pattern rather than passing functions through `navigation.navigate(...)` params.

### Data model

- **`ExpenseGroup`** (`src/types/group.ts`) represents one trip: `name`, `defaultCurrency` (pre-fills new expenses), `leadCurrency` (nullable — the "show totals in" display currency), `createdAt`.
- **`Expense`** (`src/types/expense.ts`) always belongs to exactly one group via `groupId`. An expense can never be created without a group; `ManageExpensesScreen` shows a "create your first group" onboarding state when none exist yet.
- Payment methods (`PaymentMethodsContext`) are global, not per-group. Default methods (Cash/Credit Card/Debit Card) are identified by fixed ids and their display name is resolved through translations via `src/utils/paymentMethodName.ts` (not stored as literal text), so they stay translated when the language changes; user-added custom methods store their literal name.

### Currency conversion (`src/storage/ExchangeRatesContext.tsx`)

Rates come from `open.er-api.com` (free, keyless), cached in `AsyncStorage` per base currency with a 1-hour staleness window. The cache supports multiple simultaneous bases because different groups can have different `leadCurrency` values. `convert(amount, from, to)` returns `null` when a rate isn't available (e.g. offline, never fetched) — callers must handle that by falling back to unconverted display, never assume it succeeds.

**Trip-total display convention** (see `formatTotalsWithLead` in `src/utils/formatCurrency.ts`): totals show every currency actually present in the list at its own unconverted sum, joined by " · " (e.g. `€15.00 · $20.00`), with the lead currency's real converted grand total appended in brackets when set (e.g. `€15.00 · $20.00 (₪110.91)`). This is intentional — don't collapse everything into one converted number.

### i18n (`src/i18n/`)

Hand-rolled (no i18next). `translations.ts` exports a `Translations` interface and a `TRANSLATIONS` record covering `en`, `fr`, `de`, `es`, `he`. Adding any UI string means updating the interface *and all five* language entries — TypeScript will catch a missing key. Consumed via `useLanguage()` (`LanguageContext`), which exposes `t`, `isRTL`, and `language.locale` (used for `Intl`/`toLocaleDateString` formatting).

Hebrew RTL is handled manually per-component (`isRTL` → `textAlign`, `flexDirection: 'row-reverse'`, mirrored chevrons `‹`/`›`) rather than via `I18nManager.forceRTL`, since that requires a native reload and is unreliable in Expo Go.

### State/persistence

No shared storage abstraction — each `src/storage/*Context.tsx` (`ExpensesContext`, `GroupsContext`, `PaymentMethodsContext`, `LanguageContext`, `ExchangeRatesContext`) owns its own `AsyncStorage` key(s), loads on mount, and writes through on every mutation. Follow the existing per-context pattern (`useState` + `useCallback` mutators + a memoized context value) rather than introducing a new state library.

### UI

Plain `StyleSheet`-based components, no UI kit. Shared colors in `src/theme/colors.ts` (teal/coral palette). Reusable bottom-sheet pickers live in `src/components/` (`CurrencyPickerModal`, `PaymentMethodPickerModal`, `GroupPickerModal`, `LanguagePickerModal`) and are composed into the screens in `src/screens/`. Full-page flows (add/edit expense, create/edit group) are screens, not modals — only short-lived pickers and confirmation dialogs use RN `Modal`.
