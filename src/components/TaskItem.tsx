import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Todo, Priority } from '../types';
import { useTodoStore } from '../store/useTodoStore';
import { useStatsStore } from '../store/useStatsStore';
import { Calendar, Tag as TagIcon, Flag, Trash2, CheckCircle2, Circle, GripVertical, Edit2, X } from 'lucide-react';
import { formatTaskDate } from '../utils/dateFormat';
import { marked } from 'marked';
import clsx from 'clsx';
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
  const incrementCompleted = useStatsStore(state => state.incrementCompletedToday);
  const [isEditing, setIsEditing] = useState(false);
  const [editorInput, setEditorInput] = useState(task.title);
  const [editorTags, setEditorTags] = useState<string[]>(task.tags);
  const [tagInput, setTagInput] = useState('');
  const [editorPriority, setEditorPriority] = useState<Priority>(task.priority);
  const [editorDueDate, setEditorDueDate] = useState<number | undefined>(task.dueDate);
  const [dateInput, setDateInput] = useState(task.dueDate ? formatTaskDate(task.dueDate) : '');
  const [debouncedDateInput, setDebouncedDateInput] = useState('');
  const [isExiting, setIsExiting] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const editInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing) {
      editInputRef.current?.focus();
      setEditorTags(task.tags);
      setEditorPriority(task.priority);
      setEditorDueDate(task.dueDate);
      setDateInput(task.dueDate ? formatTaskDate(task.dueDate) : '');
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
          ? "bg-gray-50/50 dark:bg-gray-800/20 border-transparent"
          : "bg-(--card-bg) border-(--border-color) shadow-sm hover:shadow-md hover:border-primary-light dark:hover:border-primary/50",
        isDragging ? "opacity-50 scale-[0.98] shadow-lg border-primary" : "",
        isExiting ? "animate-task-exit" : "",
        isCompleting ? "opacity-60 scale-[0.98]" : "",
        (task.completed && !isCompleting) ? "opacity-60 scale-[0.98]" : ""
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
            (task.completed || isCompleting) && "opacity-40"
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
              <input
                type="text"
                value={dateInput}
                onChange={e => setDateInput(e.target.value)}
                placeholder="Set due date (e.g. tomorrow, 25/12/26)..."
                className="flex-1 min-w-[120px] rounded-lg border border-(--border-color) bg-(--bg-color) px-3 py-1.5 text-xs text-(--text-primary) outline-none focus:border-primary"
              />
              {parsedDate && (
                <span className="text-xs text-primary font-semibold whitespace-nowrap">
                  {formatTaskDate(parsedDate)}
                </span>
              )}
              {editorDueDate && (
                <button
                  type="button"
                  onClick={() => { setEditorDueDate(undefined); setDateInput(''); }}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                >
                  <X size={14} />
                </button>
              )}
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
                  <Flag size={12} className="mr-1 inline" />
                  {p}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {editorTags.map(tag => (
                <span key={tag} className="inline-flex items-center gap-1.5 tag-pill text-primary px-3 py-1.5 rounded-md text-sm font-semibold">
                  <TagIcon size={14} />
                  <span>{tag}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-red-500 transition-colors ml-0.5"
                  >
                    <X size={14} />
                  </button>
                </span>
              ))}
              <input
                type="text"
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') { e.preventDefault(); handleAddTag(); }
                }}
                placeholder="Add a tag..."
                className="flex-1 min-w-[100px] rounded-lg border border-(--border-color) bg-(--bg-color) px-3 py-1.5 text-xs text-(--text-primary) outline-none focus:border-primary"
              />
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

      <div className={clsx("shrink-0 flex items-center gap-1 transition-opacity", isEditing ? "hidden" : "opacity-100 md:opacity-0 md:group-hover:opacity-100")}>
        <button
          type="button"
          onClick={() => setIsEditing(open => !open)}
          aria-label="Edit task"
          className="grid min-h-10 w-10 place-items-center rounded-full text-gray-400 hover:text-primary hover:bg-(--bg-color) transition-colors"
        >
          <Edit2 size={16} />
        </button>
        <button
          type="button"
          onClick={handleDelete}
          aria-label="Delete task"
          className="grid min-h-10 w-10 place-items-center rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
        >
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  );
};

export default TaskItem;
