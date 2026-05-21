import { Outlet, NavLink } from 'react-router-dom';
import { Home, Calendar, BarChart2, Settings } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import UndoSnackbar from './UndoSnackbar';
import useNotificationScheduler from '../hooks/useNotificationScheduler';

const Layout = () => {
  useTheme(); // apply theme classes
  // Register the event‑driven notification scheduler
  useNotificationScheduler();

  const navItems = [
    { to: '/', icon: Home, label: 'Tasks' },
    { to: '/calendar', icon: Calendar, label: 'Calendar' },
    { to: '/stats', icon: BarChart2, label: 'Stats' },
    { to: '/options', icon: Settings, label: 'Options' },
  ];

  return (
    <div className="flex min-h-screen bg-(--bg-color) text-(--text-primary)">
      {/* Sidebar for desktop / large tablets */}
      <nav className="hidden md:flex w-20 lg:w-64 shrink-0 bg-(--card-bg) border-r border-(--border-color) flex-col transition-all duration-300 shadow-md">
        <div className="p-4 flex items-center justify-center lg:justify-start gap-3 border-b border-(--border-color) mb-2">
          <div className="w-10 h-10 shrink-0 rounded-2xl bg-primary/20 text-primary flex items-center justify-center font-black text-lg shadow-sm">
            BF
          </div>
          <span className="hidden lg:block font-black text-2xl tracking-tight text-primary">
            Board<span className="text-(--text-primary)">Flow</span>
          </span>
        </div>

        <div className="flex-1 px-3 space-y-2 mt-4">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center p-3 rounded-2xl transition-all duration-200 relative group overflow-hidden ${
                  isActive
                    ? 'bg-primary/10 text-primary font-bold shadow-sm'
                    : 'text-(--text-secondary) hover:bg-white/50 dark:hover:bg-white/5 hover:text-(--text-primary) font-medium'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon size={22} className={`shrink-0 z-10 transition-colors ${isActive ? "text-primary" : "group-hover:text-primary/70"}`} />
                  <span className={`hidden lg:block ml-3 z-10 transition-colors ${isActive ? "text-primary" : "group-hover:text-primary/70"}`}>{item.label}</span>
                  {isActive && (
                    <div className="absolute inset-y-0 left-0 w-1 bg-primary rounded-r-full" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      <div className="flex-1 flex flex-col">
        <main className="flex-1 overflow-auto p-4 md:p-8 pb-24 md:pb-8">
          <div className="max-w-5xl mx-auto h-full relative">
            <Outlet />
            <UndoSnackbar />
          </div>
        </main>

        {/* Bottom navigation for mobile */}
        <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-(--card-bg) border-t border-(--border-color) shadow-md">
          <div className="flex items-center justify-between px-2 py-2">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex-1 flex flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 transition-all duration-200 ${
                    isActive
                      ? 'text-primary'
                      : 'text-(--text-secondary) hover:text-(--text-primary)'
                  }`
                }
              >
                <item.icon size={20} />
                <span className="text-[10px] leading-none">{item.label}</span>
              </NavLink>
            ))}
          </div>
        </nav>
      </div>
    </div>
  );
};

export default Layout;
