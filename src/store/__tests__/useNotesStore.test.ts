import { describe, it, expect, beforeEach } from 'vitest';
import { useNotesStore, buildNoteIndexes } from '../useNotesStore';

beforeEach(() => {
  useNotesStore.setState({
    notes: [],
    past: [],
    future: [],
    noteIndexes: buildNoteIndexes([]),
  });
});

describe('useNotesStore', () => {
  it('adds a note', () => {
    const id = useNotesStore.getState().addNote({
      title: 'Test Note',
      content: 'Hello world',
      tags: [],
      priority: 'medium',
    });

    const notes = useNotesStore.getState().notes;
    expect(notes).toHaveLength(1);
    expect(notes[0].title).toBe('Test Note');
    expect(notes[0].content).toBe('Hello world');
    expect(notes[0].id).toBe(id);
  });

  it('updates a note', () => {
    const id = useNotesStore.getState().addNote({
      title: 'Original',
      content: 'content',
      tags: [],
      priority: 'medium',
    });

    useNotesStore.getState().updateNote(id, { title: 'Updated', tags: ['work'] });

    const note = useNotesStore.getState().notes[0];
    expect(note.title).toBe('Updated');
    expect(note.tags).toEqual(['work']);
  });

  it('deletes a note', () => {
    const id = useNotesStore.getState().addNote({
      title: 'Delete me',
      content: 'bye',
      tags: [],
      priority: 'medium',
    });

    useNotesStore.getState().deleteNote(id);
    expect(useNotesStore.getState().notes).toHaveLength(0);
  });

  it('undoes and redoes', () => {
    useNotesStore.getState().addNote({ title: 'A', content: '', tags: [], priority: 'medium' });
    useNotesStore.getState().addNote({ title: 'B', content: '', tags: [], priority: 'medium' });
    expect(useNotesStore.getState().notes).toHaveLength(2);

    useNotesStore.getState().undo();
    expect(useNotesStore.getState().notes).toHaveLength(1);

    useNotesStore.getState().redo();
    expect(useNotesStore.getState().notes).toHaveLength(2);
  });

  it('sets note sort preferences', () => {
    useNotesStore.getState().setNoteSortField('title');
    expect(useNotesStore.getState().noteSortField).toBe('title');

    useNotesStore.getState().setNoteSortDirection('asc');
    expect(useNotesStore.getState().noteSortDirection).toBe('asc');
  });

  it('getNoteById returns the correct note', () => {
    const id = useNotesStore.getState().addNote({ title: 'Find me', content: '', tags: [], priority: 'medium' });

    const found = useNotesStore.getState().getNoteById(id);
    expect(found?.title).toBe('Find me');

    expect(useNotesStore.getState().getNoteById('nonexistent')).toBeUndefined();
  });

  it('sets note order', () => {
    const idA = useNotesStore.getState().addNote({ title: 'C', content: '', tags: [], priority: 'medium' });
    const idB = useNotesStore.getState().addNote({ title: 'A', content: '', tags: [], priority: 'medium' });
    const idC = useNotesStore.getState().addNote({ title: 'B', content: '', tags: [], priority: 'medium' });

    useNotesStore.getState().setNoteOrder([idC, idA, idB]);
    const titles = useNotesStore.getState().notes.map(n => n.title);
    expect(titles).toEqual(['B', 'C', 'A']);
  });

  it('updateNote sets updatedAt', () => {
    const id = useNotesStore.getState().addNote({ title: 'T', content: '', tags: [], priority: 'medium' });
    const originalUpdatedAt = useNotesStore.getState().notes[0].updatedAt;

    useNotesStore.getState().updateNote(id, { content: 'new' });
    const updatedAt = useNotesStore.getState().notes[0].updatedAt;
    expect(updatedAt).toBeGreaterThanOrEqual(originalUpdatedAt);
  });
});
