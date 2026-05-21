import React, { useState, useEffect } from 'react';
import { PlusCircle, Calendar, Tag as TagIcon, Flag } from 'lucide-react';
import { useTodoStore } from '../store/useTodoStore';
import { parseTaskInput } from '../utils/nlp';
import { format } from 'date-fns';
import NLPGuide from './NLPGuide';

const TaskEditor = () => {
  const [input, setInput] = useState('');
  const [debouncedInput, setDebouncedInput] = useState('');
  const addTodo = useTodoStore((state) => state.addTodo);

  // Debounce input for NLP parsing to improve performance
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedInput(input), 300);
    return () => clearTimeout(timer);
  }, [input]);

  // We parse continuously based on debounced input
  const parsed = parseTaskInput(debouncedInput);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalParsed = parseTaskInput(input); // Parse immediately on submit to capture exact state
    if (!finalParsed.title.trim()) return;

    addTodo({
      title: finalParsed.title,
      dueDate: finalParsed.dueDate,
      priority: finalParsed.priority,
      tags: finalParsed.tags,
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
        className="w-full pl-12 pr-12 py-4 rounded-xl bg-[var(--card-bg)] border-2 border-[var(--border-color)] focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary-light)] outline-none transition-all shadow-sm text-lg placeholder:text-gray-400 dark:placeholder:text-gray-600"
        placeholder="Add a task... (e.g., 'Buy milk tomorrow !! #home')"
      />
      
      <NLPGuide />

      {/* Smart Preview Area */}
      {debouncedInput.trim() && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg shadow-lg p-3 flex items-center gap-3 text-sm z-10 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex-1 font-medium truncate text-[var(--text-primary)]">
            {parsed.title || '...'}
          </div>
          
          <div className="flex items-center gap-3 shrink-0">
            {parsed.dueDate && (
              <div className="flex items-center gap-1 text-[var(--color-primary)] bg-[var(--color-primary-light)] dark:bg-primary/20 px-2 py-1 rounded-md">
                <Calendar size={14} />
                <span>{format(parsed.dueDate, 'MMM d, h:mm a')}</span>
              </div>
            )}
            
            {parsed.tags.map(t => (
              <div key={t} className="flex items-center gap-1 text-purple-600 bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400 px-2 py-1 rounded-md">
                <TagIcon size={14} />
                <span>{t}</span>
              </div>
            ))}

            <div className={`flex items-center gap-1 px-2 py-1 rounded-md ${
              parsed.priority === 'high' ? 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400' :
              parsed.priority === 'low' ? 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400' :
              'text-gray-600 bg-gray-100 dark:bg-gray-800 dark:text-gray-300'
            }`}>
              <Flag size={14} />
              <span className="capitalize">{parsed.priority}</span>
            </div>
          </div>
        </div>
      )}
    </form>
  );
};

export default TaskEditor;
