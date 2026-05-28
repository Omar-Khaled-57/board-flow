import { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Tag, Plus, FolderKanban, ArrowUp, ArrowDown, Sparkles } from 'lucide-react';
import { useTodoStore } from '../store/useTodoStore';
import { useNotesStore } from '../store/useNotesStore';
import { NoteSortField } from '../types';
import PageHeader from '../components/PageHeader';
import EmptyState from '../components/EmptyState';
import SortDropdown from '../components/SortDropdown';
import NoteItem from '../components/NoteItem';
import { useDragReorder } from '../hooks/useDragReorder';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTagFilter, setActiveTagFilter] = useState('');
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
          case 'title': cmp = a.title.localeCompare(b.title); break;
          case 'date-added': cmp = a.createdAt - b.createdAt; break;
          case 'updated-at': cmp = a.updatedAt - b.updatedAt; break;
          case 'tags': cmp = (a.tags[0] || '').localeCompare(b.tags[0] || ''); break;
        }
        return noteSortDirection === 'desc' ? -cmp : cmp;
      });
    }

    return sorted;
  }, [notes, activeListId, searchQuery, activeTagFilter, noteSortField, noteSortDirection]);

  const {
    listRef,
    draggedId,
    handlePointerDown,
    DropIndicator,
    GhostPortal,
  } = useDragReorder(sortedNotes, { itemIdAttr: 'data-noteid', flipIdAttr: 'data-flipid' }, {
    onReorder: (ids) => setNoteOrder(ids),
    onSetSortField: () => setNoteSortField('custom'),
  });

  const handleNewNote = useCallback(() => {
    const actualListId = activeListId.startsWith('list:') ? activeListId.split(':')[1] : undefined;
    const newId = addNote({
      title: '', content: '', tags: [], listId: actualListId, priority: 'medium',
    });
    navigate(`/notes/${newId}`, { state: { focusNew: true } });
  }, [activeListId, addNote, navigate]);

  useEffect(() => {
    if (showLists && listPanelRef.current) {
      setListPanelHeight(listPanelRef.current.scrollHeight);
    }
  }, [showLists, lists]);

  return (
    <div className="h-full flex flex-col gap-6 min-w-0">
      <PageHeader title="Notes" subtitle="Ideas, thoughts, and everything in between">
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
      </PageHeader>

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
            <EmptyState
              icon={Sparkles}
              title="No notes right now"
              description={<p>Tap <strong className="text-primary">New Note</strong> to get started</p>}
            />
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

        {DropIndicator}
        {GhostPortal}
      </div>
    </div>
  );
};

export default NotesPage;
