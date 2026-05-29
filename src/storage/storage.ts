import { get, set, del, createStore } from 'idb-keyval';
import type { Todo, Note, Tag, TaskList, DailyGoal } from '../types';

// IndexedDB store for large-quota persistence
const customStore = createStore('boardflow-db', 'boardflow-store');

export const idbStorage = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      const val = await get(name, customStore);
      return val !== undefined ? JSON.stringify(val) : null;
    } catch (e) {
      console.error('Error reading from IndexedDB:', e);
      return null;
    }
  },
  setItem: async (name: string, value: string): Promise<void> => {
    try {
      await set(name, JSON.parse(value), customStore);
    } catch (e) {
      console.error('Error writing to IndexedDB:', e);
    }
  },
  removeItem: async (name: string): Promise<void> => {
    try {
      await del(name, customStore);
    } catch (e) {
      console.error('Error removing from IndexedDB:', e);
    }
  },
};

// Fallback localStorage adapter for environments where IndexedDB is unavailable
export const localStorageAdapter = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      return window.localStorage.getItem(name);
    } catch (e) {
      console.error('Error reading from localStorage:', e);
      return null;
    }
  },
  setItem: async (name: string, value: string): Promise<void> => {
    try {
      window.localStorage.setItem(name, value);
    } catch (e) {
      console.error('Error writing to localStorage:', e);
    }
  },
  removeItem: async (name: string): Promise<void> => {
    try {
      window.localStorage.removeItem(name);
    } catch (e) {
      console.error('Error removing from localStorage:', e);
    }
  },
};

// Removes legacy localStorage keys after migration to IndexedDB
export async function cleanupLegacyStorage(): Promise<void> {
  const legacyKeys = ['boardflow-storage', 'boardflow-notes', 'boardflow-stats', 'boardflow-schema-version'];
  for (const key of legacyKeys) {
    try {
      if (window.localStorage.getItem(key) !== null) {
        window.localStorage.removeItem(key);
      }
    } catch {
      // ignore
    }
  }
}

export const getStorageAdapter = () => {
  if (typeof window === 'undefined') return localStorageAdapter;
  // Prefer IndexedDB, fall back to localStorage
  try {
    if (window.indexedDB) return idbStorage;
  } catch {
    // IndexedDB not available
  }
  return localStorageAdapter;
};

// ─── Repository types ───

export interface TodoData {
  todos: Todo[];
  tags: Tag[];
  lists: TaskList[];
}

export interface NotesData {
  notes: Note[];
  noteSortField: string;
  noteSortDirection: 'asc' | 'desc';
}

export interface StatsData {
  dailyGoals: Record<string, DailyGoal>;
  currentStreak: number;
  longestStreak: number;
}

// ─── Generic repository helpers ───

const STORE_KEYS = {
  TODOS: 'boardflow-storage',
  NOTES: 'boardflow-notes',
  STATS: 'boardflow-stats',
  SETTINGS: 'boardflow-settings',
} as const;

export async function loadTodos(): Promise<TodoData | null> {
  try {
    const raw = await idbStorage.getItem(STORE_KEYS.TODOS);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return {
      todos: parsed.todos ?? [],
      tags: parsed.tags ?? [],
      lists: parsed.lists ?? [],
    };
  } catch {
    return null;
  }
}

export async function saveTodos(data: TodoData): Promise<void> {
  await idbStorage.setItem(STORE_KEYS.TODOS, JSON.stringify(data));
}

export async function loadNotes(): Promise<NotesData | null> {
  try {
    const raw = await idbStorage.getItem(STORE_KEYS.NOTES);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return {
      notes: parsed.state?.notes ?? parsed.notes ?? [],
      noteSortField: parsed.state?.noteSortField ?? parsed.noteSortField ?? 'date-added',
      noteSortDirection: parsed.state?.noteSortDirection ?? parsed.noteSortDirection ?? 'desc',
    };
  } catch {
    return null;
  }
}

export async function saveNotes(data: NotesData): Promise<void> {
  await idbStorage.setItem(STORE_KEYS.NOTES, JSON.stringify(data));
}

export async function loadStats(): Promise<StatsData | null> {
  try {
    const raw = await idbStorage.getItem(STORE_KEYS.STATS);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return {
      dailyGoals: parsed.dailyGoals ?? {},
      currentStreak: parsed.currentStreak ?? 0,
      longestStreak: parsed.longestStreak ?? 0,
    };
  } catch {
    return null;
  }
}

export async function saveStats(data: StatsData): Promise<void> {
  await idbStorage.setItem(STORE_KEYS.STATS, JSON.stringify(data));
}

export { STORE_KEYS };
