import { useState, useRef, useEffect, useCallback } from 'react';
import { Type, Highlighter, Hash, Link, Sigma, X } from 'lucide-react';
import { useClickOutside } from '../hooks/useClickOutside';

interface RichInsertEditorProps {
  onInsert: (type: string, value: string) => void;
  onClose: () => void;
}

const RichInsertEditor = ({ onInsert, onClose }: RichInsertEditorProps) => {
  const [mode, setMode] = useState<'select' | 'input'>('select');
  const [selectedType, setSelectedType] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const ref = useClickOutside<HTMLDivElement>(true, onClose);

  const handleSelectType = (type: string) => {
    setSelectedType(type);
    if (type === 'tag') {
      onInsert('tag', '#tag');
      onClose();
      return;
    }
    setMode('input');
  };

  const mathContainerRef = useRef<HTMLDivElement>(null);
  const mathInitDone = useRef(false);

  useEffect(() => {
    if (selectedType !== 'math' || !mathContainerRef.current || mathInitDone.current) return;
    mathInitDone.current = true;
    const container = mathContainerRef.current;
    (async () => {
      await import('mathlive');
      const el = document.createElement('math-field') as any;
    el.setAttribute('virtual-keyboard-mode', 'manual');
    el.setAttribute('math-mode', 'math');
    el.className = 'w-full min-h-[3rem] px-3 py-2 text-sm';
    el.style.color = 'var(--text-primary)';
    el.style.background = 'transparent';
    el.style.setProperty('--mathlive-background-color', 'transparent');
    container.appendChild(el);
    const handler = () => setInputValue(el.value ?? '');
    el.addEventListener('input', handler);
    })();
  }, [selectedType]);

  const handleInsert = useCallback(() => {
    if (selectedType === 'math') {
      if (!inputValue.trim()) return;
      onInsert('math', `$${inputValue}$`);
    } else if (selectedType === 'primary-text') {
      if (!inputValue.trim()) return;
      onInsert('primary-text', `**${inputValue}**`);
    } else if (selectedType === 'highlight') {
      if (!inputValue.trim()) return;
      onInsert('highlight', `==${inputValue}==`);
    } else if (selectedType === 'link') {
      if (!inputValue.trim()) return;
      onInsert('link', `[${inputValue}](${linkUrl || inputValue})`);
    }
    setMode('select');
    setInputValue('');
    setLinkUrl('');
    onClose();
  }, [selectedType, inputValue, linkUrl, onInsert, onClose]);

  if (mode === 'input') {
    return (
      <div
        ref={ref}
        className="bg-(--card-bg) border border-(--border-color) rounded-xl shadow-lg p-4 mt-2 animate-fade-slide-down"
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-bold text-(--text-primary) capitalize">
            {selectedType === 'primary-text' ? 'Primary Color Text' :
             selectedType === 'highlight' ? 'Highlight' :
             selectedType === 'link' ? 'Link' : 'Math Equation'}
          </span>
          <button type="button" onClick={onClose} className="text-(--text-secondary) hover:text-(--text-primary)">
            <X size={16} />
          </button>
        </div>
        <div className="flex flex-col gap-2">
          {selectedType === 'math' ? (
            <div className="border border-(--border-color) rounded-xl overflow-hidden max-w-full focus-within:border-primary transition-colors bg-transparent">
              <div ref={mathContainerRef} className="max-w-full overflow-hidden text-ellipsis bg-transparent" />
            </div>
          ) : (
            <input
              type="text"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleInsert(); }}
              placeholder={
                selectedType === 'primary-text' ? 'Text to style...' :
                selectedType === 'highlight' ? 'Text to highlight...' :
                'Display name...'
              }
              className="w-full px-3 py-2 text-sm bg-(--bg-color) border border-(--border-color) rounded-xl text-(--text-primary) placeholder:text-(--text-secondary)/40 focus:outline-none focus:border-primary transition-colors"
              autoFocus
            />
          )}
          {selectedType === 'link' && (
            <input
              type="url"
              value={linkUrl}
              onChange={e => setLinkUrl(e.target.value)}
              placeholder="https://..."
              className="w-full px-3 py-2 text-sm bg-(--bg-color) border border-(--border-color) rounded-xl text-(--text-primary) placeholder:text-(--text-secondary)/40 focus:outline-none focus:border-primary transition-colors"
            />
          )}
          <div className="flex items-center justify-between gap-2">
            {selectedType === 'math' && inputValue && (
              <span className="min-w-0 text-[11px] text-(--text-secondary) opacity-60 font-mono truncate max-w-[120px]">
                ${inputValue.length > 20 ? inputValue.slice(0, 20) + '…' : inputValue}$
              </span>
            )}
            <button
              type="button"
              onClick={handleInsert}
              className="ms-auto px-4 py-2 bg-primary text-(--text-on-primary) text-sm font-bold rounded-xl hover:brightness-110 transition-all"
            >
              Insert
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className="bg-(--card-bg) border border-(--border-color) rounded-xl shadow-lg p-3 mt-2 animate-fade-slide-down"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-(--text-secondary) uppercase tracking-wider">Insert</span>
        <button type="button" onClick={onClose} className="text-(--text-secondary) hover:text-(--text-primary)">
          <X size={14} />
        </button>
      </div>
      <div className="grid grid-cols-5 gap-2">
        <button
          type="button"
          onClick={() => handleSelectType('primary-text')}
          className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-primary/10 transition-colors"
          title="Primary color text"
        >
          <Type size={18} className="text-primary" />
          <span className="text-[10px] text-(--text-secondary)">Primary</span>
        </button>
        <button
          type="button"
          onClick={() => handleSelectType('highlight')}
          className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-primary/10 transition-colors"
          title="Highlighted text"
        >
          <Highlighter size={18} className="text-primary" />
          <span className="text-[10px] text-(--text-secondary)">Highlight</span>
        </button>
        <button
          type="button"
          onClick={() => handleSelectType('tag')}
          className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-primary/10 transition-colors"
          title="Inline tag"
        >
          <Hash size={18} className="text-primary" />
          <span className="text-[10px] text-(--text-secondary)">Tag</span>
        </button>
        <button
          type="button"
          onClick={() => handleSelectType('link')}
          className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-primary/10 transition-colors"
          title="Clickable link"
        >
          <Link size={18} className="text-primary" />
          <span className="text-[10px] text-(--text-secondary)">Link</span>
        </button>
        <button
          type="button"
          onClick={() => handleSelectType('math')}
          className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-primary/10 transition-colors"
          title="Math equation"
        >
          <Sigma size={18} className="text-primary" />
          <span className="text-[10px] text-(--text-secondary)">Math</span>
        </button>
      </div>
      <p className="text-[10px] text-(--text-secondary) opacity-50 mt-2 text-center">Formatting renders after saving</p>
    </div>
  );
};

export default RichInsertEditor;
