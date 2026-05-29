import { loadNotes, saveNotes, type NotesData } from '../storage';
import type { Note } from '../../types';

let cache: NotesData | null = null;

async function getData(): Promise<NotesData> {
  if (cache) return cache;
  const data = await loadNotes();
  cache = data ?? { notes: [], noteSortField: 'date-added', noteSortDirection: 'desc' };
  return cache!;
}

export function invalidateCache(): void {
  cache = null;
}

export async function getAllNotes(): Promise<Note[]> {
  const data = await getData();
  return data.notes;
}

export async function getSortField(): Promise<string> {
  const data = await getData();
  return data.noteSortField;
}

export async function getSortDirection(): Promise<'asc' | 'desc'> {
  const data = await getData();
  return data.noteSortDirection;
}

export async function persistNotesState(
  notes: Note[],
  noteSortField: string,
  noteSortDirection: 'asc' | 'desc'
): Promise<void> {
  cache = { notes, noteSortField, noteSortDirection };
  await saveNotes(cache);
}
