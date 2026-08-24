import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Todo, Settings, Tag, TaskList } from '../types';
import { getStorageAdapter } from './storage';
import { importableTodoSchema, tagSchema, taskListSchema } from '../schemas';
import { generateId } from '../utils/id';

export const HISTORY_LIMIT = 50;

interface TodoStateShallow {
  todos: Todo[];
  tags: Tag[];
  lists: TaskList[];
  settings: Settings;
  past: Todo[][];
  future: Todo[][];

  _hasHydrated: boolean;

  addTodo: (todo: Omit<Todo, 'id' | 'createdAt'>) => void;
  updateTodo: (id: string, updates: Partial<Todo>) => void;
  deleteTodo: (id: string) => void;
  deleteCompletedTodos: () => void;
  toggleTodo: (id: string) => void;
  setTodoOrder: (orderedIds: string[]) => void;

  addTag: (tag: Omit<Tag, 'id'>) => void;
  addList: (list: Omit<TaskList, 'id' | 'createdAt'>) => void;
  deleteList: (id: string) => void;
  renameList: (id: string, newName: string) => void;
  updateSettings: (settings: Partial<Settings>) => void;

  undo: () => void;
  redo: () => void;

  todoIndexes: {
    byListId: Map<string, Todo[]>;
    byTag: Map<string, Todo[]>;
    byPriority: Map<string, Todo[]>;
    byId: Map<string, Todo>;
  };

  getTodosByListId: (listId: string) => Todo[];
  getTodosByTag: (tag: string) => Todo[];
  getTodoById: (id: string) => Todo | undefined;
}

export type TodoState = TodoStateShallow;

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

export function buildTodoIndexes(todos: Todo[]) {
  const byListId = new Map<string, Todo[]>();
  const byTag = new Map<string, Todo[]>();
  const byPriority = new Map<string, Todo[]>();
  const byId = new Map<string, Todo>();

  for (const todo of todos) {
    byId.set(todo.id, todo);

    const listKey = todo.listId ?? '__unlisted__';
    let listArr = byListId.get(listKey);
    if (!listArr) { listArr = []; byListId.set(listKey, listArr); }
    listArr.push(todo);

    const priKey = todo.priority;
    let priArr = byPriority.get(priKey);
    if (!priArr) { priArr = []; byPriority.set(priKey, priArr); }
    priArr.push(todo);

    for (const tag of todo.tags) {
      let tagArr = byTag.get(tag);
      if (!tagArr) { tagArr = []; byTag.set(tag, tagArr); }
      tagArr.push(todo);
    }
  }

  return { byListId, byTag, byPriority, byId };
}

export const useTodoStore = create<TodoState>()(
  persist(
    (set, get) => ({
      _hasHydrated: false,
      todos: [],
      tags: [
        { id: '1', name: 'Tasks', color: '#e85d5d' },
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
      todoIndexes: { byListId: new Map(), byTag: new Map(), byPriority: new Map(), byId: new Map() },

      getTodosByListId: (listId) => {
        const idx = get().todoIndexes;
        return idx.byListId.get(listId) ?? idx.byListId.get('__unlisted__') ?? [];
      },

      getTodosByTag: (tag) => {
        return get().todoIndexes.byTag.get(tag) ?? [];
      },

      getTodoById: (id) => {
        return get().todoIndexes.byId.get(id);
      },

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
          future: [],
          todoIndexes: buildTodoIndexes(newTodos),
        };
      }),

      updateTodo: (id, updates) => set((state) => {
        const newTodos = state.todos.map(t => t.id === id ? { ...t, ...updates } : t);
        return {
          todos: newTodos,
          past: [...state.past, state.todos].slice(-HISTORY_LIMIT),
          future: [],
          todoIndexes: buildTodoIndexes(newTodos),
        };
      }),

      deleteTodo: (id) => set((state) => {
        const newTodos = state.todos.filter(t => t.id !== id);
        return {
          todos: newTodos,
          past: [...state.past, state.todos].slice(-HISTORY_LIMIT),
          future: [],
          todoIndexes: buildTodoIndexes(newTodos),
        };
      }),

      deleteCompletedTodos: () => set((state) => {
        const newTodos = state.todos.filter(t => !t.completed);
        return {
          todos: newTodos,
          past: [...state.past, state.todos].slice(-HISTORY_LIMIT),
          future: [],
          todoIndexes: buildTodoIndexes(newTodos),
        };
      }),

      toggleTodo: (id) => set((state) => {
        const newTodos = state.todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
        return {
          todos: newTodos,
          past: [...state.past, state.todos].slice(-HISTORY_LIMIT),
          future: [],
          todoIndexes: buildTodoIndexes(newTodos),
        };
      }),

      setTodoOrder: (orderedIds) => set((state) => {
        const idSet = new Set(orderedIds);
        const reordered = orderedIds
          .map((id: string) => state.todos.find(t => t.id === id))
          .filter((t): t is Todo => t !== undefined);
        const remaining = state.todos.filter(t => !idSet.has(t.id));
        const newTodos = [...reordered, ...remaining];
        return {
          todos: newTodos,
          past: [...state.past, state.todos].slice(-HISTORY_LIMIT),
          future: [],
          todoIndexes: buildTodoIndexes(newTodos),
        };
      }),

      addTag: (tagData) => set((state) => ({
        tags: [...state.tags, { ...tagData, id: generateId() }]
      })),

      addList: (listData) => set((state) => ({
        lists: [...state.lists, { ...listData, id: generateId(), createdAt: Date.now() }]
      })),

      deleteList: (id) => set((state) => {
        const newTodos = state.todos.map(t => t.listId === id ? { ...t, listId: undefined } : t);
        return {
          lists: state.lists.filter(l => l.id !== id),
          todos: newTodos,
          past: [...state.past, state.todos].slice(-HISTORY_LIMIT),
          future: [],
          todoIndexes: buildTodoIndexes(newTodos),
        };
      }),

      renameList: (id, newName) => set((state) => ({
        lists: state.lists.map(l => l.id === id ? { ...l, name: newName } : l)
      })),

      updateSettings: (newSettings) => set((state) => ({
        settings: { ...state.settings, ...newSettings }
      })),

      undo: () => set((state) => {
        if (state.past.length === 0) return state;
        const previous = state.past[state.past.length - 1];
        return {
          todos: previous,
          past: state.past.slice(0, -1),
          future: [state.todos, ...state.future],
          todoIndexes: buildTodoIndexes(previous),
        };
      }),

      redo: () => set((state) => {
        if (state.future.length === 0) return state;
        const next = state.future[0];
        return {
          todos: next,
          past: [...state.past, state.todos].slice(-HISTORY_LIMIT),
          future: state.future.slice(1),
          todoIndexes: buildTodoIndexes(next),
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
      }),
      merge: (persisted, current) => {
        const p = persisted as Partial<TodoState>;
        const todos = Array.isArray(p.todos)
          ? p.todos.flatMap(item => {
              const result = importableTodoSchema.safeParse(item);
              return result.success ? [result.data as Todo] : [];
            })
          : current.todos;
        const tags = Array.isArray(p.tags)
          ? p.tags.flatMap(item => {
              const result = tagSchema.safeParse(item);
              return result.success ? [result.data as Tag] : [];
            })
          : current.tags;
        const lists = Array.isArray(p.lists)
          ? p.lists.flatMap(item => {
              const result = taskListSchema.safeParse(item);
              return result.success ? [result.data as TaskList] : [];
            })
          : current.lists;
        return {
          ...current,
          ...p,
          todos,
          tags,
          lists,
          todoIndexes: buildTodoIndexes(todos),
        };
      },
      onRehydrateStorage: () => () => {
        // Set unconditionally (also on hydration errors, where `state`
        // would be undefined) so the boot splash never waits on us.
        useTodoStore.setState({ _hasHydrated: true });
      },
    }
  )
);
