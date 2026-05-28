import { useEffect, useState, useRef, useCallback } from 'react';
import { useTodoStore } from '../store/useTodoStore';
import { Undo2, Redo2, X } from 'lucide-react';

const KEYBOARD_THRESHOLD = 100;
/** Extra cushion above the keyboard so the snackbar is clearly visible */
const KEYBOARD_CUSHION = 40; // px

/** Bottom offset (rem) contributed by the mobile bottom nav, by orientation */
const getNavGap = (): number => {
  if (window.matchMedia('(min-width: 768px)').matches) return 2;
  if (window.matchMedia('(orientation: portrait)').matches) return 7.5;
  return 6.25;
};

const UndoSnackbar = () => {
  const [visible, setVisible] = useState(false);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [keyboardOffset, setKeyboardOffset] = useState(0);
  const [navGap, setNavGap] = useState(getNavGap);

  const pastLength = useTodoStore(state => state.past.length);
  const futureLength = useTodoStore(state => state.future.length);
  const undo = useTodoStore(state => state.undo);
  const redo = useTodoStore(state => state.redo);

  const initialMount = useRef(true);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const recalc = useCallback(() => setNavGap(getNavGap()), []);

  useEffect(() => {
    recalc();
    const mq = window.matchMedia('(min-width: 768px)');
    const orient = window.matchMedia('(orientation: portrait)');
    mq.addEventListener('change', recalc);
    orient.addEventListener('change', recalc);
    return () => {
      mq.removeEventListener('change', recalc);
      orient.removeEventListener('change', recalc);
    };
  }, [recalc]);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const update = () => {
      const diff = window.innerHeight - vv.height;
      const kbOpen = diff > KEYBOARD_THRESHOLD;
      setIsKeyboardOpen(kbOpen);
      setKeyboardOffset(kbOpen ? diff + KEYBOARD_CUSHION : 0);
    };

    vv.addEventListener('resize', update);
    update();
    return () => vv.removeEventListener('resize', update);
  }, []);

  useEffect(() => {
    if (initialMount.current) {
      initialMount.current = false;
    }

    if (pastLength === 0 && futureLength === 0) {
      setVisible(false);
      return;
    }

    setVisible(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setVisible(false);
    }, 6000);

    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [pastLength, futureLength]);

  if (!visible || (pastLength === 0 && futureLength === 0)) return null;

  return (
    <div
      className="fixed start-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 duration-300"
      style={{
        bottom: isKeyboardOpen
          ? `${keyboardOffset}px`
          : `calc(${navGap}rem + env(safe-area-inset-bottom, 0px))`,
      }}
    >
      <div className="bg-(--card-bg) border border-(--border-color) shadow-lg rounded-full px-4 py-2 flex items-center gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => { undo(); setVisible(false); }}
            disabled={pastLength === 0}
            className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            aria-label="Undo last action"
          >
            <Undo2 size={14} /> Undo
          </button>
          <div className="w-px h-4 bg-(--border-color)" />
          <button
            onClick={() => { redo(); setVisible(false); }}
            disabled={futureLength === 0}
            className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            aria-label="Redo last action"
          >
            <Redo2 size={14} /> Redo
          </button>
        </div>
        <button
          onClick={() => setVisible(false)}
          className="text-(--text-secondary) hover:text-(--text-primary) ms-1 transition-colors"
          aria-label="Close undo bar"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
};

export default UndoSnackbar;
