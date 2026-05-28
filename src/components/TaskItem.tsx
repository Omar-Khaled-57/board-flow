import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Calendar, Clock, Tag as TagIcon, Flag, Trash2, CheckCircle2, Circle, GripVertical, Edit2, X } from 'lucide-react';
import { marked } from 'marked';
import clsx from 'clsx';
import { Todo, Priority } from '../types';
import { useTodoStore } from '../store/useTodoStore';
import { useStatsStore } from '../store/useStatsStore';
import { formatTaskDate, formatTaskTime } from '../utils/dateFormat';
import { playCompleteSound } from '../utils/audio';
import { parseTaskInput } from '../utils/nlp';

interface TaskItemProps {
  task: Todo;
  isDragging?: boolean;
  onPointerDown?: (e: React.PointerEvent, id: string) => void;
}

const escapeHtml = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const TaskItem = ({ task, isDragging, onPointerDown }: TaskItemProps) => {
  const toggleTodo = useTodoStore(state => state.toggleTodo);
  const deleteTodo = useTodoStore(state => state.deleteTodo);
  const updateTodo = useTodoStore(state => state.updateTodo);
  const settings = useTodoStore(state => state.settings);
  const lists = useTodoStore(state => state.lists);
  const todos = useTodoStore(state => state.todos);
  const tagLibrary = useTodoStore(state => state.tags);
  const incrementCompleted = useStatsStore(state => state.incrementCompletedToday);
  const [isEditing, setIsEditing] = useState(false);
  const [editorInput, setEditorInput] = useState(task.title);
  const [editorTags, setEditorTags] = useState<string[]>(task.tags);
  const [tagInput, setTagInput] = useState('');
  const [editorPriority, setEditorPriority] = useState<Priority>(task.priority);
  const [editorDueDate, setEditorDueDate] = useState<number | undefined>(task.dueDate);
  const [editorListId, setEditorListId] = useState<string | undefined>(task.listId);
  const [dateInput, setDateInput] = useState(task.dueDate ? formatTaskDate(task.dueDate) : '');
  const [timeInput, setTimeInput] = useState(() => {
    if (!task.dueDate) return '';
    const d = new Date(task.dueDate);
    if (d.getHours() === 0 && d.getMinutes() === 0) return '';
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  });
  const [debouncedDateInput, setDebouncedDateInput] = useState('');
  const [isExiting, setIsExiting] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [calendarViewDate, setCalendarViewDate] = useState(() => {
    const d = task.dueDate ? new Date(task.dueDate) : new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [listDropdownOpen, setListDropdownOpen] = useState(false);

  const [tagSuggestionOpen, setTagSuggestionOpen] = useState(false);
  const [tagSuggestionIndex, setTagSuggestionIndex] = useState(-1);
  const [dateMenuOpen, setDateMenuOpen] = useState(false);
  const editInputRef = useRef<HTMLTextAreaElement>(null);
  const listDropdownRef = useRef<HTMLDivElement>(null);

  const tagSuggestionRef = useRef<HTMLDivElement>(null);
  const dateMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isEditing) {
      editInputRef.current?.focus();
      setEditorTags(task.tags);
      setEditorPriority(task.priority);
      setEditorDueDate(task.dueDate);
      setEditorListId(task.listId);
      setDateInput(task.dueDate ? formatTaskDate(task.dueDate) : '');
      setTimeInput(task.dueDate ? (() => {
        const d = new Date(task.dueDate);
        if (d.getHours() === 0 && d.getMinutes() === 0) return '';
        return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
      })() : '');
      setDebouncedDateInput('');
    }
  }, [isEditing]);

  useEffect(() => {
    if (!isEditing) {
      setEditorInput(task.title);
    }
  }, [task.title, isEditing]);

  useEffect(() => {
    if (editInputRef.current) {
      editInputRef.current.style.height = 'auto';
      editInputRef.current.style.height = editInputRef.current.scrollHeight + 'px';
    }
  }, [editorInput]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedDateInput(dateInput), 300);
    return () => clearTimeout(timer);
  }, [dateInput]);

  const parsedDate = useMemo(() => {
    if (!debouncedDateInput.trim()) return undefined;
    return parseTaskInput(debouncedDateInput).dueDate;
  }, [debouncedDateInput]);

  useEffect(() => {
    if (parsedDate) {
      setEditorDueDate(parsedDate);
    }
  }, [parsedDate]);

  useEffect(() => {
    if (!listDropdownOpen && !dateMenuOpen && !tagSuggestionOpen) return;
    const handler = (e: MouseEvent) => {
      if (listDropdownOpen && listDropdownRef.current && !listDropdownRef.current.contains(e.target as Node)) setListDropdownOpen(false);
      if (dateMenuOpen && dateMenuRef.current && !dateMenuRef.current.contains(e.target as Node)) setDateMenuOpen(false);
      if (tagSuggestionOpen && tagSuggestionRef.current && !tagSuggestionRef.current.contains(e.target as Node)) setTagSuggestionOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [listDropdownOpen, dateMenuOpen, tagSuggestionOpen]);

  const suggestionTags = useMemo(() => {
    const fromLibrary = new Set(tagLibrary.map(t => t.name));
    const fromTodos = new Set(todos.flatMap(t => t.tags));
    return Array.from(new Set([...fromLibrary, ...fromTodos])).sort();
  }, [tagLibrary, todos]);

  const filteredTagSuggestions = useMemo(() => {
    if (!tagInput.trim()) return [];
    return suggestionTags.filter(t => t.toLowerCase().includes(tagInput.toLowerCase()));
  }, [suggestionTags, tagInput]);

  const handleToggle = useCallback(() => {
    if (task.completed) {
      toggleTodo(task.id);
      return;
    }
    setIsCompleting(true);
    setTimeout(() => {
      toggleTodo(task.id);
      if (settings.soundEnabled) playCompleteSound();
      incrementCompleted();
      setIsCompleting(false);
    }, 500);
  }, [task.id, task.completed, toggleTodo, settings.soundEnabled, incrementCompleted]);

  const handleDelete = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => {
      deleteTodo(task.id);
    }, 300);
  }, [task.id, deleteTodo]);

  const handleSaveEdit = () => {
    const parsed = parseTaskInput(editorInput.trim());
    if (!parsed.title.trim()) return;
    updateTodo(task.id, {
      title: parsed.title,
      dueDate: editorDueDate,
      priority: editorPriority,
      tags: editorTags,
      listId: editorListId,
    });
    setIsEditing(false);
  };

  const handleAddTag = () => {
    const tag = tagInput.trim();
    if (tag && !editorTags.includes(tag)) {
      setEditorTags(prev => [...prev, tag]);
    }
    setTagInput('');
  };

  const handleRemoveTag = (tag: string) => {
    setEditorTags(prev => prev.filter(t => t !== tag));
  };

  const handleGripPointerDown = useCallback((e: React.PointerEvent) => {
    if (isEditing) return;
    e.preventDefault();
    onPointerDown?.(e, task.id);
  }, [isEditing, onPointerDown, task.id]);

  const markup = useMemo(() => {
    const safeText = escapeHtml(task.title);
    return { __html: marked(safeText, { gfm: true, breaks: true }) as string };
  }, [task.title]);

  return (
    <div
      data-taskid={task.id}
      className={clsx(
        "group flex items-start p-4 rounded-xl border transition-all duration-200 w-full",
        isEditing ? "gap-0" : "gap-3",
        !isEditing && "select-none",
        task.completed
          ? "bg-[#E7EBEF] dark:bg-[#1A1F26] border-transparent"
          : "bg-(--card-bg) border-(--border-color) shadow-sm hover:shadow-md hover:border-primary-light dark:hover:bg-[#252B33] dark:hover:shadow-[0_0_10px_var(--color-primary)] dark:hover:border-primary/50",
        isDragging ? "opacity-50 scale-[0.98] shadow-lg border-primary" : "",
        isExiting ? "animate-task-exit" : "",
        isCompleting ? "opacity-60 scale-[0.98]" : "",
        (task.completed && !isCompleting) ? "opacity-80 scale-[0.98]" : ""
      )}
    >
      {/* Drag handle — initiates pointer drag */}
      <div
        onPointerDown={handleGripPointerDown}
        className={clsx(
          "mt-1.5 text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing touch-none overflow-hidden shrink-0 flex items-center justify-center transition-all duration-200 ease-out",
          isEditing
            ? "w-0 opacity-0 scale-75 pointer-events-none"
            : "w-4 md:opacity-0 md:group-hover:opacity-100"
        )}
        title="Drag to reorder"
        aria-label="Drag to reorder"
      >
        <GripVertical size={16} />
      </div>

      <button
        onClick={handleToggle}
        aria-label={task.completed ? 'Mark task incomplete' : 'Mark task complete'}
        className={clsx(
          "mt-1 text-gray-400 hover:text-success overflow-hidden shrink-0 flex items-center justify-center transition-all duration-200 ease-out",
          isEditing
            ? "w-0 opacity-0 scale-75 pointer-events-none"
            : "w-6"
        )}
      >
        {task.completed ? <CheckCircle2 size={24} className="text-success" /> : <Circle size={24} />}
      </button>

      <div className="flex-1 min-w-0 overflow-hidden">
        {/* Content area with smooth cross-fade between view and edit modes */}
        <div
          className="transition-all duration-200 ease-out"
          style={{
            opacity: isEditing ? 0 : 1,
            transform: isEditing ? 'translateY(-4px)' : 'translateY(0)',
            position: isEditing ? 'absolute' : 'relative',
            pointerEvents: isEditing ? 'none' : 'auto',
          }}
        >
          {/* View mode */}
          <div
            className={clsx(
              "prose prose-sm dark:prose-invert max-w-full break-words [word-break:break-word] transition-all duration-500",
              (task.completed || isCompleting) && "line-through text-(--text-completed)"
            )}
            dangerouslySetInnerHTML={markup}
          />
          {/* Meta info row */}
          <div className={clsx(
            "flex flex-wrap items-center gap-3 mt-2 text-xs transition-all duration-500",
            (task.completed || isCompleting) && "opacity-60"
          )}>
             {task.dueDate && (
              <div className={clsx(
                "flex items-center gap-1 px-2 py-1 rounded-md font-semibold border border-transparent",
                task.dueDate < Date.now() && !task.completed
                  ? "badge-danger dark:text-[#64B5F6] dark:bg-[#64B5F6]/12 dark:border-[#64B5F6]/22"
                  : "badge-info dark:text-[#64B5F6] dark:bg-[#64B5F6]/12 dark:border-[#64B5F6]/22"
              )}>
                <Calendar size={12} />
                <span>{formatTaskDate(task.dueDate)}</span>
              </div>
            )}
            {formatTaskTime(task.dueDate) && (
              <div className="flex items-center gap-1 px-2 py-1 rounded-md font-semibold border border-transparent badge-info dark:text-[#64B5F6] dark:bg-[#64B5F6]/12 dark:border-[#64B5F6]/22">
                <Clock size={12} className="text-primary" />
                <span>{formatTaskTime(task.dueDate)}</span>
              </div>
            )}
            {task.priority !== 'medium' && (
              <div className={clsx(
                "flex items-center gap-1 px-2 py-1 rounded-md capitalize font-semibold border border-transparent",
                task.priority === 'high'
                  ? "badge-danger dark:bg-[#EF5350]/12 dark:text-[#EF5350] dark:border-[#EF5350]/22"
                  : "badge-success dark:bg-[#66BB6A]/12 dark:text-[#66BB6A] dark:border-[#66BB6A]/22"
              )}>
                <Flag size={12} />
                <span>{task.priority}</span>
              </div>
            )}
            {task.tags.map(t => (
              <div key={t} className="flex items-center gap-1 text-primary tag-pill px-2 py-1 rounded-md">
                <TagIcon size={12} />
                <span>{t}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Edit mode */}
        <div
          className="transition-all duration-200 ease-out"
          style={{
            opacity: isEditing ? 1 : 0,
            transform: isEditing ? 'translateY(0)' : 'translateY(4px)',
            position: isEditing ? 'relative' : 'absolute',
            pointerEvents: isEditing ? 'auto' : 'none',
          }}
        >
          <div className="space-y-3">
            <textarea
              ref={editInputRef}
              value={editorInput}
              onChange={(e) => setEditorInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveEdit();
                if (e.key === 'Escape') setIsEditing(false);
              }}
              rows={1}
              className="w-full rounded-[2rem] border border-(--border-color) bg-(--card-bg) px-4 py-3 text-sm text-(--text-primary) outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none overflow-hidden"
              aria-label="Edit task text"
            />

            <div className="flex flex-wrap items-center gap-2">
              <div ref={dateMenuRef} className="flex flex-col gap-1">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setDateMenuOpen(o => !o)}
                    className="p-1.5 rounded-lg text-primary hover:bg-primary/10 transition-colors"
                    aria-label="Open calendar"
                  >
                    <Calendar size={16} className="text-primary" />
                  </button>
                  <input
                type="text"
                value={dateInput}
                onChange={e => setDateInput(e.target.value)}
                placeholder="Set due date..."
                className="flex-1 min-w-[80px] rounded-lg border border-(--border-color) bg-(--bg-color) px-3 py-1.5 text-xs text-(--text-primary) outline-none focus:border-primary"
              />
              <input
                type="time"
                value={timeInput}
                onChange={e => {
                  setTimeInput(e.target.value);
                  if (e.target.value && editorDueDate) {
                    const [h, m] = e.target.value.split(':').map(Number);
                    const d = new Date(editorDueDate);
                    d.setHours(h, m, 0, 0);
                    setEditorDueDate(d.getTime());
                  } else if (e.target.value && !editorDueDate) {
                    const [h, m] = e.target.value.split(':').map(Number);
                    const d = new Date();
                    d.setHours(h, m, 0, 0);
                    setEditorDueDate(d.getTime());
                    setDateInput(formatTaskDate(d.getTime()));
                  }
                }}
                className="w-28 rounded-lg border border-(--border-color) bg-(--bg-color) px-3 py-1.5 text-xs text-(--text-primary) outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 [accent-color:var(--color-primary)] [&::-webkit-calendar-picker-indicator]:opacity-60 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:hover:opacity-100"
              />
              {parsedDate && (
                <span className="text-xs text-primary font-semibold whitespace-nowrap">
                  {formatTaskDate(parsedDate)}
                  {formatTaskTime(parsedDate) && <span className="ms-1.5">{formatTaskTime(parsedDate)}</span>}
                </span>
              )}
              {editorDueDate && (
                <button
                  type="button"
                  onClick={() => { setEditorDueDate(undefined); setDateInput(''); setTimeInput(''); }}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                >
                  <X size={14} />
                </button>
              )}
            </div>
              <div className={`overflow-hidden transition-all duration-300 ${
                dateMenuOpen ? 'max-h-[280px] opacity-100' : 'max-h-0 opacity-0'
              }`}>
                <div className="w-[240px] bg-(--card-bg) border border-(--border-color) rounded-xl shadow-lg shadow-[var(--shadow-color)] p-3">
                  <div className="flex items-center justify-between mb-2">
                    <button
                      type="button"
                      onMouseDown={() => setCalendarViewDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
                      className="p-1 rounded-md text-(--text-secondary) hover:text-primary hover:bg-(--bg-color) transition-colors"
                    >
                      <svg className="size-4 fill-current" viewBox="0 0 20 20"><path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.83 10l3.94 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z"/></svg>
                    </button>
                    <span className="text-sm font-bold text-(--text-primary)">
                      {calendarViewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </span>
                    <button
                      type="button"
                      onMouseDown={() => setCalendarViewDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
                      className="p-1 rounded-md text-(--text-secondary) hover:text-primary hover:bg-(--bg-color) transition-colors"
                    >
                      <svg className="size-4 fill-current" viewBox="0 0 20 20"><path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.17 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"/></svg>
                    </button>
                  </div>
                  <div className="grid grid-cols-7 gap-0.5 text-center text-xs font-semibold text-(--text-secondary) mb-1">
                    {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => <div key={d} className="py-1">{d}</div>)}
                  </div>
                  <div className="grid grid-cols-7 gap-0.5 text-center text-xs">
                    {(() => {
                      const year = calendarViewDate.getFullYear();
                      const month = calendarViewDate.getMonth();
                      const firstDay = new Date(year, month, 1).getDay();
                      const daysInMonth = new Date(year, month + 1, 0).getDate();
                      const today = new Date();
                      const todayStr = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;
                      const cells: React.ReactNode[] = [];
                      for (let i = 0; i < firstDay; i++) cells.push(<div key={`e${i}`} />);
                      for (let d = 1; d <= daysInMonth; d++) {
                        const date = new Date(year, month, d);
                        const ts = date.getTime();
                        const dateStr = `${year}-${month}-${d}`;
                        const isToday = dateStr === todayStr;
                        const isSelected = editorDueDate && new Date(editorDueDate).toDateString() === date.toDateString();
                        cells.push(
                          <button
                            key={d}
                            type="button"
                            onMouseDown={() => { setEditorDueDate(ts); setDateInput(formatTaskDate(ts)); setDateMenuOpen(false); }}
                            className={`w-full py-1.5 rounded-lg font-medium transition-colors ${
                              isSelected
                                ? 'bg-primary text-(--text-on-primary)'
                                : isToday
                                  ? 'bg-primary/10 text-primary font-bold'
                                  : 'text-(--text-primary) hover:bg-(--bg-color)'
                            }`}
                          >
                            {d}
                          </button>
                        );
                      }
                      return cells;
                    })()}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <label className="text-xs font-medium text-(--text-secondary)">List:</label>
              <div className="relative flex-1 min-w-[100px]" ref={listDropdownRef}>
                <button
                  type="button"
                  onClick={() => setListDropdownOpen(o => !o)}
                  className="w-full flex items-center justify-between gap-1 rounded-lg border border-(--border-color) bg-(--bg-color) px-3 py-1.5 text-xs text-(--text-primary) outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 cursor-pointer"
                >
                  <span className={editorListId ? '' : 'opacity-50'}>
                    {editorListId ? lists.find(l => l.id === editorListId)?.name || 'Unnamed' : 'No list'}
                  </span>
                  <svg className={`size-3 fill-current text-(--text-secondary) transition-transform duration-200 ${listDropdownOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20"><path d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z"/></svg>
                </button>
                <div
                  className={`absolute start-0 top-full mt-1 w-full min-w-[120px] bg-(--card-bg) border border-(--border-color) rounded-xl shadow-lg shadow-[var(--shadow-color)] p-1 z-50 origin-inline-end transition-all duration-200 ${
                    listDropdownOpen
                      ? 'opacity-100 scale-100 visible pointer-events-auto'
                      : 'opacity-0 scale-95 invisible pointer-events-none'
                  } overflow-hidden`}
                >
                  <button
                    type="button"
                    onMouseDown={() => { setEditorListId(undefined); setListDropdownOpen(false); }}
                    className={`w-full text-start px-3 py-1.5 text-sm rounded-lg transition-colors ${
                      !editorListId
                        ? 'bg-primary/15 text-primary font-bold'
                        : 'text-(--text-primary) hover:bg-(--bg-color)'
                    }`}
                  >
                    No list
                  </button>
                  {lists.map(list => (
                    <button
                      key={list.id}
                      type="button"
                      onMouseDown={() => { setEditorListId(list.id); setListDropdownOpen(false); }}
                      className={`w-full text-start px-3 py-1.5 text-sm rounded-lg transition-colors ${
                        editorListId === list.id
                          ? 'bg-primary/15 text-primary font-bold'
                          : 'text-(--text-primary) hover:bg-(--bg-color)'
                      }`}
                    >
                      {list.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 px-0.5 landscape:flex-nowrap landscape:justify-start">
              {(['high', 'medium', 'low'] as Priority[]).map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setEditorPriority(p)}
                  className={clsx(
                    "flex-1 landscape:flex-none px-3 py-1.5 rounded-md text-xs font-semibold capitalize transition-all",
                    editorPriority === p
                      ? p === 'high' ? 'badge-danger dark:bg-[#EF5350]/12 dark:text-[#EF5350] ring-2 ring-red-500/40'
                        : p === 'low' ? 'badge-success dark:bg-[#66BB6A]/12 dark:text-[#66BB6A] ring-2 ring-green-500/40'
                        : 'bg-gray-300 text-gray-900 dark:text-[#FFAB00] dark:bg-[#FFAB00]/12 ring-2 ring-gray-500/40'
                      : 'text-gray-500 bg-gray-100 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                  )}
                >
                  <Flag size={12} className="me-1 inline" />
                  {p}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2 relative" ref={tagSuggestionRef}>
              {editorTags.map(tag => (
                <span key={tag} className="inline-flex items-center gap-1.5 tag-pill text-primary px-3 py-1.5 rounded-md text-sm font-semibold">
                  <TagIcon size={14} />
                  <span>{tag}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-red-500 transition-colors ms-0.5"
                  >
                    <X size={14} />
                  </button>
                </span>
              ))}
              <div className="relative flex-1 min-w-[100px]">
                <input
                  type="text"
                  value={tagInput}
                  onChange={e => { setTagInput(e.target.value); setTagSuggestionOpen(true); setTagSuggestionIndex(-1); }}
                  onKeyDown={e => {
                    if (tagSuggestionOpen && filteredTagSuggestions.length > 0) {
                      if (e.key === 'ArrowDown') { e.preventDefault(); setTagSuggestionIndex(i => Math.min(i + 1, filteredTagSuggestions.length - 1)); return; }
                      if (e.key === 'ArrowUp') { e.preventDefault(); setTagSuggestionIndex(i => Math.max(i - 1, 0)); return; }
                      if (e.key === 'Enter' && tagSuggestionIndex >= 0) { e.preventDefault(); const t = filteredTagSuggestions[tagSuggestionIndex]; if (!editorTags.includes(t)) setEditorTags(prev => [...prev, t]); setTagInput(''); setTagSuggestionOpen(false); setTagSuggestionIndex(-1); return; }
                      if (e.key === 'Escape') { setTagSuggestionOpen(false); setTagSuggestionIndex(-1); return; }
                    }
                    if (e.key === 'Enter') { e.preventDefault(); handleAddTag(); }
                  }}
                  onFocus={() => tagInput.trim() && setTagSuggestionOpen(true)}
                  placeholder="Add a tag..."
                  className="w-full rounded-lg border border-(--border-color) bg-(--bg-color) px-3 py-1.5 text-xs text-(--text-primary) outline-none focus:border-primary"
                />
                {tagSuggestionOpen && filteredTagSuggestions.length > 0 && (
                  <div className="absolute start-0 bottom-full mb-1 w-full min-w-[120px] bg-(--card-bg) border border-(--border-color) rounded-xl shadow-lg shadow-[var(--shadow-color)] p-1 z-50 origin-inline-start transition-all duration-200 overflow-hidden">
                    {filteredTagSuggestions.map((tag, i) => (
                      <button
                        key={tag}
                        type="button"
                        onMouseDown={() => { if (!editorTags.includes(tag)) setEditorTags(prev => [...prev, tag]); setTagInput(''); setTagSuggestionOpen(false); setTagSuggestionIndex(-1); }}
                        onMouseEnter={() => setTagSuggestionIndex(i)}
                        className={`w-full text-start px-3 py-1.5 text-sm rounded-lg transition-colors ${
                          i === tagSuggestionIndex
                            ? 'bg-primary/15 text-primary font-bold'
                            : 'text-(--text-primary) hover:bg-(--bg-color)'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 landscape:justify-start">
              <button
                type="button"
                onClick={handleSaveEdit}
                className="flex-1 landscape:flex-none inline-flex items-center justify-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-(--text-on-primary) transition hover:bg-primary-hover"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="flex-1 landscape:flex-none inline-flex items-center justify-center gap-2 rounded-full border border-(--border-color) bg-(--bg-color) px-4 py-2 text-sm text-(--text-primary) transition hover:bg-(--card-bg)"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                aria-label="Delete task"
                className="flex-1 landscape:flex-none inline-flex items-center justify-center gap-2 rounded-full border border-(--border-color) bg-(--bg-color) px-4 py-2 text-sm text-red-500 transition hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <Trash2 size={16} />
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>

      {(!settings.hideEditInTasks || !settings.hideDeleteInTasks) && (
        <div className={clsx("shrink-0 flex items-center gap-1 transition-opacity", isEditing ? "hidden" : "opacity-100 md:opacity-0 md:group-hover:opacity-100", settings.verticalActionButtons && "flex-col")}>
          {!settings.hideEditInTasks && (
            <button
              type="button"
              onClick={() => setIsEditing(open => !open)}
              aria-label="Edit task"
              className="grid min-h-10 w-10 place-items-center rounded-full text-gray-400 hover:text-primary hover:bg-(--bg-color) transition-colors"
            >
              <Edit2 size={16} />
            </button>
          )}
          {!settings.hideDeleteInTasks && (
            <button
              type="button"
              onClick={handleDelete}
              aria-label="Delete task"
              className="grid min-h-10 w-10 place-items-center rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <Trash2 size={18} />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default TaskItem;
