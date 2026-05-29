import { describe, it, expect, beforeEach } from 'vitest';
import { useTodoStore, buildTodoIndexes } from '../useTodoStore';

beforeEach(() => {
  useTodoStore.setState({
    todos: [],
    past: [],
    future: [],
    todoIndexes: buildTodoIndexes([]),
  });
});

describe('useTodoStore', () => {
  it('adds a todo', () => {
    useTodoStore.getState().addTodo({
      title: 'Test task',
      completed: false,
      priority: 'medium',
      tags: [],
      subtasks: [],
      listId: undefined,
    });

    const todos = useTodoStore.getState().todos;
    expect(todos).toHaveLength(1);
    expect(todos[0].title).toBe('Test task');
    expect(todos[0].completed).toBe(false);
    expect(todos[0].id).toBeDefined();
    expect(todos[0].createdAt).toBeDefined();
  });

  it('toggles a todo', () => {
    useTodoStore.getState().addTodo({
      title: 'Toggle me',
      completed: false,
      priority: 'low',
      tags: [],
      subtasks: [],
      listId: undefined,
    });

    const id = useTodoStore.getState().todos[0].id;
    useTodoStore.getState().toggleTodo(id);

    expect(useTodoStore.getState().todos[0].completed).toBe(true);
    useTodoStore.getState().toggleTodo(id);
    expect(useTodoStore.getState().todos[0].completed).toBe(false);
  });

  it('deletes a todo', () => {
    useTodoStore.getState().addTodo({
      title: 'Delete me',
      completed: false,
      priority: 'medium',
      tags: [],
      subtasks: [],
      listId: undefined,
    });

    const id = useTodoStore.getState().todos[0].id;
    useTodoStore.getState().deleteTodo(id);

    expect(useTodoStore.getState().todos).toHaveLength(0);
  });

  it('updates a todo', () => {
    useTodoStore.getState().addTodo({
      title: 'Original',
      completed: false,
      priority: 'medium',
      tags: [],
      subtasks: [],
      listId: undefined,
    });

    const id = useTodoStore.getState().todos[0].id;
    useTodoStore.getState().updateTodo(id, { title: 'Updated', priority: 'high' });

    const todo = useTodoStore.getState().todos[0];
    expect(todo.title).toBe('Updated');
    expect(todo.priority).toBe('high');
  });

  it('deletes completed todos', () => {
    useTodoStore.getState().addTodo({ title: 'A', completed: true, priority: 'low', tags: [], subtasks: [], listId: undefined });
    useTodoStore.getState().addTodo({ title: 'B', completed: false, priority: 'low', tags: [], subtasks: [], listId: undefined });
    useTodoStore.getState().addTodo({ title: 'C', completed: true, priority: 'low', tags: [], subtasks: [], listId: undefined });

    useTodoStore.getState().deleteCompletedTodos();

    expect(useTodoStore.getState().todos).toHaveLength(1);
    expect(useTodoStore.getState().todos[0].title).toBe('B');
  });

  it('undoes and redoes actions', () => {
    useTodoStore.getState().addTodo({
      title: 'Task 1',
      completed: false,
      priority: 'medium',
      tags: [],
      subtasks: [],
      listId: undefined,
    });

    useTodoStore.getState().addTodo({
      title: 'Task 2',
      completed: false,
      priority: 'medium',
      tags: [],
      subtasks: [],
      listId: undefined,
    });

    expect(useTodoStore.getState().todos).toHaveLength(2);

    useTodoStore.getState().undo();
    expect(useTodoStore.getState().todos).toHaveLength(1);
    expect(useTodoStore.getState().todos[0].title).toBe('Task 1');

    useTodoStore.getState().undo();
    expect(useTodoStore.getState().todos).toHaveLength(0);

    useTodoStore.getState().redo();
    expect(useTodoStore.getState().todos).toHaveLength(1);
    expect(useTodoStore.getState().todos[0].title).toBe('Task 1');

    useTodoStore.getState().redo();
    expect(useTodoStore.getState().todos).toHaveLength(2);
  });

  it('sets todo order', () => {
    useTodoStore.getState().addTodo({ title: 'C', completed: false, priority: 'low', tags: [], subtasks: [], listId: undefined });
    useTodoStore.getState().addTodo({ title: 'A', completed: false, priority: 'low', tags: [], subtasks: [], listId: undefined });
    useTodoStore.getState().addTodo({ title: 'B', completed: false, priority: 'low', tags: [], subtasks: [], listId: undefined });

    const ids = useTodoStore.getState().todos.map(t => t.id);
    const reordered = [ids[2], ids[0], ids[1]];
    useTodoStore.getState().setTodoOrder(reordered);

    const titles = useTodoStore.getState().todos.map(t => t.title);
    expect(titles).toEqual(['B', 'C', 'A']);
  });

  it('adds a tag', () => {
    useTodoStore.getState().addTag({ name: 'Urgent', color: '#ff0000' });

    const tags = useTodoStore.getState().tags;
    expect(tags.some(t => t.name === 'Urgent')).toBe(true);
  });

  it('adds and deletes a list', () => {
    useTodoStore.getState().addList({ name: 'Test List', color: '#00ff00' });

    const lists = useTodoStore.getState().lists;
    const list = lists.find(l => l.name === 'Test List');
    expect(list).toBeDefined();

    useTodoStore.getState().deleteList(list!.id);
    expect(useTodoStore.getState().lists.some(l => l.name === 'Test List')).toBe(false);
  });

  it('renames a list', () => {
    const listId = useTodoStore.getState().lists[0].id;
    useTodoStore.getState().renameList(listId, 'Renamed');

    expect(useTodoStore.getState().lists[0].name).toBe('Renamed');
  });

  it('updates settings', () => {
    useTodoStore.getState().updateSettings({ addToTop: true, soundEnabled: false });

    const settings = useTodoStore.getState().settings;
    expect(settings.addToTop).toBe(true);
    expect(settings.soundEnabled).toBe(false);
  });

  it('getTodosByListId returns todos for a list', () => {
    useTodoStore.getState().addTodo({ title: 'In list', completed: false, priority: 'medium', tags: [], subtasks: [], listId: 'list-1' });
    useTodoStore.getState().addTodo({ title: 'Unlisted', completed: false, priority: 'medium', tags: [], subtasks: [], listId: undefined });

    expect(useTodoStore.getState().getTodosByListId('list-1')).toHaveLength(1);
  });

  it('getTodoById returns the correct todo', () => {
    useTodoStore.getState().addTodo({ title: 'Find me', completed: false, priority: 'medium', tags: [], subtasks: [], listId: undefined });
    const id = useTodoStore.getState().todos[0].id;

    const found = useTodoStore.getState().getTodoById(id);
    expect(found?.title).toBe('Find me');

    expect(useTodoStore.getState().getTodoById('nonexistent')).toBeUndefined();
  });
});
