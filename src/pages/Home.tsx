import { useState } from 'react';
import TaskEditor from '../components/TaskEditor';
import TodoList from '../components/TodoList';
import { Search } from 'lucide-react';

const Home = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  return (
    <div className="h-full flex flex-col gap-6">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-linear-to-r from-primary to-purple-500">
            Tasks
          </h1>
          <p className="text-(--text-secondary) mt-1">Stay organized, stay productive</p>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-(--text-secondary)" size={16} />
            <input 
              type="text" 
              placeholder="Search tasks..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 rounded-lg bg-(--card-bg) border border-(--border-color) text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none w-full md:w-48"
            />
          </div>
          
          <div className="flex items-center bg-(--card-bg) border border-(--border-color) rounded-lg p-1">
            {(['all', 'active', 'completed'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 text-sm rounded-md capitalize transition-colors ${filter === f ? 'bg-primary text-white' : 'text-(--text-secondary) hover:text-(--text-primary)'}`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </header>
      
      <div className="flex-1 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="flex flex-col gap-6">
          <TaskEditor />

          <div className="bg-(--card-bg) rounded-xl shadow-sm border border-(--border-color) p-4 md:p-6 overflow-hidden flex flex-col lg:hidden">
            <div className="overflow-y-auto pr-2 -mr-2">
              <TodoList searchQuery={searchQuery} filter={filter} />
            </div>
          </div>
        </div>

        <div className="hidden lg:flex flex-col bg-(--card-bg) rounded-xl shadow-sm border border-(--border-color) p-4 md:p-6 overflow-hidden">
          <h2 className="text-xl font-semibold mb-4">Your Tasks</h2>
          <div className="overflow-y-auto pr-2 -mr-2">
            <TodoList searchQuery={searchQuery} filter={filter} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
