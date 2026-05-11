import { useCallback, useEffect, useState } from "react";

export interface SerializableBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface RecentSearch {
  id: string;
  label: string;
  lat: number;
  lng: number;
  zoom: number;
  bounds?: SerializableBounds;
}

interface UseRecentSearchesOptions {
  storageKey?: string;
  capacity?: number;
}

interface UseRecentSearchesReturn {
  recents: RecentSearch[];
  addRecent: (item: RecentSearch) => void;
  clearRecents: () => void;
}

const DEFAULT_STORAGE_KEY = "aircasting:recent-searches";
const DEFAULT_CAPACITY = 5;

const isValidRecent = (value: unknown): value is RecentSearch => {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.label === "string" &&
    typeof candidate.lat === "number" &&
    typeof candidate.lng === "number" &&
    typeof candidate.zoom === "number"
  );
};

const readFromStorage = (storageKey: string): RecentSearch[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isValidRecent);
  } catch {
    return [];
  }
};

const writeToStorage = (storageKey: string, value: RecentSearch[]) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(value));
  } catch {
    // localStorage quota exceeded or unavailable — silently skip
  }
};

const useRecentSearches = (
  options: UseRecentSearchesOptions = {}
): UseRecentSearchesReturn => {
  const { storageKey = DEFAULT_STORAGE_KEY, capacity = DEFAULT_CAPACITY } =
    options;

  const [recents, setRecents] = useState<RecentSearch[]>(() =>
    readFromStorage(storageKey)
  );

  useEffect(() => {
    writeToStorage(storageKey, recents);
  }, [recents, storageKey]);

  const addRecent = useCallback(
    (item: RecentSearch) => {
      setRecents((previous) => {
        const withoutDuplicate = previous.filter((r) => r.id !== item.id);
        const next = [item, ...withoutDuplicate];
        return next.slice(0, capacity);
      });
    },
    [capacity]
  );

  const clearRecents = useCallback(() => {
    setRecents([]);
  }, []);

  return { recents, addRecent, clearRecents };
};

export default useRecentSearches;
