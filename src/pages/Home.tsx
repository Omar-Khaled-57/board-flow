import { useState } from 'react';
import TaskEditor from '../components/TaskEditor';
import TodoList from '../components/TodoList';
import { Search, Tag } from 'lucide-react';
import { useTodoStore } from '../store/useTodoStore';

const Home = () => {
  const todos = useTodoStore(state => state.todos);
  const allTags = Array.from(new Set(todos.flatMap(t => t.tags)));
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
        
        <div className="flex flex-col w-full md:w-auto items-stretch md:items-end gap-3 mt-4 md:mt-0">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto">
            <div className="relative flex-1 sm:flex-none">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-(--text-secondary)" size={16} />
              <input 
                type="text" 
                placeholder="Search tasks..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 rounded-xl bg-(--card-bg) border border-(--border-color) text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none w-full sm:w-48 transition-shadow shadow-sm"
              />
            </div>
            
            <div className="flex items-center bg-(--card-bg) border border-(--border-color) rounded-xl p-1 w-full sm:w-auto shadow-sm">
              {(['all', 'active', 'completed'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`flex-1 sm:flex-none px-3 py-1.5 text-sm rounded-lg capitalize transition-colors ${filter === f ? 'bg-primary text-white font-medium shadow-sm' : 'text-(--text-secondary) hover:text-(--text-primary) hover:bg-gray-50 dark:hover:bg-gray-800/50'}`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
          
          {allTags.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 w-full md:justify-end">
              <Tag size={12} className="text-(--text-secondary)" />
              {allTags.slice(0, 5).map(tag => (
                <button 
                  key={tag}
                  onClick={() => setSearchQuery(searchQuery === tag ? '' : tag)}
                  className={`text-[11px] px-2 py-1 rounded-lg transition-colors border ${searchQuery === tag ? 'bg-primary text-white border-primary shadow-sm' : 'bg-(--card-bg) text-(--text-secondary) border-(--border-color) hover:border-primary/50'}`}
                >
                  {tag}
                </button>
              ))}
              {allTags.length > 5 && (
                <span className="text-xs text-(--text-secondary)">+{allTags.length - 5}</span>
              )}
            </div>
          )}
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
