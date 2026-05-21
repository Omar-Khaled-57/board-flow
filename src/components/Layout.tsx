import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { Home, Calendar, BarChart2, Settings } from 'lucide-react';
import { useState } from 'react';
import { useTheme } from '../hooks/useTheme';
import UndoSnackbar from './UndoSnackbar';
import useNotificationScheduler from '../hooks/useNotificationScheduler';

const Layout = () => {
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const location = useLocation();
  useTheme(); // apply theme classes
  // Register the event‑driven notification scheduler
  useNotificationScheduler();

  const navItems = [
    { to: '/', icon: Home, label: 'Tasks' },
    { to: '/calendar', icon: Calendar, label: 'Calendar' },
    { to: '/stats', icon: BarChart2, label: 'Stats' },
    { to: '/options', icon: Settings, label: 'Options' },
  ];
  const activeNavIndex = Math.max(
    0,
    navItems.findIndex(item => item.to === '/' ? location.pathname === '/' : location.pathname.startsWith(item.to))
  );

  return (
    <div className="flex min-h-screen bg-(--bg-color) text-(--text-primary)">
      {/* Sidebar for desktop / large tablets */}
      <nav
        className={`hidden md:flex shrink-0 bg-(--card-bg) border-r border-(--border-color) flex-col transition-[width] duration-300 ease-out shadow-md ${
          isSidebarExpanded ? 'w-64' : 'w-20'
        }`}
      >
        <div className="p-4 flex items-center gap-2 border-b border-(--border-color) mb-2">
          <div className="w-12 shrink-0 flex justify-center">
            <button
              type="button"
              onClick={() => setIsSidebarExpanded(open => !open)}
              className="w-10 h-10 shrink-0 rounded-2xl bg-primary/20 text-primary flex items-center justify-center font-black text-lg shadow-none transition-all hover:bg-primary hover:text-[var(--text-on-primary)]"
              aria-label={isSidebarExpanded ? 'Collapse navigation' : 'Expand navigation'}
              aria-expanded={isSidebarExpanded}
            >
              BF
            </button>
          </div>
          <span
            className={`overflow-hidden whitespace-nowrap font-black text-2xl tracking-tight text-primary transition-[max-width,opacity,transform] duration-300 ease-out ${
              isSidebarExpanded ? 'max-w-44 opacity-100 translate-x-0' : 'max-w-0 opacity-0 -translate-x-2'
            }`}
          >
            Board<span className="text-(--text-primary)">Flow</span>
          </span>
        </div>

        <div className="relative flex-1 px-3 mt-4">
          <div
            className="absolute left-3 right-3 top-0 h-12 rounded-r-3xl rounded-l-none bg-primary/10 shadow-sm transition-transform duration-300 ease-out"
            style={{ transform: `translateY(${activeNavIndex * 3.5}rem)` }}
            aria-hidden="true"
          >
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

      <div className="flex-1 flex flex-col">
        <main className="flex-1 overflow-auto p-4 md:p-8 pb-32 md:pb-8">
          <div className="max-w-7xl mx-auto h-full relative">
            <Outlet />
            <UndoSnackbar />
          </div>
        </main>

        {/* Bottom navigation for mobile */}
        <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-(--card-bg) border-t border-(--border-color) shadow-md pb-4 portrait:pb-9">
          <div className="relative grid grid-cols-4 px-2 py-2">
            <div
              className="absolute top-2 bottom-2 rounded-t-3xl rounded-b-none bg-primary/10 shadow-sm transition-[left] duration-300 ease-out"
              style={{
                left: `calc(0.5rem + ${activeNavIndex} * ((100% - 1rem) / 4))`,
                width: 'calc((100% - 1rem) / 4)',
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
