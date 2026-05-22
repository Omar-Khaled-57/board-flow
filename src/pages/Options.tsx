import { useRef, useState } from 'react';
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
          className="absolute z-50 left-0 right-0 top-full mt-1 animate-fade-slide-down origin-top"
        >
          <div className="rounded-xl border border-(--border-color) bg-(--card-bg) py-1 shadow-lg shadow-primary/5 overflow-hidden">
            {items.map((item, i) => (
              <button
                key={item.id}
                type="button"
                onClick={() => { onChange(item.id); setOpen(false); }}
                className={`w-full flex items-center gap-2 px-4 py-2.5 text-left text-sm transition-colors hover:bg-primary/10 ${
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

  const [selectedExportList, setSelectedExportList] = useState('all');
  const [selectedImportList, setSelectedImportList] = useState('all');
  const [importMessage, setImportMessage] = useState('');
  const [exportMessage, setExportMessage] = useState('');
  const [showFallback, setShowFallback] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const normalizedLists = [{ id: 'all', name: 'All tasks' }, ...lists];

  const handleExportTasks = () => {
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

      // Method 1: anchor click with download attribute
      let downloadAttempted = false;
      try {
        const file = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(file);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = filename;
        anchor.rel = 'noopener';
        anchor.style.position = 'fixed';
        anchor.style.left = '10px';
        anchor.style.top = '10px';
        anchor.style.width = '1px';
        anchor.style.height = '1px';
        anchor.style.opacity = '0';
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        setTimeout(() => URL.revokeObjectURL(url), 10000);
        downloadAttempted = true;
        setExportMessage(`Exported ${exportTasks.length} task${exportTasks.length === 1 ? '' : 's'}. Check your browser's download folder.`);
        setShowFallback('');
      } catch {
        downloadAttempted = false;
      }

      if (!downloadAttempted) {
        try {
          const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(json);
          const w = window.open(dataUri, '_blank');
          if (w) {
            setExportMessage(`Exported ${exportTasks.length} task${exportTasks.length === 1 ? '' : 's'}. If the file didn't download, use Ctrl+S to save the page as .json.`);
            setShowFallback('');
          } else {
            throw new Error('popup blocked');
          }
        } catch {
          setShowFallback(json);
          setExportMessage('Auto-download failed. Copy the JSON below and save it as a .json file.');
        }
      }
    } catch (e) {
      setExportMessage('Export failed. Please try again.');
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
        <div className="absolute top-4 left-4 w-16 h-16 rounded-full border-4 border-(--text-on-primary) opacity-30 pointer-events-none" />
        <div className="absolute bottom-8 -right-5 w-32 h-32 rounded-full bg-(--text-on-primary) opacity-20 pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-(--text-on-primary) opacity-10 pointer-events-none" />

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
          <h2 className="text-xl font-semibold mb-4 border-b border-(--border-color) pb-2">Behavior</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="font-medium text-(--text-secondary) cursor-pointer select-none">Add new tasks to top</label>
              <input 
                title="Add new tasks to top"
                type="checkbox" 
                checked={settings.addToTop}
                onChange={e => updateSettings({ addToTop: e.target.checked })}
                className="w-6 h-6 rounded-lg appearance-none bg-primary/10 border border-primary/20 checked:bg-primary checked:border-primary transition-all cursor-pointer relative shadow-inner after:content-[''] after:absolute after:hidden checked:after:block after:left-2 after:top-1 after:w-1.5 after:h-3 after:border-r-2 after:border-b-2 after:border-white after:rotate-45"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <label className="font-medium text-(--text-secondary) cursor-pointer select-none">Move completed tasks to bottom</label>
              <input 
                title="Move completed tasks to bottom"
                type="checkbox" 
                checked={settings.completedToBottom}
                onChange={e => updateSettings({ completedToBottom: e.target.checked })}
                className="w-6 h-6 rounded-lg appearance-none bg-primary/10 border border-primary/20 checked:bg-primary checked:border-primary transition-all cursor-pointer relative shadow-inner after:content-[''] after:absolute after:hidden checked:after:block after:left-2 after:top-1 after:w-1.5 after:h-3 after:border-r-2 after:border-b-2 after:border-white after:rotate-45"
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
                className="w-6 h-6 shrink-0 rounded-lg appearance-none bg-primary/10 border border-primary/20 checked:bg-primary checked:border-primary transition-all cursor-pointer relative shadow-inner after:content-[''] after:absolute after:hidden checked:after:block after:left-2 after:top-1 after:w-1.5 after:h-3 after:border-r-2 after:border-b-2 after:border-white after:rotate-45"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <label className="font-medium text-(--text-secondary) cursor-pointer select-none">Enable completion sound</label>
              <input 
                title="Enable completion sound"
                type="checkbox" 
                checked={settings.soundEnabled}
                onChange={e => updateSettings({ soundEnabled: e.target.checked })}
                className="w-6 h-6 rounded-lg appearance-none bg-primary/10 border border-primary/20 checked:bg-primary checked:border-primary transition-all cursor-pointer relative shadow-inner after:content-[''] after:absolute after:hidden checked:after:block after:left-2 after:top-1 after:w-1.5 after:h-3 after:border-r-2 after:border-b-2 after:border-white after:rotate-45"
              />
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4 border-b border-(--border-color) pb-2">Daily Goals</h2>
          <div className="flex items-center justify-between">
            <label className="font-medium text-(--text-secondary)">Daily task completion target</label>
            <input
              type="number"
              min="1"
              max="100"
              value={todayGoal}
              onChange={e => {
                const val = parseInt(e.target.value, 10);
                if (!isNaN(val) && val >= 1) setDailyGoal(val);
              }}
              className="w-20 rounded-xl border border-(--border-color) bg-(--bg-color) px-3 py-2 text-center text-sm font-semibold text-(--text-primary) outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
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
      </div>
    </div>
  );
};

export default Options;
