import { describe, it, expect } from 'vitest';
import {
  importableTodoSchema,
  importableNoteSchema,
  tagSchema,
  dailyGoalSchema,
} from '../index';

const validTodo = {
  id: 't1',
  title: 'Task',
  completed: false,
  priority: 'high',
  tags: ['work'],
  subtasks: [],
  createdAt: 1700000000000,
};

describe('importableTodoSchema', () => {
  it('accepts a fully valid todo', () => {
    const result = importableTodoSchema.safeParse(validTodo);
    expect(result.success).toBe(true);
  });

  it('accepts exporter-style null optionals and normalizes them to undefined', () => {
    const result = importableTodoSchema.safeParse({ ...validTodo, dueDate: null });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.dueDate).toBeUndefined();
      expect('dueDate' in result.data === false || result.data.dueDate === undefined).toBe(true);
    }
  });

  it('fills defaults for legacy todos missing newer fields', () => {
    const legacy = { id: 't2', title: 'Legacy', createdAt: 1700000000000 };
    const result = importableTodoSchema.safeParse(legacy);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.subtasks).toEqual([]);
      expect(result.data.tags).toEqual([]);
      expect(result.data.priority).toBe('medium');
      expect(result.data.completed).toBe(false);
    }
  });

  it('rejects entries without a title', () => {
    const { title: _title, ...noTitle } = validTodo;
    expect(importableTodoSchema.safeParse(noTitle).success).toBe(false);
  });

  it('rejects non-object entries', () => {
    expect(importableTodoSchema.safeParse('junk').success).toBe(false);
    expect(importableTodoSchema.safeParse(42).success).toBe(false);
  });

  it('rejects invalid priority values', () => {
    expect(importableTodoSchema.safeParse({ ...validTodo, priority: 'urgent' }).success).toBe(false);
  });
});

describe('importableNoteSchema', () => {
  const validNote = {
    id: 'n1',
    title: 'Note',
    content: 'hello',
    tags: [],
    priority: 'low',
    createdAt: 1700000000000,
    updatedAt: 1700000000000,
  };

  it('accepts a fully valid note', () => {
    expect(importableNoteSchema.safeParse(validNote).success).toBe(true);
  });

  it('defaults missing title/content/tags so partial notes are salvaged', () => {
    const minimal = { id: 'n2', createdAt: 1, updatedAt: 1 };
    const result = importableNoteSchema.safeParse(minimal);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.title).toBe('');
      expect(result.data.content).toBe('');
      expect(result.data.tags).toEqual([]);
      expect(result.data.priority).toBe('medium');
    }
  });

  it('normalizes null linkedTaskId to undefined', () => {
    const result = importableNoteSchema.safeParse({ ...validNote, linkedTaskId: null });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.linkedTaskId).toBeUndefined();
  });

  it('rejects entries without an id', () => {
    const { id: _id, ...noId } = validNote;
    expect(importableNoteSchema.safeParse(noId).success).toBe(false);
  });
});

describe('supporting schemas', () => {
  it('tagSchema rejects wrong-shaped tags', () => {
    expect(tagSchema.safeParse({ id: 'x', name: 'A', color: '#fff' }).success).toBe(true);
    expect(tagSchema.safeParse({ id: 'x' }).success).toBe(false);
  });

  it('dailyGoalSchema rejects malformed goal records', () => {
    expect(dailyGoalSchema.safeParse({ date: '2026-01-01', completedCount: 1, goal: 5 }).success).toBe(true);
    expect(dailyGoalSchema.safeParse({ date: '2026-01-01', completedCount: 'many', goal: 5 }).success).toBe(false);
  });
});
