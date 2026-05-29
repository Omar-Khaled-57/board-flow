import '@testing-library/jest-dom';
import 'fake-indexeddb/auto';
import { vi } from 'vitest';

vi.mock('@tauri-apps/plugin-store', () => {
  const mockData = new Map<string, any>();
  const stores = new Map<string, any>();

  return {
    Store: class {
      private key: string;
      constructor(key: string) { this.key = key; }
      static async load(key: string) {
        if (!stores.has(key)) stores.set(key, new this(key));
        return stores.get(key);
      }
      async get<T>(name: string): Promise<T | null> {
        return mockData.get(`${this.key}:${name}`) ?? null;
      }
      async set(name: string, value: any) { mockData.set(`${this.key}:${name}`, value); }
      async delete(name: string) { mockData.delete(`${this.key}:${name}`); }
      async save() {}
    }
  };
});

vi.mock('@tauri-apps/plugin-notification', () => ({
  isPermissionGranted: async () => true,
  requestPermission: async () => 'granted' as const,
  sendNotification: async () => {},
}));

vi.mock('@tauri-apps/api/path', () => ({
  resolveResource: async (path: string) => path,
}));
