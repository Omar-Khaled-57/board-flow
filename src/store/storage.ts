import { get, set, del, createStore } from 'idb-keyval';
import { Store } from '@tauri-apps/plugin-store';

const isTauriAvailable = typeof window !== 'undefined' && typeof (window as any).__TAURI_IPC__ !== 'undefined';

// IndexedDB store for web environments (larger quota, no 5MB cap)
const idbCustomStore = createStore('boardflow-db', 'boardflow-store');

export const idbStorage = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      const val = await get(name, idbCustomStore);
      return val !== undefined ? JSON.stringify(val) : null;
    } catch (e) {
      console.error('Error reading from IndexedDB:', e);
      return null;
    }
  },
  setItem: async (name: string, value: string): Promise<void> => {
    try {
      await set(name, JSON.parse(value), idbCustomStore);
    } catch (e) {
      console.error('Error writing to IndexedDB:', e);
    }
  },
  removeItem: async (name: string): Promise<void> => {
    try {
      await del(name, idbCustomStore);
    } catch (e) {
      console.error('Error removing from IndexedDB:', e);
    }
  },
};

export const tauriStorage = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      const store = await Store.load('boardflow.dat');
      const val = await store.get<any>(name);
      return val ? JSON.stringify(val) : null;
    } catch (e) {
      console.error('Error reading from Tauri store:', e);
      return null;
    }
  },
  setItem: async (name: string, value: string): Promise<void> => {
    try {
      const store = await Store.load('boardflow.dat');
      await store.set(name, JSON.parse(value));
      await store.save();
    } catch (e) {
      console.error('Error writing to Tauri store:', e);
    }
  },
  removeItem: async (name: string): Promise<void> => {
    try {
      const store = await Store.load('boardflow.dat');
      await store.delete(name);
      await store.save();
    } catch (e) {
      console.error('Error removing from Tauri store:', e);
    }
  },
};

export const localStorageAdapter = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      return window.localStorage.getItem(name);
    } catch {
      return null;
    }
  },
  setItem: async (name: string, value: string): Promise<void> => {
    try {
      window.localStorage.setItem(name, value);
    } catch {
      // quota exceeded or unavailable
    }
  },
  removeItem: async (name: string): Promise<void> => {
    try {
      window.localStorage.removeItem(name);
    } catch {
      // ignore
    }
  },
};

export const getStorageAdapter = () => {
  if (isTauriAvailable) return tauriStorage;
  // Prefer IndexedDB, fall back to localStorage
  try {
    if (typeof window !== 'undefined' && window.indexedDB) return idbStorage;
  } catch {
    // IndexedDB not available
  }
  return localStorageAdapter;
};
