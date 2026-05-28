import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, Edit2, GripVertical } from 'lucide-react';
import { Note } from '../types';
import { useNotesStore } from '../store/useNotesStore';
import { DateBadge, MetaDate, PriorityBadge, TagBadge } from './Badge';

interface NoteItemProps {
  note: Note;
  isDragging?: boolean;
  onPointerDown?: (e: React.PointerEvent, id: string) => void;
}

const NoteItem = ({ note, isDragging, onPointerDown }: NoteItemProps) => {
  const deleteNote = useNotesStore(state => state.deleteNote);
  const navigate = useNavigate();

  const preview = useMemo(() => {
    const text = note.content.replace(/[#$*=`\[\]_~>]/g, '').trim();
    if (text.length <= 120) return text;
    return text.slice(0, 120).trimEnd() + '...';
  }, [note.content]);

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteNote(note.id);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/notes/${note.id}`);
  };

  const handleGripPointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    onPointerDown?.(e, note.id);
  };

  return (
    <div
      data-noteid={note.id}
      onClick={() => navigate(`/notes/${note.id}`)}
      className={`group bg-(--card-bg) border rounded-xl shadow-sm transition-all duration-200 cursor-pointer overflow-hidden min-w-0 ${
        isDragging
          ? 'border-primary/40 shadow-lg shadow-primary/10 opacity-50 scale-[1.02]'
          : 'border-(--border-color) hover:shadow-md'
      }`}
    >
      <div className="px-5 pt-4 pb-3 flex items-start justify-between gap-3">
        <div className="flex items-start gap-2 min-w-0 flex-1">
          <button
            type="button"
            onPointerDown={handleGripPointerDown}
            className="mt-0.5 text-(--text-secondary) opacity-30 hover:opacity-60 transition-opacity touch-none cursor-grab active:cursor-grabbing shrink-0"
            title="Drag to reorder"
            aria-label="Drag to reorder"
          >
            <GripVertical size={16} />
          </button>
          <div className="min-w-0 flex-1">
          <h3 className="text-base font-bold text-(--text-primary) truncate">
            {note.title || <span className="text-(--text-secondary) opacity-50">Untitled</span>}
          </h3>
          <div className="flex items-center gap-x-3 gap-y-1 mt-1.5 min-w-0 overflow-hidden">
            <MetaDate date={note.createdAt} />
            <span className="text-[11px] text-(--text-secondary) opacity-40 shrink-0">·</span>
            <span className="text-[11px] text-(--text-secondary) opacity-60 truncate">
              edited <MetaDate date={note.updatedAt} />
            </span>
          </div>
        </div>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button
            type="button"
            onClick={handleEdit}
            className="text-(--text-secondary) hover:text-primary transition-colors p-1"
            title="Edit note"
            aria-label="Edit note"
          >
            <Edit2 size={14} />
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="text-(--text-secondary) hover:text-danger transition-colors p-1"
            title="Delete note"
            aria-label="Delete note"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <div className="mx-5 h-px bg-primary/20" />

      {preview && (
        <div className="px-5 py-3">
          <p className="text-sm text-(--text-secondary) truncate">
            {preview}
          </p>
        </div>
      )}

      {(note.tags.length > 0 || note.dueDate || (note.priority && note.priority !== 'medium')) && (
        <div className="mx-5 h-px bg-primary/20" />
      )}

      {(note.tags.length > 0 || note.dueDate || (note.priority && note.priority !== 'medium')) && (
        <div className="px-5 py-3 flex items-center gap-2 overflow-x-auto min-w-0 hide-scrollbar">
          {note.dueDate && <DateBadge date={note.dueDate} />}
          {note.priority && note.priority !== 'medium' && <PriorityBadge priority={note.priority} />}
          {note.tags.map(tag => <TagBadge key={tag} tag={tag} />)}
        </div>
      )}
    </div>
  );
};

export default NoteItem;
