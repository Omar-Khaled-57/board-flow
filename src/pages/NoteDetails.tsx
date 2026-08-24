import { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Edit2, Trash2, Plus, Tag as TagIcon, X, Save, Calendar, Clock, Flag } from 'lucide-react';
import { useNotesStore } from '../store/useNotesStore';
import { Note } from '../types';
import { formatTaskDate, formatTaskTime } from '../utils/dateFormat';
import { parseTaskInput, extractHashtags } from '../utils/nlp';
import katex from 'katex';
import RichInsertEditor from '../components/RichInsertEditor';
import NoteLinkButton from '../components/NoteLinkButton';
import NoteClipButton from '../components/NoteClipButton';

const renderNoteContent = (content: string) => {
  const mathHtml: string[] = [];

  // Display math: $$...$$  (must come before inline to avoid double-match)
  const withDisplayMath = content.replace(/\$\$([^$]+)\$\$/g, (_, eq: string) => {
    try {
      const rendered = katex.renderToString(eq.trim(), { 
        throwOnError: false, 
        displayMode: true,
        macros: { '\\placeholder': '\\square' }
      });
      const ph = `\x00MATH${mathHtml.length}\x00`;
      mathHtml.push(`<span style="display:block;width:fit-content;max-width:100%;overflow-x:auto;overflow-y:hidden;margin:0 auto;padding:0.25rem 0;">${rendered}</span>`);
      return ph;
    } catch {
      const ph = `\x00MATH${mathHtml.length}\x00`;
      mathHtml.push(`<span style="color:var(--color-primary);font-style:italic">$$${eq}$$</span>`);
      return ph;
    }
  });

  // Inline math: $...$
  const withPlaceholders = withDisplayMath.replace(/\$([^$\n]+)\$/g, (_, eq: string) => {
    try {
      const rendered = katex.renderToString(eq.trim(), { 
        throwOnError: false, 
        displayMode: false,
        macros: { '\\placeholder': '\\square' }
      });
      const ph = `\x00MATH${mathHtml.length}\x00`;
      mathHtml.push(`<span style="display:inline-block;width:fit-content;overflow:hidden; vertical-align:middle;">${rendered}</span>`);
      return ph;
    } catch {
      const ph = `\x00MATH${mathHtml.length}\x00`;
      mathHtml.push(`<span style="color:var(--color-primary);font-style:italic">$${eq}$</span>`);
      return ph;
    }
  });

  let html = withPlaceholders
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Render #hashtags (any script, e.g. Arabic) as tag pills. Done FIRST via
  // placeholders so hashtag-like URL fragments (`…#section`) inside later
  // link/bold rewrites can never be mangled, and pills can never end up
  // inside a generated href attribute. Safe: content is already escaped and
  // the pattern only matches word characters.
  const hashHtml: string[] = [];
  html = html.replace(/#([\p{L}\p{N}_-]+)/gu, (_, tag: string) => {
    const ph = `\x00HASH${hashHtml.length}\x00`;
    hashHtml.push(`<span style="color:var(--color-primary);background:color-mix(in srgb,var(--color-primary) 12%,transparent);border-radius:9999px;padding:0 0.375rem;font-weight:500">#${tag}</span>`);
    return ph;
  });

  html = html.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer" style="color:var(--color-primary);text-decoration:underline">$1</a>'
  );

  html = html.replace(
    /\*\*([^*]+)\*\*/g,
    '<span style="color:var(--color-primary);font-weight:600">$1</span>'
  );

  html = html.replace(
    /==([^=]+)==/g,
    '<span style="background:color-mix(in srgb,var(--color-primary) 20%,transparent);border-radius:0.25rem;padding:0 0.25rem">$1</span>'
  );

  html = html.replace(/\n/g, '<br />');

  mathHtml.forEach((rendered, i) => {
    html = html.replace(`\x00MATH${i}\x00`, rendered);
  });

  hashHtml.forEach((rendered, i) => {
    html = html.replace(`\x00HASH${i}\x00`, rendered);
  });

  return html;
};

const NoteDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const notes = useNotesStore(state => state.notes);
  const updateNote = useNotesStore(state => state.updateNote);
  const deleteNote = useNotesStore(state => state.deleteNote);

  const note = notes.find(n => n.id === id);

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [debouncedTagInput, setDebouncedTagInput] = useState('');
  const [showRichEditor, setShowRichEditor] = useState(false);
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const [tagSuggestionIndex, setTagSuggestionIndex] = useState(0);
  const [tagPrefix, setTagPrefix] = useState('');
  const tagInputRef = useRef<HTMLInputElement>(null);

  const focusNew = (location.state as { focusNew?: boolean })?.focusNew;
  const [initialized, setInitialized] = useState(false);
  useEffect(() => {
    if (focusNew && !initialized && note) {
      setEditTitle(note.title);
      setEditContent(note.content);
      setIsEditing(true);
      setInitialized(true);
    }
  }, [focusNew, initialized, note]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedTagInput(tagInput), 300);
    return () => clearTimeout(timer);
  }, [tagInput]);

  const parsedTagInput = useMemo(() => parseTaskInput(debouncedTagInput), [debouncedTagInput]);

  const allNoteTags = useMemo(() => {
    const all = notes.flatMap(n => n.tags);
    return Array.from(new Set(all)).sort();
  }, [notes]);

  const filteredTagSuggestions = useMemo(() => {
    if (!showTagSuggestions || !tagPrefix) return [];
    return allNoteTags.filter(t => t.toLowerCase().startsWith(tagPrefix));
  }, [allNoteTags, showTagSuggestions, tagPrefix]);

  const previewAllTags = useMemo(() => {
    if (!debouncedTagInput.trim()) return [];
    return [...new Set(parsedTagInput.tags)];
  }, [debouncedTagInput, parsedTagInput.tags]);

  const handleAddTag = () => {
    const parsed = parseTaskInput(tagInput);
    const currentNote = useNotesStore.getState().notes.find(n => n.id === id);
    if (!currentNote) return;
    const allTags = [...new Set(parsed.tags)];
    const newTags = allTags.filter(t => !currentNote.tags.includes(t));
    const updates: Partial<Note> = {};
    if (newTags.length > 0) updates.tags = [...currentNote.tags, ...newTags];
    if (parsed.dueDate) updates.dueDate = parsed.dueDate;
    if (/!high|!low|!med(?:ium)?|!!/i.test(tagInput)) updates.priority = parsed.priority;
    if (Object.keys(updates).length > 0) updateNote(currentNote.id, updates);
    setTagInput('');
    setDebouncedTagInput('');
    setShowTagSuggestions(false);
  };

  const insertTagSuggestion = useCallback((tagName: string) => {
    setTagInput(`#${tagName} `);
    setShowTagSuggestions(false);
    tagInputRef.current?.focus();
  }, []);

  const handleTagInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTagInput(value);

    const cursorPos = e.target.selectionStart ?? value.length;
    const beforeCursor = value.slice(0, cursorPos);
    const hashIdx = beforeCursor.lastIndexOf('#');

    if (hashIdx !== -1) {
      const afterHash = beforeCursor.slice(hashIdx + 1);
      if (afterHash.indexOf(' ') === -1 && afterHash.length > 0) {
        setTagPrefix(afterHash.toLowerCase());
        setShowTagSuggestions(true);
        setTagSuggestionIndex(0);
        return;
      }
    }
    setShowTagSuggestions(false);
  }, []);

  const handleTagInputKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!showTagSuggestions || filteredTagSuggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setTagSuggestionIndex(i => Math.min(i + 1, filteredTagSuggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setTagSuggestionIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      if (tagSuggestionIndex >= 0 && tagSuggestionIndex < filteredTagSuggestions.length) {
        e.preventDefault();
        insertTagSuggestion(filteredTagSuggestions[tagSuggestionIndex]);
      }
    } else if (e.key === 'Escape') {
      setShowTagSuggestions(false);
    }
  }, [showTagSuggestions, filteredTagSuggestions, tagSuggestionIndex, insertTagSuggestion]);

  const handleRemoveTag = (tag: string) => {
    const n = useNotesStore.getState().notes.find(n => n.id === id);
    if (!n) return;
    updateNote(n.id, { tags: n.tags.filter(t => t !== tag) });
  };

  useEffect(() => {
    if (!showTagSuggestions) return;
    const handleClick = (e: MouseEvent) => {
      if (tagInputRef.current && !tagInputRef.current.contains(e.target as Node)) {
        setShowTagSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showTagSuggestions]);

  const handleInsertElement = (_type: string, value: string) => {
    setEditContent(prev => {
      if (prev === '') return value;
      const last = prev[prev.length - 1];
      if (last === '\n' || last === ' ') return prev + value;
      return prev + ' ' + value;
    });
    setShowRichEditor(false);
  };

  // Placed after every hook so the hook order stays stable when the note
  // disappears mid-view (e.g. it is removed by undo/redo or an import).
  if (!note) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-(--text-secondary)">
        <p className="text-lg font-medium">Note not found</p>
        <button
          type="button"
          onClick={() => navigate('/notes')}
          className="mt-4 text-primary hover:underline text-sm"
        >
          Back to notes
        </button>
      </div>
    );
  }

  const handleStartEdit = () => {
    setEditTitle(note.title);
    setEditContent(note.content);
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    // Hashtags written in the content (any script) become real tags on save,
    // merged with manually added ones. They are not auto-removed when the
    // hashtag text is deleted — remove via the tag chip instead.
    const contentTags = extractHashtags(editContent);
    const mergedTags = Array.from(new Set([...note.tags, ...contentTags]));
    updateNote(note.id, {
      title: editTitle.trim() || 'Untitled',
      content: editContent,
      tags: mergedTags,
    });
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (confirm('Delete this note?')) {
      deleteNote(note.id);
      navigate('/notes');
    }
  };

  return (
    <div className="h-full flex flex-col min-w-0 pt-9 pb-5 animate-fade-in">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-6">
        <button
          type="button"
          onClick={() => navigate('/notes')}
          className="flex items-center gap-2 text-(--text-secondary) hover:text-(--text-primary) transition-colors text-sm font-medium"
        >
          <ArrowLeft size={18} />
          Back
        </button>
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <button
                type="button"
                onClick={handleSaveEdit}
                className="flex items-center gap-1.5 px-4 py-2 bg-primary text-(--text-on-primary) text-sm font-bold rounded-xl hover:brightness-110 transition-all"
              >
                <Save size={15} />
                Save
              </button>
              <button
                type="button"
                onClick={handleCancelEdit}
                className="px-4 py-2 bg-(--bg-color) text-(--text-primary) border border-(--border-color) text-sm font-bold rounded-xl hover:bg-primary/10 transition-all"
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={handleStartEdit}
                className="flex items-center gap-1.5 px-4 py-2 bg-primary/10 text-primary text-sm font-bold rounded-xl hover:bg-primary/20 transition-all"
              >
                <Edit2 size={15} />
                Edit
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="flex items-center gap-1.5 px-4 py-2 bg-danger/10 text-danger text-sm font-bold rounded-xl hover:bg-danger/20 transition-all"
              >
                <Trash2 size={15} />
                Delete
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto min-w-0">
        {isEditing ? (
          <div className="flex flex-col gap-4">
            <input
              type="text"
              value={editTitle}
              onChange={e => setEditTitle(e.target.value)}
              className="text-3xl font-black text-(--text-primary) bg-transparent border-none outline-none w-full placeholder:text-(--text-secondary)/40"
              placeholder="Note title..."
              name="noteTitle"
            />
            <div className="relative">
              <textarea
                value={editContent}
                onChange={e => setEditContent(e.target.value)}
                className="w-full min-h-[300px] bg-(--card-bg) border border-(--border-color) rounded-xl p-4 text-sm text-(--text-primary) resize-y focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-all break-words"
                placeholder="Start writing..."
                name="noteContent"
              />
              {/* Floating action buttons */}
              <div className="absolute bottom-4 end-4 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowRichEditor(o => !o)}
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-all shadow-md ${
                    showRichEditor
                      ? 'bg-primary text-(--text-on-primary)'
                      : 'bg-(--card-bg) border border-(--border-color) text-primary hover:bg-primary/10'
                  }`}
                  title="Insert rich element"
                  aria-label="Insert rich element"
                >
                  <Plus size={16} />
                </button>
                <NoteLinkButton noteId={note.id} />
                <NoteClipButton noteId={note.id} />
              </div>
            </div>
            {showRichEditor && (
              <RichInsertEditor onInsert={handleInsertElement} onClose={() => setShowRichEditor(false)} />
            )}
          </div>
        ) : (
          <div>
            <h1 className="text-3xl font-black text-(--text-primary) mb-1 leading-tight">
              {note.title || <span className="text-(--text-secondary) opacity-50">Untitled</span>}
            </h1>
            {/* Accent line under title */}
            <div className="w-12 h-[3px] rounded-full bg-gradient-to-r from-primary/60 to-primary/10 mb-5" />

            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 mb-6">
              <span className="inline-flex items-center gap-1 text-[11px] text-(--text-secondary) opacity-60 bg-(--bg-color) rounded-full px-2.5 py-1">
                <Calendar size={11} />
                Created {formatTaskDate(note.createdAt)} {formatTaskTime(note.createdAt)}
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] text-(--text-secondary) opacity-60 bg-(--bg-color) rounded-full px-2.5 py-1">
                Edited {formatTaskDate(note.updatedAt)} {formatTaskTime(note.updatedAt)}
              </span>
              {note.linkedTaskId && (
                <span className="inline-flex items-center gap-1 text-[11px] text-primary font-semibold bg-primary/8 rounded-full px-2.5 py-1">
                  Linked to task
                </span>
              )}
              {note.dueDate && (
                <span className="inline-flex items-center gap-1 text-[11px] text-primary opacity-80 bg-primary/8 rounded-full px-2.5 py-1">
                  <Calendar size={11} />
                  {formatTaskDate(note.dueDate)}{formatTaskTime(note.dueDate) ? ` ${formatTaskTime(note.dueDate)}` : ''}
                </span>
              )}
              {note.priority && note.priority !== 'medium' && (
                <span className={`inline-flex items-center gap-1 text-[11px] font-semibold capitalize rounded-full px-2.5 py-1 ${
                  note.priority === 'high' ? 'text-danger bg-danger/8' : 'text-success bg-success/8'
                }`}>
                  <Flag size={11} />
                  {note.priority}
                </span>
              )}
            </div>
            <div className="min-w-0">
              <div
                className="text-[14px] text-(--text-primary) leading-[1.75] overflow-x-auto max-w-full w-fit [word-break:break-word] [overflow-wrap:anywhere] note-content"
                dangerouslySetInnerHTML={{
                  __html: note.content ? renderNoteContent(note.content) : ''
                }}
              />
            </div>
            {!note.content && (
              <div className="py-12 flex flex-col items-center text-center">
                <span className="text-sm text-(--text-secondary) italic opacity-50">No content yet</span>
                <span className="text-xs text-(--text-secondary) opacity-30 mt-1">Click Edit to start writing</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom section: Tags */}
      <div className="mt-6 pt-4 border-t border-(--border-color)">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <TagIcon size={14} className="text-(--text-secondary) opacity-30" />
          {(note?.tags ?? []).map(tag => (
            <span
              key={tag}
              className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full tag-pill text-primary"
            >
              <TagIcon size={12} />
              {tag}
              {isEditing && (
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="hover:opacity-60 transition-opacity ml-0.5"
                >
                  <X size={11} />
                </button>
              )}
            </span>
          ))}
          {note?.dueDate && (
            <>
              <span className="flex items-center gap-1 text-[11px] font-semibold text-(--color-primary) bg-(--color-primary-light) dark:text-[#64B5F6] dark:bg-[#64B5F6]/12 dark:border-[#64B5F6]/22 border border-transparent px-2.5 py-1 rounded-full">
                <Calendar size={12} />
                {formatTaskDate(note.dueDate)}
                {isEditing && (
                  <button
                    type="button"
                    onClick={() => updateNote(note.id, { dueDate: undefined })}
                    className="hover:opacity-60 transition-opacity ml-0.5"
                  >
                    <X size={11} />
                  </button>
                )}
              </span>
              {formatTaskTime(note.dueDate) && (
                <span className="flex items-center gap-1 text-[11px] font-semibold text-(--color-primary) bg-(--color-primary-light) dark:text-[#64B5F6] dark:bg-[#64B5F6]/12 dark:border-[#64B5F6]/22 border border-transparent px-2.5 py-1 rounded-full">
                  <Clock size={12} />
                  {formatTaskTime(note.dueDate)}
                  {isEditing && (
                    <button
                      type="button"
                      onClick={() => {
                        const d = new Date(note.dueDate!);
                        d.setHours(0, 0, 0, 0);
                        updateNote(note.id, { dueDate: d.getTime() });
                      }}
                      className="hover:opacity-60 transition-opacity ml-0.5"
                    >
                      <X size={11} />
                    </button>
                  )}
                </span>
              )}
            </>
          )}
          {note?.priority && note.priority !== 'medium' && (
            <span className={`flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full capitalize font-semibold border border-transparent ${
              note.priority === 'high'
                ? 'badge-danger dark:bg-[#EF5350]/12 dark:text-[#EF5350] dark:border-[#EF5350]/22'
                : 'badge-success dark:bg-[#66BB6A]/12 dark:text-[#66BB6A] dark:border-[#66BB6A]/22'
            }`}>
              <Flag size={12} />
              {note.priority}
              {isEditing && (
                <button
                  type="button"
                  onClick={() => updateNote(note.id, { priority: 'medium' })}
                  className="hover:opacity-60 transition-opacity ml-0.5"
                >
                  <X size={11} />
                </button>
              )}
            </span>
          )}
        </div>
        {isEditing && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 relative">
              <input
                ref={tagInputRef}
                type="text"
                value={tagInput}
                onChange={handleTagInputChange}
                onKeyDown={e => {
                  if (e.key === 'Enter') { e.preventDefault(); handleAddTag(); }
                  else handleTagInputKeyDown(e);
                }}
                placeholder="Add #tag... (NLP: #tasks tomorrow)"
                className="flex-1 px-3 py-2 text-sm bg-(--bg-color) border border-(--border-color) rounded-xl text-(--text-primary) placeholder:text-(--text-secondary)/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-all"
                name="noteTag"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-3 py-2 bg-primary/10 text-primary text-sm font-bold rounded-xl hover:bg-primary/20 transition-all shrink-0"
              >
                Add
              </button>

              {showTagSuggestions && filteredTagSuggestions.length > 0 && (
                <div className="absolute bottom-full inset-inline-0 mb-2 bg-(--card-bg) border border-(--border-color) rounded-lg shadow-lg z-20 max-h-40 overflow-y-auto">
                  {filteredTagSuggestions.map((tag, i) => (
                    <button
                      key={tag}
                      type="button"
                      onPointerDown={e => { e.preventDefault(); insertTagSuggestion(tag); }}
                      onMouseEnter={() => setTagSuggestionIndex(i)}
                      className={`w-full flex items-center gap-2 px-3 py-1.5 text-sm text-start transition-colors ${
                        i === tagSuggestionIndex ? 'bg-primary/10 text-primary' : 'text-(--text-primary) hover:bg-(--bg-color)'
                      }`}
                    >
                      <span className="size-2 rounded-full shrink-0 bg-primary/40" />
                      <span className="font-medium">#{tag}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {debouncedTagInput.trim() && (
              <div className="flex items-center gap-2 flex-wrap bg-(--card-bg) border border-(--border-color) rounded-lg p-2 shadow-sm min-w-0">
                <span className="text-[11px] font-medium truncate text-(--text-primary) max-w-[180px] shrink-0">
                  {parsedTagInput.title || '...'}
                </span>
                {parsedTagInput.dueDate && (
                  <span className="flex items-center gap-1 text-[11px] text-(--color-primary) bg-(--color-primary-light) dark:text-[#64B5F6] dark:bg-[#64B5F6]/12 dark:border-[#64B5F6]/22 border border-transparent px-1.5 py-0.5 rounded-md">
                    <Calendar size={11} />
                    {formatTaskDate(parsedTagInput.dueDate)}
                  </span>
                )}
                {parsedTagInput.dueDate && formatTaskTime(parsedTagInput.dueDate) && (
                  <span className="flex items-center gap-1 text-[11px] text-(--color-primary) bg-(--color-primary-light) dark:text-[#64B5F6] dark:bg-[#64B5F6]/12 dark:border-[#64B5F6]/22 border border-transparent px-1.5 py-0.5 rounded-md">
                    <Clock size={11} />
                    {formatTaskTime(parsedTagInput.dueDate)}
                  </span>
                )}
                {previewAllTags.map(t => (
                  <span key={t} className="text-[11px] font-semibold px-1.5 py-0.5 rounded-full tag-pill">
                    {t}
                  </span>
                ))}
                <span className={`flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded-md capitalize font-semibold border border-transparent ${
                  parsedTagInput.priority === 'high'
                    ? 'badge-danger dark:bg-[#EF5350]/12 dark:text-[#EF5350] dark:border-[#EF5350]/22'
                    : parsedTagInput.priority === 'low'
                      ? 'badge-success dark:bg-[#66BB6A]/12 dark:text-[#66BB6A] dark:border-[#66BB6A]/22'
                      : 'text-gray-600 bg-gray-100 dark:text-[#FFAB00] dark:bg-[#FFAB00]/12 dark:border-[#FFAB00]/22'
                }`}>
                  <Flag size={10} />
                  {parsedTagInput.priority}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default NoteDetails;
