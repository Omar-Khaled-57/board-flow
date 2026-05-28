import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { ClipboardList, NotebookPen, Calendar, BarChart2, Settings } from 'lucide-react';
import { useState, useEffect } from 'react';
import UndoSnackbar from './UndoSnackbar';
import useNotificationScheduler from '../hooks/useNotificationScheduler';
import { useTodoStore } from '../store/useTodoStore';

const navItems = [
  { to: '/', icon: ClipboardList, label: 'Tasks' },
  { to: '/notes', icon: NotebookPen, label: 'Notes' },
  { to: '/calendar', icon: Calendar, label: 'Calendar' },
  { to: '/stats', icon: BarChart2, label: 'Stats' },
  { to: '/options', icon: Settings, label: 'Options' },
];

/* ─── Layout ─── */
const Layout = () => {
  const settings = useTodoStore(state => state.settings);
  const updateSettings = useTodoStore(state => state.updateSettings);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(settings.sidebarExpanded);
  const location = useLocation();
  useNotificationScheduler();

  const undo = useTodoStore(state => state.undo);
  const redo = useTodoStore(state => state.redo);

  // Global undo/redo keyboard shortcuts (Ctrl+Z / Ctrl+Y or Cmd+Z / Cmd+Shift+Z)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z' && !e.shiftKey) {
          e.preventDefault();
          undo();
        } else if (e.key === 'y' || (e.key === 'z' && e.shiftKey)) {
          e.preventDefault();
          redo();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  // Persist sidebar collapsed/expanded state
  useEffect(() => {
    updateSettings({ sidebarExpanded: isSidebarExpanded });
  }, [isSidebarExpanded]);

  const activeNavIndex = Math.max(
    0,
    navItems.findIndex(item => item.to === '/' ? location.pathname === '/' : location.pathname.startsWith(item.to))
  );

  return (
    <div className="flex min-h-screen bg-(--bg-color) text-(--text-primary)">
      {/* Desktop sidebar — sticky, collapsible */}
      {/* Logical: border-e for RTL border-inline-end */}
      <nav
        className={`hidden md:flex shrink-0 sticky top-0 h-screen bg-(--card-bg) border-e border-(--border-color) flex-col transition-[width] duration-300 ease-out shadow-md ${
          isSidebarExpanded ? 'w-64' : 'w-20'
        }`}
      >
        <div className="p-4 flex items-center gap-2 border-b border-(--border-color) mb-2">
          <div className="w-12 shrink-0 flex justify-center">
            <button
              type="button"
              onClick={() => setIsSidebarExpanded(open => !open)}
              className="w-10 h-10 shrink-0 rounded-2xl bg-primary/20 text-primary flex items-center justify-center font-black text-lg shadow-none transition-all hover:bg-primary hover:text-(--text-on-primary)"
              aria-label={isSidebarExpanded ? 'Collapse navigation' : 'Expand navigation'}
              aria-expanded={isSidebarExpanded}
            >
              BF
            </button>
          </div>
          {/* Sidebar brand label — collapses/expands with sidebar */}
          <span
            className={`overflow-hidden whitespace-nowrap font-black text-2xl tracking-tight text-primary transition-[max-width,opacity,transform] duration-300 ease-out ${
              isSidebarExpanded ? 'max-w-44 opacity-100 translate-x-0' : 'max-w-0 opacity-0 -translate-x-2'
            }`}
          >
            Board<span className="text-(--text-primary)">Flow</span>
          </span>
        </div>

        <div className="relative flex-1 px-3 mt-4">
          {/* Active nav indicator track — slides vertically */}
          <div
            className="absolute left-3 right-3 top-0 h-12 rounded-r-3xl rounded-l-none bg-primary/10 shadow-sm transition-transform duration-400 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
            style={{ transform: `translateY(${activeNavIndex * 3.5}rem)` }}
            aria-hidden="true"
          >
            {/* Active indicator left bar */}
            <div className="absolute inset-y-0 left-0 w-1 bg-primary rounded-l-full" />
          </div>
          <div className="relative z-10 space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex h-12 items-center rounded-r-3xl rounded-l-none transition-colors duration-200 relative group overflow-hidden ${
                  isActive
                    ? 'text-primary font-bold'
                    : 'text-(--text-secondary) hover:bg-white/50 dark:hover:bg-white/5 hover:text-(--text-primary) font-medium'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span className="z-10 flex w-12 shrink-0 justify-center">
                    <item.icon size={22} className={`shrink-0 transition-colors duration-200 ${isActive ? "text-primary" : "group-hover:text-primary/70"}`} />
                  </span>
                  {/* Sidebar nav label — collapses inline with sidebar */}
            <span
                    className={`z-10 overflow-hidden whitespace-nowrap transition-[max-width,opacity,transform,color] duration-300 ease-out ${
                      isSidebarExpanded ? 'max-w-32 opacity-100 translate-x-0' : 'max-w-0 opacity-0 -translate-x-2'
                    } ${isActive ? "text-primary" : "group-hover:text-primary/70"}`}
                  >
                    {item.label}
                  </span>
                </>
              )}
            </NavLink>
          ))}
          </div>
        </div>
      </nav>

      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 overflow-auto p-4 md:p-8 pb-32 md:pb-8 animate-fade-in">
          <div className="max-w-7xl mx-auto h-full relative">
            <Outlet />
          </div>
        </main>
        <UndoSnackbar />

        {/* Mobile bottom navigation — fixed bar with sliding active indicator */}
        <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-(--card-bg) border-t border-(--border-color) shadow-md pb-4 portrait:pb-9">
          <div className="relative grid grid-cols-5 px-2 py-2">
            <div
              className="absolute top-2 bottom-2 rounded-t-3xl rounded-b-none bg-primary/10 shadow-sm transition-[left] duration-400 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
              style={{
                left: `calc(0.5rem + ${activeNavIndex} * ((100% - 1rem) / 5))`,
                width: 'calc((100% - 1rem) / 5)',
              }}
              aria-hidden="true"
            >
              <div className="absolute inset-x-0 bottom-0 h-1 bg-primary rounded-b-full" />
            </div>
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `relative z-10 flex min-h-14 flex-col items-center justify-center gap-1 rounded-t-3xl rounded-b-none px-2 py-2 transition-colors duration-200 ${
                    isActive
                      ? 'text-primary font-bold'
                      : 'text-(--text-secondary) hover:text-(--text-primary)'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <item.icon size={20} className={`transition-colors duration-200 ${isActive ? 'text-primary' : ''}`} />
                    <span className="text-[10px] leading-none">{item.label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </nav>
      </div>
    </div>
  );
};

export default Layout;
