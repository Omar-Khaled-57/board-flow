import { useState, useEffect } from 'react';
import { ClipboardList } from 'lucide-react';
import { version } from '../../package.json';

const SplashScreen = ({ onComplete }: { onComplete: () => void }) => {
  const [fade, setFade] = useState(false);

  useEffect(() => {
    const timer1 = setTimeout(() => setFade(true), 1500);
    const timer2 = setTimeout(() => onComplete(), 2000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [onComplete]);

  return (
    <div className={`fixed inset-0 flex flex-col items-center justify-center bg-gray-50 dark:bg-slate-900 transition-opacity duration-500 z-50 ${fade ? 'opacity-0' : 'opacity-100'}`}>
      <div className="animate-bounce">
        <ClipboardList size={64} className="text-primary mb-4" />
      </div>
      <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-500 animate-pulse">
        BoardFlow
      </h1>
      <p className="text-sm text-(--text-secondary) mt-2 font-medium">v{version}</p>
    </div>
  );
};

export default SplashScreen;
