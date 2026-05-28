import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Search, Tag, Plus, FolderKanban, ArrowUp, ArrowDown, Sparkles, GripVertical } from 'lucide-react';
import { useTodoStore } from '../store/useTodoStore';
import { useNotesStore } from '../store/useNotesStore';
import { Note, NoteSortField } from '../types';
import SortDropdown from '../components/SortDropdown';
import NoteItem from '../components/NoteItem';

const NotesPage = () => {
  const notes = useNotesStore(state => state.notes);
  const addNote = useNotesStore(state => state.addNote);
  const noteSortField = useNotesStore(state => state.noteSortField);
  const noteSortDirection = useNotesStore(state => state.noteSortDirection);
  const setNoteSortField = useNotesStore(state => state.setNoteSortField);
  const setNoteSortDirection = useNotesStore(state => state.setNoteSortDirection);
  const setNoteOrder = useNotesStore(state => state.setNoteOrder);
  const navigate = useNavigate();
  const lists = useTodoStore(state => state.lists);
  const listRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTagFilter, setActiveTagFilter] = useState('');
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dropY, setDropY] = useState<number | null>(null);
  const [ghostPos, setGhostPos] = useState<{ x: number; y: number } | null>(null);
  const draggedIdRef = useRef(draggedId);
  const dropYRef = useRef<number | null>(null);
  const sortedRef = useRef<Note[]>([]);
  const ghostNoteRef = useRef<Note | null>(null);
  const prevPositionsRef = useRef<Map<string, DOMRect>>(new Map());
  const prevSortedIdsRef = useRef<string[]>([]);
  const flipAnimatingRef = useRef(false);
  const [activeListId, setActiveListId] = useState('all');
  const [showLists, setShowLists] = useState(false);
  const [showAllTags, setShowAllTags] = useState(false);
  const listPanelRef = useRef<HTMLDivElement>(null);
  const [listPanelHeight, setListPanelHeight] = useState(0);

  const allNoteTags = useMemo(
    () => Array.from(new Set(notes.flatMap(n => n.tags))),
    [notes]
  );

  const sortedNotes = useMemo(() => {
    let filtered = notes;

    if (activeListId.startsWith('list:')) {
      const lid = activeListId.split(':')[1];
      filtered = filtered.filter(n => n.listId === lid);
    } else if (activeListId === 'unlisted') {
      filtered = filtered.filter(n => !n.listId);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(n =>
        n.title.toLowerCase().includes(q) ||
        n.content.toLowerCase().includes(q) ||
        n.tags.some(t => t.toLowerCase().includes(q))
      );
    }

    if (activeTagFilter) {
      filtered = filtered.filter(n => n.tags.includes(activeTagFilter));
    }

    const sorted = [...filtered];
    if (noteSortField !== 'custom') {
      sorted.sort((a, b) => {
        let cmp = 0;
        switch (noteSortField) {
          case 'title':
            cmp = a.title.localeCompare(b.title);
            break;
          case 'date-added':
            cmp = a.createdAt - b.createdAt;
            break;
          case 'updated-at':
            cmp = a.updatedAt - b.updatedAt;
            break;
          case 'tags':
            cmp = (a.tags[0] || '').localeCompare(b.tags[0] || '');
            break;
        }
        return noteSortDirection === 'desc' ? -cmp : cmp;
      });
    }

    return sorted;
  }, [notes, activeListId, searchQuery, activeTagFilter, noteSortField, noteSortDirection]);

  // ── FLIP animation for reordering ──
  useLayoutEffect(() => {
    if (draggedId) return;
    const container = listRef.current;
    if (!container) return;
    const currentIds = sortedNotes.map(n => n.id);
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
  }, [sortedNotes, draggedId]);

  useEffect(() => { draggedIdRef.current = draggedId; }, [draggedId]);
  useEffect(() => { dropYRef.current = dropY; }, [dropY]);
  useEffect(() => { sortedRef.current = sortedNotes; }, [sortedNotes]);

  const handlePointerDown = useCallback((e: React.PointerEvent, id: string) => {
    setDraggedId(id);
    const note = sortedNotes.find(n => n.id === id);
    ghostNoteRef.current = note ?? null;
    setGhostPos({ x: e.clientX, y: e.clientY });
  }, [sortedNotes]);

  const handleNewNote = () => {
    const actualListId = activeListId.startsWith('list:') ? activeListId.split(':')[1] : undefined;
    const newId = addNote({
      title: '',
      content: '',
      tags: [],
      listId: actualListId,
      priority: 'medium',
    });
    navigate(`/notes/${newId}`, { state: { focusNew: true } });
  };

  useEffect(() => {
    if (!draggedId) { setGhostPos(null); setDropY(null); return; }

    const handlePointerMove = (e: PointerEvent) => {
      setGhostPos({ x: e.clientX, y: e.clientY });
      const listEl = listRef.current;
      if (!listEl) { setDropY(null); return; }
      const listRect = listEl.getBoundingClientRect();
      const sorted = sortedRef.current;
      const dragId = draggedIdRef.current;
      if (!dragId || sorted.length === 0) { setDropY(null); return; }

      const items = listEl.querySelectorAll<HTMLElement>('[data-noteid]');
      let beforeIdx: number | null = null;

      for (const el of items) {
        const rect = el.getBoundingClientRect();
        const noteId = el.dataset.noteid;
        if (noteId === dragId) continue;
        if (e.clientY < rect.top + rect.height / 2) {
          beforeIdx = sorted.findIndex(n => n.id === noteId);
          break;
        }
      }

      if (beforeIdx === null) {
        beforeIdx = sorted.length;
      }

      const dragIdx = sorted.findIndex(n => n.id === dragId);
      let effectiveIdx = beforeIdx;
      if (dragIdx < beforeIdx) effectiveIdx = beforeIdx - 1;
      else effectiveIdx = beforeIdx;

      if (dragIdx === effectiveIdx) {
        setDropY(null);
        return;
      }

      if (beforeIdx === sorted.length) {
        const lastItem = items[items.length - 1];
        if (lastItem) {
          const lastRect = lastItem.getBoundingClientRect();
          setDropY(lastRect.bottom - listRect.top);
        }
      } else if (beforeIdx !== null) {
        const targetEl = items[beforeIdx];
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

      if (dragId && y !== null) {
        const listEl = listRef.current;
        if (listEl) {
          const listRect = listEl.getBoundingClientRect();
          const relY = y;
          const items = listEl.querySelectorAll<HTMLElement>('[data-noteid]');
          let beforeIdx: number | null = sorted.length;

          for (const el of items) {
            const rect = el.getBoundingClientRect();
            const noteId = el.dataset.noteid;
            if (noteId === dragId) continue;
            if (relY + listRect.top < rect.top + rect.height / 2) {
              beforeIdx = sorted.findIndex(n => n.id === noteId);
              break;
            }
          }

          const sortedIds = sorted.map(n => n.id);
          const newIds = [...sortedIds];
          const fromIdx = sortedIds.indexOf(dragId);
          const [moved] = newIds.splice(fromIdx, 1);
          let toIdx = beforeIdx ?? sorted.length;
          if (fromIdx < toIdx) toIdx -= 1;
          newIds.splice(toIdx, 0, moved);

          setNoteOrder(newIds);
          setNoteSortField('custom');
        }
      }

      setDraggedId(null);
      setDropY(null);
      setGhostPos(null);
      ghostNoteRef.current = null;
    };

    document.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('pointerup', handlePointerUp);
    return () => {
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerup', handlePointerUp);
    };
  }, [draggedId, setNoteOrder]);

  useEffect(() => {
    if (showLists && listPanelRef.current) {
      setListPanelHeight(listPanelRef.current.scrollHeight);
    }
  }, [showLists, lists]);

  return (
    <div className="h-full flex flex-col gap-6 min-w-0">
      <header className="bg-primary -mx-4 md:-mx-8 -mt-4 md:-mt-8 mb-6 px-6 md:px-12 pt-12 pb-14 md:pb-16 arch-bottom shadow-lg shadow-primary/20 relative overflow-hidden flex flex-col items-start gap-6">
        <div className="absolute top-4 start-4 w-16 h-16 rounded-full border-4 border-(--text-on-primary) opacity-30 pointer-events-none" />
        <div className="absolute bottom-8 -end-5 w-32 h-32 rounded-full bg-(--text-on-primary) opacity-20 pointer-events-none" />
        <div className="absolute top-1/2 start-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-(--text-on-primary) opacity-10 pointer-events-none" />

        <div className="z-10 relative max-w-xl">
          <h1 className="text-4xl md:text-5xl font-black drop-shadow-md text-(--text-on-primary)">
            Notes
          </h1>
          <p className="mt-2 font-medium text-(--text-on-primary) opacity-80">Ideas, thoughts, and everything in between</p>
        </div>

        <div className="flex flex-col w-full items-stretch gap-3 z-10 relative">
          <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-[auto_minmax(12rem,1fr)] lg:grid-cols-[auto_minmax(14rem,1fr)_minmax(20rem,24rem)] lg:items-center">
            <button
              type="button"
              onClick={() => setShowLists(o => !o)}
              className={`flex min-h-11 items-center justify-center gap-2 px-4 py-2.5 rounded-full border text-sm font-bold transition-all shadow-sm backdrop-blur-sm ${
                showLists
                  ? 'bg-(--text-on-primary) text-primary border-(--text-on-primary)'
                  : 'bg-[rgba(var(--text-on-primary-rgb),0.1)] text-(--text-on-primary) border-[rgba(var(--text-on-primary-rgb),0.2)] hover:bg-[rgba(var(--text-on-primary-rgb),0.2)]'
              }`}
              aria-expanded={showLists}
            >
              <FolderKanban size={16} />
              <span>{lists.length} lists</span>
            </button>

            <div className="relative min-w-0">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 text-(--text-on-primary) opacity-60" size={16} />
              <input
                type="text"
                placeholder="Search notes..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="min-h-11 ps-9 pe-4 py-2.5 rounded-full bg-[rgba(var(--text-on-primary-rgb),0.1)] border border-[rgba(var(--text-on-primary-rgb),0.2)] text-(--text-on-primary) placeholder-[rgba(var(--text-on-primary-rgb),0.6)] text-sm focus:border-(--text-on-primary) focus:ring-2 focus:ring-[rgba(var(--text-on-primary-rgb),0.3)] outline-none w-full transition-all shadow-sm backdrop-blur-sm"
                aria-label="Search notes"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:col-span-2 lg:col-span-1">
              <button
                type="button"
                onClick={handleNewNote}
                className="flex min-h-11 items-center justify-center gap-2 px-5 py-2.5 rounded-full border text-sm font-bold transition-all shadow-sm backdrop-blur-sm bg-(--text-on-primary) text-primary border-(--text-on-primary) hover:brightness-110"
              >
                <Plus size={16} />
                New Note
              </button>
            </div>
          </div>

          {allNoteTags.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <Tag size={12} className="text-(--text-on-primary) opacity-60 shrink-0" />
              {allNoteTags.slice(0, 5).map(tag => (
                <button
                  key={tag}
                  onClick={() => setActiveTagFilter(activeTagFilter === tag ? '' : tag)}
                  className={`text-[11px] font-bold px-3 py-1.5 rounded-full transition-all border ${
                    activeTagFilter === tag
                      ? 'bg-(--text-on-primary) text-primary border-(--text-on-primary) shadow-sm scale-95'
                      : 'bg-[rgba(var(--text-on-primary-rgb),0.1)] text-(--text-on-primary) border-[rgba(var(--text-on-primary-rgb),0.2)] hover:border-(--text-on-primary) hover:bg-[rgba(var(--text-on-primary-rgb),0.2)]'
                  }`}
                >
                  {tag}
                </button>
              ))}
              {allNoteTags.length > 5 && (
                <button
                  type="button"
                  onClick={() => setShowAllTags(o => !o)}
                  className={`text-[11px] font-bold px-3 py-1.5 rounded-full transition-all border cursor-pointer shrink-0 ${
                    showAllTags
                      ? 'bg-(--text-on-primary) text-primary border-(--text-on-primary)'
                      : 'text-(--text-on-primary) opacity-60 bg-[rgba(var(--text-on-primary-rgb),0.05)] border-transparent hover:opacity-100 hover:bg-[rgba(var(--text-on-primary-rgb),0.1)]'
                  }`}
                >
                  {showAllTags ? `-${allNoteTags.length - 5}` : `+${allNoteTags.length - 5}`}
                </button>
              )}
            </div>
          )}
        </div>
      </header>

      <div
        className="overflow-hidden transition-all duration-400 ease-[cubic-bezier(0.4,0,0.2,1)]"
        style={{
          maxHeight: showLists ? listPanelHeight || 500 : 0,
          opacity: showLists ? 1 : 0,
          transform: showLists ? 'scaleY(1) translateY(0)' : 'scaleY(0.95) translateY(-8px)',
          marginTop: showLists ? '-2rem' : '-2rem',
          marginBottom: showLists ? '0.5rem' : '0',
          pointerEvents: showLists ? 'auto' : 'none' as const,
        }}
        aria-hidden={!showLists}
      >
        <div ref={listPanelRef}>
          <div className="rounded-[2rem] border border-(--border-color) bg-(--card-bg) shadow-sm shadow-[var(--shadow-color)] p-2.5 sm:p-3">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveListId('all')}
                className={`min-h-9 rounded-full px-4 py-2 text-sm font-bold transition-all ${
                  activeListId === 'all'
                    ? 'bg-primary text-(--text-on-primary) shadow-sm'
                    : 'bg-(--bg-color) text-(--text-secondary) hover:bg-primary/10 hover:text-primary border border-(--border-color)'
                }`}
              >
                All Notes
              </button>
              <button
                type="button"
                onClick={() => setActiveListId('unlisted')}
                className={`min-h-9 rounded-full px-4 py-2 text-sm font-bold transition-all ${
                  activeListId === 'unlisted'
                    ? 'bg-primary text-(--text-on-primary) shadow-sm'
                    : 'bg-(--bg-color) text-(--text-secondary) hover:bg-primary/10 hover:text-primary border border-(--border-color)'
                }`}
              >
                No List
              </button>
              {lists.map(list => (
                <button
                  key={list.id}
                  type="button"
                  onClick={() => setActiveListId(`list:${list.id}`)}
                  className={`min-h-9 rounded-full px-4 py-2 text-sm font-bold transition-all ${
                    activeListId === `list:${list.id}`
                      ? 'bg-primary text-(--text-on-primary) shadow-sm'
                      : 'bg-(--bg-color) text-(--text-secondary) hover:bg-primary/10 hover:text-primary border border-(--border-color)'
                  }`}
                >
                  {list.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-semibold truncate text-(--text-primary)">
          {activeListId === 'all' ? 'All Notes' : activeListId === 'unlisted' ? 'Unlisted' : lists.find(l => l.id === activeListId.split(':')[1])?.name || 'Notes'}
        </h2>
        <div className="flex items-center gap-1.5 shrink-0">
          <SortDropdown
            value={noteSortField}
            onChange={v => setNoteSortField(v as NoteSortField)}
            options={[
              { value: 'custom', label: 'Custom' },
              { value: 'date-added', label: 'Date Added' },
              { value: 'updated-at', label: 'Updated' },
              { value: 'title', label: 'Title' },
              { value: 'tags', label: 'Tags' },
            ]}
          />
          <button
            onClick={() => setNoteSortDirection(noteSortDirection === 'asc' ? 'desc' : 'asc')}
            className="text-primary font-bold text-sm drop-shadow-[0_0_4px_var(--color-primary)] transition-all hover:opacity-80"
            aria-label="Toggle sort direction"
          >
            {noteSortDirection === 'asc' ? <ArrowUp size={15} /> : <ArrowDown size={15} />}
          </button>
        </div>
      </div>

      <div className="relative flex flex-col gap-3 pb-4 min-h-[20rem]">
        {sortedNotes.length === 0 ? (
          <div className="bg-(--card-bg) rounded-xl shadow-sm border border-(--border-color) p-6 flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center justify-center py-16 text-center text-(--text-primary) opacity-80 dark:opacity-100">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                <Sparkles size={40} className="text-primary" />
              </div>
              <h3 className="text-2xl font-bold text-(--text-primary) mb-3">No notes right now</h3>
              <div className="mx-auto flex max-w-sm flex-col items-center gap-2.5 text-center text-sm leading-6 text-(--text-primary) dark:opacity-85">
                <p>
                  Tap <strong className="text-primary">New Note</strong> to get started
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div ref={listRef} className="flex flex-col gap-3">
            {sortedNotes.map(note => (
              <div key={note.id} data-flipid={note.id}>
                <NoteItem
                  note={note}
                  isDragging={draggedId === note.id}
                  onPointerDown={handlePointerDown}
                />
              </div>
            ))}
          </div>
        )}

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

        {ghostPos && ghostNoteRef.current && createPortal(
          <div
            className="fixed z-50 pointer-events-none"
            style={{ insetInlineStart: ghostPos.x - 8, top: ghostPos.y - 8 }}
            aria-hidden="true"
          >
            <div className="flex items-start gap-3 p-3 rounded-xl border border-primary/40 bg-(--card-bg)/90 backdrop-blur-sm shadow-xl opacity-85 max-w-65">
              <div className="mt-0.5 shrink-0 text-primary/50">
                <GripVertical size={14} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-(--text-primary) truncate">
                  {ghostNoteRef.current.title || 'Untitled'}
                </div>
                {ghostNoteRef.current.tags.length > 0 && (
                  <div className="text-[11px] text-primary/60 mt-0.5 truncate">
                    {ghostNoteRef.current.tags.join(', ')}
                  </div>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}
      </div>
    </div>
  );
};

export default NotesPage;
