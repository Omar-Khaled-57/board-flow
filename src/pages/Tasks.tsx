import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import TaskEditor from '../components/TaskEditor';
import TodoList from '../components/TodoList';
import SortDropdown from '../components/SortDropdown';
import PageHeader from '../components/PageHeader';
import { FolderKanban, Search, Tag, Plus, Trash2, Edit2, CheckCheck, ArrowUp, ArrowDown } from 'lucide-react';
import { useTodoStore } from '../store/useTodoStore';
import { SortField } from '../types';

type TaskListTab = {
  id: string;
  label: string;
  count: number;
  showUnlistedOnly?: boolean;
};

const Tasks = () => {
  const todos = useTodoStore(state => state.todos);
  const lists = useTodoStore(state => state.lists);
  const addList = useTodoStore(state => state.addList);
  const deleteList = useTodoStore(state => state.deleteList);
  const renameList = useTodoStore(state => state.renameList);
  const deleteCompletedTodos = useTodoStore(state => state.deleteCompletedTodos);
  const settings = useTodoStore(state => state.settings);
  const updateSettings = useTodoStore(state => state.updateSettings);

  const allTags = useMemo(() => Array.from(new Set(todos.flatMap(t => t.tags))), [todos]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTagFilter, setActiveTagFilter] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [showTaskTabs, setShowTaskTabs] = useState(false);
  const [showAllTags, setShowAllTags] = useState(false);
  const [activeTaskListId, setActiveTaskListId] = useState<string>(settings.lastActiveListId || 'all');
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
      { id: 'all', label: 'All Tasks', count: todos.length },
      ...listTabs,
      { id: 'unlisted', label: 'No List', count: unlistedCount, showUnlistedOnly: true },
    ];
  }, [lists, todos]);

  useEffect(() => {
    if (showTaskTabs && tabsPanelRef.current) {
      setTabsPanelHeight(tabsPanelRef.current.scrollHeight);
    }
  }, [showTaskTabs, taskListTabs, editingListId, lists]);

  const activeTaskList = taskListTabs.find(tab => tab.id === activeTaskListId) ?? taskListTabs[0];
  const activeListId = activeTaskListId.startsWith('list:') ? activeTaskListId.split(':')[1] : undefined;
  const filterIndex = filter === 'active' ? 1 : filter === 'completed' ? 2 : 0;
  const useStackedLandscapeLayout = settings.landscapeStackedTasks ?? true;

  useEffect(() => {
    if (!taskListTabs.some(tab => tab.id === activeTaskListId)) {
      setActiveTaskListId('all');
    }
  }, [activeTaskListId, taskListTabs]);

  useEffect(() => {
    updateSettings({ lastActiveListId: activeTaskListId });
  }, [activeTaskListId]);

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

  const handleToggleTaskTabs = useCallback(() => {
    setShowTaskTabs(open => {
      if (open) setEditingListId(null);
      return !open;
    });
  }, []);

  const handleClearCompleted = useCallback(() => {
    const completed = todos.filter(t => t.completed);
    if (completed.length > 0) deleteCompletedTodos();
  }, [todos, deleteCompletedTodos]);

  return (
    <div className="h-full flex flex-col gap-6">
      <PageHeader title="Tasks" subtitle="From to-do to done, in one smooth flow">
        <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-[auto_minmax(12rem,1fr)] lg:grid-cols-[auto_minmax(14rem,1fr)_minmax(20rem,24rem)] lg:items-center">
          <button
            type="button"
            onClick={handleToggleTaskTabs}
            className={`flex min-h-11 items-center justify-center gap-2 px-4 py-2.5 rounded-full border text-sm font-bold transition-all shadow-sm backdrop-blur-sm ${
              showTaskTabs
                ? 'bg-(--text-on-primary) text-primary border-(--text-on-primary)'
                : 'bg-[rgba(var(--text-on-primary-rgb),0.1)] text-(--text-on-primary) border-[rgba(var(--text-on-primary-rgb),0.2)] hover:bg-[rgba(var(--text-on-primary-rgb),0.2)]'
            }`}
            aria-expanded={showTaskTabs}
          >
            <FolderKanban size={16} />
            <span>{taskListTabs.length} lists</span>
          </button>

          <div className="relative min-w-0">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 text-(--text-on-primary) opacity-60" size={16} />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="min-h-11 ps-9 pe-4 py-2.5 rounded-full bg-[rgba(var(--text-on-primary-rgb),0.1)] border border-[rgba(var(--text-on-primary-rgb),0.2)] text-(--text-on-primary) placeholder-[rgba(var(--text-on-primary-rgb),0.6)] text-sm focus:border-(--text-on-primary) focus:ring-2 focus:ring-[rgba(var(--text-on-primary-rgb),0.3)] outline-none w-full transition-all shadow-sm backdrop-blur-sm"
              aria-label="Search tasks"
              name="search"
            />
          </div>

          <div className="relative grid min-h-11 grid-cols-3 items-center gap-1 overflow-hidden bg-(--card-bg)/95 backdrop-blur-sm border border-[rgba(var(--text-on-primary-rgb),0.24)] rounded-full p-1 w-full shadow-sm sm:col-span-2 lg:col-span-1">
            <div
              className="absolute top-1 bottom-1 rounded-full bg-primary shadow-sm transition-[inset-inline-start] duration-300 ease-out"
              style={{
                insetInlineStart: `calc(0.25rem + ${filterIndex} * ((100% - 1rem) / 3 + 0.25rem))`,
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
                    onClick={() => setActiveTagFilter(activeTagFilter === tag ? '' : tag)}
                    className={`text-[11px] font-bold px-3 py-1.5 rounded-full transition-all border ${activeTagFilter === tag ? 'bg-(--text-on-primary) text-primary border-(--text-on-primary) shadow-sm scale-95' : 'bg-[rgba(var(--text-on-primary-rgb),0.1)] text-(--text-on-primary) border-[rgba(var(--text-on-primary-rgb),0.2)] hover:border-(--text-on-primary) hover:bg-[rgba(var(--text-on-primary-rgb),0.2)]'}`}
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
                    onClick={() => setActiveTagFilter(activeTagFilter === tag ? '' : tag)}
                    className={`text-[11px] font-bold px-3 py-1.5 rounded-full transition-all border ${activeTagFilter === tag ? 'bg-(--text-on-primary) text-primary border-(--text-on-primary) shadow-sm scale-95' : 'bg-[rgba(var(--text-on-primary-rgb),0.1)] text-(--text-on-primary) border-[rgba(var(--text-on-primary-rgb),0.2)] hover:border-(--text-on-primary) hover:bg-[rgba(var(--text-on-primary-rgb),0.2)]'}`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClearCompleted}
            className="flex min-h-11 items-center justify-center gap-2 px-4 py-2.5 rounded-full border text-sm font-bold transition-all shadow-sm backdrop-blur-sm bg-[rgba(var(--text-on-primary-rgb),0.1)] text-(--text-on-primary) border-[rgba(var(--text-on-primary-rgb),0.2)] hover:bg-[rgba(var(--text-on-primary-rgb),0.2)] portrait:w-full landscape:self-auto"
            title="Delete all completed tasks"
          >
            <CheckCheck size={16} />
            Clear done
          </button>
        </div>
      </PageHeader>

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
            {taskListTabs.map(tab => {
              const isListTab = tab.id.startsWith('list:');
              const listId = isListTab ? tab.id.split(':')[1] : null;
              const isActiveList = activeTaskList.id === tab.id;
              
              return (
                <div
                  key={tab.id}
                  className={`group flex max-w-full items-center gap-1 rounded-full border backdrop-blur-md transition-all duration-300 ease-out border-(--border-color) bg-(--bg-color)/70 px-1.5 py-1 shadow-sm`}
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
                title="Create a new task list"
                value={newListName}
                onChange={e => setNewListName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleAddList();
                }}
                className="min-h-9 min-w-0 flex-1 rounded-xl bg-(--bg-color) border border-(--border-color) px-3 py-2 text-sm text-(--text-primary) placeholder:text-(--text-secondary) focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-none"
                name="newList"
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
      
      <div className={`flex-1 ${useStackedLandscapeLayout ? 'lg:flex lg:justify-center' : 'grid gap-6 lg:grid-cols-[0.9fr_1.1fr]'}`}>
        <div className={`flex flex-col gap-6 ${useStackedLandscapeLayout ? 'lg:w-[82%] lg:max-w-5xl' : ''}`}>
          <TaskEditor listId={activeListId} />

          <div className={`bg-(--card-bg)/70 rounded-xl shadow-sm border border-(--border-color) p-4 md:p-6 flex flex-col ${useStackedLandscapeLayout ? '' : 'lg:hidden'}`}>
            <div className="flex items-center justify-between gap-3 mb-4">
              <h2 className="text-xl font-semibold truncate">{activeTaskList.label} Tasks</h2>
              <div className="flex items-center gap-1.5 shrink-0">
                <SortDropdown
                  value={settings.sortField}
                  onChange={v => updateSettings({ sortField: v as SortField })}
                  options={[
                    { value: 'custom', label: 'Custom' },
                    { value: 'date-added', label: 'Date Added' },
                    { value: 'name', label: 'Name' },
                    { value: 'due-date', label: 'Due Date' },
                    { value: 'priority', label: 'Priority' },
                    { value: 'tags', label: 'Tags' },
                  ]}
                />
                <button
                  onClick={() => updateSettings({ sortDirection: settings.sortDirection === 'asc' ? 'desc' : 'asc' })}
                  className="text-primary font-bold text-sm drop-shadow-[0_0_4px_var(--color-primary)] transition-all hover:opacity-80"
                  aria-label="Toggle sort direction"
                >
                  {settings.sortDirection === 'asc' ? <ArrowUp size={15} /> : <ArrowDown size={15} />}
                </button>
              </div>
            </div>
            <div className="overflow-y-auto ps-2 pt-3 pb-3 pe-2 -ms-2 -me-2">
              <TodoList
                searchQuery={searchQuery}
                filter={filter}
                tagFilter={activeTagFilter || undefined}
                listId={activeListId}
                showUnlistedOnly={activeTaskListId === 'unlisted'}
              />
            </div>
          </div>
        </div>

        {/* Landscape/desktop layout: stacked task list */}
        {!useStackedLandscapeLayout && (
        <div className="hidden lg:flex flex-col bg-(--card-bg) rounded-xl shadow-sm border border-(--border-color) p-4 md:p-6">
          <div className="flex items-center justify-between gap-3 mb-4">
            <h2 className="text-xl font-semibold truncate">{activeTaskList.label} Tasks</h2>
            <div className="flex items-center gap-1.5 shrink-0">
              <SortDropdown
                value={settings.sortField}
                onChange={v => updateSettings({ sortField: v as SortField })}
                options={[
                  { value: 'custom', label: 'Custom' },
                  { value: 'date-added', label: 'Date Added' },
                  { value: 'name', label: 'Name' },
                  { value: 'due-date', label: 'Due Date' },
                  { value: 'priority', label: 'Priority' },
                  { value: 'tags', label: 'Tags' },
                ]}
              />
              <button
                onClick={() => updateSettings({ sortDirection: settings.sortDirection === 'asc' ? 'desc' : 'asc' })}
                className="text-primary font-bold text-sm drop-shadow-[0_0_4px_var(--color-primary)] transition-all hover:opacity-80"
                aria-label="Toggle sort direction"
              >
                {settings.sortDirection === 'asc' ? <ArrowUp size={15} /> : <ArrowDown size={15} />}
              </button>
            </div>
          </div>
          <div className="overflow-y-auto ps-3 pt-3 pb-3 pe-2 -me-2">
            <TodoList
              searchQuery={searchQuery}
              filter={filter}
              tagFilter={activeTagFilter || undefined}
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

export default Tasks;
