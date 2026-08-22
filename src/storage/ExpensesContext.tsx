import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Category, Expense, ExpenseSplitShare } from '../types/expense';

const STORAGE_KEY = 'vacation-expenses:v1';

// Expenses persisted before "note" was renamed to "description", before expense
// splitting existed, or before "groupId" was renamed to "vacationId" lack those
// fields (or have the old one instead).
function normalizeExpense(raw: any): Expense {
  const description = raw.description !== undefined ? raw.description : raw.note ?? '';
  const split = raw.split !== undefined ? raw.split : [];
  const vacationId = raw.vacationId !== undefined ? raw.vacationId : raw.groupId;
  const excludedFromStatistics = raw.excludedFromStatistics === true;
  if (
    raw.description !== undefined &&
    raw.split !== undefined &&
    raw.vacationId !== undefined &&
    raw.excludedFromStatistics !== undefined
  ) {
    return raw;
  }
  return { ...raw, description, split, vacationId, excludedFromStatistics };
}

interface ExpensesContextValue {
  expenses: Expense[];
  loading: boolean;
  addExpense: (
    amount: number,
    category: Category | null,
    description: string,
    currencyCode: string,
    paymentMethodId: string,
    vacationId: string,
    createdAt: string,
    split: ExpenseSplitShare[]
  ) => Promise<string>;
  updateExpense: (
    id: string,
    amount: number,
    category: Category | null,
    description: string,
    currencyCode: string,
    paymentMethodId: string,
    createdAt: string,
    split: ExpenseSplitShare[]
  ) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  setExpenseStatisticsExcluded: (id: string, excluded: boolean) => Promise<void>;
  deleteExpensesByVacation: (vacationId: string) => Promise<void>;
}

const ExpensesContext = createContext<ExpensesContextValue | undefined>(undefined);

export function ExpensesProvider({ children }: { children: React.ReactNode }) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw).map(normalizeExpense);
          setExpenses(parsed);
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const persist = useCallback(async (next: Expense[]) => {
    setExpenses(next);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const addExpense = useCallback(
    async (
      amount: number,
      category: Category | null,
      description: string,
      currencyCode: string,
      paymentMethodId: string,
      vacationId: string,
      createdAt: string,
      split: ExpenseSplitShare[]
    ) => {
      const expense: Expense = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        amount,
        category,
        description: description.trim(),
        createdAt,
        currencyCode,
        paymentMethodId,
        vacationId,
        split,
        excludedFromStatistics: false,
      };
      await persist([expense, ...expenses]);
      return expense.id;
    },
    [expenses, persist]
  );

  const updateExpense = useCallback(
    async (
      id: string,
      amount: number,
      category: Category | null,
      description: string,
      currencyCode: string,
      paymentMethodId: string,
      createdAt: string,
      split: ExpenseSplitShare[]
    ) => {
      await persist(
        expenses.map((e) =>
          e.id === id
            ? {
                ...e,
                amount,
                category,
                description: description.trim(),
                currencyCode,
                paymentMethodId,
                createdAt,
                split,
              }
            : e
        )
      );
    },
    [expenses, persist]
  );

  const deleteExpense = useCallback(
    async (id: string) => {
      await persist(expenses.filter((e) => e.id !== id));
    },
    [expenses, persist]
  );

  const setExpenseStatisticsExcluded = useCallback(
    async (id: string, excluded: boolean) => {
      await persist(
        expenses.map((expense) =>
          expense.id === id ? { ...expense, excludedFromStatistics: excluded } : expense
        )
      );
    },
    [expenses, persist]
  );

  const deleteExpensesByVacation = useCallback(
    async (vacationId: string) => {
      await persist(expenses.filter((e) => e.vacationId !== vacationId));
    },
    [expenses, persist]
  );

  const value = useMemo(
    () => ({
      expenses,
      loading,
      addExpense,
      updateExpense,
      deleteExpense,
      setExpenseStatisticsExcluded,
      deleteExpensesByVacation,
    }),
    [expenses, loading, addExpense, updateExpense, deleteExpense, setExpenseStatisticsExcluded, deleteExpensesByVacation]
  );

  return <ExpensesContext.Provider value={value}>{children}</ExpensesContext.Provider>;
}

export function useExpenses(): ExpensesContextValue {
  const ctx = useContext(ExpensesContext);
  if (!ctx) throw new Error('useExpenses must be used within an ExpensesProvider');
  return ctx;
}
