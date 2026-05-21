import { useEffect, useState, useRef } from 'react';
import { useTodoStore } from '../store/useTodoStore';
import { Undo2, Redo2, X } from 'lucide-react';

const UndoSnackbar = () => {
  const [visible, setVisible] = useState(false);
  const undo = useTodoStore(state => state.undo);
  const redo = useTodoStore(state => state.redo);
  const pastLength = useTodoStore(state => state.past.length);
  const futureLength = useTodoStore(state => state.future.length);
  
  const initialMount = useRef(true);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (initialMount.current) {
      initialMount.current = false;
      return;
    }

    // Show snackbar when past/future changes
    if (pastLength > 0 || futureLength > 0) {
      setVisible(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        setVisible(false);
      }, 6000);
    }
  }, [pastLength, futureLength]);

  if (!visible || (pastLength === 0 && futureLength === 0)) return null;

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 bg-(--card-bg) border border-(--border-color) shadow-lg rounded-full px-4 py-1.5 flex items-center gap-3 z-50 animate-in slide-in-from-top-5">
      <div className="flex items-center gap-3">
        <button 
          onClick={() => { undo(); setVisible(false); }}
          disabled={pastLength === 0}
          className="flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary-hover disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Undo2 size={14} /> Undo
        </button>
        <div className="w-px h-4 bg-(--border-color)"></div>
        <button 
          onClick={() => { redo(); setVisible(false); }}
          disabled={futureLength === 0}
          className="flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary-hove disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Redo2 size={14} /> Redo
        </button>
      </div>
      <button onClick={() => setVisible(false)} className="text-gray-400 hover:text-gray-600 ml-1" title="Close">
        <X size={14} />
      </button>
    </div>
  );
};

export default UndoSnackbar;
