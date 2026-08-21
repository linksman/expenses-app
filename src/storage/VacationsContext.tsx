import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Vacation } from '../types/vacation';
import { TravelCompanion } from '../types/companion';
import { ExpenseGrouping, isExpenseGrouping } from '../types/expenseGrouping';
import { type DestinationImageResult, findDestinationImage } from '../utils/destinationImage';

const VACATIONS_KEY = 'vacation-expenses:vacations:v1';
const ACTIVE_VACATION_KEY = 'vacation-expenses:active-vacation:v1';
const LEGACY_GROUP_BY_KEY = 'vacation-expenses:group-by:v1';
// Pre-rename keys (back when vacations were called "groups"). Read once to
// migrate existing users' data over; never written to again.
const LEGACY_VACATIONS_KEY = 'vacation-expenses:groups:v1';
const LEGACY_ACTIVE_VACATION_KEY = 'vacation-expenses:active-group:v1';

// Vacations persisted before travel companions existed lack the field entirely.
function normalizeVacation(raw: any, legacyGroupBy: unknown = 'date'): Vacation {
  const hasUnsplashImage = !!raw.summaryImageUrl && !!raw.summaryImagePhotographerName;
  return {
    ...raw,
    companions: raw.companions ?? [],
    groupBy: isExpenseGrouping(raw.groupBy)
      ? raw.groupBy
      : isExpenseGrouping(legacyGroupBy)
        ? legacyGroupBy
        : 'date',
    summaryImageLocalUri: undefined,
    ...(!hasUnsplashImage
      ? {
          summaryImageUrl: undefined,
          summaryImagePhotographerName: undefined,
          summaryImagePhotographerUrl: undefined,
          summaryImageUnsplashUrl: undefined,
        }
      : {}),
  };
}

interface VacationsContextValue {
  vacations: Vacation[];
  activeVacationId: string | null;
  activeVacation: Vacation | null;
  loading: boolean;
  addVacation: (
    name: string,
    defaultCurrency: string,
    leadCurrency: string | null,
    companions: TravelCompanion[]
  ) => Promise<Vacation>;
  updateVacation: (
    id: string,
    name: string,
    defaultCurrency: string,
    leadCurrency: string | null,
    companions: TravelCompanion[]
  ) => Promise<Vacation>;
  deleteVacation: (id: string) => Promise<void>;
  setVacationSummaryImage: (id: string, image: DestinationImageResult | null) => void;
  setVacationFixedExchangeRate: (id: string, rate: number | null) => void;
  setVacationGroupBy: (id: string, groupBy: ExpenseGrouping) => void;
  setActiveVacationId: (id: string) => void;
}

const VacationsContext = createContext<VacationsContextValue | undefined>(undefined);

export function VacationsProvider({ children }: { children: React.ReactNode }) {
  const [vacations, setVacations] = useState<Vacation[]>([]);
  const [activeVacationId, setActiveVacationIdState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const setVacationSummaryImage = useCallback((id: string, image: DestinationImageResult | null) => {
    setVacations((current) => {
      const next = current.map((vacation) =>
        vacation.id === id
          ? {
              ...vacation,
              summaryImageUrl: image?.url ?? '',
              summaryImagePhotographerName: image?.photographerName,
              summaryImagePhotographerUrl: image?.photographerUrl,
              summaryImageUnsplashUrl: image?.unsplashUrl,
            }
          : vacation
      );
      void AsyncStorage.setItem(VACATIONS_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const setVacationFixedExchangeRate = useCallback((id: string, rate: number | null) => {
    setVacations((current) => {
      const next = current.map((vacation) =>
        vacation.id === id ? { ...vacation, fixedExchangeRate: rate } : vacation
      );
      void AsyncStorage.setItem(VACATIONS_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const setVacationGroupBy = useCallback((id: string, groupBy: ExpenseGrouping) => {
    setVacations((current) => {
      const next = current.map((vacation) =>
        vacation.id === id ? { ...vacation, groupBy } : vacation
      );
      void AsyncStorage.setItem(VACATIONS_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  useEffect(() => {
    (async () => {
      try {
        let [rawVacations, rawActive, legacyGroupBy] = await Promise.all([
          AsyncStorage.getItem(VACATIONS_KEY),
          AsyncStorage.getItem(ACTIVE_VACATION_KEY),
          AsyncStorage.getItem(LEGACY_GROUP_BY_KEY),
        ]);
        if (rawVacations === null) {
          const [legacyVacations, legacyActive] = await Promise.all([
            AsyncStorage.getItem(LEGACY_VACATIONS_KEY),
            AsyncStorage.getItem(LEGACY_ACTIVE_VACATION_KEY),
          ]);
          if (legacyVacations !== null) rawVacations = legacyVacations;
          if (rawActive === null && legacyActive !== null) rawActive = legacyActive;
        }
        const loadedVacations: Vacation[] = rawVacations
          ? JSON.parse(rawVacations).map((raw: unknown) => normalizeVacation(raw, legacyGroupBy))
          : [];
        setVacations(loadedVacations);
        if (rawVacations) await AsyncStorage.setItem(VACATIONS_KEY, JSON.stringify(loadedVacations));
        if (rawActive && loadedVacations.some((v) => v.id === rawActive)) {
          setActiveVacationIdState(rawActive);
          await AsyncStorage.setItem(ACTIVE_VACATION_KEY, rawActive);
        } else if (loadedVacations.length > 0) {
          setActiveVacationIdState(loadedVacations[0].id);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Older vacations predate destination photos. Resolve them once after storage
  // loads so users don't have to rename an existing vacation to trigger a lookup.
  useEffect(() => {
    if (loading) return;
    for (const vacation of vacations) {
      if (vacation.summaryImageUrl && vacation.summaryImagePhotographerName) continue;
      void findDestinationImage(vacation.name).then((image) => {
        setVacationSummaryImage(vacation.id, image);
      });
    }
    // This is intentionally a one-time migration pass when loading flips false.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  const setActiveVacationId = useCallback((id: string) => {
    setActiveVacationIdState(id);
    AsyncStorage.setItem(ACTIVE_VACATION_KEY, id);
  }, []);

  const addVacation = useCallback(
    async (
      name: string,
      defaultCurrency: string,
      leadCurrency: string | null,
      companions: TravelCompanion[]
    ) => {
      const vacation: Vacation = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: name.trim(),
        defaultCurrency,
        leadCurrency,
        groupBy: 'date',
        companions,
        createdAt: new Date().toISOString(),
      };
      const image = await findDestinationImage(vacation.name);
      vacation.summaryImageUrl = image?.url ?? '';
      vacation.summaryImagePhotographerName = image?.photographerName;
      vacation.summaryImagePhotographerUrl = image?.photographerUrl;
      vacation.summaryImageUnsplashUrl = image?.unsplashUrl;
      const next = [...vacations, vacation];
      setVacations(next);
      await AsyncStorage.setItem(VACATIONS_KEY, JSON.stringify(next));
      setActiveVacationId(vacation.id);
      return vacation;
    },
    [vacations, setActiveVacationId]
  );

  const updateVacation = useCallback(
    async (
      id: string,
      name: string,
      defaultCurrency: string,
      leadCurrency: string | null,
      companions: TravelCompanion[]
    ) => {
      let updated: Vacation | undefined;
      const next = vacations.map((v) => {
        if (v.id !== id) return v;
        updated = { ...v, name: name.trim(), defaultCurrency, leadCurrency, companions };
        return updated;
      });
      setVacations(next);
      await AsyncStorage.setItem(VACATIONS_KEY, JSON.stringify(next));
      setActiveVacationId(id);
      return updated!;
    },
    [vacations, setActiveVacationId]
  );

  const deleteVacation = useCallback(
    async (id: string) => {
      const next = vacations.filter((v) => v.id !== id);
      setVacations(next);
      await AsyncStorage.setItem(VACATIONS_KEY, JSON.stringify(next));
      if (activeVacationId === id) {
        const fallback = next[0]?.id ?? null;
        setActiveVacationIdState(fallback);
        if (fallback) await AsyncStorage.setItem(ACTIVE_VACATION_KEY, fallback);
        else await AsyncStorage.removeItem(ACTIVE_VACATION_KEY);
      }
    },
    [vacations, activeVacationId]
  );

  const activeVacation = useMemo(
    () => vacations.find((v) => v.id === activeVacationId) ?? null,
    [vacations, activeVacationId]
  );

  const value = useMemo(
    () => ({
      vacations,
      activeVacationId,
      activeVacation,
      loading,
      addVacation,
      updateVacation,
      deleteVacation,
      setVacationSummaryImage,
      setVacationFixedExchangeRate,
      setVacationGroupBy,
      setActiveVacationId,
    }),
    [
      vacations,
      activeVacationId,
      activeVacation,
      loading,
      addVacation,
      updateVacation,
      deleteVacation,
      setVacationSummaryImage,
      setVacationFixedExchangeRate,
      setVacationGroupBy,
      setActiveVacationId,
    ]
  );

  return <VacationsContext.Provider value={value}>{children}</VacationsContext.Provider>;
}

export function useVacations(): VacationsContextValue {
  const ctx = useContext(VacationsContext);
  if (!ctx) throw new Error('useVacations must be used within a VacationsProvider');
  return ctx;
}
