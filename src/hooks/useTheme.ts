import { useEffect } from 'react';
import { useTodoStore } from '../store/useTodoStore';

export const useTheme = () => {
  const settings = useTodoStore((state) => state.settings);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    let finalTheme = settings.theme;
    if (settings.theme === 'system') {
      finalTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    
    root.classList.add(finalTheme);

    let finalAccent = settings.accentColor;
    // Handle the white theme switching
    if (finalAccent.toLowerCase() === '#f5f5f5') {
      finalAccent = finalTheme === 'dark' ? '#ffffff' : '#111827';
    }

    // Apply accent color
    root.style.setProperty('--color-primary', finalAccent);

    // Calculate contrasting text color for the header
    const hex = finalAccent.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16) || 0;
    const g = parseInt(hex.substring(2, 4), 16) || 0;
    const b = parseInt(hex.substring(4, 6), 16) || 0;
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    
    // If background is very light, use off-black text, otherwise white
    const textOnPrimary = brightness > 155 ? '#111827' : '#ffffff';
    const textOnPrimaryRGB = brightness > 155 ? '17, 24, 39' : '255, 255, 255';
    root.style.setProperty('--text-on-primary', textOnPrimary);
    root.style.setProperty('--text-on-primary-rgb', textOnPrimaryRGB);
  }, [settings.theme, settings.accentColor]);
};
