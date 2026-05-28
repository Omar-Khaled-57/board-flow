import { useEffect, useRef, type RefObject } from 'react';

export const useClickOutside = <T extends HTMLElement>(
  enabled: boolean,
  onClose: () => void
): RefObject<T | null> => {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    if (!enabled) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [enabled, onClose]);

  return ref;
};
