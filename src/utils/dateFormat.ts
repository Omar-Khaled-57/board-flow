import { format } from 'date-fns';

export const formatTaskDate = (date: number | Date | null | undefined): string => {
  if (date == null) return '';
  const d = typeof date === 'number' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';
  return format(d, 'dd/MM/yy');
};
