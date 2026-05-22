import { useEffect, useLayoutEffect } from 'react';
import { useTodoStore } from '../store/useTodoStore';

const themeVars: Record<string, Record<string, string>> = {
  light: {
    '--bg-color': '#FFF5F9',
    '--card-bg': '#FFFFFF',
    '--text-primary': '#1A1A1A',
    '--text-secondary': '#8B95A5',
    '--border-color': '#F0D8E8',
    '--shadow-color': 'rgba(232, 74, 151, 0.10)',
    '--text-completed': '#BCC5D3',
  },
  dark: {
    '--bg-color': '#1A1A1A',
    '--card-bg': '#222227',
    '--text-primary': '#FFF5F9',
    '--text-secondary': '#9B8FA5',
    '--border-color': 'color-mix(in srgb, var(--color-primary) 20%, transparent)',
    '--shadow-color': 'rgba(0, 0, 0, 0.5)',
    '--text-completed': '#4A3A52',
  },
};

const applyTheme = (theme: string, accentColor: string) => {
  const root = window.document.documentElement;
  root.classList.remove('light', 'dark');

  let finalTheme = theme;
  if (theme === 'system') {
    finalTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  root.classList.add(finalTheme);

  // Apply theme CSS vars as inline styles to override the inline script's initial values
  const vars = themeVars[finalTheme];
  for (const [key, val] of Object.entries(vars)) {
    root.style.setProperty(key, val);
  }

  let finalAccent = accentColor || '#5b6af0';
  if (finalAccent.toLowerCase() === '#f5f5f5') {
    finalAccent = finalTheme === 'dark' ? '#ffffff' : '#111827';
  }

  root.style.setProperty('--color-primary', finalAccent);

  const hex = finalAccent.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16) || 0;
  const g = parseInt(hex.substring(2, 4), 16) || 0;
  const b = parseInt(hex.substring(4, 6), 16) || 0;
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;

  const textOnPrimary = brightness > 155 ? '#111827' : '#ffffff';
  const textOnPrimaryRGB = brightness > 155 ? '17, 24, 39' : '255, 255, 255';
  root.style.setProperty('--text-on-primary', textOnPrimary);
  root.style.setProperty('--text-on-primary-rgb', textOnPrimaryRGB);

  // Compute a readable tag text color — darken bright accents so they're visible on white cards
  let tagTextColor = finalAccent;
  if (finalTheme === 'light' && brightness > 155) {
    const f = 0.5; // darken factor
    const tr = Math.round(r * f);
    const tg = Math.round(g * f);
    const tb = Math.round(b * f);
    tagTextColor = `#${((tr << 16) | (tg << 8) | tb).toString(16).padStart(6, '0')}`;
  }
  root.style.setProperty('--color-primary-readable', tagTextColor);
};

export const useTheme = () => {
  const settings = useTodoStore((state) => state.settings);

  // Use useLayoutEffect so theme applies synchronously before paint
  useLayoutEffect(() => {
    applyTheme(settings.theme, settings.accentColor);
  }, [settings.theme, settings.accentColor]);

  // Listen for system theme changes when in 'system' mode
  useEffect(() => {
    if (settings.theme !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => applyTheme('system', settings.accentColor);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [settings.theme, settings.accentColor]);
};
