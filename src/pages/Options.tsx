import { useRef, useState, useEffect } from 'react';
import { save } from '@tauri-apps/plugin-dialog';
import { writeTextFile } from '@tauri-apps/plugin-fs';
import { version } from '../../package.json';
import { useTodoStore } from '../store/useTodoStore';
import { useStatsStore } from '../store/useStatsStore';
import { Sun, Moon, Monitor, Check } from 'lucide-react';
import { Todo } from '../types';

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
            className="inline-flex items-center justify-center rounded-full border border-[#EF4444] dark:border-red-400/30 bg-[#FEE2E2] dark:bg-red-900/10 px-4 py-2.5 text-sm font-semibold text-[#B91C1C] dark:text-red-400 transition-all hover:bg-[#FEE2E2]/80 dark:hover:bg-red-900/20 hover:shadow-md active:scale-95"
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
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 px-4 pt-3 pb-1">
            <p className="text-sm font-medium text-[#B91C1C] dark:text-red-400">This will permanently erase all statistics data.</p>
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                type="button"
                onClick={() => { clearStats(); setOpen(false); }}
                className="inline-flex items-center justify-center rounded-full bg-red-500 px-3.5 py-1.5 text-xs font-bold text-white transition-all hover:bg-red-600 active:scale-95"
              >
                Confirm
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex items-center justify-center rounded-full border border-(--border-color) bg-(--bg-color) px-3.5 py-1.5 text-xs font-semibold text-(--text-secondary) transition-all hover:bg-(--card-bg) active:scale-95"
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
  const lists = useTodoStore(state => state.lists);
  const addTodo = useTodoStore(state => state.addTodo);
  const dailyGoals = useStatsStore(state => state.dailyGoals);
  const setDailyGoal = useStatsStore(state => state.setDailyGoal);
  const todayKey = new Date().toISOString().slice(0, 10);
  const todayGoal = dailyGoals[todayKey]?.goal ?? 5;
  const [goalInput, setGoalInput] = useState(String(todayGoal));

  useEffect(() => {
    setGoalInput(String(todayGoal));
  }, [todayGoal]);

  const [selectedExportList, setSelectedExportList] = useState('all');
  const [selectedImportList, setSelectedImportList] = useState('all');
  const [importMessage, setImportMessage] = useState('');
  const [exportMessage, setExportMessage] = useState('');
  const [showFallback, setShowFallback] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const normalizedLists = [{ id: 'all', name: 'All tasks' }, ...lists];

  const handleExportTasks = async () => {
    try {
      const listId = selectedExportList;
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

      const json = JSON.stringify(payload, null, 2);
      const filename = `boardflow-tasks-${listId === 'all' ? 'all' : listId}.json`;

      const isTauri = typeof window !== 'undefined' && typeof (window as any).__TAURI_IPC__ !== 'undefined';
      const isAndroid = isTauri && navigator.userAgent.toLowerCase().includes('android');

      if (isTauri) {
        const filePath = await save({
          defaultPath: filename,
          filters: [{ name: 'JSON', extensions: ['json'] }],
        });
        if (!filePath) {
          setExportMessage('Export cancelled.');
          return;
        }
        try {
          await writeTextFile(filePath, json);
          setExportMessage(`Exported ${exportTasks.length} task${exportTasks.length === 1 ? '' : 's'} to ${filePath}.`);
        } catch (writeError) {
          console.error('Tauri write failed:', writeError);
          if (isAndroid) {
            setExportMessage('Export failed. The save dialog may not be supported on your device. Try using the desktop version.');
          } else {
            tryFallbackDownload(json, filename, exportTasks.length);
          }
        }
      } else {
        tryFallbackDownload(json, filename, exportTasks.length);
      }
    } catch (e) {
      setExportMessage('Export failed: ' + (e instanceof Error ? e.message : 'unknown error'));
      console.error('Export failed:', e);
    }
  };

  const tryFallbackDownload = (json: string, filename: string, count: number) => {
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
      setExportMessage(`Exported ${count} task${count === 1 ? '' : 's'}. Check your browser's download folder.`);
    } catch {
      setShowFallback(json);
      setExportMessage('Auto-download failed. Copy the JSON below and save it as a .json file.');
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

  const handleImportTasks = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const payload = JSON.parse(text);
      const rawTasks: any[] = Array.isArray(payload.tasks) ? payload.tasks : Array.isArray(payload) ? payload : [];
      const targetListId = selectedImportList === 'all' ? undefined : selectedImportList;
      let importedCount = 0;

      rawTasks.forEach(task => {
        const normalized = normalizeImportedTask(task, targetListId);
        if (normalized) {
          addTodo(normalized);
          importedCount += 1;
        }
      });

      setImportMessage(`Imported ${importedCount} task${importedCount === 1 ? '' : 's'}.`);
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
      <header className="bg-primary -mx-4 md:-mx-8 -mt-4 md:-mt-8 mb-6 px-6 md:px-12 pt-12 pb-14 md:pb-16 arch-bottom shadow-lg shadow-primary/20 relative overflow-hidden flex flex-col items-center justify-center text-center">
        <div className="absolute top-4 start-4 w-16 h-16 rounded-full border-4 border-(--text-on-primary) opacity-30 pointer-events-none" />
        <div className="absolute bottom-8 -end-5 w-32 h-32 rounded-full bg-(--text-on-primary) opacity-20 pointer-events-none" />
        <div className="absolute top-1/2 start-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-(--text-on-primary) opacity-10 pointer-events-none" />

        <div className="z-10 relative">
          <h1 className="text-4xl md:text-5xl font-black drop-shadow-md text-(--text-on-primary)">
            Options
          </h1>
          <p className="mt-2 font-medium text-(--text-on-primary) opacity-80">Customize your experience</p>
        </div>
      </header>
      
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
            <div className="flex items-center justify-between">
              <label className="font-medium text-(--text-secondary) cursor-pointer select-none">Add new tasks to top</label>
              <input 
                title="Add new tasks to top"
                type="checkbox" 
                checked={settings.addToTop}
                onChange={e => updateSettings({ addToTop: e.target.checked })}
                className="w-6 h-6 rounded-lg appearance-none bg-primary/10 border border-primary/20 checked:bg-primary checked:border-primary transition-all cursor-pointer relative shadow-inner after:content-[''] after:absolute after:hidden checked:after:block after:start-2 after:top-1 after:w-1.5 after:h-3 after:border-e-2 after:border-b-2 after:border-white after:rotate-45"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <label className="font-medium text-(--text-secondary) cursor-pointer select-none">Move completed tasks to bottom</label>
              <input 
                title="Move completed tasks to bottom"
                type="checkbox" 
                checked={settings.completedToBottom}
                onChange={e => updateSettings({ completedToBottom: e.target.checked })}
                className="w-6 h-6 rounded-lg appearance-none bg-primary/10 border border-primary/20 checked:bg-primary checked:border-primary transition-all cursor-pointer relative shadow-inner after:content-[''] after:absolute after:hidden checked:after:block after:start-2 after:top-1 after:w-1.5 after:h-3 after:border-e-2 after:border-b-2 after:border-white after:rotate-45"
              />
            </div>

            <div className="hidden landscape:flex items-center justify-between gap-4">
              <div>
                <label className="font-medium text-(--text-secondary) cursor-pointer select-none">Stack composer above tasks</label>
                <p className="text-xs text-(--text-secondary) opacity-75">Landscape only. Turn off to use the split composer/list layout.</p>
              </div>
              <input
                title="Stack composer above tasks in landscape"
                type="checkbox"
                checked={settings.landscapeStackedTasks ?? true}
                onChange={e => updateSettings({ landscapeStackedTasks: e.target.checked })}
                className="w-6 h-6 shrink-0 rounded-lg appearance-none bg-primary/10 border border-primary/20 checked:bg-primary checked:border-primary transition-all cursor-pointer relative shadow-inner after:content-[''] after:absolute after:hidden checked:after:block after:start-2 after:top-1 after:w-1.5 after:h-3 after:border-e-2 after:border-b-2 after:border-white after:rotate-45"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <label className="font-medium text-(--text-secondary) cursor-pointer select-none">Enable completion sound</label>
              <input 
                title="Enable completion sound"
                type="checkbox" 
                checked={settings.soundEnabled}
                onChange={e => updateSettings({ soundEnabled: e.target.checked })}
                className="w-6 h-6 rounded-lg appearance-none bg-primary/10 border border-primary/20 checked:bg-primary checked:border-primary transition-all cursor-pointer relative shadow-inner after:content-[''] after:absolute after:hidden checked:after:block after:start-2 after:top-1 after:w-1.5 after:h-3 after:border-e-2 after:border-b-2 after:border-white after:rotate-45"
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="font-medium text-(--text-secondary) cursor-pointer select-none">Hide Edit in Tasks</label>
              <input
                title="Hide Edit in Tasks"
                type="checkbox"
                checked={!!settings.hideEditInTasks}
                onChange={e => updateSettings({ hideEditInTasks: e.target.checked })}
                className="w-6 h-6 rounded-lg appearance-none bg-primary/10 border border-primary/20 checked:bg-primary checked:border-primary transition-all cursor-pointer relative shadow-inner after:content-[''] after:absolute after:hidden checked:after:block after:start-2 after:top-1 after:w-1.5 after:h-3 after:border-e-2 after:border-b-2 after:border-white after:rotate-45"
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="font-medium text-(--text-secondary) cursor-pointer select-none">Hide Delete in Tasks</label>
              <input
                title="Hide Delete in Tasks"
                type="checkbox"
                checked={!!settings.hideDeleteInTasks}
                onChange={e => updateSettings({ hideDeleteInTasks: e.target.checked })}
                className="w-6 h-6 rounded-lg appearance-none bg-primary/10 border border-primary/20 checked:bg-primary checked:border-primary transition-all cursor-pointer relative shadow-inner after:content-[''] after:absolute after:hidden checked:after:block after:start-2 after:top-1 after:w-1.5 after:h-3 after:border-e-2 after:border-b-2 after:border-white after:rotate-45"
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="font-medium text-(--text-secondary) cursor-pointer select-none">Vertical action buttons</label>
              <input
                title="Stack edit/delete buttons vertically"
                type="checkbox"
                checked={!!settings.verticalActionButtons}
                onChange={e => updateSettings({ verticalActionButtons: e.target.checked })}
                className="w-6 h-6 rounded-lg appearance-none bg-primary/10 border border-primary/20 checked:bg-primary checked:border-primary transition-all cursor-pointer relative shadow-inner after:content-[''] after:absolute after:hidden checked:after:block after:start-2 after:top-1 after:w-1.5 after:h-3 after:border-e-2 after:border-b-2 after:border-white after:rotate-45"
              />
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4 border-b border-(--border-color) pb-2">Statistics</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="font-medium text-(--text-secondary)">Daily task completion target</label>
              <input
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
                  items={normalizedLists}
                  value={selectedExportList}
                  onChange={v => setSelectedExportList(v)}
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-(--text-secondary)">Import into</label>
                <Dropdown
                  items={normalizedLists}
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
