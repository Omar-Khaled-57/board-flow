import { useTodoStore } from '../store/useTodoStore';
import { Sun, Moon, Monitor } from 'lucide-react';

const Options = () => {
  const settings = useTodoStore(state => state.settings);
  const updateSettings = useTodoStore(state => state.updateSettings);

  const colors = ['#5b6af0', '#e85d5d', '#3cb878', '#f59e0b', '#8b5cf6', '#ec4899', '#f5f5f5', '#9ca3af', '#39ff14', '#00e5ff'];

  const getDisplayColor = (color: string) => {
    if (color !== '#f5f5f5') return color;
    let currentTheme = settings.theme;
    if (currentTheme === 'system') {
      currentTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return currentTheme === 'dark' ? '#ffffff' : '#111827';
  };

  const getSwatchBorderColor = (color: string) => {
    if (settings.accentColor !== color) return 'transparent';
    return 'var(--text-primary)';
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
    <div className="h-full flex flex-col gap-6">
      <header className="bg-primary -mx-4 md:-mx-8 -mt-4 md:-mt-8 mb-6 px-6 md:px-12 pt-12 pb-14 md:pb-16 arch-bottom shadow-lg shadow-primary/20 relative overflow-hidden flex flex-col items-center justify-center text-center">
        {/* Decorative elements */}
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
      
      <div className="flex-1 bg-(--card-bg) rounded-xl shadow-sm border border-(--border-color) p-6 space-y-8 overflow-y-auto">
        
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
      </div>
    </div>
  );
};

export default Options;
