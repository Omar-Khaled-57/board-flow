export type Priority = 'low' | 'medium' | 'high';

export interface Tag {
  id: string;
  name: string;
  color: string;
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
  subtasks: Subtask[];
  attachments?: string[]; // paths to local files
  notified?: boolean;
  createdAt: number;
}

export interface Settings {
  theme: 'light' | 'dark' | 'system';
  accentColor: string;
  soundEnabled: boolean;
  notificationsEnabled: boolean;
  addToTop: boolean;
  completedToBottom: boolean;
}

export interface DailyGoal {
  date: string; // YYYY-MM-DD
  completedCount: number;
  goal: number;
}
