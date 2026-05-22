import { useState } from 'react';
import { HelpCircle, X } from 'lucide-react';

const NLPGuide = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-primary opacity-80 hover:opacity-100 drop-shadow-[0_0_8px_var(--color-primary)] transition-all p-1 rounded-full"
        aria-label="Open smart input guide"
      >
        <HelpCircle size={22} />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-(--card-bg) border border-(--border-color) rounded-xl shadow-xl p-4 z-50 animate-in fade-in slide-in-from-top-2">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-(--text-primary)">Smart Input Guide</h3>
            <button type="button" onClick={() => setIsOpen(false)} className="text-(--text-secondary) hover:text-(--text-primary) transition-colors" aria-label="Close smart input guide">
              <X size={16} />
            </button>
          </div>
          <div className="space-y-3 text-sm text-(--text-primary) dark:opacity-85">
            <p>Type naturally to auto-fill task details:</p>
            <ul className="space-y-2 list-none p-0 m-0">
              <li><strong className="text-primary">Dates:</strong> write "tomorrow", "20 May 2027", "20/may/2027", or "20/05/27"</li>
              <li><strong className="text-primary">Tags:</strong> use # to add tags (e.g. "#home")</li>
              <li><strong className="text-primary">Priority:</strong> "!!", "!high", "!med", "!low"</li>
            </ul>
            <div className="rounded-xl mt-5 border border-(--border-color) bg-(--bg-color) px-4 py-3 text-center text-sm font-medium text-(--text-primary) shadow-sm">
              Example: "Buy milk 20/05/27 !! #home"
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default NLPGuide;
