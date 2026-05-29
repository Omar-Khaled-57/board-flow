import { useEffect, useState, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useTheme } from './hooks/useTheme';
import Layout from './components/Layout';
const Tasks = lazy(() => import('./pages/Tasks'));
const NotesPage = lazy(() => import('./pages/NotesPage'));
const NoteDetails = lazy(() => import('./pages/NoteDetails'));
const CalendarPage = lazy(() => import('./pages/CalendarPage'));
const StatsPage = lazy(() => import('./pages/StatsPage'));
const Options = lazy(() => import('./pages/Options'));
import SplashScreen from './components/SplashScreen';
import { isPermissionGranted, requestPermission } from '@tauri-apps/plugin-notification';

function App() {
  useTheme();

  // Request notification permissions on first launch
  useEffect(() => {
    const requestPermissions = async () => {
      try {
        let permissionGranted = await isPermissionGranted();
        if (!permissionGranted) {
          await requestPermission();
        }
      } catch {
        // Tauri not available — try web notification API
        if ('Notification' in window && Notification.permission === 'default') {
          Notification.requestPermission();
        }
      }
    };
    requestPermissions();
  }, []);

  const [showSplash, setShowSplash] = useState(() => {
    try {
      return !localStorage.getItem('hasSeenSplash');
    } catch {
      return false;
    }
  });

  if (showSplash) {
    return <SplashScreen onComplete={() => {
      try {
        localStorage.setItem('hasSeenSplash', 'true');
      } catch {
        // localStorage unavailable — continue silently
      }
      setShowSplash(false);
    }} />;
  }

  return (
    <BrowserRouter>
      <Suspense fallback={null}>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Tasks />} />
            <Route path="notes" element={<NotesPage />} />
            <Route path="notes/:id" element={<NoteDetails />} />
            <Route path="calendar" element={<CalendarPage />} />
            <Route path="stats" element={<StatsPage />} />
            <Route path="options" element={<Options />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
