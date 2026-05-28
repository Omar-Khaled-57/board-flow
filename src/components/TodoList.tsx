import { useMemo } from 'react';
import { useTodoStore } from '../store/useTodoStore';
import { useDragReorder } from '../hooks/useDragReorder';
import TaskItem from './TaskItem';
import EmptyState from './EmptyState';

import { Sparkles, Search } from 'lucide-react';

interface TodoListProps {
  searchQuery?: string;
  filter?: 'all' | 'active' | 'completed';
  tagFilter?: string;
  showUnlistedOnly?: boolean;
  listId?: string;
}

const TodoList = ({ searchQuery = '', filter = 'all', tagFilter, showUnlistedOnly = false, listId }: TodoListProps) => {
  const todos = useTodoStore(state => state.todos);
  const settings = useTodoStore(state => state.settings);
  const setTodoOrder = useTodoStore(state => state.setTodoOrder);
  const updateSettings = useTodoStore(state => state.updateSettings);

  const filteredTodos = useMemo(() => todos.filter(todo => {
    if (listId && todo.listId !== listId) return false;
    if (tagFilter && !todo.tags.includes(tagFilter)) return false;
    if (showUnlistedOnly && todo.listId) return false;
    if (searchQuery.trim() && !todo.title.toLowerCase().includes(searchQuery.toLowerCase()) && !todo.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))) return false;
    if (filter === 'active' && todo.completed) return false;
    if (filter === 'completed' && !todo.completed) return false;
    return true;
  }), [todos, listId, tagFilter, showUnlistedOnly, searchQuery, filter]);

  const sortedTodos = useMemo(() => {
    const sorted = [...filteredTodos];
    if (settings.sortField !== 'custom') {
      sorted.sort((a, b) => {
        const multiplier = settings.sortDirection === 'asc' ? 1 : -1;
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        let cmp = 0;
        switch (settings.sortField) {
          case 'name': cmp = a.title.localeCompare(b.title); break;
          case 'date-added': cmp = a.createdAt - b.createdAt; break;
          case 'due-date': {
            if (!a.dueDate && !b.dueDate) cmp = 0;
            else if (!a.dueDate) cmp = 1;
            else if (!b.dueDate) cmp = -1;
            else cmp = a.dueDate - b.dueDate;
            break;
          }
          case 'priority': cmp = (priorityOrder[a.priority] ?? 1) - (priorityOrder[b.priority] ?? 1); break;
          case 'tags': cmp = (a.tags[0] || '').localeCompare(b.tags[0] || ''); break;
        }
        return multiplier * cmp;
      });
      if (settings.completedToBottom) {
        sorted.sort((a, b) => {
          if (a.completed && !b.completed) return 1;
          if (!a.completed && b.completed) return -1;
          return 0;
        });
      }
    }
    return sorted;
  }, [filteredTodos, settings.completedToBottom, settings.sortField, settings.sortDirection]);

  const {
    listRef,
    draggedId,
    handlePointerDown,
    DropIndicator,
    GhostPortal,
  } = useDragReorder(
    sortedTodos.map(t => ({ id: t.id, title: t.title, subtitle: t.dueDate ? new Date(t.dueDate).toLocaleDateString() : undefined })),
    { itemIdAttr: 'data-taskid', flipIdAttr: 'data-flipid' },
    {
      onReorder: (ids) => {
        const filtered = sortedTodos;
        const filteredIdSet = new Set(filtered.map(t => t.id));
        const orderForFiltered = ids.filter(id => filteredIdSet.has(id));
        const otherIds = todos.filter(t => !filteredIdSet.has(t.id)).map(t => t.id);
        setTodoOrder([...orderForFiltered, ...otherIds]);
        updateSettings({ sortField: 'custom' });
      },
    }
  );

  const showEmptyState = todos.length === 0;
  const showNoMatch = todos.length > 0 && sortedTodos.length === 0;
  const showTaskList = sortedTodos.length > 0;

  return (
    <div ref={listRef} className="relative min-h-[32rem]">
      {showEmptyState && (
        <EmptyState
          icon={Sparkles}
          title="No tasks right now"
          description={
            <>
              <p>Type naturally to auto-fill task details:</p>
              <p className="max-w-xs">
                <strong className="text-primary">Dates:</strong>{' '}
                write "tomorrow", "20 May 2027", "20/may/2027", or "20/05/27".
              </p>
              <p className="max-w-xs">
                <strong className="text-primary">Tags:</strong>{' '}
                use # to add tags, like "#tasks".
              </p>
              <p className="max-w-xs">
                <strong className="text-primary">Priority:</strong>{' '}
                use "!!", "!high", "!med", or "!low".
              </p>
              <div className="mt-1 w-full rounded-xl border border-(--border-color) bg-(--bg-color) px-4 py-3 text-center text-sm font-medium text-(--text-primary) shadow-sm">
                Example: "Buy milk 20/05/27 !! #tasks"
              </div>
            </>
          }
        />
      )}

      {showNoMatch && (
        <EmptyState
          icon={Search}
          title="No tasks match your filters"
          description={<p>Try changing your search terms or filter settings.</p>}
        />
      )}

      {showTaskList && (
        <div className="relative flex flex-col gap-3">
          {sortedTodos.map(todo => (
            <div key={todo.id} data-flipid={todo.id}>
              <TaskItem
                task={todo}
                isDragging={draggedId === todo.id}
                onPointerDown={handlePointerDown}
              />
            </div>
          ))}
        </div>
      )}

      {DropIndicator}
      {GhostPortal}
    </div>
  );
};

export default TodoList;
