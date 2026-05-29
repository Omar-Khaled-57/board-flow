import { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Tag, Plus, FolderKanban, ArrowUp, ArrowDown, Sparkles, Edit2, Trash2 } from 'lucide-react';
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
  const addList = useTodoStore(state => state.addList);
  const deleteList = useTodoStore(state => state.deleteList);
  const renameList = useTodoStore(state => state.renameList);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTagFilter, setActiveTagFilter] = useState('');
  const [activeListId, setActiveListId] = useState('all');
  const [showLists, setShowLists] = useState(false);
  const [showAllTags, setShowAllTags] = useState(false);
  const [editingListId, setEditingListId] = useState<string | null>(null);
  const [editingListName, setEditingListName] = useState('');
  const [newListName, setNewListName] = useState('');
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

  const handleAddList = useCallback(() => {
    if (newListName.trim()) {
      addList({ name: newListName, color: '#5b6af0' });
      setNewListName('');
    }
  }, [newListName, addList]);

  const handleRenameList = useCallback((listId: string, newName: string) => {
    if (newName.trim()) {
      renameList(listId, newName);
      setEditingListId(null);
    }
  }, [renameList]);

  useEffect(() => {
    if (showLists && listPanelRef.current) {
      setListPanelHeight(listPanelRef.current.scrollHeight);
    }
  }, [showLists, lists, editingListId]);

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
          <div className="rounded-[2rem] border border-(--border-color) bg-(--card-bg) shadow-sm shadow-[var(--shadow-color)] p-2.5 sm:p-3 flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              {[{ id: 'all', label: 'All Notes' }, { id: 'unlisted', label: 'No List' }, ...lists.map(l => ({ id: `list:${l.id}`, label: l.name }))].map(tab => {
                const isListTab = tab.id.startsWith('list:');
                const listId = isListTab ? tab.id.split(':')[1] : null;
                const isActiveList = activeListId === tab.id;

                return (
                  <div
                    key={tab.id}
                    className="group flex max-w-full items-center gap-1 rounded-full border backdrop-blur-md transition-all duration-300 ease-out border-(--border-color) bg-(--bg-color)/70 px-1.5 py-1 shadow-sm"
                  >
                    <button
                      type="button"
                      onClick={() => setActiveListId(tab.id)}
                      className={`flex min-h-9 min-w-0 max-w-full items-center gap-2 rounded-full px-3.5 py-2 text-sm font-bold transition-all shadow-none ${
                        isActiveList
                          ? 'bg-primary text-(--text-on-primary) shadow-sm'
                          : 'bg-transparent text-(--text-secondary) hover:bg-primary/10 hover:text-primary'
                      }`}
                    >
                      <span className="truncate">{tab.label}</span>
                    </button>

                    {isListTab && listId && (
                      <div
                        className={`origin-inline-start flex shrink-0 gap-1 overflow-hidden transition-[max-width,opacity,transform,margin] duration-300 ease-out ${
                          isActiveList
                            ? 'ms-0 max-w-20 opacity-100 scale-100 pointer-events-auto'
                            : '-ms-1 max-w-0 opacity-0 scale-90 pointer-events-none'
                        }`}
                        aria-hidden={!isActiveList}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setEditingListId(listId);
                            setEditingListName(lists.find(l => l.id === listId)?.name || '');
                          }}
                          className={`grid min-h-8 w-8 place-items-center rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-(--text-on-primary) transition-all duration-300 shadow-none ${
                            isActiveList ? 'scale-100' : 'scale-75'
                          }`}
                          title="Rename list"
                          aria-label={`Rename ${tab.label}`}
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteList(listId)}
                          className={`grid min-h-8 w-8 place-items-center rounded-full bg-danger/10 text-danger hover:bg-danger hover:text-white transition-all duration-300 shadow-none ${
                            isActiveList ? 'scale-100' : 'scale-75'
                          }`}
                          title="Delete list"
                          aria-label={`Delete ${tab.label}`}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}

              <div className="flex min-w-0 flex-1 basis-full items-center gap-2 sm:basis-64 lg:basis-72">
                <input
                  type="text"
                  placeholder="New list..."
                  title="Create a new list"
                  value={newListName}
                  onChange={e => setNewListName(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleAddList();
                  }}
                  className="min-h-9 min-w-0 flex-1 rounded-xl bg-(--bg-color) border border-(--border-color) px-3 py-2 text-sm text-(--text-primary) placeholder:text-(--text-secondary) focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-none"
                />
                <button
                  type="button"
                  onClick={handleAddList}
                  className="grid min-h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-(--text-on-primary) transition-all shadow-none"
                  title="Add new list"
                  aria-label="Add new list"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>

            {editingListId && (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 px-2 py-2 bg-primary/5 rounded-2xl">
                <input
                  type="text"
                  placeholder="List name..."
                  title="Rename list"
                  value={editingListName}
                  onChange={e => setEditingListName(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleRenameList(editingListId, editingListName);
                    if (e.key === 'Escape') setEditingListId(null);
                  }}
                  autoFocus
                  className="min-h-9 flex-1 px-3 py-2 rounded-xl bg-(--card-bg) border border-primary/30 text-sm focus:outline-none focus:border-primary shadow-none"
                />
                <button
                  type="button"
                  onClick={() => handleRenameList(editingListId, editingListName)}
                  className="min-h-9 px-4 py-2 bg-primary text-(--text-on-primary) text-sm rounded-xl hover:bg-primary-hover transition-all shadow-none"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setEditingListId(null)}
                  className="min-h-9 px-4 py-2 bg-(--bg-color) text-(--text-primary) border border-(--border-color) text-sm rounded-xl hover:bg-primary/10 transition-all shadow-none"
                >
                  Cancel
                </button>
              </div>
            )}
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
