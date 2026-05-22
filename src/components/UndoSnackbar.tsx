import { useEffect, useState, useRef } from 'react';
import { useTodoStore } from '../store/useTodoStore';
import { Undo2, Redo2, X } from 'lucide-react';

const UndoSnackbar = () => {
  const [visible, setVisible] = useState(false);
  const pastLength = useTodoStore(state => state.past.length);
  const futureLength = useTodoStore(state => state.future.length);
  const undo = useTodoStore(state => state.undo);
  const redo = useTodoStore(state => state.redo);

  const initialMount = useRef(true);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (initialMount.current) {
      initialMount.current = false;
      return;
    }

    if (pastLength > 0 || futureLength > 0) {
      setVisible(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        setVisible(false);
      }, 6000);
    }

    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [pastLength, futureLength]);

  if (!visible || (pastLength === 0 && futureLength === 0)) return null;

  return (
    <div className="
      fixed left-1/2 -translate-x-1/2 z-50
      bottom-[7rem] portrait:bottom-[8.5rem] md:bottom-8
      animate-in slide-in-from-bottom-4 duration-300
    ">
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
          className="text-(--text-secondary) hover:text-(--text-primary) ml-1 transition-colors"
          aria-label="Close undo bar"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
};

export default UndoSnackbar;
