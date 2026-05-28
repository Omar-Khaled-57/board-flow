import { Calendar, Clock, Flag, Tag as TagIcon } from 'lucide-react';
import clsx from 'clsx';
import type { Priority } from '../types';
import { formatTaskDate, formatTaskTime } from '../utils/dateFormat';

interface BaseBadgeProps {
  className?: string;
  children: React.ReactNode;
}

const BaseBadge = ({ className, children }: BaseBadgeProps) => (
  <span className={clsx(
    "flex items-center gap-1 px-2 py-1 rounded-md font-semibold border border-transparent shrink-0",
    className
  )}>
    {children}
  </span>
);

export const DateBadge = ({ date, overdue }: { date: number | Date; overdue?: boolean }) => {
  const isOverdue = overdue ?? (typeof date === 'number' ? date < Date.now() : date.getTime() < Date.now());
  return (
    <BaseBadge className={clsx(
      isOverdue
        ? "badge-danger dark:text-[#64B5F6] dark:bg-[#64B5F6]/12 dark:border-[#64B5F6]/22"
        : "badge-info dark:text-[#64B5F6] dark:bg-[#64B5F6]/12 dark:border-[#64B5F6]/22"
    )}>
      <Calendar size={12} />
      <span>{formatTaskDate(date)}</span>
    </BaseBadge>
  );
};

export const TimeBadge = ({ date }: { date?: number | Date | null }) => {
  if (date == null) return null;
  const time = formatTaskTime(date);
  if (!time) return null;
  return (
    <BaseBadge className="badge-info dark:text-[#64B5F6] dark:bg-[#64B5F6]/12 dark:border-[#64B5F6]/22">
      <Clock size={12} className="text-primary" />
      <span>{time}</span>
    </BaseBadge>
  );
};

export const PriorityBadge = ({ priority }: { priority: Priority }) => {
  if (priority === 'medium') return null;
  return (
    <BaseBadge className={clsx(
      "capitalize",
      priority === 'high'
        ? "badge-danger dark:bg-[#EF5350]/12 dark:text-[#EF5350] dark:border-[#EF5350]/22"
        : "badge-success dark:bg-[#66BB6A]/12 dark:text-[#66BB6A] dark:border-[#66BB6A]/22"
    )}>
      <Flag size={12} />
      <span>{priority}</span>
    </BaseBadge>
  );
};

export const MetaDate = ({ date }: { date: number | Date }) => (
  <span className="flex items-center gap-1 text-[11px] text-(--text-secondary) opacity-60 shrink-0 whitespace-nowrap">
    <Calendar size={11} />
    {formatTaskDate(date)}
  </span>
);

export const TagBadge = ({ tag, onRemove }: { tag: string; onRemove?: () => void }) => (
  <BaseBadge className="tag-pill text-primary max-w-[160px]">
    <TagIcon size={12} className="shrink-0" />
    <span className={/[-_]/.test(tag) ? 'min-w-0 [overflow-wrap:anywhere]' : 'truncate'}>{tag}</span>
    {onRemove && (
      <button type="button" onClick={onRemove} className="hover:text-red-500 transition-colors ms-0.5">
        <svg className="size-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
      </button>
    )}
  </BaseBadge>
);
