import { useState, useCallback, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { useClickOutside } from '../hooks/useClickOutside';

interface SortDropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}

const SortDropdown = ({ value, onChange, options }: SortDropdownProps) => {
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);
  const close = useCallback(() => setOpen(false), []);
  const containerRef = useClickOutside<HTMLDivElement>(open, close);

  const selected = options.find(o => o.value === value);

  useEffect(() => {
    if (open) setHighlighted(options.findIndex(o => o.value === value));
  }, [open, options, value]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === 'Enter' || e.key === 'ArrowDown') {
        setOpen(true);
        e.preventDefault();
      }
      return;
    }
    switch (e.key) {
      case 'ArrowDown':
        setHighlighted(i => Math.min(i + 1, options.length - 1));
        e.preventDefault();
        break;
      case 'ArrowUp':
        setHighlighted(i => Math.max(i - 1, 0));
        e.preventDefault();
        break;
      case 'Enter':
        if (highlighted >= 0) {
          onChange(options[highlighted].value);
          close();
        }
        e.preventDefault();
        break;
      case 'Escape':
        close();
        e.preventDefault();
        break;
    }
  };

  return (
    <div className="relative flex" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        onKeyDown={handleKeyDown}
        className="text-sm font-bold text-primary bg-transparent outline-none cursor-pointer flex items-center gap-1 drop-shadow-[0_0_4px_var(--color-primary)] whitespace-nowrap"
      >
        {selected?.label}
        <ChevronDown size={12} className={`text-primary opacity-70 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      <div
        className={`absolute end-0 top-full mt-1.5 min-w-[150px] bg-(--card-bg) border border-(--border-color) rounded-xl shadow-lg shadow-[var(--shadow-color)] p-1 z-50 origin-inline-end transition-all duration-200 ${
          open
            ? 'opacity-100 scale-100 visible pointer-events-auto'
            : 'opacity-0 scale-95 invisible pointer-events-none'
        } overflow-hidden`}
      >
        {options.map(opt => (
          <button
            key={opt.value}
            type="button"
            onMouseDown={() => { onChange(opt.value); close(); }}
            onMouseEnter={() => setHighlighted(options.indexOf(opt))}
            className={`w-full text-start px-3 py-1.5 text-sm rounded-lg transition-colors ${
              opt.value === value
                ? 'bg-primary/15 text-primary font-bold'
                : 'text-(--text-primary) hover:bg-(--bg-color)'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default SortDropdown;
