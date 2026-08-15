import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { ExpenseGroup } from '../types/group';

const GROUPS_KEY = 'vacation-expenses:groups:v1';
const ACTIVE_GROUP_KEY = 'vacation-expenses:active-group:v1';

interface GroupsContextValue {
  groups: ExpenseGroup[];
  activeGroupId: string | null;
  activeGroup: ExpenseGroup | null;
  loading: boolean;
  addGroup: (
    name: string,
    defaultCurrency: string,
    leadCurrency: string | null
  ) => Promise<ExpenseGroup>;
  updateGroup: (
    id: string,
    name: string,
    defaultCurrency: string,
    leadCurrency: string | null
  ) => Promise<ExpenseGroup>;
  deleteGroup: (id: string) => Promise<void>;
  setActiveGroupId: (id: string) => void;
}

const GroupsContext = createContext<GroupsContextValue | undefined>(undefined);

export function GroupsProvider({ children }: { children: React.ReactNode }) {
  const [groups, setGroups] = useState<ExpenseGroup[]>([]);
  const [activeGroupId, setActiveGroupIdState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [rawGroups, rawActive] = await Promise.all([
          AsyncStorage.getItem(GROUPS_KEY),
          AsyncStorage.getItem(ACTIVE_GROUP_KEY),
        ]);
        const loadedGroups: ExpenseGroup[] = rawGroups ? JSON.parse(rawGroups) : [];
        setGroups(loadedGroups);
        if (rawGroups) await AsyncStorage.setItem(GROUPS_KEY, JSON.stringify(loadedGroups));
        if (rawActive && loadedGroups.some((g) => g.id === rawActive)) {
          setActiveGroupIdState(rawActive);
        } else if (loadedGroups.length > 0) {
          setActiveGroupIdState(loadedGroups[0].id);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const setActiveGroupId = useCallback((id: string) => {
    setActiveGroupIdState(id);
    AsyncStorage.setItem(ACTIVE_GROUP_KEY, id);
  }, []);

  const addGroup = useCallback(
    async (name: string, defaultCurrency: string, leadCurrency: string | null) => {
      const group: ExpenseGroup = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: name.trim(),
        defaultCurrency,
        leadCurrency,
        createdAt: new Date().toISOString(),
      };
      const next = [...groups, group];
      setGroups(next);
      await AsyncStorage.setItem(GROUPS_KEY, JSON.stringify(next));
      setActiveGroupId(group.id);
      return group;
    },
    [groups, setActiveGroupId]
  );

  const updateGroup = useCallback(
    async (id: string, name: string, defaultCurrency: string, leadCurrency: string | null) => {
      let updated: ExpenseGroup | undefined;
      const next = groups.map((g) => {
        if (g.id !== id) return g;
        updated = { ...g, name: name.trim(), defaultCurrency, leadCurrency };
        return updated;
      });
      setGroups(next);
      await AsyncStorage.setItem(GROUPS_KEY, JSON.stringify(next));
      setActiveGroupId(id);
      return updated!;
    },
    [groups, setActiveGroupId]
  );

  const deleteGroup = useCallback(
    async (id: string) => {
      const next = groups.filter((g) => g.id !== id);
      setGroups(next);
      await AsyncStorage.setItem(GROUPS_KEY, JSON.stringify(next));
      if (activeGroupId === id) {
        const fallback = next[0]?.id ?? null;
        setActiveGroupIdState(fallback);
        if (fallback) await AsyncStorage.setItem(ACTIVE_GROUP_KEY, fallback);
        else await AsyncStorage.removeItem(ACTIVE_GROUP_KEY);
      }
    },
    [groups, activeGroupId]
  );

  const activeGroup = useMemo(
    () => groups.find((g) => g.id === activeGroupId) ?? null,
    [groups, activeGroupId]
  );

  const value = useMemo(
    () => ({
      groups,
      activeGroupId,
      activeGroup,
      loading,
      addGroup,
      updateGroup,
      deleteGroup,
      setActiveGroupId,
    }),
    [
      groups,
      activeGroupId,
      activeGroup,
      loading,
      addGroup,
      updateGroup,
      deleteGroup,
      setActiveGroupId,
    ]
  );

  return <GroupsContext.Provider value={value}>{children}</GroupsContext.Provider>;
}

export function useGroups(): GroupsContextValue {
  const ctx = useContext(GroupsContext);
  if (!ctx) throw new Error('useGroups must be used within a GroupsProvider');
  return ctx;
}
