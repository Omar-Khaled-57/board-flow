import { get, set } from 'idb-keyval';

export const STORAGE_VERSION_KEY = 'boardflow-schema-version';
export const CURRENT_STORAGE_VERSION = 2;

type MigrationFn = () => Promise<void>;

const migrations: Record<number, MigrationFn> = {
  1: async () => {
    // v1 -> v2: establishes versioning framework, no data transform needed
    await Promise.resolve();
  },
};

export async function getStoredVersion(): Promise<number> {
  try {
    const v = await get<number>(STORAGE_VERSION_KEY);
    return v ?? 1;
  } catch {
    return 1;
  }
}

export async function setStoredVersion(version: number): Promise<void> {
  await set(STORAGE_VERSION_KEY, version);
}

export async function runMigrations(): Promise<void> {
  const current = await getStoredVersion();

  if (current >= CURRENT_STORAGE_VERSION) return;

  for (let v = current; v < CURRENT_STORAGE_VERSION; v++) {
    const fn = migrations[v];
    if (fn) {
      await fn();
    }
    await setStoredVersion(v + 1);
  }
}
