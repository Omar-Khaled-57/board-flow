import { useState } from 'react';
import { HelpCircle, X } from 'lucide-react';

const NLPGuide = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button 
        type="button" 
        onClick={() => setIsOpen(true)}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-primary)] opacity-80 hover:opacity-100 drop-shadow-[0_0_8px_var(--color-primary)] transition-all p-1 rounded-full"
        title="Smart Input Guide"
      >
        <HelpCircle size={22} />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl shadow-xl p-4 z-50 animate-in fade-in slide-in-from-top-2">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold text-[var(--text-primary)]">Smart Input Guide</h3>
            <button type="button" onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <X size={16} />
            </button>
          </div>
          <div className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
            <p>Type naturally to auto-fill task details:</p>
            <ul className="space-y-2 list-none p-0 m-0">
              <li><strong className="text-[var(--color-primary)]">Dates:</strong> write "tomorrow", "20 May 2027", "20/may/2027", or "20/05/27"</li>
              <li><strong className="text-purple-500">Tags:</strong> use # to add tags (e.g. "#home")</li>
              <li><strong className="text-red-500">Priority:</strong> "!!", "!high", "!med", "!low"</li>
            </ul>
            <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded-md mt-2 text-xs border border-[var(--border-color)]">
              <em>Example: "Buy milk 20/05/27 !! #home"</em>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default NLPGuide;
