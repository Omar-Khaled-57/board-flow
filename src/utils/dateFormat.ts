import { format } from 'date-fns';

export const formatTaskDate = (date: number | Date) => format(date, 'dd/MM/yy');
