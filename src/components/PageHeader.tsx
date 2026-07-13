interface PageHeaderProps {
  title: string;
  subtitle: string;
  children?: React.ReactNode;
  align?: 'start' | 'center' | 'responsive';
}

const PageHeader = ({ title, subtitle, children, align = 'responsive' }: PageHeaderProps) => (
  <header className={`bg-primary -mx-4 md:-mx-8 -mt-4 md:-mt-8 mb-6 px-6 md:px-12 pt-12 pb-14 md:pb-16 arch-bottom shadow-lg shadow-primary/20 relative overflow-hidden flex flex-col gap-6 ${
    align === 'responsive'
      ? 'items-center min-aspect-4-3:items-start'
      : align === 'center'
        ? 'items-center'
        : 'items-start'
  }`}>
    <div className="absolute top-4 start-4 w-16 h-16 rounded-full border-4 border-(--text-on-primary) opacity-30 pointer-events-none" />
    <div className="absolute bottom-8 -end-5 w-32 h-32 rounded-full bg-(--text-on-primary) opacity-20 pointer-events-none" />
    <div className="absolute top-1/2 start-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-(--text-on-primary) opacity-10 pointer-events-none" />

    <div className={`z-10 relative max-w-xl ${align === 'responsive' ? 'text-center min-aspect-4-3:text-start' : ''}`}>
      <h1 className="text-4xl md:text-5xl font-black drop-shadow-md text-(--text-on-primary)">
        {title}
      </h1>
      <p className="mt-2 font-medium text-(--text-on-primary) opacity-80">{subtitle}</p>
    </div>

    {children && (
      <div className="flex flex-col w-full items-stretch gap-3 z-10 relative">
        {children}
      </div>
    )}
  </header>
);

export default PageHeader;
