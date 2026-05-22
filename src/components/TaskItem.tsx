import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Todo } from '../types';
import { useTodoStore } from '../store/useTodoStore';
import { useStatsStore } from '../store/useStatsStore';
import { Calendar, Tag as TagIcon, Flag, Trash2, CheckCircle2, Circle, GripVertical, Edit2 } from 'lucide-react';
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
  const [isExiting, setIsExiting] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing) {
      editInputRef.current?.focus();
    }
  }, [isEditing]);

  useEffect(() => {
    if (!isEditing) {
      setEditorInput(task.title);
    }
  }, [task.title, isEditing]);

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
      dueDate: parsed.dueDate,
      priority: parsed.priority,
      tags: parsed.tags,
    });
    setIsEditing(false);
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
        "group flex items-start gap-3 p-4 rounded-xl border transition-all duration-200",
        !isEditing && "select-none",
        task.completed
          ? "bg-gray-50/50 dark:bg-gray-800/20 border-transparent"
          : "bg-(--card-bg) border-(--border-color) hover:shadow-md hover:border-primary-light dark:hover:border-primary/50",
        isDragging ? "opacity-50 scale-[0.98] shadow-lg border-primary" : "",
        isExiting ? "animate-task-exit" : "",
        isCompleting ? "opacity-60 scale-[0.98]" : "",
        (task.completed && !isCompleting) ? "opacity-60 scale-[0.98]" : ""
      )}
    >
      {/* Drag handle — initiates pointer drag */}
      <div
        onPointerDown={handleGripPointerDown}
        className="mt-1.5 shrink-0 text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing md:opacity-0 md:group-hover:opacity-100 transition-opacity touch-none"
        title="Drag to reorder"
      >
        <GripVertical size={16} />
      </div>

      <button onClick={handleToggle} aria-label={task.completed ? 'Mark task incomplete' : 'Mark task complete'} className="mt-1 shrink-0 text-gray-400 hover:text-success transition-colors">
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
              "prose prose-sm dark:prose-invert max-w-none wrap-break-word transition-all duration-500",
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
                "flex items-center gap-1 px-2 py-1 rounded-md",
                task.dueDate < Date.now() && !task.completed
                  ? "text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400"
                  : "text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400"
              )}>
                <Calendar size={12} />
                <span>{formatTaskDate(task.dueDate)}</span>
              </div>
            )}
            {task.priority !== 'medium' && (
              <div className={clsx(
                "flex items-center gap-1 px-2 py-1 rounded-md capitalize",
                task.priority === 'high' ? 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400' : 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400'
              )}>
                <Flag size={12} />
                <span>{task.priority}</span>
              </div>
            )}
            {task.tags.map(t => (
              <div key={t} className="flex items-center gap-1 text-purple-600 bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400 px-2 py-1 rounded-md">
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
              <input
              ref={editInputRef}
              type="text"
              value={editorInput}
              onChange={(e) => setEditorInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveEdit();
                if (e.key === 'Escape') setIsEditing(false);
              }}
              className="w-full rounded-2xl border border-(--border-color) bg-(--card-bg) px-4 py-3 text-sm text-(--text-primary) outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
              aria-label="Edit task text"
            />
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleSaveEdit}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-(--text-on-primary) transition hover:bg-primary-hover"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="inline-flex items-center gap-2 rounded-full border border-(--border-color) bg-(--bg-color) px-4 py-2 text-sm text-(--text-primary) transition hover:bg-(--card-bg)"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="shrink-0 flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
        <button
          type="button"
          onClick={() => setIsEditing(open => !open)}
          aria-label={isEditing ? 'Cancel edit' : 'Edit task'}
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
