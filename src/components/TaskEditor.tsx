import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { PlusCircle, Calendar, Clock, Tag as TagIcon, Flag } from 'lucide-react';
import clsx from 'clsx';
import { useTodoStore } from '../store/useTodoStore';
import { parseTaskInput } from '../utils/nlp';
import { formatTaskDate, formatTaskTime } from '../utils/dateFormat';
import NLPGuide from './NLPGuide';

interface TaskEditorProps {
  listId?: string;
}

const TaskEditor = ({ listId }: TaskEditorProps) => {
  const [input, setInput] = useState('');
  const [debouncedInput, setDebouncedInput] = useState('');
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [suggestionIndex, setSuggestionIndex] = useState(0);
  const [tagPrefix, setTagPrefix] = useState('');
  const addTodo = useTodoStore((state) => state.addTodo);
  const tagLibrary = useTodoStore((state) => state.tags);
  const todos = useTodoStore((state) => state.todos);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounce input for NLP parsing to improve performance
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedInput(input), 300);
    return () => clearTimeout(timer);
  }, [input]);

  const parsed = useMemo(() => parseTaskInput(debouncedInput), [debouncedInput]);

  // Detect #tag being typed and show suggestions
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInput(value);

    const cursorPos = e.target.selectionStart ?? value.length;
    const beforeCursor = value.slice(0, cursorPos);
    const hashIdx = beforeCursor.lastIndexOf('#');

    if (hashIdx !== -1) {
      const afterHash = beforeCursor.slice(hashIdx + 1);
      // Only suggest if there are no spaces after the # (single tag being typed)
      if (afterHash.indexOf(' ') === -1 && afterHash.length > 0) {
        setTagPrefix(afterHash.toLowerCase());
        setSuggestionsOpen(true);
        setSuggestionIndex(0);
        return;
      }
    }
    setSuggestionsOpen(false);
  }, []);

  const suggestionTags = useMemo(() => {
    const fromLibrary = new Set(tagLibrary.map(t => t.name));
    const fromTodos = new Set(todos.flatMap(t => t.tags));
    const all = new Set([...fromLibrary, ...fromTodos]);
    return Array.from(all).sort();
  }, [tagLibrary, todos]);

  const filteredSuggestions = useMemo(() => {
    if (!suggestionsOpen || !tagPrefix) return [];
    return suggestionTags.filter(t => t.toLowerCase().startsWith(tagPrefix));
  }, [suggestionTags, tagPrefix, suggestionsOpen]);

  const insertSuggestion = useCallback((tagName: string) => {
    const cursorPos = inputRef.current?.selectionStart ?? input.length;
    const beforeCursor = input.slice(0, cursorPos);
    const hashIdx = beforeCursor.lastIndexOf('#');
    if (hashIdx === -1) return;

    const afterHash = beforeCursor.slice(hashIdx + 1);
    const wordEnd = afterHash.search(/\s/);
    const replaceLen = wordEnd === -1 ? afterHash.length : wordEnd;

    const newInput = 
      input.slice(0, hashIdx + 1) + 
      tagName + 
      input.slice(hashIdx + 1 + replaceLen);
    setInput(newInput);
    setSuggestionsOpen(false);
    inputRef.current?.focus();
  }, [input]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!suggestionsOpen || filteredSuggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSuggestionIndex(i => Math.min(i + 1, filteredSuggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSuggestionIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      if (suggestionIndex >= 0 && suggestionIndex < filteredSuggestions.length) {
        e.preventDefault();
        insertSuggestion(filteredSuggestions[suggestionIndex]);
      }
    } else if (e.key === 'Escape') {
      setSuggestionsOpen(false);
    }
  }, [suggestionsOpen, filteredSuggestions, suggestionIndex, insertSuggestion]);

  // Close suggestions on click outside
  useEffect(() => {
    if (!suggestionsOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(e.target as Node)) {
        setSuggestionsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [suggestionsOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalParsed = parseTaskInput(input);
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
    setSuggestionsOpen(false);
  };

  return (
    <form onSubmit={handleSubmit} className="relative group">
      <div className="absolute inset-y-0 start-4 flex items-center pointer-events-none">
        <PlusCircle className="text-gray-400 group-focus-within:text-primary transition-colors" size={20} />
      </div>
      <input
        ref={inputRef}
        type="text"
        value={input}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        className="w-full ps-12 pe-12 py-4 rounded-[2rem] bg-(--card-bg) border border-black dark:border-white shadow-[0_0_15px_var(--color-primary)] focus:shadow-[0_0_25px_var(--color-primary)] focus:border-primary outline-none transition-all text-lg placeholder:text-gray-400 dark:placeholder:text-gray-600"
        placeholder="Add a task... (e.g., 'Buy milk tomorrow !! #tasks')"
        aria-label="New task input"
      />
      
      <NLPGuide />

      {/* Tag suggestions dropdown — above input to avoid preview overlap */}
      {suggestionsOpen && filteredSuggestions.length > 0 && (
        <div className="absolute bottom-full inset-inline-0 mb-2 bg-(--card-bg) border border-(--border-color) rounded-lg shadow-lg z-20 max-h-40 overflow-y-auto animate-in fade-in slide-in-from-bottom-2 duration-200">
          {filteredSuggestions.map((tag, i) => (
            <button
              key={tag}
              type="button"
              onPointerDown={(e) => { e.preventDefault(); insertSuggestion(tag); }}
              onMouseEnter={() => setSuggestionIndex(i)}
              className={`w-full flex items-center gap-2 px-4 py-2 text-sm text-start transition-colors ${
                i === suggestionIndex ? 'bg-primary/10 text-primary' : 'text-(--text-primary) hover:bg-(--bg-color)'
              }`}
            >
              <span className="size-2.5 rounded-full shrink-0 bg-primary/40" />
              <span className="font-medium">#{tag}</span>
            </button>
          ))}
        </div>
      )}

      {/* Smart Preview Area */}
      {debouncedInput.trim() && (
        <div className="absolute top-full inset-inline-0 mt-2 bg-(--card-bg) border border-(--border-color) rounded-lg shadow-lg p-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm z-10 overflow-hidden min-w-0 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex-1 font-medium truncate text-(--text-primary) min-w-[6rem]">
            {parsed.title || '...'}
          </div>
          
          <div className="flex items-center gap-2 min-w-0 max-w-full overflow-hidden flex-wrap">
            {parsed.dueDate && (
              <div className="flex items-center gap-1 text-(--color-primary) bg-(--color-primary-light) dark:text-[#64B5F6] dark:bg-[#64B5F6]/12 dark:border-[#64B5F6]/22 border border-transparent px-2 py-1 rounded-md max-w-[140px] truncate shrink-0">
                <Calendar size={14} className="shrink-0" />
                <span className="truncate">{formatTaskDate(parsed.dueDate)}</span>
              </div>
            )}
            {parsed.dueDate && formatTaskTime(parsed.dueDate) && (
              <div className="flex items-center gap-1 text-(--color-primary) bg-(--color-primary-light) dark:text-[#64B5F6] dark:bg-[#64B5F6]/12 dark:border-[#64B5F6]/22 border border-transparent px-2 py-1 rounded-md max-w-[120px] truncate shrink-0">
                <Clock size={14} className="shrink-0" />
                <span className="truncate">{formatTaskTime(parsed.dueDate)}</span>
              </div>
            )}
            
            {parsed.tags.map(t => (
              <div key={t} className="flex items-center gap-1 tag-pill text-primary px-2 py-1 rounded-md max-w-[160px] shrink-0">
                <TagIcon size={14} className="shrink-0" />
                <span className={/[-_]/.test(t) ? 'min-w-0 [overflow-wrap:anywhere]' : 'truncate'}>{t}</span>
              </div>
            ))}

            <div className={clsx(
              "flex items-center gap-1 px-2 py-1 rounded-md capitalize font-semibold border border-transparent shrink-0 max-w-[100px] truncate",
              parsed.priority === 'high' ? "badge-danger dark:bg-[#EF5350]/12 dark:text-[#EF5350] dark:border-[#EF5350]/22" :
              parsed.priority === 'low' ? "badge-success dark:bg-[#66BB6A]/12 dark:text-[#66BB6A] dark:border-[#66BB6A]/22" :
              "text-gray-600 bg-gray-100 dark:text-[#FFAB00] dark:bg-[#FFAB00]/12 dark:border-[#FFAB00]/22"
            )}>
              <Flag size={12} className="shrink-0" />
              <span className="truncate">{parsed.priority}</span>
            </div>
          </div>
        </div>
      )}
    </form>
  );
};

export default TaskEditor;
