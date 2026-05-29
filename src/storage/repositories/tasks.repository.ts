import { loadTodos, saveTodos, type TodoData } from '../storage';
import type { Todo, Tag, TaskList } from '../../types';

let cache: TodoData | null = null;

async function getData(): Promise<TodoData> {
  if (cache) return cache;
  const data = await loadTodos();
  cache = data ?? { todos: [], tags: [], lists: [] };
  return cache!;
}

export function invalidateCache(): void {
  cache = null;
}

export async function getAllTodos(): Promise<Todo[]> {
  const data = await getData();
  return data.todos;
}

export async function getAllTags(): Promise<Tag[]> {
  const data = await getData();
  return data.tags;
}

export async function getAllLists(): Promise<TaskList[]> {
  const data = await getData();
  return data.lists;
}

export async function saveAllTodos(todos: Todo[]): Promise<void> {
  const data = await getData();
  data.todos = todos;
  await saveTodos(data);
}

export async function saveAllTags(tags: Tag[]): Promise<void> {
  const data = await getData();
  data.tags = tags;
  await saveTodos(data);
}

export async function saveAllLists(lists: TaskList[]): Promise<void> {
  const data = await getData();
  data.lists = lists;
  await saveTodos(data);
}

export async function persistTodoState(todos: Todo[], tags: Tag[], lists: TaskList[]): Promise<void> {
  cache = { todos, tags, lists };
  await saveTodos(cache);
}
