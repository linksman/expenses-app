import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'vacation-expenses:group-by:v1';

export const EXPENSE_GROUPINGS = [
  'date',
  'paymentMethod',
  'collaborators',
  'category',
  'currency',
] as const;

export type ExpenseGrouping = (typeof EXPENSE_GROUPINGS)[number];

interface ExpenseGroupingContextValue {
  groupBy: ExpenseGrouping;
  setGroupBy: (value: ExpenseGrouping) => Promise<void>;
}

const ExpenseGroupingContext = createContext<ExpenseGroupingContextValue | undefined>(undefined);

function isExpenseGrouping(value: string | null): value is ExpenseGrouping {
  return EXPENSE_GROUPINGS.some((option) => option === value);
}

export function ExpenseGroupingProvider({ children }: { children: React.ReactNode }) {
  const [groupBy, setGroupByState] = useState<ExpenseGrouping>('date');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (isExpenseGrouping(stored)) setGroupByState(stored);
    });
  }, []);

  const setGroupBy = useCallback(async (value: ExpenseGrouping) => {
    setGroupByState(value);
    await AsyncStorage.setItem(STORAGE_KEY, value);
  }, []);

  const value = useMemo(() => ({ groupBy, setGroupBy }), [groupBy, setGroupBy]);
  return <ExpenseGroupingContext.Provider value={value}>{children}</ExpenseGroupingContext.Provider>;
}

export function useExpenseGrouping(): ExpenseGroupingContextValue {
  const context = useContext(ExpenseGroupingContext);
  if (!context) throw new Error('useExpenseGrouping must be used within ExpenseGroupingProvider');
  return context;
}
