import * as chrono from 'chrono-node';
import { Priority } from '../types';

export interface ParsedInput {
  title: string;
  dueDate?: number;
  tags: string[];
  priority: Priority;
}

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

  // Extract Dates using Chrono
  const parsedResults = chrono.parse(cleanedText);
  let dueDate: number | undefined;

  if (parsedResults.length > 0) {
    // take the first date found
    const result = parsedResults[0];
    dueDate = result.start.date().getTime();
    // remove the date text from the title
    cleanedText = cleanedText.replace(result.text, '');
  }

  return {
    title: cleanedText.trim().replace(/\s+/g, ' '),
    dueDate,
    tags: tags.map(t => t.toLowerCase()),
    priority
  };
};
