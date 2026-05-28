import { useState, useRef, useCallback, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { GripVertical } from 'lucide-react';

interface DragItem {
  id: string;
  title: string;
  subtitle?: string;
}

interface DragConfig {
  itemIdAttr: string;
  flipIdAttr: string;
}

interface DragState {
  draggedId: string | null;
  dropY: number | null;
  ghostPos: { x: number; y: number } | null;
}

interface DragCallbacks {
  onReorder: (orderedIds: string[]) => void;
  onSetSortField?: () => void;
}

export const useDragReorder = <T extends DragItem>(
  items: T[],
  config: DragConfig,
  callbacks: DragCallbacks
) => {
  const { itemIdAttr, flipIdAttr } = config;
  const { onReorder, onSetSortField } = callbacks;

  const [state, setState] = useState<DragState>({ draggedId: null, dropY: null, ghostPos: null });
  const listRef = useRef<HTMLDivElement>(null);
  const draggedIdRef = useRef(state.draggedId);
  const dropYRef = useRef(state.dropY);
  const sortedRef = useRef(items);
  const ghostItemRef = useRef<DragItem | null>(null);

  // FLIP animation refs
  const prevPositionsRef = useRef<Map<string, DOMRect>>(new Map());
  const prevSortedIdsRef = useRef<string[]>([]);
  const flipAnimatingRef = useRef(false);

  useEffect(() => { draggedIdRef.current = state.draggedId; }, [state.draggedId]);
  useEffect(() => { dropYRef.current = state.dropY; }, [state.dropY]);
  useEffect(() => { sortedRef.current = items; }, [items]);

  const handlePointerDown = useCallback((e: React.PointerEvent, id: string) => {
    const item = items.find(i => i.id === id);
    ghostItemRef.current = item ?? null;
    setState(s => ({ ...s, draggedId: id, ghostPos: { x: e.clientX, y: e.clientY } }));
  }, [items]);

  // FLIP animation
  useLayoutEffect(() => {
    if (state.draggedId) return;
    const container = listRef.current;
    if (!container) return;

    const currentIds = items.map(i => i.id);
    const prevIds = prevSortedIdsRef.current;
    const prevPositions = prevPositionsRef.current;

    const itemEls = container.querySelectorAll<HTMLElement>(`[${flipIdAttr}]`);
    const currentRects = new Map<string, DOMRect>();
    itemEls.forEach(el => {
      const id = el.getAttribute(flipIdAttr);
      if (id) currentRects.set(id, el.getBoundingClientRect());
    });

    if (prevIds.length > 0 && prevPositions.size > 0 && !flipAnimatingRef.current) {
      let hasFlip = false;
      itemEls.forEach(el => {
        const id = el.getAttribute(flipIdAttr);
        if (!id) return;
        const prev = prevPositions.get(id);
        const curr = currentRects.get(id);
        if (prev && curr) {
          const dy = prev.top - curr.top;
          const dx = prev.left - curr.left;
          if (Math.abs(dy) > 1 || Math.abs(dx) > 1) {
            (el as HTMLElement).style.transform = `translate(${dx}px, ${dy}px)`;
            hasFlip = true;
          }
        }
      });

      if (hasFlip) {
        flipAnimatingRef.current = true;
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            itemEls.forEach(el => {
              (el as HTMLElement).style.transition = 'transform 300ms ease';
              (el as HTMLElement).style.transform = '';
            });
            setTimeout(() => {
              itemEls.forEach(el => {
                (el as HTMLElement).style.transition = '';
                (el as HTMLElement).style.transform = '';
              });
              flipAnimatingRef.current = false;
            }, 350);
          });
        });
      }
    }

    prevPositionsRef.current = currentRects;
    prevSortedIdsRef.current = currentIds;
  }, [items, state.draggedId, flipIdAttr]);

  // Pointer move/up handlers
  useEffect(() => {
    if (!state.draggedId) return;

    const handlePointerMove = (e: PointerEvent) => {
      setState(s => ({ ...s, ghostPos: { x: e.clientX, y: e.clientY } }));

      const listEl = listRef.current;
      if (!listEl) { setState(s => ({ ...s, dropY: null })); return; }
      const listRect = listEl.getBoundingClientRect();
      const sorted = sortedRef.current;
      const dragId = draggedIdRef.current;
      if (!dragId || sorted.length === 0) { setState(s => ({ ...s, dropY: null })); return; }

      const itemEls = listEl.querySelectorAll<HTMLElement>(`[${itemIdAttr}]`);
      let beforeIdx: number | null = null;

      for (const el of itemEls) {
        const rect = el.getBoundingClientRect();
        const elId = el.getAttribute(itemIdAttr);
        if (elId === dragId) continue;
        if (e.clientY < rect.top + rect.height / 2) {
          beforeIdx = sorted.findIndex(t => t.id === elId);
          break;
        }
      }

      if (beforeIdx === null) beforeIdx = sorted.length;

      const dragIdx = sorted.findIndex(t => t.id === dragId);
      const effectiveIdx = dragIdx < beforeIdx ? beforeIdx - 1 : beforeIdx;

      if (dragIdx === effectiveIdx) {
        setState(s => ({ ...s, dropY: null }));
        return;
      }

      if (beforeIdx === sorted.length) {
        const lastItem = itemEls[itemEls.length - 1];
        if (lastItem) {
          const lastRect = lastItem.getBoundingClientRect();
          setState(s => ({ ...s, dropY: lastRect.bottom - listRect.top }));
        }
      } else if (beforeIdx !== null) {
        const targetEl = itemEls[beforeIdx];
        if (targetEl) {
          const targetRect = targetEl.getBoundingClientRect();
          setState(s => ({ ...s, dropY: targetRect.top - listRect.top - 2 }));
        }
      }
    };

    const handlePointerUp = () => {
      const dragId = draggedIdRef.current;
      const y = dropYRef.current;
      const sorted = sortedRef.current;

      if (dragId && y !== null) {
        const listEl = listRef.current;
        if (listEl) {
          const listRect = listEl.getBoundingClientRect();
          const relY = y;
          const itemEls = listEl.querySelectorAll<HTMLElement>(`[${itemIdAttr}]`);
          let beforeIdx: number | null = sorted.length;

          for (const el of itemEls) {
            const rect = el.getBoundingClientRect();
            const elId = el.getAttribute(itemIdAttr);
            if (elId === dragId) continue;
            if (relY + listRect.top < rect.top + rect.height / 2) {
              beforeIdx = sorted.findIndex(t => t.id === elId);
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

          onReorder(newIds);
          onSetSortField?.();
        }
      }

      setState({ draggedId: null, dropY: null, ghostPos: null });
      ghostItemRef.current = null;
    };

    document.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('pointerup', handlePointerUp);
    return () => {
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerup', handlePointerUp);
    };
  }, [state.draggedId, onReorder, onSetSortField, itemIdAttr]);

  const DropIndicator = state.dropY !== null ? (
    <div
      className="absolute start-2 end-2 z-20 pointer-events-none"
      style={{ top: state.dropY }}
    >
      <div className="flex items-center gap-2">
        <div className="h-0.5 flex-1 rounded-full bg-primary shadow-sm shadow-primary/50" />
        <div className="size-2.5 rounded-full bg-primary shadow-sm shadow-primary/50 shrink-0" />
        <div className="h-0.5 flex-1 rounded-full bg-primary shadow-sm shadow-primary/50" />
      </div>
    </div>
  ) : null;

  const GhostPortal = state.ghostPos && ghostItemRef.current ? createPortal(
    <div
      className="fixed z-50 pointer-events-none"
      style={{ insetInlineStart: state.ghostPos.x - 8, top: state.ghostPos.y - 8 }}
      aria-hidden="true"
    >
      <div className="flex items-start gap-3 p-3 rounded-xl border border-primary/40 bg-(--card-bg)/90 backdrop-blur-sm shadow-xl opacity-85 max-w-65">
        <div className="mt-0.5 shrink-0 text-primary/50">
          <GripVertical size={14} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-(--text-primary) truncate">
            {ghostItemRef.current.title}
          </div>
          {ghostItemRef.current.subtitle && (
            <div className="text-[11px] text-primary/60 mt-0.5 truncate">
              {ghostItemRef.current.subtitle}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  ) : null;

  return {
    listRef,
    draggedId: state.draggedId,
    handlePointerDown,
    DropIndicator,
    GhostPortal,
  };
};
