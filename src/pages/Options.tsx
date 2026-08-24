import { useRef, useState, useEffect } from 'react';
import { save } from '@tauri-apps/plugin-dialog';
import { writeTextFile } from '@tauri-apps/plugin-fs';
import { version } from '../../package.json';
import { useTodoStore, buildTodoIndexes, HISTORY_LIMIT } from '../store/useTodoStore';
import { useNotesStore, buildNoteIndexes } from '../store/useNotesStore';
import { useStatsStore, getTodayString } from '../store/useStatsStore';
import {
  importableTodoSchema,
  importableNoteSchema,
  tagSchema,
  taskListSchema,
  dailyGoalSchema,
} from '../schemas';
import type { z } from 'zod';
import { Sun, Moon, Monitor, Check } from 'lucide-react';
import { Todo } from '../types';
import { generateId } from '../utils/id';
import PageHeader from '../components/PageHeader';
import ToggleSwitch from '../components/ToggleSwitch';

const Dropdown = <T extends string>({
  items,
  value,
  onChange,
}: {
  items: { id: T; name: string }[];
  value: T;
  onChange: (v: T) => void;
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        onBlur={(e) => { if (!ref.current?.contains(e.relatedTarget)) setOpen(false); }}
        className="w-full flex items-center justify-between rounded-xl border border-(--border-color) bg-(--bg-color) px-4 py-2.5 text-sm text-(--text-primary) outline-none transition-all hover:border-primary/40 focus:border-primary focus:ring-2 focus:ring-primary/20 cursor-pointer"
      >
        <span>{items.find(i => i.id === value)?.name ?? value}</span>
        <svg className={`size-4 fill-current text-(--text-secondary) transition-transform duration-200 ${open ? 'rotate-180' : ''}`} viewBox="0 0 20 20"><path d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z"/></svg>
      </button>
      {open && (
        <div
          className="absolute z-50 inset-inline-0 top-full mt-1 animate-fade-slide-down origin-top"
        >
          <div className="rounded-xl border border-(--border-color) bg-(--card-bg) py-1 shadow-lg shadow-primary/5 overflow-hidden">
            {items.map((item, i) => (
              <button
                key={item.id}
                type="button"
                onClick={() => { onChange(item.id); setOpen(false); }}
                className={`w-full flex items-center gap-2 px-4 py-2.5 text-start text-sm transition-colors hover:bg-primary/10 ${
                  i === 0 ? 'rounded-t-xl' : ''
                } ${
                  i === items.length - 1 ? 'rounded-b-xl' : ''
                } ${
                  value === item.id ? 'text-primary font-semibold' : 'text-(--text-primary)'
                }`}
              >
                <span className={`size-4 shrink-0 rounded-full border-2 transition-all ${
                  value === item.id
                    ? 'border-primary bg-primary flex items-center justify-center'
                    : 'border-(--border-color)'
                }`}>
                  {value === item.id && <Check size={10} className="text-(--text-on-primary)" strokeWidth={3} />}
                </span>
                {item.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const ClearStatsButton = () => {
  const clearStats = useStatsStore(state => state.clearStats);
  const [open, setOpen] = useState(false);

  return (
    <div className={`rounded-xl border transition-all duration-300 ease-out ${
      open ? 'border-[#EF4444] dark:border-red-400/30 bg-[#FEE2E2] dark:bg-red-900/10 shadow-sm' : 'border-transparent'
    }`}>
      <div
        className={`grid transition-all duration-300 ease-out ${
          open ? 'grid-rows-[0fr] opacity-0' : 'grid-rows-[1fr] opacity-100'
        }`}
      >
        <div className="overflow-hidden">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex items-center justify-center rounded-full border border-[#EF4444] dark:border-red-400/30 bg-[#FEE2E2] dark:bg-red-900/10 px-5 py-2.5 text-sm font-semibold text-[#B91C1C] dark:text-red-400 transition-all hover:bg-[#FEE2E2]/80 dark:hover:bg-red-900/20 hover:shadow-md active:scale-95"
          >
            Clear Stats
          </button>
        </div>
      </div>
      <div
        className={`grid transition-all duration-300 ease-out ${
          open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="overflow-hidden">
          <div className="flex flex-col gap-4 p-5">
            <p className="text-sm leading-relaxed text-[#B91C1C] dark:text-red-400">
              <span className="font-semibold">Warning:</span> This will permanently erase all statistics data. This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => { clearStats(); setOpen(false); }}
                className="inline-flex items-center justify-center rounded-full bg-red-500 px-5 py-2 text-sm font-bold text-white transition-all hover:bg-red-600 active:scale-95 shadow-sm"
              >
                Confirm
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex items-center justify-center rounded-full border border-(--border-color) bg-(--bg-color) px-5 py-2 text-sm font-semibold text-(--text-secondary) transition-all hover:bg-(--card-bg) active:scale-95"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Options = () => {
  const settings = useTodoStore(state => state.settings);
  const updateSettings = useTodoStore(state => state.updateSettings);
  const todos = useTodoStore(state => state.todos);
  const tags = useTodoStore(state => state.tags);
  const lists = useTodoStore(state => state.lists);
  const notes = useNotesStore(state => state.notes);
  const noteSortField = useNotesStore(state => state.noteSortField);
  const noteSortDirection = useNotesStore(state => state.noteSortDirection);
  const dailyGoals = useStatsStore(state => state.dailyGoals);
  const currentStreak = useStatsStore(state => state.currentStreak);
  const longestStreak = useStatsStore(state => state.longestStreak);
  const setDailyGoal = useStatsStore(state => state.setDailyGoal);
  // Must match the stats store's local-date key, not a UTC date.
  const todayKey = getTodayString();
  const todayGoal = dailyGoals[todayKey]?.goal ?? 5;
  const [goalInput, setGoalInput] = useState(String(todayGoal));

  useEffect(() => {
    setGoalInput(String(todayGoal));
  }, [todayGoal]);

  const [selectedExportList, setSelectedExportList] = useState('__full__');
  const [selectedImportList, setSelectedImportList] = useState('all');
  const [importMessage, setImportMessage] = useState('');
  const [exportMessage, setExportMessage] = useState('');
  const [showFallback, setShowFallback] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const exportOptions = [
    { id: '__full__', name: 'Full backup' },
    { id: 'all', name: 'All tasks' },
    ...lists.map(l => ({ id: l.id, name: l.name })),
  ];
  const importOptions = lists.length > 0
    ? [{ id: 'all', name: 'All tasks' }, ...lists.map(l => ({ id: l.id, name: l.name }))]
    : [{ id: 'all', name: 'All tasks' }];

  const handleExportTasks = async () => {
    try {
      const listId = selectedExportList;
      let json: string;
      let filename: string;
      let itemCount = 0;

      if (listId === '__full__') {
        const payload = {
          version: 2,
          type: 'full-backup',
          exportedAt: Date.now(),
          tags,
          lists,
          todos: todos.map(t => ({ ...t, dueDate: t.dueDate || null })),
          notes: notes.map(n => ({ ...n, dueDate: n.dueDate || null })),
          noteSortField,
          noteSortDirection,
          settings,
          stats: { dailyGoals, currentStreak, longestStreak },
        };
        json = JSON.stringify(payload, null, 2);
        filename = `boardflow-full-backup-${new Date().toISOString().slice(0, 10)}.json`;
        itemCount = todos.length + notes.length;
      } else {
        const exportTasks = listId === 'all'
          ? todos
          : todos.filter(task => task.listId === listId);

        if (exportTasks.length === 0) {
          setExportMessage('No tasks to export.');
          return;
        }

        const payload = {
          version: 1,
          exportedAt: Date.now(),
          listId: listId === 'all' ? null : listId,
          tasks: exportTasks.map(task => ({
            ...task,
            dueDate: task.dueDate || null,
          })),
        };
        json = JSON.stringify(payload, null, 2);
        filename = `boardflow-tasks-${listId === 'all' ? 'all' : listId}.json`;
        itemCount = exportTasks.length;
      }

      const isTauri = typeof window !== 'undefined' && typeof (window as any).__TAURI_IPC__ !== 'undefined';
      const isAndroid = isTauri && navigator.userAgent.includes('Android');
      const itemCountLabel = `${itemCount} item${itemCount === 1 ? '' : 's'}`;

      // Tier 1: Tauri save dialog (desktop + mobile)
      if (isTauri) {
        try {
          const filePath = await save({
            defaultPath: filename,
            filters: [{ name: 'JSON', extensions: ['json'] }],
          });
          if (!filePath) {
            setExportMessage('Export cancelled.');
            return;
          }
          // Android SAF `content://` URIs cannot be written by plugin-fs
          // (no custom Rust command exists for them); skip straight to the
          // platform fallbacks below.
          if (!filePath.startsWith('content://')) {
            await writeTextFile(filePath, json);
            setExportMessage(`Exported ${itemCountLabel} to ${filePath}.`);
            return;
          }
        } catch (writeError) {
          console.error('Tauri save/write failed:', writeError);
        }
      }

      // Tier 2: Blob download (webview/desktop). Android webviews do not
      // support anchor downloads, so they fall through to the clipboard.
      if (!isAndroid) {
        try {
          const file = new Blob([json], { type: 'application/json' });
          const url = URL.createObjectURL(file);
          const anchor = document.createElement('a');
          anchor.href = url;
          anchor.download = filename;
          anchor.rel = 'noopener';
          anchor.style.display = 'none';
          document.body.appendChild(anchor);
          anchor.click();
          document.body.removeChild(anchor);
          setTimeout(() => URL.revokeObjectURL(url), 10000);
          setExportMessage(`Exported ${itemCountLabel}. Check your browser's download folder.`);
          return;
        } catch {
          // blob download failed, fall through
        }
      }

      // Tier 3: Clipboard
      try {
        await navigator.clipboard.writeText(json);
        setExportMessage(`Exported ${itemCountLabel} copied to clipboard. Paste into a text editor and save as .json.`);
        return;
      } catch {
        // clipboard unavailable, fall through
      }

      // Tier 4: Textarea fallback
      setShowFallback(json);
      setExportMessage('Auto-export failed. Copy the JSON below and save it as a .json file.');
    } catch (e) {
      setExportMessage('Export failed: ' + (e instanceof Error ? e.message : 'unknown error'));
      console.error('Export failed:', e);
    }
  };

  const generateSubtaskId = () => Math.random().toString(36).substring(2, 9);

  const normalizeImportedTask = (raw: any, targetListId?: string | null): Omit<Todo, 'id' | 'createdAt'> | null => {
    const title = typeof raw.title === 'string' ? raw.title.trim() : '';
    if (!title) return null;

    const tags = Array.isArray(raw.tags)
      ? (Array.from(new Set(raw.tags.filter(Boolean).map((value: any) => String(value)))) as string[])
      : [];

    const dueDateValue = raw.dueDate;
    const dueDate = typeof dueDateValue === 'number'
      ? dueDateValue
      : typeof dueDateValue === 'string' && dueDateValue.trim()
        ? Number(new Date(dueDateValue)) || undefined
        : undefined;

    const priority = raw.priority === 'high' || raw.priority === 'low' ? raw.priority : 'medium';
    const completed = Boolean(raw.completed);
    const subtasks = Array.isArray(raw.subtasks)
      ? raw.subtasks.filter(Boolean).map((subtask: any) => ({
          id: typeof subtask.id === 'string' ? subtask.id : generateSubtaskId(),
          title: String(subtask.title || ''),
          completed: Boolean(subtask.completed),
        }))
      : [];

    return {
      title,
      dueDate,
      priority,
      tags,
      completed,
      subtasks,
      listId: targetListId ?? raw.listId,
    };
  };

  const collectValid = <T,>(schema: z.ZodType<T>, raw: unknown): T[] =>
    Array.isArray(raw)
      ? raw.flatMap(item => {
          const result = schema.safeParse(item);
          return result.success ? [result.data] : [];
        })
      : [];

  const countInvalid = (raw: unknown, validCount: number): number =>
    Array.isArray(raw) ? raw.length - validCount : 0;

  const toStreakCount = (value: unknown): number =>
    typeof value === 'number' && Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;

  const handleImportTasks = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const payload = JSON.parse(text);
      const targetListId = selectedImportList === 'all' ? undefined : selectedImportList;

      // Version 2 full backup — merge into existing data
      if (payload.version === 2 && payload.type === 'full-backup') {
        const state = useTodoStore.getState();
        const notesState = useNotesStore.getState();
        const statsState = useStatsStore.getState();

        const importedTodos = collectValid(importableTodoSchema, payload.todos);
        const importedNotes = collectValid(importableNoteSchema, payload.notes);
        const importedTags = collectValid(tagSchema, payload.tags);
        const importedLists = collectValid(taskListSchema, payload.lists);

        const invalidCount =
          countInvalid(payload.todos, importedTodos.length) +
          countInvalid(payload.notes, importedNotes.length) +
          countInvalid(payload.tags, importedTags.length) +
          countInvalid(payload.lists, importedLists.length);

        const existingTodoIds = new Set(state.todos.map(t => t.id));
        const newTodos = importedTodos.filter(t => !existingTodoIds.has(t.id));

        const existingNoteIds = new Set(notesState.notes.map(n => n.id));
        const newNotes = importedNotes.filter(n => !existingNoteIds.has(n.id));

        const existingTagIds = new Set(state.tags.map(t => t.id));
        const newTags = importedTags.filter(t => !existingTagIds.has(t.id));

        const existingListIds = new Set(state.lists.map(l => l.id));
        const newLists = importedLists.filter(l => !existingListIds.has(l.id));

        const mergedTodos = [...state.todos, ...newTodos];
        const mergedNotes = [...notesState.notes, ...newNotes];
        const mergedTags = [...state.tags, ...newTags];
        const mergedLists = [...state.lists, ...newLists];

        // Merge stats: take max completedCount per date, max streaks
        const mergedGoals = { ...statsState.dailyGoals };
        if (payload.stats?.dailyGoals) {
          for (const [date, goal] of Object.entries(payload.stats.dailyGoals)) {
            const result = dailyGoalSchema.safeParse(goal);
            if (!result.success) continue;
            const g = result.data;
            const existing = mergedGoals[date];
            if (!existing || g.completedCount > existing.completedCount) {
              mergedGoals[date] = g;
            }
          }
        }
        const mergedStreak = Math.max(statsState.currentStreak, toStreakCount(payload.stats?.currentStreak));
        const mergedLongest = Math.max(statsState.longestStreak, toStreakCount(payload.stats?.longestStreak));

        useTodoStore.setState({
          todos: mergedTodos,
          tags: mergedTags,
          lists: mergedLists,
          past: [],
          future: [],
          todoIndexes: buildTodoIndexes(mergedTodos),
        });

        useNotesStore.setState({
          notes: mergedNotes,
          past: [],
          future: [],
          noteIndexes: buildNoteIndexes(mergedNotes),
        });

        useStatsStore.setState({
          dailyGoals: mergedGoals,
          currentStreak: mergedStreak,
          longestStreak: mergedLongest,
        });

        const parts: string[] = [];
        if (newTodos.length > 0) parts.push(`${newTodos.length} task${newTodos.length === 1 ? '' : 's'}`);
        if (newNotes.length > 0) parts.push(`${newNotes.length} note${newNotes.length === 1 ? '' : 's'}`);
        if (newTags.length > 0) parts.push(`${newTags.length} tag${newTags.length === 1 ? '' : 's'}`);
        if (newLists.length > 0) parts.push(`${newLists.length} list${newLists.length === 1 ? '' : 's'}`);
        const imported = parts.join(', ');
        const duplicateCount =
          (importedTodos.length - newTodos.length) +
          (importedNotes.length - newNotes.length);
        let message = `Imported ${imported || '0 items'}.`;
        if (duplicateCount > 0) message += ` ${duplicateCount} duplicate${duplicateCount === 1 ? '' : 's'} skipped.`;
        if (invalidCount > 0) message += ` ${invalidCount} invalid item${invalidCount === 1 ? '' : 's'} ignored.`;
        message += ' Settings and sort preferences were kept from current session.';
        setImportMessage(message);
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      // Version 1 (or unversioned) — legacy per-list import.
      // Batch into a single state transition: one history entry, one persist
      // write, instead of N store updates (N disk writes on desktop).
      const rawTasks: any[] = Array.isArray(payload.tasks) ? payload.tasks : Array.isArray(payload) ? payload : [];
      const normalizedTasks = rawTasks
        .map(task => normalizeImportedTask(task, targetListId))
        .filter((task): task is NonNullable<ReturnType<typeof normalizeImportedTask>> => task !== null);

      if (normalizedTasks.length === 0) {
        setImportMessage('No valid tasks found in file.');
      } else {
        const state = useTodoStore.getState();
        const now = Date.now();
        const newTodos: Todo[] = normalizedTasks.map(normalized => ({
          ...normalized,
          id: generateId(),
          createdAt: now,
        }));
        const ordered = state.settings.addToTop
          ? [...newTodos, ...state.todos]
          : [...state.todos, ...newTodos];
        useTodoStore.setState({
          todos: ordered,
          past: [...state.past, state.todos].slice(-HISTORY_LIMIT),
          future: [],
          todoIndexes: buildTodoIndexes(ordered),
        });
        setImportMessage(`Imported ${newTodos.length} task${newTodos.length === 1 ? '' : 's'}.`);
      }
    } catch (error) {
      setImportMessage('Unable to import tasks. Please use a valid BoardFlow task export file.');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const colors = ['#5b6af0', '#e85d5d', '#3cb878', '#f59e0b', '#8b5cf6', '#ec4899', '#f5f5f5', '#9ca3af', '#39ff14', '#00e5ff'];

  const getCurrentTheme = () => {
    let t = settings.theme;
    if (t === 'system') t = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    return t;
  };

  const adjustBrightness = (hex: string, amount: number) => {
    const num = parseInt(hex.replace('#', ''), 16);
    const clamp = (v: number) => Math.min(255, Math.max(0, v));
    const r = clamp(((num >> 16) & 0xFF) + amount);
    const g = clamp(((num >> 8) & 0xFF) + amount);
    const b = clamp((num & 0xFF) + amount);
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
  };

  const getDisplayColor = (color: string) => {
    if (color !== '#f5f5f5') return color;
    return getCurrentTheme() === 'dark' ? '#ffffff' : '#111827';
  };

  const getSwatchBorderColor = (color: string) => {
    if (settings.accentColor !== color) return 'transparent';
    const raw = color === '#f5f5f5' ? '#111827' : color;
    return getCurrentTheme() === 'dark' ? adjustBrightness(raw, 50) : adjustBrightness(raw, -50);
  };

  const getSwatchBoxShadow = (color: string) => {
    if (settings.accentColor !== color) return undefined;

    const hex = color.replace('#', '');
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);

    return `0 0 0 3px rgba(${r}, ${g}, ${b}, 0.28)`;
  };

  return (
    <div className="min-h-full flex flex-col gap-6">
      <PageHeader title="Options" subtitle="Customize your experience" />
      
      <div className="bg-(--card-bg) rounded-xl shadow-sm border border-(--border-color) p-6 space-y-8">
        
        <section>
          <h2 className="text-xl font-semibold mb-4 border-b border-(--border-color) pb-2">Appearance</h2>
          
          <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <label className="font-medium text-(--text-secondary)">Theme Mode</label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => updateSettings({ theme: 'light' })}
                  className={`p-2 rounded-full border-2 transition-all ${settings.theme === 'light' ? 'border-primary text-primary bg-primary/10' : 'border-transparent text-(--text-secondary) hover:bg-(--bg-color)'}`}
                  title="Light Mode"
                >
                  <Sun size={20} />
                </button>
                <button
                  onClick={() => updateSettings({ theme: 'dark' })}
                  className={`p-2 rounded-full border-2 transition-all ${settings.theme === 'dark' ? 'border-primary text-primary bg-primary/10' : 'border-transparent text-(--text-secondary) hover:bg-(--bg-color)'}`}
                  title="Dark Mode"
                >
                  <Moon size={20} />
                </button>
                <button
                  onClick={() => updateSettings({ theme: 'system' })}
                  className={`p-2 rounded-full border-2 transition-all ${settings.theme === 'system' ? 'border-primary text-primary bg-primary/10' : 'border-transparent text-(--text-secondary) hover:bg-(--bg-color)'}`}
                  title="System Default"
                >
                  <Monitor size={20} />
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <label className="font-medium text-(--text-secondary)">Accent Color</label>
              <div className="flex flex-wrap gap-2">
                {colors.map(color => (
                  // eslint-disable-next-line react/style-prop-object
                  <button 
                    key={color}
                    onClick={() => updateSettings({ accentColor: color })}
                    aria-label={`Select accent color ${color}`}
                    className={`w-10 h-10 rounded-full border-2 transition-all hover:scale-110 ${settings.accentColor === color ? 'scale-110' : ''}`}
                    style={{
                      backgroundColor: getDisplayColor(color),
                      borderColor: getSwatchBorderColor(color),
                      boxShadow: getSwatchBoxShadow(color),
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4 border-b border-(--border-color) pb-2">Interface</h2>
          
          <div className="space-y-4">
            <ToggleSwitch
              label="Add new tasks to top"
              checked={settings.addToTop}
              onChange={v => updateSettings({ addToTop: v })}
            />

            <ToggleSwitch
              label="Move completed tasks to bottom"
              checked={settings.completedToBottom}
              onChange={v => updateSettings({ completedToBottom: v })}
            />

            <div className="hidden landscape:block">
              <ToggleSwitch
                label="Stack composer above tasks"
                sublabel="Landscape only. Turn off to use the split composer/list layout."
                checked={settings.landscapeStackedTasks ?? true}
                onChange={v => updateSettings({ landscapeStackedTasks: v })}
              />
            </div>

            <ToggleSwitch
              label="Enable completion sound"
              checked={settings.soundEnabled}
              onChange={v => updateSettings({ soundEnabled: v })}
            />

            <ToggleSwitch
              label="Hide Edit in Tasks"
              checked={!!settings.hideEditInTasks}
              onChange={v => updateSettings({ hideEditInTasks: v })}
            />

            <ToggleSwitch
              label="Hide Delete in Tasks"
              checked={!!settings.hideDeleteInTasks}
              onChange={v => updateSettings({ hideDeleteInTasks: v })}
            />

            <ToggleSwitch
              label="Vertical action buttons"
              checked={!!settings.verticalActionButtons}
              onChange={v => updateSettings({ verticalActionButtons: v })}
            />
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4 border-b border-(--border-color) pb-2">Statistics</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label htmlFor="dailyGoal" className="font-medium text-(--text-secondary)">Daily task completion target</label>
              <input
                id="dailyGoal"
                type="number"
                min="1"
                max="100"
                value={goalInput}
                onChange={e => setGoalInput(e.target.value)}
                onBlur={() => {
                  const val = parseInt(goalInput, 10);
                  if (isNaN(val) || val < 1) {
                    setGoalInput('5');
                    setDailyGoal(5);
                  } else {
                    setDailyGoal(val);
                  }
                }}
                className="number-spinner-primary w-20 rounded-xl border border-(--border-color) bg-(--bg-color) px-3 py-2 text-center text-sm font-semibold text-(--text-primary) outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <ClearStatsButton />
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4 border-b border-(--border-color) pb-2">Import / Export Tasks</h2>
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-(--text-secondary)">Export</label>
                <Dropdown
                  items={exportOptions}
                  value={selectedExportList}
                  onChange={v => setSelectedExportList(v)}
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-(--text-secondary)">Import into</label>
                <Dropdown
                  items={importOptions}
                  value={selectedImportList}
                  onChange={v => setSelectedImportList(v)}
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleExportTasks}
                className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-(--text-on-primary) shadow-sm transition-all hover:brightness-110 hover:shadow-md active:scale-95"
              >
                Export Tasks
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center justify-center rounded-full border border-(--border-color) bg-(--bg-color) px-5 py-2.5 text-sm font-semibold text-(--text-primary) shadow-sm transition-all hover:bg-primary/10 hover:border-primary/40 hover:shadow-md active:scale-95"
              >
                Import Tasks
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              title="Select a JSON file to import tasks"
              accept="application/json"
              onChange={handleImportTasks}
              className="hidden"
              aria-hidden="true"
            />

            {importMessage && (
              <div className="animate-fade-slide-down rounded-2xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm text-primary">
                {importMessage}
              </div>
            )}

            {exportMessage && (
              <div className="animate-fade-slide-down rounded-2xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm text-primary">
                {exportMessage}
              </div>
            )}

            {showFallback && (
              <div className="animate-fade-slide-down space-y-2">
                <p className="text-sm text-(--text-secondary)">Copy the JSON below and save it as a .json file:</p>
                <textarea
                  readOnly
                  value={showFallback}
                  className="w-full h-48 rounded-xl border border-(--border-color) bg-(--bg-color) p-3 text-xs font-mono text-(--text-primary) outline-none resize-y"
                  onClick={e => (e.target as HTMLTextAreaElement).select()}
                />
              </div>
            )}
          </div>
        </section>

        <p className="text-center text-xs text-(--text-secondary) pb-4">BoardFlow v{version}</p>
      </div>
    </div>
  );
};

export default Options;
