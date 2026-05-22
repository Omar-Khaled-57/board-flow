import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTodoStore } from '../store/useTodoStore';
import TaskItem from './TaskItem';
import { Todo } from '../types';
import { Sparkles, Search, GripVertical } from 'lucide-react';

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

  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dropY, setDropY] = useState<number | null>(null);
  const [ghostPos, setGhostPos] = useState<{ x: number; y: number } | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const draggedIdRef = useRef(draggedId);
  const dropYRef = useRef<number | null>(null);
  const sortedRef = useRef<Todo[]>([]);
  const filteredRef = useRef<Todo[]>([]);
  const ghostTaskRef = useRef<Todo | null>(null);

  const filteredTodos = useMemo(() => todos.filter(todo => {
    if (listId && todo.listId !== listId) return false;
    if (tagFilter && !todo.tags.includes(tagFilter)) return false;
    if (showUnlistedOnly && todo.listId) return false;
    if (searchQuery.trim() && !todo.title.toLowerCase().includes(searchQuery.toLowerCase()) && !todo.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))) return false;
    if (filter === 'active' && todo.completed) return false;
    if (filter === 'completed' && !todo.completed) return false;
    return true;
  }), [todos, listId, tagFilter, showUnlistedOnly, searchQuery, filter]);

  const sortedTodos = useMemo(() => [...filteredTodos].sort((a, b) => {
    if (settings.completedToBottom) {
      if (a.completed && !b.completed) return 1;
      if (!a.completed && b.completed) return -1;
    }
    return 0;
  }), [filteredTodos, settings.completedToBottom]);

  useEffect(() => { draggedIdRef.current = draggedId; }, [draggedId]);
  useEffect(() => { dropYRef.current = dropY; }, [dropY]);
  useEffect(() => { sortedRef.current = sortedTodos; }, [sortedTodos]);
  useEffect(() => { filteredRef.current = filteredTodos; }, [filteredTodos]);

  const handlePointerDown = useCallback((_e: React.PointerEvent, id: string) => {
    setDraggedId(id);
    const task = sortedTodos.find(t => t.id === id);
    ghostTaskRef.current = task ?? null;
  }, [sortedTodos]);

  useEffect(() => {
    if (!draggedId) { setGhostPos(null); setDropY(null); return; }

    const handlePointerMove = (e: PointerEvent) => {
      // Update ghost position
      setGhostPos({ x: e.clientX + 16, y: e.clientY - 30 });

      // Calculate drop position based on task element boundaries
      const listEl = listRef.current;
      if (!listEl) { setDropY(null); return; }
      const listRect = listEl.getBoundingClientRect();
      const sorted = sortedRef.current;
      const dragId = draggedIdRef.current;
      if (!dragId || sorted.length === 0) { setDropY(null); return; }

      // Find which task gap the cursor is in
      const taskEls = listEl.querySelectorAll<HTMLElement>('[data-taskid]');
      let beforeIdx: number | null = null;

      for (const el of taskEls) {
        const rect = el.getBoundingClientRect();
        const taskId = el.dataset.taskid;
        if (taskId === dragId) continue;
        if (e.clientY < rect.top + rect.height / 2) {
          beforeIdx = sorted.findIndex(t => t.id === taskId);
          break;
        }
      }

      if (beforeIdx === null) {
        // After the last task
        beforeIdx = sorted.length;
      }

      // Prevent no-op: if the item is already at this position
      const dragIdx = sorted.findIndex(t => t.id === dragId);
      let effectiveIdx = beforeIdx;
      if (dragIdx < beforeIdx) effectiveIdx = beforeIdx - 1;
      else effectiveIdx = beforeIdx;

      if (dragIdx === effectiveIdx) {
        setDropY(null);
        return;
      }

      // Calculate Y for the drop indicator
      if (beforeIdx === sorted.length) {
        // After last task — place at the bottom of the last task
        const lastTask = taskEls[taskEls.length - 1];
        if (lastTask) {
          const lastRect = lastTask.getBoundingClientRect();
          setDropY(lastRect.bottom - listRect.top);
        }
      } else if (beforeIdx !== null) {
        const targetEl = taskEls[beforeIdx];
        if (targetEl) {
          const targetRect = targetEl.getBoundingClientRect();
          setDropY(targetRect.top - listRect.top - 2);
        }
      }
    };

    const handlePointerUp = () => {
      const dragId = draggedIdRef.current;
      const y = dropYRef.current;
      const sorted = sortedRef.current;
      const filtered = filteredRef.current;

      if (dragId && y !== null) {
        // Recalculate drop index from Y position at the time of release
        const listEl = listRef.current;
        if (listEl) {
          const listRect = listEl.getBoundingClientRect();
          const relY = y;
          const taskEls = listEl.querySelectorAll<HTMLElement>('[data-taskid]');
          let beforeIdx: number | null = sorted.length;

          for (const el of taskEls) {
            const rect = el.getBoundingClientRect();
            const taskId = el.dataset.taskid;
            if (taskId === dragId) continue;
            if (relY + listRect.top < rect.top + rect.height / 2) {
              beforeIdx = sorted.findIndex(t => t.id === taskId);
              break;
            }
          }

          const sortedIds = sorted.map(t => t.id);
          const newIds = [...sortedIds];
          const fromIdx = sortedIds.indexOf(dragId);
          const [moved] = newIds.splice(fromIdx, 1);
          let toIdx = beforeIdx ?? sorted.length;
          if (fromIdx < toIdx) toIdx -= 1;
          newIds.splice(toIdx, 0, moved);

          const filteredIdSet = new Set(filtered.map(t => t.id));
          const orderForFiltered = newIds.filter(id => filteredIdSet.has(id));
          const otherIds = todos.filter(t => !filteredIdSet.has(t.id)).map(t => t.id);
          setTodoOrder([...orderForFiltered, ...otherIds]);
        }
      }

      setDraggedId(null);
      setDropY(null);
      setGhostPos(null);
      ghostTaskRef.current = null;
    };

    document.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('pointerup', handlePointerUp);
    return () => {
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerup', handlePointerUp);
    };
  }, [draggedId, todos, setTodoOrder]);

  const showEmptyState = todos.length === 0;
  const showNoMatch = todos.length > 0 && sortedTodos.length === 0;
  const showTaskList = sortedTodos.length > 0;

  return (
    <div ref={listRef} className="relative min-h-[32rem]">
      {showEmptyState && (
        <div className="flex flex-col items-center justify-center py-20 text-center text-(--text-primary) opacity-80 dark:opacity-100">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
            <Sparkles size={40} className="text-primary" />
          </div>
          <h3 className="text-2xl font-bold text-(--text-primary) mb-3">No tasks right now</h3>
          <div className="mx-auto flex max-w-sm flex-col items-center gap-2.5 text-center text-sm leading-6 text-(--text-primary) dark:opacity-85">
            <p>Type naturally to auto-fill task details:</p>
            <p className="max-w-xs">
              <strong className="text-primary">Dates:</strong>{' '}
              write "tomorrow", "20 May 2027", "20/may/2027", or "20/05/27".
            </p>
            <p className="max-w-xs">
              <strong className="text-primary">Tags:</strong>{' '}
              use # to add tags, like "#home".
            </p>
            <p className="max-w-xs">
              <strong className="text-primary">Priority:</strong>{' '}
              use "!!", "!high", "!med", or "!low".
            </p>
            <div className="mt-1 w-full rounded-xl border border-(--border-color) bg-(--bg-color) px-4 py-3 text-center text-sm font-medium text-(--text-primary) shadow-sm">
              Example: "Buy milk 20/05/27 !! #home"
            </div>
          </div>
        </div>
      )}

      {showNoMatch && (
        <div className="flex flex-col items-center justify-center p-12 text-center text-(--text-primary) opacity-80 dark:opacity-100">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Search size={32} className="text-primary opacity-60" />
          </div>
          <p className="text-lg font-medium">No tasks match your filters</p>
          <p>Try changing your search terms or filter settings.</p>
        </div>
      )}

      {showTaskList && (
        <div className="relative flex flex-col gap-3">
          {sortedTodos.map(todo => (
            <TaskItem
              key={todo.id}
              task={todo}
              isDragging={draggedId === todo.id}
              onPointerDown={handlePointerDown}
            />
          ))}
        </div>
      )}

      {/* Absolute-positioned drop indicator — no layout shift */}
      {dropY !== null && (
        <div
          className="absolute left-2 right-2 z-20 pointer-events-none"
          style={{ top: dropY }}
        >
          <div className="flex items-center gap-2">
            <div className="h-0.5 flex-1 rounded-full bg-primary shadow-sm shadow-primary/50" />
            <div className="size-2.5 rounded-full bg-primary shadow-sm shadow-primary/50 shrink-0" />
            <div className="h-0.5 flex-1 rounded-full bg-primary shadow-sm shadow-primary/50" />
          </div>
        </div>
      )}

      {/* Floating ghost — translucent copy following the cursor */}
      {ghostPos && ghostTaskRef.current && (
        <div
          className="fixed z-50 pointer-events-none transition-opacity duration-75"
          style={{ left: ghostPos.x, top: ghostPos.y }}
          aria-hidden="true"
        >
          <div className="flex items-start gap-3 p-3 rounded-xl border border-primary/40 bg-(--card-bg)/90 backdrop-blur-sm shadow-xl opacity-85 max-w-65">
            <div className="mt-0.5 shrink-0 text-primary/50">
              <GripVertical size={14} />
            </div>
            <div className="shrink-0 text-primary/50 mt-0.5">
              <div className="size-5 rounded-full border-2 border-primary/40" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-(--text-primary) truncate">
                {ghostTaskRef.current.title}
              </div>
              {ghostTaskRef.current.dueDate && (
                <div className="text-[11px] text-primary/60 mt-0.5">
                  {new Date(ghostTaskRef.current.dueDate).toLocaleDateString()}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TodoList;
