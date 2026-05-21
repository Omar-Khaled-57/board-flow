import { useTodoStore } from '../store/useTodoStore';
import { Settings } from '../types';

const Options = () => {
  const settings = useTodoStore(state => state.settings);
  const updateSettings = useTodoStore(state => state.updateSettings);

  const colors = ['#5b6af0', '#e85d5d', '#3cb878', '#f59e0b', '#8b5cf6', '#ec4899'];

  return (
    <div className="h-full flex flex-col gap-6">
      <header>
        <h1 className="text-3xl font-bold">Options</h1>
        <p className="text-(--text-secondary) mt-1">Customize your experience</p>
      </header>
      
      <div className="flex-1 bg-(--card-bg) rounded-xl shadow-sm border border-(--border-color) p-6 space-y-8 overflow-y-auto">
        
        <section>
          <h2 className="text-xl font-semibold mb-4 border-b border-(--border-color) pb-2">Appearance</h2>
          
          <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <label className="font-medium text-(--text-secondary)">Theme Mode</label>
              <select 
                title="Select Theme Mode"
                value={settings.theme}
                onChange={e => updateSettings({ theme: e.target.value as Settings['theme'] })}
                className="w-full sm:w-auto bg-(--bg-color) border border-(--border-color) rounded-md px-3 py-2 outline-none text-(--text-primary)"
              >
                <option value="system">System Default</option>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <label className="font-medium text-(--text-secondary)">Accent Color</label>
              <div className="flex flex-wrap gap-2">
                {colors.map(color => (
                  <button 
                    key={color}
                    onClick={() => updateSettings({ accentColor: color })}
                    aria-label={`Select accent color ${color}`}
                    className={`w-10 h-10 rounded-full border-2 transition-transform hover:scale-110 ${settings.accentColor === color ? 'border-(--text-primary) scale-110' : 'border-transparent'}`}
                    style={{ backgroundColor: color }}
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
              <label className="font-medium text-(--text-secondary)">Add new tasks to top</label>
              <input 
                title="Add new tasks to top"
                type="checkbox" 
                checked={settings.addToTop}
                onChange={e => updateSettings({ addToTop: e.target.checked })}
                className="w-5 h-5 accent-primary cursor-pointer"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <label className="font-medium text-(--text-secondary)">Move completed tasks to bottom</label>
              <input 
                title="Move completed tasks to bottom"
                type="checkbox" 
                checked={settings.completedToBottom}
                onChange={e => updateSettings({ completedToBottom: e.target.checked })}
                className="w-5 h-5 accent-primary cursor-pointer"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <label className="font-medium text-(--text-secondary)">Enable completion sound</label>
              <input 
                title="Enable completion sound"
                type="checkbox" 
                checked={settings.soundEnabled}
                onChange={e => updateSettings({ soundEnabled: e.target.checked })}
                className="w-5 h-5 accent-primary cursor-pointer"
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Options;
