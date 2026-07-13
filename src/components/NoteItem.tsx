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
    if (text.length <= 140) return text;
    return text.slice(0, 140).trimEnd() + '…';
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

  const hasMeta = note.tags.length > 0 || note.dueDate || (note.priority && note.priority !== 'medium');

  return (
    <div
      data-noteid={note.id}
      onClick={() => navigate(`/notes/${note.id}`)}
      className={`group relative bg-(--card-bg) border rounded-xl overflow-hidden min-w-0 transition-[transform,box-shadow,border-color] duration-200 ease-out cursor-pointer note-item ${
        isDragging
          ? 'border-primary/40 shadow-lg shadow-primary/10 opacity-50 scale-[1.02]'
          : 'border-(--border-color) hover:-translate-y-0.5 hover:shadow-md hover:border-primary/25'
      }`}
    >
      {/* Left accent bar */}
      <div className="absolute inset-y-0 start-0 w-[3px] bg-gradient-to-b from-primary/60 via-primary/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-s-xl" />

      <div className="px-5 pt-4 pb-3 flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5 min-w-0 flex-1">
          <button
            type="button"
            onPointerDown={handleGripPointerDown}
            className="mt-1 text-(--text-secondary) opacity-0 group-hover:opacity-40 hover:!opacity-70 transition-opacity touch-none cursor-grab active:cursor-grabbing shrink-0"
            title="Drag to reorder"
            aria-label="Drag to reorder"
          >
            <GripVertical size={16} />
          </button>
          <div className="min-w-0 flex-1">
            <h3 className="text-[15px] font-bold text-(--text-primary) truncate leading-snug">
              {note.title || <span className="text-(--text-secondary) italic opacity-50">Untitled</span>}
            </h3>
            <div className="flex items-center gap-x-2.5 gap-y-1 mt-1 min-w-0 overflow-hidden">
              <MetaDate date={note.createdAt} />
              <span className="text-[11px] text-(--text-secondary) opacity-30 shrink-0">·</span>
              <span className="text-[11px] text-(--text-secondary) opacity-50 truncate">
                edited <MetaDate date={note.updatedAt} />
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 shrink-0">
          <button
            type="button"
            onClick={handleEdit}
            className="text-(--text-secondary) hover:text-primary p-1.5 rounded-lg hover:bg-primary/10 transition-all duration-200"
            title="Edit note"
            aria-label="Edit note"
          >
            <Edit2 size={14} />
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="text-(--text-secondary) hover:text-danger p-1.5 rounded-lg hover:bg-danger/10 transition-all duration-200"
            title="Delete note"
            aria-label="Delete note"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {preview && (
        <div className="px-5 pb-3 ps-[3.25rem]">
          <p className="text-[13px] text-(--text-secondary) leading-relaxed line-clamp-2">
            {preview}
          </p>
        </div>
      )}

      {hasMeta && (
        <div className="mx-5 mb-3 ps-[2.75rem] flex items-center gap-1.5 overflow-x-auto min-w-0 hide-scrollbar">
          {note.dueDate && <DateBadge date={note.dueDate} />}
          {note.priority && note.priority !== 'medium' && <PriorityBadge priority={note.priority} />}
          {note.tags.map(tag => <TagBadge key={tag} tag={tag} />)}
        </div>
      )}
    </div>
  );
};

export default NoteItem;
