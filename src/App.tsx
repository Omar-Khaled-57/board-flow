import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import CalendarPage from './pages/CalendarPage';
import StatsPage from './pages/StatsPage';
import Options from './pages/Options';
import SplashScreen from './components/SplashScreen';

function App() {
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
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="calendar" element={<CalendarPage />} />
          <Route path="stats" element={<StatsPage />} />
          <Route path="options" element={<Options />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
