import { z } from 'zod';
import type { Priority, Todo, Note, Settings, Tag, TaskList, Subtask, NoteAttachment, DailyGoal, NoteSortField, SortField, SortDirection } from '../types';

export const prioritySchema = z.enum(['low', 'medium', 'high']) satisfies z.ZodType<Priority>;

export const subtaskSchema = z.object({
  id: z.string(),
  title: z.string(),
  completed: z.boolean(),
}) satisfies z.ZodType<Subtask>;

export const tagSchema = z.object({
  id: z.string(),
  name: z.string(),
  color: z.string(),
}) satisfies z.ZodType<Tag>;

export const taskListSchema = z.object({
  id: z.string(),
  name: z.string(),
  color: z.string(),
  createdAt: z.number(),
}) satisfies z.ZodType<TaskList>;

export const todoSchema = z.object({
  id: z.string(),
  title: z.string(),
  notes: z.string().optional(),
  completed: z.boolean(),
  dueDate: z.number().optional(),
  priority: prioritySchema,
  tags: z.array(z.string()),
  listId: z.string().optional(),
  subtasks: z.array(subtaskSchema),
  attachments: z.array(z.string()).optional(),
  notified: z.boolean().optional(),
  createdAt: z.number(),
}) satisfies z.ZodType<Todo>;

export const noteAttachmentSchema = z.object({
  id: z.string(),
  type: z.enum(['image', 'video', 'document']),
  name: z.string(),
  path: z.string(),
  size: z.number().optional(),
}) satisfies z.ZodType<NoteAttachment>;

export const noteSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string(),
  tags: z.array(z.string()),
  listId: z.string().optional(),
  linkedTaskId: z.string().optional(),
  attachments: z.array(noteAttachmentSchema).optional(),
  dueDate: z.number().optional(),
  priority: prioritySchema,
  createdAt: z.number(),
  updatedAt: z.number(),
}) satisfies z.ZodType<Note>;

export const sortFieldSchema = z.enum(['custom', 'name', 'date-added', 'due-date', 'priority', 'tags']) satisfies z.ZodType<SortField>;
export const sortDirectionSchema = z.enum(['asc', 'desc']) satisfies z.ZodType<SortDirection>;
export const noteSortFieldSchema = z.enum(['custom', 'title', 'date-added', 'updated-at', 'tags']) satisfies z.ZodType<NoteSortField>;

export const settingsSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']),
  accentColor: z.string(),
  soundEnabled: z.boolean(),
  notificationsEnabled: z.boolean(),
  addToTop: z.boolean(),
  completedToBottom: z.boolean(),
  landscapeStackedTasks: z.boolean(),
  hideEditInTasks: z.boolean(),
  hideDeleteInTasks: z.boolean(),
  verticalActionButtons: z.boolean(),
  lastActiveListId: z.string(),
  sidebarExpanded: z.boolean(),
  sortField: sortFieldSchema,
  sortDirection: sortDirectionSchema,
}) satisfies z.ZodType<Settings>;

export const dailyGoalSchema = z.object({
  date: z.string(),
  completedCount: z.number(),
  goal: z.number(),
}) satisfies z.ZodType<DailyGoal>;

export const dailyGoalsRecordSchema = z.record(z.string(), dailyGoalSchema);

export const todoStoreSchema = z.object({
  todos: z.array(todoSchema),
  tags: z.array(tagSchema),
  lists: z.array(taskListSchema),
  settings: settingsSchema,
});

export const notesStoreSchema = z.object({
  notes: z.array(noteSchema),
  noteSortField: noteSortFieldSchema,
  noteSortDirection: sortDirectionSchema,
});

export const statsStoreSchema = z.object({
  dailyGoals: dailyGoalsRecordSchema,
  currentStreak: z.number(),
  longestStreak: z.number(),
});

const nullToUndefined = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((value) => (value === null ? undefined : value), schema);

/**
 * Import/rehydration-tolerant variants: the exporter serializes missing
 * optionals as null (e.g. `dueDate: null`), and older app versions may have
 * persisted items before some fields existed. Salvageable items are
 * normalized with defaults; only unusable entries fail validation.
 */
export const importableTodoSchema = z.object({
  id: z.string(),
  title: z.string(),
  notes: nullToUndefined(z.string().optional()),
  completed: z.boolean().default(false),
  dueDate: nullToUndefined(z.number().optional()),
  priority: prioritySchema.default('medium'),
  tags: z.array(z.string()).default([]),
  listId: nullToUndefined(z.string().optional()),
  subtasks: z.array(subtaskSchema).default([]),
  attachments: nullToUndefined(z.array(z.string()).optional()),
  notified: nullToUndefined(z.boolean().optional()),
  createdAt: z.number(),
});

export const importableNoteSchema = z.object({
  id: z.string(),
  title: z.string().default(''),
  content: z.string().default(''),
  tags: z.array(z.string()).default([]),
  listId: nullToUndefined(z.string().optional()),
  linkedTaskId: nullToUndefined(z.string().optional()),
  attachments: nullToUndefined(z.array(noteAttachmentSchema).optional()),
  dueDate: nullToUndefined(z.number().optional()),
  priority: prioritySchema.default('medium'),
  createdAt: z.number(),
  updatedAt: z.number(),
});
