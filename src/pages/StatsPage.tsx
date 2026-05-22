import { useStatsStore } from '../store/useStatsStore';
import { Flame, Target, Trophy, TrendingUp } from 'lucide-react';
import { format, subDays } from 'date-fns';

const StatsPage = () => {
  const stats = useStatsStore();
  
  const d = new Date();
  const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  
  const todayStats = stats.dailyGoals[today] || { completedCount: 0, goal: 5 };

  const safeGoal = todayStats.goal > 0 ? todayStats.goal : 1;
  const progressPercent = Math.min(100, Math.round((todayStats.completedCount / safeGoal) * 100)) || 0;

  const hasNoData = Object.keys(stats.dailyGoals).length === 0 || Object.values(stats.dailyGoals).every(g => g.completedCount === 0);

  const last7DaysData = Array.from({ length: 7 }).map((_, i) => {
    const date = subDays(new Date(), 6 - i);
    const dateString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const dayStats = stats.dailyGoals[dateString] || { completedCount: 0, goal: 5 };
    const safeGoal = dayStats.goal > 0 ? dayStats.goal : 1;
    const percent = Math.min(100, Math.round((dayStats.completedCount / safeGoal) * 100)) || 0;
    return {
      label: format(date, 'EEE'),
      percent,
      completed: dayStats.completedCount
    };
  });

  if (hasNoData) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-8 text-(--text-secondary)">
        <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-6">
          <TrendingUp size={48} className="text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-(--text-primary) mb-2">No Stats Yet</h2>
        <p className="max-w-md">
          Your productivity insights will appear here once you start completing tasks. 
          Head over to the home page and crush your first goal!
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col gap-6">
      <header className="bg-primary -mx-4 md:-mx-8 -mt-4 md:-mt-8 mb-6 px-6 md:px-12 pt-12 pb-14 md:pb-16 arch-bottom shadow-lg shadow-primary/20 relative overflow-hidden flex flex-col items-center justify-center text-center">
        {/* Decorative elements */}
        <div className="absolute top-4 left-4 w-16 h-16 rounded-full border-4 border-(--text-on-primary) opacity-30 pointer-events-none" />
        <div className="absolute bottom-8 -right-5 w-32 h-32 rounded-full bg-(--text-on-primary) opacity-20 pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-(--text-on-primary) opacity-10 pointer-events-none" />

        <div className="z-10 relative">
          <h1 className="text-4xl md:text-5xl font-black drop-shadow-md text-(--text-on-primary)">
            Statistics
          </h1>
          <p className="mt-2 font-medium text-(--text-on-primary) opacity-80">Track your productivity and crush goals.</p>
        </div>
      </header>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Progress Ring */}
        <div className="bg-(--card-bg) rounded-xl shadow-sm border border-(--border-color) p-6 flex flex-col items-center justify-center text-center">
          <h3 className="text-lg font-semibold mb-4 text-(--text-secondary) flex items-center gap-2">
            <Target size={18} className="text-primary" />
            Daily Goal
          </h3>
          
          <div className="relative w-32 h-32 flex items-center justify-center mb-4">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle 
                cx="50" cy="50" r="40" 
                fill="transparent" 
                stroke="var(--border-color)" 
                strokeWidth="8" 
              />
              <circle 
                cx="50" cy="50" r="40" 
                fill="transparent" 
                stroke="var(--color-primary)" 
                strokeWidth="8" 
                strokeDasharray="251.2" 
                strokeDashoffset={251.2 - (251.2 * progressPercent) / 100}
                className="transition-all duration-1000 ease-out"
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-3xl font-bold">{progressPercent}%</span>
            </div>
          </div>
          
          <p className="text-sm font-medium">
            {todayStats.completedCount} / {todayStats.goal} tasks completed
          </p>
        </div>

        {/* Current Streak */}
        <div className="bg-(--card-bg) rounded-xl shadow-sm border border-(--border-color) p-6 flex flex-col items-center justify-center text-center">
          <h3 className="text-lg font-semibold mb-4 text-(--text-secondary) flex items-center gap-2">
            <Flame size={18} className="text-orange-500" />
            Current Streak
          </h3>
          <div className="text-5xl font-bold text-orange-500 mb-2">{stats.currentStreak}</div>
          <p className="text-sm font-medium">Days in a row</p>
        </div>

        {/* Longest Streak */}
        <div className="bg-(--card-bg) rounded-xl shadow-sm border border-(--border-color) p-6 flex flex-col items-center justify-center text-center">
          <h3 className="text-lg font-semibold mb-4 text-(--text-secondary) flex items-center gap-2">
            <Trophy size={18} className="text-yellow-500" />
            Longest Streak
          </h3>
          <div className="text-5xl font-bold text-yellow-500 mb-2">{stats.longestStreak}</div>
          <p className="text-sm font-medium">Best record</p>
        </div>
      </div>
      
      <div className="flex-1 bg-(--card-bg) rounded-xl shadow-sm border border-(--border-color) p-6">
        <h3 className="text-xl font-semibold mb-6">Activity (Last 7 Days)</h3>
        <div className="h-48 flex items-end justify-between gap-2">
          {last7DaysData.map((data, i) => (
            <div key={i} className="w-full flex flex-col items-center gap-2" title={`${data.completed} completed`}>
              <div className="w-full max-w-10 bg-primary-light dark:bg-primary/20 rounded-t-md relative flex items-end justify-center group" style={{ height: '100%' }}>
                <div 
                  className="w-full bg-primary rounded-t-md transition-all duration-1000 ease-out relative group-hover:brightness-110" 
                  style={{ height: `${data.percent}%` }}
                >
                  <span className="absolute -top-7 left-1/2 -translate-x-1/2 text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity bg-(--card-bg) border border-(--border-color) px-2 py-0.5 rounded shadow-sm text-(--text-primary)">
                    {data.completed}
                  </span>
                </div>
              </div>
              <span className="text-xs text-(--text-secondary) font-medium">{data.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StatsPage;
