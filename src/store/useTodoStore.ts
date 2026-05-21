import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Todo, Settings, Tag } from '../types';

interface TodoState {
  todos: Todo[];
  tags: Tag[];
  settings: Settings;
  
  // Undo/Redo stacks
  past: Todo[][];
  future: Todo[][];

  // Actions
  addTodo: (todo: Omit<Todo, 'id' | 'createdAt'>) => void;
  updateTodo: (id: string, updates: Partial<Todo>) => void;
  deleteTodo: (id: string) => void;
  toggleTodo: (id: string) => void;
  reorderTodos: (startIndex: number, endIndex: number) => void;
  
  addTag: (tag: Omit<Tag, 'id'>) => void;
  updateSettings: (settings: Partial<Settings>) => void;
  
  undo: () => void;
  redo: () => void;
}

const HISTORY_LIMIT = 50;

const defaultSettings: Settings = {
  theme: 'system',
  accentColor: '#5b6af0', // default primary
  soundEnabled: true,
  notificationsEnabled: true,
  addToTop: false,
  completedToBottom: false,
};

const generateId = () => Math.random().toString(36).substring(2, 9);

import { createJSONStorage } from 'zustand/middleware';
import { getStorageAdapter } from './storage';

export const useTodoStore = create<TodoState>()(
  persist(
    (set) => ({
      todos: [],
      tags: [
        { id: '1', name: 'Home', color: '#e85d5d' },
        { id: '2', name: 'Work', color: '#5b6af0' },
        { id: '3', name: 'School', color: '#3cb878' },
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

      toggleTodo: (id) => set((state) => {
        const newTodos = state.todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
        return {
          todos: newTodos,
          past: [...state.past, state.todos].slice(-HISTORY_LIMIT),
          future: []
        };
      }),

      reorderTodos: (startIndex, endIndex) => set((state) => {
        const newTodos = Array.from(state.todos);
        const [removed] = newTodos.splice(startIndex, 1);
        newTodos.splice(endIndex, 0, removed);
        return {
          todos: newTodos,
          past: [...state.past, state.todos].slice(-HISTORY_LIMIT),
          future: []
        };
      }),

      addTag: (tagData) => set((state) => ({
        tags: [...state.tags, { ...tagData, id: generateId() }]
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
        settings: state.settings,
      }), // don't persist undo/redo history
    }
  )
);
