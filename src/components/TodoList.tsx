import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTodoStore } from '../store/useTodoStore';
import TaskItem from './TaskItem';
import { Todo, SortField, SortDirection } from '../types';
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
  const updateSettings = useTodoStore(state => state.updateSettings);


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

  const priorityOrder = { high: 0, medium: 1, low: 2 };

  const compareField = (a: Todo, b: Todo, field: SortField, dir: SortDirection): number => {
    const multiplier = dir === 'asc' ? 1 : -1;
    switch (field) {
      case 'name':
        return multiplier * a.title.localeCompare(b.title);
      case 'date-added':
        return multiplier * (a.createdAt - b.createdAt);
      case 'due-date': {
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return multiplier * (a.dueDate - b.dueDate);
      }
      case 'priority':
        return multiplier * ((priorityOrder[a.priority] ?? 1) - (priorityOrder[b.priority] ?? 1));
      case 'tags': {
        const aTag = a.tags[0] || '';
        const bTag = b.tags[0] || '';
        return multiplier * aTag.localeCompare(bTag);
      }
      default:
        return 0;
    }
  };

  const sortedTodos = useMemo(() => {
    const sorted = [...filteredTodos];
    if (settings.sortField !== 'custom') {
      sorted.sort((a, b) => compareField(a, b, settings.sortField, settings.sortDirection));
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

  // ── FLIP animation for reordering ──
  const prevPositionsRef = useRef<Map<string, DOMRect>>(new Map());
  const prevSortedIdsRef = useRef<string[]>([]);
  const flipAnimatingRef = useRef(false);

  useLayoutEffect(() => {
    if (draggedId) return;

    const container = listRef.current;
    if (!container) return;

    const currentIds = sortedTodos.map(t => t.id);
    const prevIds = prevSortedIdsRef.current;
    const prevPositions = prevPositionsRef.current;

    const items = container.querySelectorAll<HTMLElement>('[data-flipid]');
    const currentRects = new Map<string, DOMRect>();
    items.forEach(el => {
      const id = el.dataset.flipid;
      if (id) currentRects.set(id, el.getBoundingClientRect());
    });

    if (prevIds.length > 0 && prevPositions.size > 0 && !flipAnimatingRef.current) {
      let hasFlip = false;

      items.forEach(el => {
        const id = el.dataset.flipid;
        if (!id) return;
        const prev = prevPositions.get(id);
        const curr = currentRects.get(id);
        if (prev && curr) {
          const dy = prev.top - curr.top;
          const dx = prev.left - curr.left;
          if (Math.abs(dy) > 1 || Math.abs(dx) > 1) {
            el.style.transform = `translate(${dx}px, ${dy}px)`;
            hasFlip = true;
          }
        }
      });

      if (hasFlip) {
        flipAnimatingRef.current = true;
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            items.forEach(el => {
              el.style.transition = 'transform 300ms ease';
              el.style.transform = '';
            });
            setTimeout(() => {
              items.forEach(el => {
                el.style.transition = '';
                el.style.transform = '';
              });
              flipAnimatingRef.current = false;
            }, 350);
          });
        });
      }
    }

    prevPositionsRef.current = currentRects;
    prevSortedIdsRef.current = currentIds;
  }, [sortedTodos, settings.completedToBottom, draggedId]);

  useEffect(() => { draggedIdRef.current = draggedId; }, [draggedId]);
  useEffect(() => { dropYRef.current = dropY; }, [dropY]);
  useEffect(() => { sortedRef.current = sortedTodos; }, [sortedTodos]);
  useEffect(() => { filteredRef.current = filteredTodos; }, [filteredTodos]);

  const handlePointerDown = useCallback((e: React.PointerEvent, id: string) => {
    setDraggedId(id);
    const task = sortedTodos.find(t => t.id === id);
    ghostTaskRef.current = task ?? null;
    setGhostPos({ x: e.clientX, y: e.clientY });
  }, [sortedTodos]);

  useEffect(() => {
    if (!draggedId) { setGhostPos(null); setDropY(null); return; }

    const handlePointerMove = (e: PointerEvent) => {
      // Update ghost position
      setGhostPos({ x: e.clientX, y: e.clientY });

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
          updateSettings({ sortField: 'custom' });
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
  }, [draggedId, todos, setTodoOrder, updateSettings]);

  const showEmptyState = todos.length === 0;
  const showNoMatch = todos.length > 0 && sortedTodos.length === 0;
  const showTaskList = sortedTodos.length > 0;

  return (
    <div ref={listRef} className="relative min-h-[32rem]">
      {showEmptyState && (
        <div className="flex flex-col items-center justify-center py-10 text-center text-(--text-primary) opacity-80 dark:opacity-100">
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
              use # to add tags, like "#tasks".
            </p>
            <p className="max-w-xs">
              <strong className="text-primary">Priority:</strong>{' '}
              use "!!", "!high", "!med", or "!low".
            </p>
            <div className="mt-1 w-full rounded-xl border border-(--border-color) bg-(--bg-color) px-4 py-3 text-center text-sm font-medium text-(--text-primary) shadow-sm">
              Example: "Buy milk 20/05/27 !! #tasks"
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

      {/* Absolute-positioned drop indicator — no layout shift */}
      {dropY !== null && (
        <div
          className="absolute start-2 end-2 z-20 pointer-events-none"
          style={{ top: dropY }}
        >
          <div className="flex items-center gap-2">
            <div className="h-0.5 flex-1 rounded-full bg-primary shadow-sm shadow-primary/50" />
            <div className="size-2.5 rounded-full bg-primary shadow-sm shadow-primary/50 shrink-0" />
            <div className="h-0.5 flex-1 rounded-full bg-primary shadow-sm shadow-primary/50" />
          </div>
        </div>
      )}

      {/* Floating ghost — portaled to body to escape ancestor clipping */}
      {ghostPos && ghostTaskRef.current && createPortal(
        <div
          className="fixed z-50 pointer-events-none"
          style={{ insetInlineStart: ghostPos.x - 8, top: ghostPos.y - 8 }}
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
        </div>,
        document.body
      )}
    </div>
  );
};

export default TodoList;
