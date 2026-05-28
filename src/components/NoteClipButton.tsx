import { useRef, useState } from 'react';
import { Paperclip, X, Image, FileText, Video } from 'lucide-react';
import { useNotesStore } from '../store/useNotesStore';
import { NoteAttachment } from '../types';

interface NoteClipButtonProps {
  noteId: string;
}

const NoteClipButton = ({ noteId }: NoteClipButtonProps) => {
  const note = useNotesStore(state => state.notes.find(n => n.id === noteId));
  const updateNote = useNotesStore(state => state.updateNote);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  if (!note) return null;

  const handleFileSelect = (fileType: NoteAttachment['type']) => {
    const input = document.createElement('input');
    input.type = 'file';
    if (fileType === 'image') input.accept = 'image/*';
    else if (fileType === 'video') input.accept = 'video/*';
    else if (fileType === 'document') input.accept = '.pdf,.doc,.docx,.txt,.md';
    input.multiple = false;

    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;

      const attachment: NoteAttachment = {
        id: Date.now().toString(36),
        type: fileType,
        name: file.name,
        path: URL.createObjectURL(file),
        size: file.size,
      };

      updateNote(note.id, {
        attachments: [...(note.attachments || []), attachment],
      });
      setOpen(false);
    };

    input.click();
  };

  const handleRemoveAttachment = (attId: string) => {
    const att = note.attachments?.find(a => a.id === attId);
    if (att) URL.revokeObjectURL(att.path);
    updateNote(note.id, {
      attachments: (note.attachments || []).filter(a => a.id !== attId),
    });
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-9 h-9 rounded-full flex items-center justify-center bg-(--card-bg) border border-(--border-color) text-primary hover:bg-primary/10 transition-all shadow-md"
        title="Attach file"
        aria-label="Attach file"
      >
        <Paperclip size={15} />
      </button>

      {open && (
        <div className="absolute bottom-full mb-2 end-0 w-56 bg-(--card-bg) border border-(--border-color) rounded-xl shadow-lg p-3 z-50 animate-fade-slide-down">
          <div className="text-xs font-bold text-(--text-secondary) uppercase mb-2">Attach</div>
          <div className="flex flex-col gap-1">
            <button
              type="button"
              onClick={() => handleFileSelect('image')}
              className="flex items-center gap-2 px-2 py-2 text-sm text-(--text-primary) rounded-lg hover:bg-primary/10 transition-colors"
            >
              <Image size={16} className="text-primary" />
              Image
            </button>
            <button
              type="button"
              onClick={() => handleFileSelect('video')}
              className="flex items-center gap-2 px-2 py-2 text-sm text-(--text-primary) rounded-lg hover:bg-primary/10 transition-colors"
            >
              <Video size={16} className="text-primary" />
              Video
            </button>
            <button
              type="button"
              onClick={() => handleFileSelect('document')}
              className="flex items-center gap-2 px-2 py-2 text-sm text-(--text-primary) rounded-lg hover:bg-primary/10 transition-colors"
            >
              <FileText size={16} className="text-primary" />
              Document
            </button>
          </div>
        </div>
      )}

      {note.attachments && note.attachments.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {note.attachments.map(att => (
            <div
              key={att.id}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-primary/5 border border-primary/10 rounded-lg text-xs text-(--text-primary)"
            >
              {att.type === 'image' && <Image size={12} className="text-primary" />}
              {att.type === 'video' && <Video size={12} className="text-primary" />}
              {att.type === 'document' && <FileText size={12} className="text-primary" />}
              <span className="max-w-[100px] truncate">{att.name}</span>
              <button
                type="button"
                onClick={() => handleRemoveAttachment(att.id)}
                className="text-(--text-secondary) hover:text-danger transition-colors"
              >
                <X size={11} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NoteClipButton;
