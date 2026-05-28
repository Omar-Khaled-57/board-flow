import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Todo, Settings, Tag, TaskList } from '../types';
import { getStorageAdapter } from './storage';

interface TodoState {
  todos: Todo[];
  /** Tag library (all known tags, not per-task tags) */
  tags: Tag[];
  lists: TaskList[];
  settings: Settings;

  /** Undo/Redo stacks — each entry is a full snapshot of `todos` */
  past: Todo[][];
  future: Todo[][];

  addTodo: (todo: Omit<Todo, 'id' | 'createdAt'>) => void;
  updateTodo: (id: string, updates: Partial<Todo>) => void;
  deleteTodo: (id: string) => void;
  deleteCompletedTodos: () => void;
  toggleTodo: (id: string) => void;
  /** Replace the full todos array with a custom ordering (used by drag-and-drop) */
  setTodoOrder: (orderedIds: string[]) => void;

  addTag: (tag: Omit<Tag, 'id'>) => void;
  addList: (list: Omit<TaskList, 'id' | 'createdAt'>) => void;
  deleteList: (id: string) => void;
  renameList: (id: string, newName: string) => void;
  updateSettings: (settings: Partial<Settings>) => void;

  undo: () => void;
  redo: () => void;
}

const HISTORY_LIMIT = 50;
const ID_LENGTH = 7;

const defaultSettings: Settings = {
  theme: 'system',
  accentColor: '#5b6af0',
  soundEnabled: true,
  notificationsEnabled: true,
  addToTop: false,
  completedToBottom: false,
  landscapeStackedTasks: true,
  hideEditInTasks: false,
  hideDeleteInTasks: false,
  verticalActionButtons: false,
  lastActiveListId: 'all',
  sidebarExpanded: true,
  sortField: 'date-added',
  sortDirection: 'desc',
};

const generateId = () => Math.random().toString(36).substring(2, 2 + ID_LENGTH);

export const useTodoStore = create<TodoState>()(
  persist(
    (set) => ({
      todos: [],
      tags: [
        { id: '1', name: 'Home', color: '#e85d5d' },
        { id: '2', name: 'Work', color: '#5b6af0' },
        { id: '3', name: 'School', color: '#3cb878' },
      ],
      lists: [
        { id: '1', name: 'My Tasks', color: '#5b6af0', createdAt: Date.now() },
        { id: '2', name: 'Shopping', color: '#e85d5d', createdAt: Date.now() },
      ],
      settings: defaultSettings,
      past: [],
      future: [],

      addTodo: (todoData) => set((state) => {
        const newTodo: Todo = {
          ...todoData,
          id: generateId(),
          createdAt: Date.now(),
        };
        const newTodos = state.settings.addToTop 
          ? [newTodo, ...state.todos] 
          : [...state.todos, newTodo];
          
        return {
          todos: newTodos,
          past: [...state.past, state.todos].slice(-HISTORY_LIMIT),
          future: []
        };
      }),

      updateTodo: (id, updates) => set((state) => {
        const newTodos = state.todos.map(t => t.id === id ? { ...t, ...updates } : t);
        return {
          todos: newTodos,
          past: [...state.past, state.todos].slice(-HISTORY_LIMIT),
          future: []
        };
      }),

      deleteTodo: (id) => set((state) => {
        const newTodos = state.todos.filter(t => t.id !== id);
        return {
          todos: newTodos,
          past: [...state.past, state.todos].slice(-HISTORY_LIMIT),
          future: []
        };
      }),

      deleteCompletedTodos: () => set((state) => {
        const newTodos = state.todos.filter(t => !t.completed);
        return {
          todos: newTodos,
          past: [...state.past, state.todos].slice(-HISTORY_LIMIT),
          future: []
        };
      }),

      toggleTodo: (id) => set((state) => {
        const newTodos = state.todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
        return {
          todos: newTodos,
          past: [...state.past, state.todos].slice(-HISTORY_LIMIT),
          future: []
        };
      }),

      setTodoOrder: (orderedIds: string[]) => set((state) => {
    const idSet = new Set(orderedIds);
    const reordered = orderedIds
      .map((id: string) => state.todos.find(t => t.id === id))
      .filter((t): t is Todo => t !== undefined);
    const remaining = state.todos.filter(t => !idSet.has(t.id));
    return {
      todos: [...reordered, ...remaining],
      past: [...state.past, state.todos].slice(-HISTORY_LIMIT),
      future: []
    };
  }),

      addTag: (tagData) => set((state) => ({
        tags: [...state.tags, { ...tagData, id: generateId() }]
      })),

      addList: (listData) => set((state) => ({
        lists: [...state.lists, { ...listData, id: generateId(), createdAt: Date.now() }]
      })),

      deleteList: (id) => set((state) => ({
        lists: state.lists.filter(l => l.id !== id),
        todos: state.todos.map(t => t.listId === id ? { ...t, listId: undefined } : t)
      })),

      renameList: (id, newName) => set((state) => ({
        lists: state.lists.map(l => l.id === id ? { ...l, name: newName } : l)
      })),

      updateSettings: (newSettings) => set((state) => ({
        settings: { ...state.settings, ...newSettings }
      })),

      undo: () => set((state) => {
        if (state.past.length === 0) return state;
        const previous = state.past[state.past.length - 1];
        const newPast = state.past.slice(0, state.past.length - 1);
        return {
          todos: previous,
          past: newPast,
          future: [state.todos, ...state.future]
        };
      }),

      redo: () => set((state) => {
        if (state.future.length === 0) return state;
        const next = state.future[0];
        const newFuture = state.future.slice(1);
        return {
          todos: next,
          past: [...state.past, state.todos].slice(-HISTORY_LIMIT),
          future: newFuture
        };
      }),
    }),
    {
      name: 'boardflow-storage',
      storage: createJSONStorage(() => getStorageAdapter()),
      partialize: (state) => ({
        todos: state.todos,
        tags: state.tags,
        lists: state.lists,
        settings: state.settings,
      }), // don't persist undo/redo history
    }
  )
);
