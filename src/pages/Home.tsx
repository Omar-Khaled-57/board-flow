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
      <header className="bg-primary -mx-4 md:-mx-8 -mt-4 md:-mt-8 mb-6 p-8 md:p-12 pb-16 arch-bottom shadow-lg shadow-primary/20 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        {/* Decorative elements */}
        <div className="absolute top-4 left-4 w-16 h-16 rounded-full border-4 border-[var(--text-on-primary)] opacity-30 pointer-events-none" />
        <div className="absolute bottom-8 right-[-20px] w-32 h-32 rounded-full bg-[var(--text-on-primary)] opacity-20 pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-[var(--text-on-primary)] opacity-10 pointer-events-none" />

        <div className="z-10 relative">
          <h1 className="text-4xl md:text-5xl font-black drop-shadow-md text-[var(--text-on-primary)]">
            Tasks
          </h1>
          <p className="mt-2 font-medium text-[var(--text-on-primary)] opacity-80">Wait less, Live more. Stay organized.</p>
        </div>
        
        <div className="flex flex-col w-full md:w-auto items-stretch md:items-end gap-3 z-10 relative">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto">
            <div className="relative flex-1 sm:flex-none">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-on-primary)] opacity-60" size={16} />
              <input 
                type="text" 
                placeholder="Search tasks..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2.5 rounded-2xl bg-[rgba(var(--text-on-primary-rgb),0.1)] border border-[rgba(var(--text-on-primary-rgb),0.2)] text-[var(--text-on-primary)] placeholder-[rgba(var(--text-on-primary-rgb),0.6)] text-sm focus:border-[var(--text-on-primary)] focus:ring-2 focus:ring-[rgba(var(--text-on-primary-rgb),0.3)] outline-none w-full sm:w-48 transition-all shadow-sm backdrop-blur-sm"
              />
            </div>
            
            <div className="flex items-center bg-[rgba(var(--text-on-primary-rgb),0.1)] backdrop-blur-sm border border-[rgba(var(--text-on-primary-rgb),0.2)] rounded-2xl p-1 w-full sm:w-auto shadow-sm">
              {(['all', 'active', 'completed'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`flex-1 sm:flex-none px-4 py-1.5 text-sm rounded-xl capitalize font-bold transition-all duration-200 ${filter === f ? 'bg-[var(--text-on-primary)] text-primary shadow-sm scale-95' : 'text-[var(--text-on-primary)] hover:bg-[rgba(var(--text-on-primary-rgb),0.2)]'}`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
          
          {allTags.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 w-full md:justify-end mt-2">
              <Tag size={12} className="text-[var(--text-on-primary)] opacity-60" />
              {allTags.slice(0, 5).map(tag => (
                <button 
                  key={tag}
                  onClick={() => setSearchQuery(searchQuery === tag ? '' : tag)}
                  className={`text-[11px] font-bold px-3 py-1.5 rounded-full transition-all border ${searchQuery === tag ? 'bg-[var(--text-on-primary)] text-primary border-[var(--text-on-primary)] shadow-sm scale-95' : 'bg-[rgba(var(--text-on-primary-rgb),0.1)] text-[var(--text-on-primary)] border-[rgba(var(--text-on-primary-rgb),0.2)] hover:border-[var(--text-on-primary)] hover:bg-[rgba(var(--text-on-primary-rgb),0.2)]'}`}
                >
                  {tag}
                </button>
              ))}
              {allTags.length > 5 && (
                <span className="text-xs font-bold text-[var(--text-on-primary)] opacity-60 bg-[rgba(var(--text-on-primary-rgb),0.05)] px-2 py-1 rounded-full">+{allTags.length - 5}</span>
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
