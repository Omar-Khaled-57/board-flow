import { format } from 'date-fns';

export const formatTaskDate = (date: number | Date | null | undefined): string => {
  if (date == null) return '';
  const d = typeof date === 'number' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';
  return format(d, 'dd/MM/yy');
};

export const formatTaskTime = (date: number | Date | null | undefined): string | null => {
  if (date == null) return null;
  const d = typeof date === 'number' ? new Date(date) : date;
  if (isNaN(d.getTime())) return null;
  if (d.getHours() === 0 && d.getMinutes() === 0) return null;
  return format(d, 'h:mm a');
};
