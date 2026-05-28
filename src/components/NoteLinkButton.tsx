import { useState, useRef, useEffect } from 'react';
import { Link, Unlink } from 'lucide-react';
import { useNotesStore } from '../store/useNotesStore';
import { useTodoStore } from '../store/useTodoStore';

interface NoteLinkButtonProps {
  noteId: string;
}

const NoteLinkButton = ({ noteId }: NoteLinkButtonProps) => {
  const note = useNotesStore(state => state.notes.find(n => n.id === noteId));
  const updateNote = useNotesStore(state => state.updateNote);
  const todos = useTodoStore(state => state.todos);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  if (!note) return null;

  const handleUnlink = () => {
    updateNote(noteId, { linkedTaskId: undefined });
    setOpen(false);
  };

  const handleLink = (taskId: string) => {
    updateNote(noteId, { linkedTaskId: taskId });
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`w-9 h-9 rounded-full flex items-center justify-center transition-all shadow-md ${
          note.linkedTaskId
            ? 'bg-primary text-(--text-on-primary)'
            : 'bg-(--card-bg) border border-(--border-color) text-primary hover:bg-primary/10'
        }`}
        title={note.linkedTaskId ? 'Linked to a task' : 'Link to task'}
        aria-label="Link note to task"
      >
        {note.linkedTaskId ? <Unlink size={15} /> : <Link size={15} />}
      </button>
      {open && (
        <div className="absolute bottom-full mb-2 end-0 w-64 bg-(--card-bg) border border-(--border-color) rounded-xl shadow-lg p-3 z-50 animate-fade-slide-down">
          <div className="text-xs font-bold text-(--text-secondary) uppercase mb-2">
            {note.linkedTaskId ? 'Linked Task' : 'Link to a Task'}
          </div>
          {note.linkedTaskId ? (
            <div className="flex flex-col gap-2">
              <p className="text-sm text-(--text-primary) truncate">
                {todos.find(t => t.id === note.linkedTaskId)?.title || 'Unknown task'}
              </p>
              <button
                type="button"
                onClick={handleUnlink}
                className="text-xs text-danger font-bold hover:underline"
              >
                Unlink
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-1 max-h-36 overflow-y-auto">
              {todos.length === 0 ? (
                <p className="text-xs text-(--text-secondary)">No tasks available</p>
              ) : (
                todos.map(task => (
                  <button
                    key={task.id}
                    type="button"
                    onClick={() => handleLink(task.id)}
                    className="text-left text-sm text-(--text-primary) px-2 py-1.5 rounded-lg hover:bg-primary/10 transition-colors truncate"
                  >
                    {task.title}
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NoteLinkButton;
