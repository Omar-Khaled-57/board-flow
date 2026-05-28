export type Priority = 'low' | 'medium' | 'high';

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface TaskList {
  id: string;
  name: string;
  color: string;
  createdAt: number;
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Todo {
  id: string;
  title: string;
  notes?: string;
  completed: boolean;
  dueDate?: number;
  priority: Priority;
  tags: string[];
  listId?: string; // belongs to a specific list
  subtasks: Subtask[];
  attachments?: string[]; // paths to local files
  notified?: boolean;
  createdAt: number;
}

export type SortField = 'name' | 'date-added' | 'due-date' | 'priority' | 'tags';
export type SortDirection = 'asc' | 'desc';

export interface Settings {
  theme: 'light' | 'dark' | 'system';
  accentColor: string;
  soundEnabled: boolean;
  notificationsEnabled: boolean;
  addToTop: boolean;
  completedToBottom: boolean;
  landscapeStackedTasks: boolean;
  hideEditInTasks: boolean;
  hideDeleteInTasks: boolean;
  verticalActionButtons: boolean;
  lastActiveListId: string;
  sortField: SortField;
  sortDirection: SortDirection;
}

export interface DailyGoal {
  date: string; // YYYY-MM-DD
  completedCount: number;
  goal: number;
}
