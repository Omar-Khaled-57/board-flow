import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Note, NoteSortField } from '../types';
import { getStorageAdapter } from './storage';
import { generateId } from '../utils/id';

interface NotesState {
  notes: Note[];
  noteSortField: NoteSortField;
  noteSortDirection: 'asc' | 'desc';
  past: Note[][];
  future: Note[][];

  addNote: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateNote: (id: string, updates: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  setNoteOrder: (orderedIds: string[]) => void;
  setNoteSortField: (field: NoteSortField) => void;
  setNoteSortDirection: (dir: 'asc' | 'desc') => void;
  undo: () => void;
  redo: () => void;

  noteIndexes: {
    byId: Map<string, Note>;
  };
  getNoteById: (id: string) => Note | undefined;
}

const HISTORY_LIMIT = 50;

export function buildNoteIndexes(notes: Note[]) {
  const byId = new Map<string, Note>();
  for (const note of notes) {
    byId.set(note.id, note);
  }
  return { byId };
}

export const useNotesStore = create<NotesState>()(
  persist(
    (set, get) => ({
      notes: [],
      noteSortField: 'date-added',
      noteSortDirection: 'desc',
      past: [],
      future: [],
      noteIndexes: { byId: new Map() },

      getNoteById: (id) => get().noteIndexes.byId.get(id),

      addNote: (data) => {
        const id = generateId();
        const now = Date.now();
        const note: Note = { ...data, id, createdAt: now, updatedAt: now };
        set((state) => {
          const newNotes = [note, ...state.notes];
          return {
            notes: newNotes,
            past: [...state.past, state.notes].slice(-HISTORY_LIMIT),
            future: [],
            noteIndexes: buildNoteIndexes(newNotes),
          };
        });
        return id;
      },

      updateNote: (id, updates) => set((state) => {
        const newNotes = state.notes.map(n =>
          n.id === id ? { ...n, ...updates, updatedAt: Date.now() } : n
        );
        return {
          notes: newNotes,
          past: [...state.past, state.notes].slice(-HISTORY_LIMIT),
          future: [],
          noteIndexes: buildNoteIndexes(newNotes),
        };
      }),

      deleteNote: (id) => set((state) => {
        const newNotes = state.notes.filter(n => n.id !== id);
        return {
          notes: newNotes,
          past: [...state.past, state.notes].slice(-HISTORY_LIMIT),
          future: [],
          noteIndexes: buildNoteIndexes(newNotes),
        };
      }),

      setNoteOrder: (orderedIds) => set((state) => {
        const idSet = new Set(orderedIds);
        const reordered = orderedIds
          .map(id => state.notes.find(n => n.id === id))
          .filter((n): n is Note => n !== undefined);
        const remaining = state.notes.filter(n => !idSet.has(n.id));
        const newNotes = [...reordered, ...remaining];
        return {
          notes: newNotes,
          past: [...state.past, state.notes].slice(-HISTORY_LIMIT),
          future: [],
          noteIndexes: buildNoteIndexes(newNotes),
        };
      }),

      undo: () => set((state) => {
        if (state.past.length === 0) return state;
        const previous = state.past[state.past.length - 1];
        return {
          notes: previous,
          past: state.past.slice(0, -1),
          future: [state.notes, ...state.future],
          noteIndexes: buildNoteIndexes(previous),
        };
      }),

      redo: () => set((state) => {
        if (state.future.length === 0) return state;
        const next = state.future[0];
        return {
          notes: next,
          past: [...state.past, state.notes].slice(-HISTORY_LIMIT),
          future: state.future.slice(1),
          noteIndexes: buildNoteIndexes(next),
        };
      }),

      setNoteSortField: (field) => set({ noteSortField: field }),
      setNoteSortDirection: (dir) => set({ noteSortDirection: dir }),
    }),
    {
      name: 'boardflow-notes-storage',
      storage: createJSONStorage(() => getStorageAdapter()),
      partialize: (state) => ({
        notes: state.notes,
        noteSortField: state.noteSortField,
        noteSortDirection: state.noteSortDirection,
      }),
      merge: (persisted, current) => ({
        ...current,
        ...(persisted as Partial<NotesState>),
        noteIndexes: buildNoteIndexes((persisted as Partial<NotesState>).notes ?? current.notes),
      }),
    }
  )
);
