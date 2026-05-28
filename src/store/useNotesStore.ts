import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Note, NoteSortField } from '../types';
import { getStorageAdapter } from './storage';

interface NotesState {
  notes: Note[];
  noteSortField: NoteSortField;
  noteSortDirection: 'asc' | 'desc';

  addNote: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateNote: (id: string, updates: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  setNoteOrder: (orderedIds: string[]) => void;
  setNoteSortField: (field: NoteSortField) => void;
  setNoteSortDirection: (dir: 'asc' | 'desc') => void;
}

const generateId = () => Math.random().toString(36).substring(2, 9);

export const useNotesStore = create<NotesState>()(
  persist(
    (set) => ({
      notes: [],
      noteSortField: 'date-added',
      noteSortDirection: 'desc',

      addNote: (data) => {
        const id = generateId();
        const now = Date.now();
        const note: Note = { ...data, id, createdAt: now, updatedAt: now };
        set((state) => ({ notes: [note, ...state.notes] }));
        return id;
      },

      updateNote: (id, updates) => set((state) => ({
        notes: state.notes.map(n =>
          n.id === id ? { ...n, ...updates, updatedAt: Date.now() } : n
        ),
      })),

      deleteNote: (id) => set((state) => ({
        notes: state.notes.filter(n => n.id !== id),
      })),

      setNoteOrder: (orderedIds) => set((state) => {
        const idSet = new Set(orderedIds);
        const reordered = orderedIds
          .map(id => state.notes.find(n => n.id === id))
          .filter((n): n is Note => n !== undefined);
        const remaining = state.notes.filter(n => !idSet.has(n.id));
        return { notes: [...reordered, ...remaining] };
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
    }
  )
);
