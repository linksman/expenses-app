import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  DEFAULT_PAYMENT_METHOD_ICON,
  DEFAULT_PAYMENT_METHODS,
  PaymentMethod,
} from '../types/paymentMethod';

const STORAGE_KEY = 'vacation-expenses:payment-methods:v1';
const DEFAULT_METHOD_STORAGE_KEY = 'vacation-expenses:default-payment-method:v1';

// Methods persisted before icons replaced emoji lack `icon`, and methods persisted
// before enable/disable existed lack `enabled` — backfill both on load so existing
// installs don't end up with a blank icon or a permanently-hidden method.
function normalizeMethod(raw: any): PaymentMethod {
  const fallback = DEFAULT_PAYMENT_METHODS.find((m) => m.id === raw.id);
  return {
    id: raw.id,
    name: raw.name,
    icon: raw.icon ?? fallback?.icon ?? DEFAULT_PAYMENT_METHOD_ICON,
    enabled: raw.enabled ?? true,
  };
}

interface PaymentMethodsContextValue {
  methods: PaymentMethod[];
  loading: boolean;
  defaultMethodId: string | null;
  effectiveDefaultMethodId: string | null;
  addPaymentMethod: (name: string) => Promise<PaymentMethod>;
  deletePaymentMethod: (id: string) => Promise<void>;
  setMethodEnabled: (id: string, enabled: boolean) => Promise<void>;
  moveMethod: (id: string, direction: 'up' | 'down') => Promise<void>;
  setDefaultMethodId: (id: string) => Promise<void>;
}

const PaymentMethodsContext = createContext<PaymentMethodsContextValue | undefined>(
  undefined
);

export function PaymentMethodsProvider({ children }: { children: React.ReactNode }) {
  const [methods, setMethods] = useState<PaymentMethod[]>(DEFAULT_PAYMENT_METHODS);
  const [defaultMethodId, setDefaultMethodIdState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [raw, rawDefault] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEY),
          AsyncStorage.getItem(DEFAULT_METHOD_STORAGE_KEY),
        ]);
        if (raw) {
          const parsed = JSON.parse(raw).map(normalizeMethod);
          setMethods(parsed);
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
        } else {
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_PAYMENT_METHODS));
        }
        if (rawDefault) setDefaultMethodIdState(rawDefault);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const persist = useCallback(async (next: PaymentMethod[]) => {
    setMethods(next);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const addPaymentMethod = useCallback(
    async (name: string) => {
      const trimmed = name.trim();
      const existing = methods.find(
        (m) => m.name.toLowerCase() === trimmed.toLowerCase()
      );
      if (existing) return existing;

      const method: PaymentMethod = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: trimmed,
        icon: DEFAULT_PAYMENT_METHOD_ICON,
        enabled: true,
      };
      await persist([...methods, method]);
      return method;
    },
    [methods, persist]
  );

  const deletePaymentMethod = useCallback(
    async (id: string) => {
      await persist(methods.filter((m) => m.id !== id));
    },
    [methods, persist]
  );

  const setMethodEnabled = useCallback(
    async (id: string, enabled: boolean) => {
      await persist(methods.map((m) => (m.id === id ? { ...m, enabled } : m)));
    },
    [methods, persist]
  );

  const moveMethod = useCallback(
    async (id: string, direction: 'up' | 'down') => {
      const index = methods.findIndex((m) => m.id === id);
      if (index === -1) return;
      const swapWith = direction === 'up' ? index - 1 : index + 1;
      if (swapWith < 0 || swapWith >= methods.length) return;
      const next = [...methods];
      [next[index], next[swapWith]] = [next[swapWith], next[index]];
      await persist(next);
    },
    [methods, persist]
  );

  const setDefaultMethodId = useCallback(
    async (id: string) => {
      setDefaultMethodIdState(id);
      await AsyncStorage.setItem(DEFAULT_METHOD_STORAGE_KEY, id);
      const index = methods.findIndex((m) => m.id === id);
      if (index > 0) {
        const next = [...methods];
        const [item] = next.splice(index, 1);
        next.unshift(item);
        await persist(next);
      }
    },
    [methods, persist]
  );

  const effectiveDefaultMethodId = useMemo(() => {
    const enabledMethods = methods.filter((m) => m.enabled);
    const currentDefault = defaultMethodId
      ? enabledMethods.find((m) => m.id === defaultMethodId)
      : undefined;
    return (currentDefault ?? enabledMethods[0])?.id ?? null;
  }, [methods, defaultMethodId]);

  const value = useMemo(
    () => ({
      methods,
      loading,
      defaultMethodId,
      effectiveDefaultMethodId,
      addPaymentMethod,
      deletePaymentMethod,
      setMethodEnabled,
      moveMethod,
      setDefaultMethodId,
    }),
    [
      methods,
      loading,
      defaultMethodId,
      effectiveDefaultMethodId,
      addPaymentMethod,
      deletePaymentMethod,
      setMethodEnabled,
      moveMethod,
      setDefaultMethodId,
    ]
  );

  return (
    <PaymentMethodsContext.Provider value={value}>
      {children}
    </PaymentMethodsContext.Provider>
  );
}

export function usePaymentMethods(): PaymentMethodsContextValue {
  const ctx = useContext(PaymentMethodsContext);
  if (!ctx)
    throw new Error('usePaymentMethods must be used within a PaymentMethodsProvider');
  return ctx;
}
