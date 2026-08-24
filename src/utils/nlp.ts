import * as chrono from 'chrono-node';
import { Priority } from '../types';

export interface ParsedInput {
  title: string;
  dueDate?: number;
  tags: string[];
  priority: Priority;
}

/**
 * Unicode-aware hashtag pattern: matches Latin, Arabic, and any other
 * letter/numeral systems (plus underscore/hyphen) after a `#`.
 */
const TAG_PATTERN = /#([\p{L}\p{N}_-]+)/gu;

/** Extract hashtags from text without removing them (deduped, lowercase). */
export const extractHashtags = (text: string): string[] => {
  const tags = new Set<string>();
  for (const match of text.matchAll(TAG_PATTERN)) {
    tags.add(match[1].toLowerCase());
  }
  return Array.from(tags);
};

const MONTHS: Record<string, number> = {
  jan: 0, january: 0,
  feb: 1, february: 1,
  mar: 2, march: 2,
  apr: 3, april: 3,
  may: 4,
  jun: 5, june: 5,
  jul: 6, july: 6,
  aug: 7, august: 7,
  sep: 8, sept: 8, september: 8,
  oct: 9, october: 9,
  nov: 10, november: 10,
  dec: 11, december: 11,
};

const normalizeYear = (year: number | undefined) => {
  if (year === undefined) return new Date().getFullYear();
  if (year < 100) return 2000 + year;
  return year;
};

const isValidDateParts = (day: number, month: number, year: number) => {
  const date = new Date(year, month, day);
  return date.getFullYear() === year && date.getMonth() === month && date.getDate() === day;
};

const parseArabicDateTerms = (text: string): { date: Date; text: string } | null => {
  const lower = text.toLowerCase();
  const now = new Date();
  let matched = false;
  let date: Date | null = null;
  let term = '';

  // tomorrow terms
  if (/بكرة|بكره/.test(lower)) {
    date = new Date(now);
    date.setDate(date.getDate() + 1);
    date.setHours(0, 0, 0, 0);
    term = lower.match(/بكرة|بكره/)?.[0] || '';
    matched = true;
  }

  if (!matched && /الصبح|الصباح/.test(lower)) {
    date = new Date(now);
    date.setHours(6, 0, 0, 0);
    term = lower.match(/الصبح|الصباح/)?.[0] || '';
    matched = true;
  }

  if (!matched && /المساء/.test(lower)) {
    date = new Date(now);
    date.setHours(18, 0, 0, 0);
    term = lower.match(/المساء/)?.[0] || '';
    matched = true;
  }

  if (!matched && /بليل/.test(lower)) {
    date = new Date(now);
    date.setHours(21, 0, 0, 0);
    term = lower.match(/بليل/)?.[0] || '';
    matched = true;
  }

  if (matched && date) {
    const originalText = text.substring(
      text.indexOf(term),
      text.indexOf(term) + term.length
    );
    return { date, text: originalText };
  }

  return null;
};

const parseFlexibleDate = (text: string): { date: Date; text: string } | null => {
  // Try Arabic terms first
  const arabicResult = parseArabicDateTerms(text);
  if (arabicResult) return arabicResult;

  const dateToken = String.raw`(?:\d{1,4}|jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t|tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)`;
  const dateRegex = new RegExp(String.raw`\b(${dateToken})[\/.]+(${dateToken})(?:[\/.]+(\d{2,4}))?\b`, 'i');
  const match = text.match(dateRegex);
  if (!match) return null;

  const firstRaw = match[1].toLowerCase();
  const secondRaw = match[2].toLowerCase();
  const year = normalizeYear(match[3] ? Number(match[3]) : undefined);
  const firstNumber = Number(firstRaw);
  const secondNumber = Number(secondRaw);
  const firstMonth = MONTHS[firstRaw];
  const secondMonth = MONTHS[secondRaw];

  let day: number | undefined;
  let month: number | undefined;

  if (firstMonth !== undefined && !Number.isNaN(secondNumber)) {
    month = firstMonth;
    day = secondNumber;
  } else if (secondMonth !== undefined && !Number.isNaN(firstNumber)) {
    day = firstNumber;
    month = secondMonth;
  } else if (!Number.isNaN(firstNumber) && !Number.isNaN(secondNumber)) {
    if (firstNumber > 12) {
      day = firstNumber;
      month = secondNumber - 1;
    } else if (secondNumber > 12) {
      month = firstNumber - 1;
      day = secondNumber;
    } else {
      day = firstNumber;
      month = secondNumber - 1;
    }
  }

  if (day === undefined || month === undefined || !isValidDateParts(day, month, year)) {
    return null;
  }

  return {
    date: new Date(year, month, day),
    text: match[0],
  };
};

export const parseTaskInput = (text: string): ParsedInput => {
  let priority: Priority = 'medium';
  let cleanedText = text;

  if (cleanedText.match(/!high/i) || cleanedText.match(/!!/)) {
    priority = 'high';
    cleanedText = cleanedText.replace(/!high/gi, '').replace(/!!/g, '');
  } else if (cleanedText.match(/!low/i)) {
    priority = 'low';
    cleanedText = cleanedText.replace(/!low/gi, '');
  } else if (cleanedText.match(/!med(ium)?/i)) {
    priority = 'medium';
    cleanedText = cleanedText.replace(/!med(ium)?/gi, '');
  }

  const tags: string[] = [];
  TAG_PATTERN.lastIndex = 0;
  let match;
  while ((match = TAG_PATTERN.exec(cleanedText)) !== null) {
    tags.push(match[1]);
  }
  cleanedText = cleanedText.replace(TAG_PATTERN, '');

  let dueDate: number | undefined;
  const flexibleDate = parseFlexibleDate(cleanedText);

  if (flexibleDate) {
    dueDate = flexibleDate.date.getTime();
    cleanedText = cleanedText.replace(flexibleDate.text, '');
  } else {
    try {
      const parsedResults = chrono.parse(cleanedText);
      if (parsedResults.length > 0) {
        const result = parsedResults[0];
        const date = result.start.date();
        if (date && !isNaN(date.getTime())) {
          dueDate = date.getTime();
          cleanedText = cleanedText.replace(result.text, '');
        }
      }
    } catch {
      // Chrono parsing failed — silently skip date extraction
    }
  }

  return {
    title: cleanedText.trim().replace(/\s+/g, ' '),
    dueDate,
    tags: tags.map(t => t.toLowerCase()),
    priority
  };
};
