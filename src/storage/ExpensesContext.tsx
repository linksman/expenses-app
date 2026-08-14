import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Category, Expense } from '../types/expense';

const STORAGE_KEY = 'vacation-expenses:v1';

// Expenses persisted before "note" was renamed to "description" lack the new field.
function normalizeExpense(raw: any): Expense {
  if (raw.description !== undefined) return raw;
  return { ...raw, description: raw.note ?? '' };
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
    groupId: string,
    createdAt: string
  ) => Promise<void>;
  updateExpense: (
    id: string,
    amount: number,
    category: Category | null,
    description: string,
    currencyCode: string,
    paymentMethodId: string,
    createdAt: string
  ) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  deleteExpensesByGroup: (groupId: string) => Promise<void>;
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
      groupId: string,
      createdAt: string
    ) => {
      const expense: Expense = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        amount,
        category,
        description: description.trim(),
        createdAt,
        currencyCode,
        paymentMethodId,
        groupId,
      };
      await persist([expense, ...expenses]);
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
      createdAt: string
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

  const deleteExpensesByGroup = useCallback(
    async (groupId: string) => {
      await persist(expenses.filter((e) => e.groupId !== groupId));
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
      deleteExpensesByGroup,
    }),
    [expenses, loading, addExpense, updateExpense, deleteExpense, deleteExpensesByGroup]
  );

  return <ExpensesContext.Provider value={value}>{children}</ExpensesContext.Provider>;
}

export function useExpenses(): ExpensesContextValue {
  const ctx = useContext(ExpensesContext);
  if (!ctx) throw new Error('useExpenses must be used within an ExpensesProvider');
  return ctx;
}
