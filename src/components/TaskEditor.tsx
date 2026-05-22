import React, { useState, useEffect, useMemo } from 'react';
import { PlusCircle, Calendar, Tag as TagIcon, Flag } from 'lucide-react';
import clsx from 'clsx';
import { useTodoStore } from '../store/useTodoStore';
import { parseTaskInput } from '../utils/nlp';
import { formatTaskDate } from '../utils/dateFormat';
import NLPGuide from './NLPGuide';

interface TaskEditorProps {
  listId?: string;
}

const TaskEditor = ({ listId }: TaskEditorProps) => {
  const [input, setInput] = useState('');
  const [debouncedInput, setDebouncedInput] = useState('');
  const addTodo = useTodoStore((state) => state.addTodo);

  // Debounce input for NLP parsing to improve performance
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedInput(input), 300);
    return () => clearTimeout(timer);
  }, [input]);

  const parsed = useMemo(() => parseTaskInput(debouncedInput), [debouncedInput]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalParsed = parseTaskInput(input); // Parse immediately on submit to capture exact state
    if (!finalParsed.title.trim()) return;

    addTodo({
      title: finalParsed.title,
      dueDate: finalParsed.dueDate,
      priority: finalParsed.priority,
      tags: finalParsed.tags,
      listId,
      completed: false,
      subtasks: [],
    });

    setInput('');
    setDebouncedInput('');
  };

  return (
    <form onSubmit={handleSubmit} className="relative group">
      <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
        <PlusCircle className="text-gray-400 group-focus-within:text-primary transition-colors" size={20} />
      </div>
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        className="w-full pl-12 pr-12 py-4 rounded-[2rem] bg-(--card-bg) border border-black dark:border-white shadow-[0_0_15px_var(--color-primary)] focus:shadow-[0_0_25px_var(--color-primary)] focus:border-primary outline-none transition-all text-lg placeholder:text-gray-400 dark:placeholder:text-gray-600"
        placeholder="Add a task... (e.g., 'Buy milk tomorrow !! #home')"
        aria-label="New task input"
      />
      
      <NLPGuide />

      {/* Smart Preview Area */}
      {debouncedInput.trim() && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-(--card-bg) border border-(--border-color) rounded-lg shadow-lg p-3 flex items-center gap-3 text-sm z-10 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex-1 font-medium truncate text-(--text-primary)">
            {parsed.title || '...'}
          </div>
          
          <div className="flex items-center gap-3 shrink-0">
            {parsed.dueDate && (
              <div className="flex items-center gap-1 text-(--color-primary) bg-(--color-primary-light) dark:text-[#64B5F6] dark:bg-[#64B5F6]/12 dark:border-[#64B5F6]/22 border border-transparent px-2 py-1 rounded-md">
                <Calendar size={14} />
                <span>{formatTaskDate(parsed.dueDate)}</span>
              </div>
            )}
            
            {parsed.tags.map(t => (
              <div key={t} className="flex items-center gap-1 tag-pill text-primary px-2 py-1 rounded-md">
                <TagIcon size={14} />
                <span>{t}</span>
              </div>
            ))}

            <div className={clsx(
              "flex items-center gap-1 px-2 py-1 rounded-md capitalize font-semibold border border-transparent",
              parsed.priority === 'high' ? "badge-danger dark:bg-[#EF5350]/12 dark:text-[#EF5350] dark:border-[#EF5350]/22" :
              parsed.priority === 'low' ? "badge-success dark:bg-[#66BB6A]/12 dark:text-[#66BB6A] dark:border-[#66BB6A]/22" :
              "text-gray-600 bg-gray-100 dark:text-[#FFAB00] dark:bg-[#FFAB00]/12 dark:border-[#FFAB00]/22"
            )}>
              <Flag size={12} />
              <span>{parsed.priority}</span>
            </div>
          </div>
        </div>
      )}
    </form>
  );
};

export default TaskEditor;
