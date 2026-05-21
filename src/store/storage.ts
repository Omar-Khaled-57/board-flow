import { Store } from '@tauri-apps/plugin-store';

// We load the store asynchronously but we can await it inside the adapter methods
const getStore = async () => {
  return await Store.load('boardflow.dat');
};

export const tauriStorage = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      const store = await getStore();
      const val = await store.get<any>(name);
      return val ? JSON.stringify(val) : null;
    } catch (e) {
      console.error('Error reading from Tauri store:', e);
      return null;
    }
  },
  setItem: async (name: string, value: string): Promise<void> => {
    try {
      const store = await getStore();
      await store.set(name, JSON.parse(value));
      await store.save();
    } catch (e) {
      console.error('Error writing to Tauri store:', e);
    }
  },
  removeItem: async (name: string): Promise<void> => {
    try {
      const store = await getStore();
      await store.delete(name);
      await store.save();
    } catch (e) {
      console.error('Error removing from Tauri store:', e);
    }
  }
};
