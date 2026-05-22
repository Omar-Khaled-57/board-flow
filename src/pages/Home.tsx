import { useEffect, useMemo, useRef, useState } from 'react';
import TaskEditor from '../components/TaskEditor';
import TodoList from '../components/TodoList';
import { FolderKanban, Search, Tag, Plus, Trash2, Edit2, CheckCheck } from 'lucide-react';
import { useTodoStore } from '../store/useTodoStore';

type TaskListTab = {
  id: string;
  label: string;
  count: number;
  showUnlistedOnly?: boolean;
};

const Home = () => {
  const todos = useTodoStore(state => state.todos);
  const lists = useTodoStore(state => state.lists);
  const undo = useTodoStore(state => state.undo);
  const redo = useTodoStore(state => state.redo);
  const addList = useTodoStore(state => state.addList);
  const deleteList = useTodoStore(state => state.deleteList);
  const renameList = useTodoStore(state => state.renameList);
  const deleteCompletedTodos = useTodoStore(state => state.deleteCompletedTodos);
  const settings = useTodoStore(state => state.settings);
  
  const allTags = useMemo(() => Array.from(new Set(todos.flatMap(t => t.tags))), [todos]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [showTaskTabs, setShowTaskTabs] = useState(false);
  const [showAllTags, setShowAllTags] = useState(false);
  const [activeTaskListId, setActiveTaskListId] = useState('all');
  const [editingListId, setEditingListId] = useState<string | null>(null);
  const [editingListName, setEditingListName] = useState('');
  const [newListName, setNewListName] = useState('');
  const tabsPanelRef = useRef<HTMLDivElement>(null);
  const [tabsPanelHeight, setTabsPanelHeight] = useState(0);

  const taskListTabs = useMemo<TaskListTab[]>(() => {
    const listTabs = lists.map(list => ({
      id: `list:${list.id}`,
      label: list.name,
      count: todos.filter(todo => todo.listId === list.id).length,
    }));
    const unlistedCount = todos.filter(todo => !todo.listId).length;
    return [
      { id: 'all', label: 'All', count: todos.length },
      ...listTabs,
      ...(unlistedCount > 0
        ? [{ id: 'unlisted' as const, label: 'No List', count: unlistedCount, showUnlistedOnly: true as const }]
        : []),
    ];
  }, [lists, todos]);
  
  const visibleTaskListTabs = useMemo(
    () => taskListTabs.filter(tab => tab.id !== 'all'),
    [taskListTabs]
  );

  useEffect(() => {
    if (showTaskTabs && tabsPanelRef.current) {
      setTabsPanelHeight(tabsPanelRef.current.scrollHeight);
    }
  }, [showTaskTabs, visibleTaskListTabs, editingListId, lists]);

  const activeTaskList = taskListTabs.find(tab => tab.id === activeTaskListId) ?? taskListTabs[0];
  const activeListId = activeTaskListId.startsWith('list:') ? activeTaskListId.split(':')[1] : undefined;
  const filterIndex = filter === 'active' ? 1 : filter === 'completed' ? 2 : 0;
  const useStackedLandscapeLayout = settings.landscapeStackedTasks ?? true;

  useEffect(() => {
    if (!taskListTabs.some(tab => tab.id === activeTaskListId)) {
      setActiveTaskListId('all');
    }
  }, [activeTaskListId, taskListTabs]);

  // Keyboard shortcuts for undo/redo in landscape mode
  useEffect(() => {
    const isLandscape = () => window.matchMedia('(min-width: 768px)').matches;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isLandscape()) return;
      
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z' && !e.shiftKey) {
          e.preventDefault();
          undo();
        } else if ((e.key === 'y') || (e.key === 'z' && e.shiftKey)) {
          e.preventDefault();
          redo();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  const handleAddList = () => {
    if (newListName.trim()) {
      addList({ name: newListName, color: '#5b6af0' });
      setNewListName('');
    }
  };

  const handleRenameList = (listId: string, newName: string) => {
    if (newName.trim()) {
      renameList(listId, newName);
      setEditingListId(null);
    }
  };

  const handleToggleTaskTabs = () => {
    setShowTaskTabs(open => {
      if (open) setEditingListId(null);
      return !open;
    });
  };

  return (
    <div className="h-full flex flex-col gap-6">
      <header className="bg-primary -mx-4 md:-mx-8 -mt-4 md:-mt-8 mb-6 px-6 md:px-12 pt-12 pb-14 md:pb-16 arch-bottom shadow-lg shadow-primary/20 relative overflow-hidden flex flex-col items-start gap-6">
        {/* Decorative elements */}
        <div className="absolute top-4 left-4 w-16 h-16 rounded-full border-4 border-(--text-on-primary) opacity-30 pointer-events-none" />
        <div className="absolute bottom-8 right-[-20px] w-32 h-32 rounded-full bg-(--text-on-primary) opacity-20 pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-(--text-on-primary) opacity-10 pointer-events-none" />

        <div className="z-10 relative max-w-xl">
          <h1 className="text-4xl md:text-5xl font-black drop-shadow-md text-(--text-on-primary)">
            Tasks
          </h1>
          <p className="mt-2 font-medium text-(--text-on-primary) opacity-80">Wait less, Live more. Stay organized.</p>
        </div>
        
        <div className="flex flex-col w-full items-stretch gap-3 z-10 relative">
          <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-[auto_minmax(12rem,1fr)] lg:grid-cols-[auto_minmax(14rem,1fr)_minmax(20rem,24rem)] lg:items-center">
            <button
              type="button"
              onClick={handleToggleTaskTabs}
              className={`flex min-h-11 items-center justify-center gap-2 px-4 py-2.5 rounded-full border text-sm font-bold transition-all shadow-sm backdrop-blur-sm ${
                showTaskTabs
                  ? 'bg-(--text-on-primary) text-primary border-(--text-on-primary)'
                  : 'bg-[rgba(var(--text-on-primary-rgb),0.1)] text-(--text-on-primary) border-[rgba(var(--text-on-primary-rgb),0.2)] hover:bg-[rgba(var(--text-on-primary-rgb),0.2)]'
              }`}
              aria-expanded={showTaskTabs ? 'true' : 'false'}
            >
              <FolderKanban size={16} />
              <span>{visibleTaskListTabs.length} lists</span>
            </button>

            <div className="relative min-w-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-(--text-on-primary) opacity-60" size={16} />
              <input 
                type="text" 
                placeholder="Search tasks..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="min-h-11 pl-9 pr-4 py-2.5 rounded-full bg-[rgba(var(--text-on-primary-rgb),0.1)] border border-[rgba(var(--text-on-primary-rgb),0.2)] text-(--text-on-primary) placeholder-[rgba(var(--text-on-primary-rgb),0.6)] text-sm focus:border-(--text-on-primary) focus:ring-2 focus:ring-[rgba(var(--text-on-primary-rgb),0.3)] outline-none w-full transition-all shadow-sm backdrop-blur-sm"
              />
            </div>
            
            <div className="relative grid min-h-11 grid-cols-3 items-center gap-1 overflow-hidden bg-(--card-bg)/95 backdrop-blur-sm border border-[rgba(var(--text-on-primary-rgb),0.24)] rounded-full p-1 w-full shadow-sm sm:col-span-2 lg:col-span-1">
              <div
                className="absolute top-1 bottom-1 rounded-full bg-primary shadow-sm transition-[left] duration-300 ease-out"
                style={{
                  left: `calc(0.25rem + ${filterIndex} * ((100% - 1rem) / 3 + 0.25rem))`,
                  width: 'calc((100% - 1rem) / 3)',
                }}
                aria-hidden="true"
              />
              {(['all', 'active', 'completed'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`relative z-10 min-w-0 px-4 py-2 text-[clamp(0.8rem,1.6vw,1rem)] sm:text-sm rounded-full capitalize font-bold transition-colors duration-200 shadow-none truncate ${
                    filter === f
                      ? 'bg-transparent text-(--text-on-primary)'
                      : 'bg-transparent text-primary hover:bg-primary/10'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex flex-col portrait:gap-2 landscape:flex-row landscape:flex-wrap landscape:items-center landscape:gap-2 w-full">
            <div className="flex flex-wrap items-center gap-2 landscape:flex-1">
              {allTags.length > 0 && (
                <>
                  <Tag size={12} className="text-(--text-on-primary) opacity-60 shrink-0" />
                  {allTags.slice(0, 5).map(tag => (
                    <button 
                      key={tag}
                      onClick={() => setSearchQuery(searchQuery === tag ? '' : tag)}
                      className={`text-[11px] font-bold px-3 py-1.5 rounded-full transition-all border ${searchQuery === tag ? 'bg-(--text-on-primary) text-primary border-(--text-on-primary) shadow-sm scale-95' : 'bg-[rgba(var(--text-on-primary-rgb),0.1)] text-(--text-on-primary) border-[rgba(var(--text-on-primary-rgb),0.2)] hover:border-(--text-on-primary) hover:bg-[rgba(var(--text-on-primary-rgb),0.2)]'}`}
                    >
                      {tag}
                    </button>
                  ))}
                  {allTags.length > 5 && (
                    <button
                      type="button"
                      onClick={() => setShowAllTags(o => !o)}
                      className={`text-[11px] font-bold px-3 py-1.5 rounded-full transition-all border cursor-pointer shrink-0 ${
                        showAllTags
                          ? 'bg-(--text-on-primary) text-primary border-(--text-on-primary)'
                          : 'text-(--text-on-primary) opacity-60 bg-[rgba(var(--text-on-primary-rgb),0.05)] border-transparent hover:opacity-100 hover:bg-[rgba(var(--text-on-primary-rgb),0.1)]'
                      }`}
                    >
                      {showAllTags ? `-${allTags.length - 5}` : `+${allTags.length - 5}`}
                    </button>
                  )}
                </>
              )}
              <div
                className="overflow-hidden transition-[max-height] duration-300 ease-out w-full"
                style={{ maxHeight: showAllTags ? 500 : 0 }}
              >
                <div className="flex flex-wrap items-center gap-2 pt-1.5">
                  {allTags.slice(5).map(tag => (
                    <button 
                      key={tag}
                      onClick={() => setSearchQuery(searchQuery === tag ? '' : tag)}
                      className={`text-[11px] font-bold px-3 py-1.5 rounded-full transition-all border ${searchQuery === tag ? 'bg-(--text-on-primary) text-primary border-(--text-on-primary) shadow-sm scale-95' : 'bg-[rgba(var(--text-on-primary-rgb),0.1)] text-(--text-on-primary) border-[rgba(var(--text-on-primary-rgb),0.2)] hover:border-(--text-on-primary) hover:bg-[rgba(var(--text-on-primary-rgb),0.2)]'}`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => { const completed = todos.filter(t => t.completed); if (completed.length > 0) deleteCompletedTodos(); }}
              className="flex min-h-11 items-center justify-center gap-2 px-4 py-2.5 rounded-full border text-sm font-bold transition-all shadow-sm backdrop-blur-sm bg-[rgba(var(--text-on-primary-rgb),0.1)] text-(--text-on-primary) border-[rgba(var(--text-on-primary-rgb),0.2)] hover:bg-[rgba(var(--text-on-primary-rgb),0.2)] portrait:w-full landscape:self-auto"
              title="Delete all completed tasks"
            >
              <CheckCheck size={16} />
              Clear done
            </button>
          </div>
        </div>
      </header>

      <div
        className="overflow-hidden transition-all duration-400 ease-[cubic-bezier(0.4,0,0.2,1)]"
        style={{
          maxHeight: showTaskTabs ? tabsPanelHeight || 500 : 0,
          opacity: showTaskTabs ? 1 : 0,
          transform: showTaskTabs ? 'scaleY(1) translateY(0)' : 'scaleY(0.95) translateY(-8px)',
          marginTop: showTaskTabs ? '-2rem' : '-2rem',
          marginBottom: showTaskTabs ? '0.5rem' : '0',
          pointerEvents: showTaskTabs ? 'auto' : 'none' as const,
        }}
        aria-hidden={!showTaskTabs}
      >
        <div ref={tabsPanelRef}>
        <div className="rounded-[2rem] border border-(--border-color) bg-(--card-bg) shadow-sm shadow-[var(--shadow-color)] p-2.5 sm:p-3 flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            {visibleTaskListTabs.map(tab => {
              const isListTab = tab.id.startsWith('list:');
              const listId = isListTab ? tab.id.split(':')[1] : null;
              const isActiveList = activeTaskList.id === tab.id;
              
              return (
                <div
                  key={tab.id}
                  className={`group flex max-w-full items-center gap-1 rounded-full border backdrop-blur-md transition-all duration-300 ease-out ${
                    isListTab
                      ? 'border-(--border-color) bg-(--bg-color)/70 px-1.5 py-1 shadow-sm'
                      : 'border-transparent bg-transparent'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setActiveTaskListId(tab.id)}
                    className={`flex min-h-9 min-w-0 max-w-full items-center gap-2 rounded-full px-3.5 py-2 text-sm font-bold transition-all shadow-none ${
                      isActiveList
                        ? 'bg-primary text-(--text-on-primary) shadow-sm'
                        : 'bg-transparent text-(--text-secondary) hover:bg-primary/10 hover:text-primary'
                    }`}
                  >
                    <span className="truncate">{tab.label}</span>
                    <span className={`shrink-0 text-[11px] leading-none px-2 py-1 rounded-full ${
                      isActiveList
                        ? 'bg-[rgba(var(--text-on-primary-rgb),0.18)] text-(--text-on-primary)'
                        : 'bg-primary/10 text-primary'
                    }`}>
                      {tab.count}
                    </span>
                  </button>
                  
                  {isListTab && listId && (
                    <div
                      className={`origin-left flex shrink-0 gap-1 overflow-hidden transition-[max-width,opacity,transform,margin] duration-300 ease-out ${
                        isActiveList
                          ? 'ml-0 max-w-20 opacity-100 scale-100 pointer-events-auto'
                          : '-ml-1 max-w-0 opacity-0 scale-90 pointer-events-none'
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
                title="Create a new task list"
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
      
      <div className={`flex-1 ${useStackedLandscapeLayout ? 'lg:flex lg:justify-center' : 'grid gap-6 lg:grid-cols-[0.9fr_1.1fr]'}`}>
        <div className={`flex flex-col gap-6 ${useStackedLandscapeLayout ? 'lg:w-[82%] lg:max-w-5xl' : ''}`}>
          <TaskEditor listId={activeListId} />

          <div className={`bg-(--card-bg) rounded-xl shadow-sm border border-(--border-color) p-4 md:p-6 overflow-hidden flex flex-col ${useStackedLandscapeLayout ? '' : 'lg:hidden'}`}>
            <h2 className="text-xl font-semibold mb-4">{activeTaskList.label} Tasks</h2>
            <div className="overflow-y-auto pr-2 -mr-2">
              <TodoList
                searchQuery={searchQuery}
                filter={filter}
                listId={activeListId}
                showUnlistedOnly={activeTaskListId === 'unlisted'}
              />
            </div>
          </div>
        </div>

        {!useStackedLandscapeLayout && (
        <div className="hidden lg:flex flex-col bg-(--card-bg) rounded-xl shadow-sm border border-(--border-color) p-4 md:p-6 overflow-hidden">
          <h2 className="text-xl font-semibold mb-4">{activeTaskList.label} Tasks</h2>
          <div className="overflow-y-auto pr-2 -mr-2">
            <TodoList
              searchQuery={searchQuery}
              filter={filter}
              listId={activeListId}
              showUnlistedOnly={activeTaskListId === 'unlisted'}
            />
          </div>
        </div>
        )}
      </div>
    </div>
  );
};

export default Home;
