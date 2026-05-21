import { useEffect } from 'react';
import { useTodoStore } from '../store/useTodoStore';

export const useTheme = () => {
  const settings = useTodoStore((state) => state.settings);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    if (settings.theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(settings.theme);
    }

    // Apply accent color
    root.style.setProperty('--color-primary', settings.accentColor);
  }, [settings.theme, settings.accentColor]);
};
