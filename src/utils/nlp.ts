import * as chrono from 'chrono-node';
import { Priority } from '../types';

export interface ParsedInput {
  title: string;
  dueDate?: number;
  tags: string[];
  priority: Priority;
}

const MONTHS: Record<string, number> = {
  jan: 0,
  january: 0,
  feb: 1,
  february: 1,
  mar: 2,
  march: 2,
  apr: 3,
  april: 3,
  may: 4,
  jun: 5,
  june: 5,
  jul: 6,
  july: 6,
  aug: 7,
  august: 7,
  sep: 8,
  sept: 8,
  september: 8,
  oct: 9,
  october: 9,
  nov: 10,
  november: 10,
  dec: 11,
  december: 11,
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

const parseFlexibleDate = (text: string): { date: Date; text: string } | null => {
  const dateToken = String.raw`(?:\d{1,4}|jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t|tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)`;
  const dateRegex = new RegExp(String.raw`\b(${dateToken})[\/.\-]+(${dateToken})(?:[\/.\-]+(\d{2,4}))?\b`, 'i');
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
  let priority: Priority = 'medium'; // default to medium priority
  let cleanedText = text;
  
  // Extract priority markers
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

  // Extract Tags (e.g. #home, #work)
  const tags: string[] = [];
  const tagRegex = /#([\w]+)/g;
  let match;
  while ((match = tagRegex.exec(cleanedText)) !== null) {
    tags.push(match[1]);
  }
  cleanedText = cleanedText.replace(/#[\w]+/g, '');

  let dueDate: number | undefined;
  const flexibleDate = parseFlexibleDate(cleanedText);

  if (flexibleDate) {
    dueDate = flexibleDate.date.getTime();
    cleanedText = cleanedText.replace(flexibleDate.text, '');
  } else {
    // Extract Dates using Chrono
    const parsedResults = chrono.parse(cleanedText);

    if (parsedResults.length > 0) {
    // take the first date found
      const result = parsedResults[0];
      dueDate = result.start.date().getTime();
      // remove the date text from the title
      cleanedText = cleanedText.replace(result.text, '');
    }
  }

  return {
    title: cleanedText.trim().replace(/\s+/g, ' '),
    dueDate,
    tags: tags.map(t => t.toLowerCase()),
    priority
  };
};
