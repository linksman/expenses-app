import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import { CURRENCIES } from '../types/currency';
import { RateSnapshot } from '../types/expense';

const CACHE_KEY = 'vacation-expenses:rates:v2';
const STALE_MS = 60 * 60 * 1000; // 1 hour
// Fixed anchor for per-expense rate snapshots: fetching this one base once
// covers every supported currency's rate in a single request, regardless of
// which currency the expense or the vacation's lead currency actually use.
const SNAPSHOT_BASE = 'USD';

interface RatesEntry {
  rates: Record<string, number>;
  fetchedAt: number;
}

type RatesCache = Record<string, RatesEntry>;

interface ExchangeRatesContextValue {
  getEntry: (base: string) => RatesEntry | undefined;
  isLoading: (base: string) => boolean;
  hasError: (base: string) => boolean;
  ensureRates: (base: string) => void;
  refresh: (base: string) => void;
  convert: (amount: number, fromCode: string, toCode: string | null) => number | null;
  captureSnapshot: () => Promise<RateSnapshot | null>;
}

const ExchangeRatesContext = createContext<ExchangeRatesContextValue | undefined>(
  undefined
);

async function fetchRates(base: string): Promise<Record<string, number>> {
  const res = await fetch(`https://open.er-api.com/v6/latest/${base}`);
  if (!res.ok) throw new Error('network error');
  const json = await res.json();
  if (json.result !== 'success' || !json.rates) throw new Error('api error');
  return json.rates;
}

export function ExchangeRatesProvider({ children }: { children: React.ReactNode }) {
  const [cache, setCache] = useState<RatesCache>({});
  const [loadingBases, setLoadingBases] = useState<Record<string, boolean>>({});
  const [errorBases, setErrorBases] = useState<Record<string, boolean>>({});
  const [cacheLoaded, setCacheLoaded] = useState(false);
  const [inFlight, setInFlight] = useState<Record<string, boolean>>({});

  const doFetch = useCallback(
    async (base: string): Promise<RatesEntry | null> => {
      setLoadingBases((prev) => ({ ...prev, [base]: true }));
      setErrorBases((prev) => ({ ...prev, [base]: false }));
      try {
        const rates = await fetchRates(base);
        const entry: RatesEntry = { rates, fetchedAt: Date.now() };
        setCache((prev) => {
          const next = { ...prev, [base]: entry };
          AsyncStorage.setItem(CACHE_KEY, JSON.stringify(next));
          return next;
        });
        return entry;
      } catch {
        setErrorBases((prev) => ({ ...prev, [base]: true }));
        return null;
      } finally {
        setLoadingBases((prev) => ({ ...prev, [base]: false }));
        setInFlight((prev) => ({ ...prev, [base]: false }));
      }
    },
    []
  );

  const ensureRates = useCallback(
    (base: string) => {
      (async () => {
        let currentCache = cache;
        if (!cacheLoaded) {
          const raw = await AsyncStorage.getItem(CACHE_KEY);
          currentCache = raw ? JSON.parse(raw) : {};
          setCache(currentCache);
          setCacheLoaded(true);
        }
        const entry = currentCache[base];
        const isStale = !entry || Date.now() - entry.fetchedAt > STALE_MS;
        if (isStale && !inFlight[base]) {
          setInFlight((prev) => ({ ...prev, [base]: true }));
          doFetch(base);
        }
      })();
    },
    [cache, cacheLoaded, inFlight, doFetch]
  );

  const refresh = useCallback(
    (base: string) => {
      if (!inFlight[base]) {
        setInFlight((prev) => ({ ...prev, [base]: true }));
        doFetch(base);
      }
    },
    [inFlight, doFetch]
  );

  const getEntry = useCallback((base: string) => cache[base], [cache]);
  const isLoading = useCallback((base: string) => !!loadingBases[base], [loadingBases]);
  const hasError = useCallback((base: string) => !!errorBases[base], [errorBases]);

  const convert = useCallback(
    (amount: number, fromCode: string, toCode: string | null): number | null => {
      if (!toCode) return null;
      if (fromCode === toCode) return amount;
      const entry = cache[toCode];
      if (!entry) return null;
      const rate = entry.rates[fromCode];
      if (!rate) return null;
      return amount / rate;
    },
    [cache]
  );

  // Captures a frozen table of every supported currency's rate, for an
  // expense to keep forever (see RateSnapshot). Reuses the same cache/fetch
  // machinery as ensureRates/refresh, just always anchored at SNAPSHOT_BASE
  // instead of whichever currency a caller wants to display totals in.
  const captureSnapshot = useCallback(async (): Promise<RateSnapshot | null> => {
    let entry = cache[SNAPSHOT_BASE];
    const isStale = !entry || Date.now() - entry.fetchedAt > STALE_MS;
    if (isStale) {
      entry = (await doFetch(SNAPSHOT_BASE)) ?? entry;
    }
    if (!entry) return null;
    const rates: Record<string, number> = {};
    for (const c of CURRENCIES) {
      if (entry.rates[c.code] != null) rates[c.code] = entry.rates[c.code];
    }
    return { base: SNAPSHOT_BASE, rates, fetchedAt: entry.fetchedAt };
  }, [cache, doFetch]);

  const value = useMemo(
    () => ({ getEntry, isLoading, hasError, ensureRates, refresh, convert, captureSnapshot }),
    [getEntry, isLoading, hasError, ensureRates, refresh, convert, captureSnapshot]
  );

  return (
    <ExchangeRatesContext.Provider value={value}>{children}</ExchangeRatesContext.Provider>
  );
}

export function useExchangeRates(): ExchangeRatesContextValue {
  const ctx = useContext(ExchangeRatesContext);
  if (!ctx)
    throw new Error('useExchangeRates must be used within an ExchangeRatesProvider');
  return ctx;
}
