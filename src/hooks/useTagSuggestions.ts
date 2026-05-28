import { useState, useMemo, useCallback, type RefObject } from 'react';
import { useClickOutside } from './useClickOutside';

export interface TagSuggestionState {
  open: boolean;
  index: number;
  prefix: string;
  filtered: string[];
}

export const useTagSuggestions = (
  allTags: string[],
  inputRef?: RefObject<HTMLInputElement | null>
) => {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(-1);
  const [prefix, setPrefix] = useState('');

  const close = useCallback(() => { setOpen(false); setIndex(-1); }, []);
  const containerRef = useClickOutside<HTMLDivElement>(open, close);

  const filtered = useMemo(() => {
    if (!open || !prefix) return [];
    return allTags.filter(t => t.toLowerCase().startsWith(prefix));
  }, [allTags, prefix, open]);

  const handleInputChange = useCallback((value: string, cursorPos: number) => {
    const beforeCursor = value.slice(0, cursorPos);
    const hashIdx = beforeCursor.lastIndexOf('#');
    if (hashIdx !== -1) {
      const afterHash = beforeCursor.slice(hashIdx + 1);
      if (afterHash.indexOf(' ') === -1 && afterHash.length > 0) {
        setPrefix(afterHash.toLowerCase());
        setOpen(true);
        setIndex(0);
        return;
      }
    }
    setOpen(false);
  }, []);

  const insertSuggestion = useCallback((tagName: string, currentInput: string, cursorPos: number) => {
    const beforeCursor = currentInput.slice(0, cursorPos);
    const hashIdx = beforeCursor.lastIndexOf('#');
    if (hashIdx === -1) return currentInput;

    const afterHash = beforeCursor.slice(hashIdx + 1);
    const wordEnd = afterHash.search(/\s/);
    const replaceLen = wordEnd === -1 ? afterHash.length : wordEnd;

    const newInput =
      currentInput.slice(0, hashIdx + 1) +
      tagName +
      currentInput.slice(hashIdx + 1 + replaceLen);
    close();
    inputRef?.current?.focus();
    return newInput;
  }, [close, inputRef]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent, onSelect?: (tag: string) => void) => {
    if (!open || filtered.length === 0) return false;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setIndex(i => Math.min(i + 1, filtered.length - 1));
      return true;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setIndex(i => Math.max(i - 1, 0));
      return true;
    }
    if (e.key === 'Enter' || e.key === 'Tab') {
      if (index >= 0 && index < filtered.length) {
        e.preventDefault();
        onSelect?.(filtered[index]);
        return true;
      }
    }
    if (e.key === 'Escape') {
      close();
      e.preventDefault();
      return true;
    }
    return false;
  }, [open, filtered, index, close]);

  return {
    open,
    index,
    prefix,
    filtered,
    containerRef,
    setOpen,
    setIndex,
    setPrefix,
    handleInputChange,
    insertSuggestion,
    handleKeyDown,
    close,
  };
};
