import { describe, it, expect } from 'vitest';
import { parseTaskInput, extractHashtags } from '../nlp';

describe('hashtag parsing (Unicode-aware)', () => {
  it('extracts Latin hashtags', () => {
    expect(extractHashtags('Buy milk #shopping #urgent')).toEqual(['shopping', 'urgent']);
  });

  it('extracts Arabic hashtags', () => {
    expect(extractHashtags('اشتري حليب #مشتريات #مذاكرة')).toEqual(['مشتريات', 'مذاكرة']);
  });

  it('extracts mixed-script hashtags with digits, underscore and hyphen', () => {
    expect(extractHashtags('#Work_2026 #دراسة-عام #x-1_y')).toEqual(['work_2026', 'دراسة-عام', 'x-1_y']);
  });

  it('dedupes case-insensitively but preserves Arabic as-is', () => {
    expect(extractHashtags('#Work #work #مذاكرة #مذاكرة')).toEqual(['work', 'مذاكرة']);
  });

  it('ignores lone hash and hash followed by punctuation', () => {
    expect(extractHashtags('# #!hello a#tag')).toEqual(['tag']);
  });
});

describe('parseTaskInput tag handling (Unicode-aware)', () => {
  it('parses Arabic hashtags into the tags list and strips them from the title', () => {
    const result = parseTaskInput('مراجعة الدرس #مذاكرة');
    expect(result.tags).toContain('مذاكرة');
    expect(result.title).not.toContain('#');
    expect(result.title).toContain('مراجعة الدرس');
  });

  it('still parses Latin hashtags and priorities together', () => {
    const result = parseTaskInput('Finish report #work !!');
    expect(result.tags).toEqual(['work']);
    expect(result.priority).toBe('high');
    expect(result.title).toBe('Finish report');
  });

  it('parses Arabic date terms alongside Arabic hashtags', () => {
    const result = parseTaskInput('أذاكر #مذاكرة بكرة');
    expect(result.tags).toContain('مذاكرة');
    expect(result.dueDate).toBeDefined();
  });
});
