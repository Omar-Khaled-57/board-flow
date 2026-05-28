import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: React.ReactNode;
  iconSize?: number;
}

const EmptyState = ({ icon: Icon, title, description, iconSize = 40 }: EmptyStateProps) => (
  <div className="flex flex-col items-center justify-center py-10 text-center text-(--text-primary) opacity-80 dark:opacity-100">
    <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
      <Icon size={iconSize} className="text-primary" />
    </div>
    <h3 className="text-2xl font-bold text-(--text-primary) mb-3">{title}</h3>
    <div className="mx-auto flex max-w-sm flex-col items-center gap-2.5 text-center text-sm leading-6 text-(--text-primary) dark:opacity-85">
      {description}
    </div>
  </div>
);

export default EmptyState;
