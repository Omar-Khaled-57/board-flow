import { useMemo } from 'react';
import { Todo } from '../types';
import { useTodoStore } from '../store/useTodoStore';
import { useStatsStore } from '../store/useStatsStore';
import { Calendar, Tag as TagIcon, Flag, Trash2, CheckCircle2, Circle, GripVertical } from 'lucide-react';
import { formatTaskDate } from '../utils/dateFormat';
import { marked } from 'marked';
import clsx from 'clsx';
import { playCompleteSound } from '../utils/audio';

interface TaskItemProps {
  task: Todo;
  onDragStart?: (e: React.DragEvent, id: string) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent, id: string) => void;
  onDragEnd?: () => void;
  isDragging?: boolean;
}

const escapeHtml = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const TaskItem = ({ task, onDragStart, onDragOver, onDrop, onDragEnd, isDragging }: TaskItemProps) => {
  const toggleTodo = useTodoStore(state => state.toggleTodo);
  const deleteTodo = useTodoStore(state => state.deleteTodo);
  const settings = useTodoStore(state => state.settings);
  const incrementCompleted = useStatsStore(state => state.incrementCompletedToday);

  const handleToggle = () => {
    toggleTodo(task.id);
    if (!task.completed) {
      if (settings.soundEnabled) playCompleteSound();
      incrementCompleted();
    }
  };

  const markup = useMemo(() => {
    const safeText = escapeHtml(task.title);
    return { __html: marked(safeText, { gfm: true, breaks: true }) as string };
  }, [task.title]);

  return (
    <div 
      draggable
      onDragStart={(e) => onDragStart?.(e, task.id)}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop?.(e, task.id)}
      onDragEnd={onDragEnd}
      className={clsx(
      "group flex items-start gap-3 p-4 rounded-xl border transition-all duration-200",
      task.completed 
        ? "bg-gray-50/50 dark:bg-gray-800/20 border-transparent opacity-60" 
        : "bg-(--card-bg) border-(--border-color) hover:shadow-md hover:border-primary-light dark:hover:border-primary/50",
      isDragging ? "opacity-50 scale-[0.98] shadow-lg border-primary" : ""
    )}>
        <div className="mt-1.5 shrink-0 text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing md:opacity-0 md:group-hover:opacity-100 transition-opacity">
          <GripVertical size={16} />
        </div>
        <button onClick={handleToggle} aria-label={task.completed ? 'Mark task incomplete' : 'Mark task complete'} className="mt-1 shrink-0 text-gray-400 hover:text-success transition-colors">
          {task.completed ? <CheckCircle2 size={24} className="text-success" /> : <Circle size={24} />}
        </button>

      <div className="flex-1 min-w-0">
        <div 
          className={clsx(
            "prose prose-sm dark:prose-invert max-w-none wrap-break-word",
            task.completed && "line-through text-(--text-completed)"
          )}
          dangerouslySetInnerHTML={markup}
        />
        
        {/* Meta info row */}
        <div className="flex flex-wrap items-center gap-3 mt-2 text-xs">
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

      <div className="shrink-0 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
        <button 
          onClick={() => deleteTodo(task.id)}
          aria-label="Delete task"
          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
        >
          <Trash2 size={18} />
        </button>
      </div>

    </div>
  );
};

export default TaskItem;
