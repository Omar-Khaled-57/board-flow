import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, Tag as TagIcon, Trash2, Edit2, Flag, GripVertical } from 'lucide-react';
import { Note } from '../types';
import { useNotesStore } from '../store/useNotesStore';
import { formatTaskDate, formatTaskTime } from '../utils/dateFormat';

interface NoteItemProps {
  note: Note;
  isDragging?: boolean;
  onPointerDown?: (e: React.PointerEvent, id: string) => void;
}

const NoteItem = ({ note, isDragging, onPointerDown }: NoteItemProps) => {
  const deleteNote = useNotesStore(state => state.deleteNote);
  const navigate = useNavigate();
  const [showActions] = useState(false);

  const preview = useMemo(() => {
    const text = note.content.replace(/[#$*=`\[\]_~>]/g, '').trim();
    if (text.length <= 120) return text;
    return text.slice(0, 120).trimEnd() + '...';
  }, [note.content]);

  const createdAtStr = useMemo(() => formatTaskDate(note.createdAt), [note.createdAt]);
  const createdTimeStr = useMemo(() => formatTaskTime(note.createdAt), [note.createdAt]);
  const updatedAtStr = useMemo(() => formatTaskDate(note.updatedAt), [note.updatedAt]);
  const updatedTimeStr = useMemo(() => formatTaskTime(note.updatedAt), [note.updatedAt]);

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
      {/* Section 1: Grip + Title + metadata (left) | Actions (right) */}
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
            <span className="flex items-center gap-1 text-[11px] text-(--text-secondary) opacity-60 shrink-0 whitespace-nowrap">
              <Calendar size={11} />
              {createdAtStr}
            </span>
            <span className="flex items-center gap-1 text-[11px] text-(--text-secondary) opacity-60 shrink-0 whitespace-nowrap">
              <Clock size={11} />
              {createdTimeStr}
            </span>
            <span className="text-[11px] text-(--text-secondary) opacity-40 shrink-0">·</span>
            <span className="flex items-center gap-1 text-[11px] text-(--text-secondary) opacity-60 truncate">
              edited {updatedAtStr} {updatedTimeStr}
            </span>
          </div>
        </div>
        </div>
        <div className={`flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ${showActions ? 'opacity-100' : ''}`}>
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

      {/* Divider */}
      <div className="mx-5 h-px bg-primary/20" />

      {/* Section 2: Content preview */}
      {preview && (
        <div className="px-5 py-3">
          <p className="text-sm text-(--text-secondary) truncate">
            {preview}
          </p>
        </div>
      )}

      {/* Divider */}
      {(note.tags.length > 0 || note.dueDate || (note.priority && note.priority !== 'medium')) && (
        <div className="mx-5 h-px bg-primary/20" />
      )}

      {/* Section 3: Footer (Date, Time, Priority, Tags) */}
      {(note.tags.length > 0 || note.dueDate || (note.priority && note.priority !== 'medium')) && (
        <div className="px-5 py-3 flex items-center gap-2 overflow-x-auto min-w-0 hide-scrollbar">
          {note.dueDate && (
            <span className="flex items-center gap-1 text-[11px] font-semibold text-(--color-primary) bg-(--color-primary-light) dark:text-[#64B5F6] dark:bg-[#64B5F6]/12 dark:border-[#64B5F6]/22 border border-transparent px-2 py-1 rounded-md shrink-0">
              <Calendar size={12} />
              {formatTaskDate(note.dueDate)}
            </span>
          )}
          {note.dueDate && formatTaskTime(note.dueDate) && (
            <span className="flex items-center gap-1 text-[11px] font-semibold text-(--color-primary) bg-(--color-primary-light) dark:text-[#64B5F6] dark:bg-[#64B5F6]/12 dark:border-[#64B5F6]/22 border border-transparent px-2 py-1 rounded-md shrink-0">
              <Clock size={12} />
              {formatTaskTime(note.dueDate)}
            </span>
          )}
          {note.priority && note.priority !== 'medium' && (
            <span className={`flex items-center gap-1 text-[11px] px-2 py-1 rounded-md capitalize font-semibold border border-transparent shrink-0 ${
              note.priority === 'high'
                ? 'badge-danger dark:bg-[#EF5350]/12 dark:text-[#EF5350] dark:border-[#EF5350]/22'
                : 'badge-success dark:bg-[#66BB6A]/12 dark:text-[#66BB6A] dark:border-[#66BB6A]/22'
            }`}>
              <Flag size={12} />
              {note.priority}
            </span>
          )}
          {note.tags.map(tag => (
            <span
              key={tag}
              className="flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-md tag-pill text-primary shrink-0"
            >
              <TagIcon size={12} />
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default NoteItem;
