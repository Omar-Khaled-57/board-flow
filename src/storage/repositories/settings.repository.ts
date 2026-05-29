import type { Settings } from '../../types';

export async function getSettings(): Promise<Partial<Settings> | null> {
  try {
    const raw = window.localStorage.getItem('boardflow-settings-snapshot');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function saveSnapshot(settings: Partial<Settings>): Promise<void> {
  try {
    window.localStorage.setItem('boardflow-settings-snapshot', JSON.stringify(settings));
  } catch {
    // non-critical
  }
}
