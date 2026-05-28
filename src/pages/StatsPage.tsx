import { Flame, Target, Trophy, TrendingUp } from 'lucide-react';
import { format, subDays } from 'date-fns';
import { useStatsStore } from '../store/useStatsStore';
import PageHeader from '../components/PageHeader';
import EmptyState from '../components/EmptyState';

const StatsPage = () => {
  const stats = useStatsStore();
  
  const d = new Date();
  const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  
  const todayStats = stats.dailyGoals[today] || { completedCount: 0, goal: 5 };

  const safeGoal = todayStats.goal > 0 ? todayStats.goal : 1;
  const rawPercent = Math.round((todayStats.completedCount / safeGoal) * 100) || 0;
  const displayPercent = rawPercent;
  const circlePercent = Math.min(100, rawPercent);
  const isOverGoal = rawPercent >= 100;

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
      <div className="h-full flex flex-col items-center justify-center p-8">
        <div className="bg-(--card-bg) rounded-xl shadow-sm border border-(--border-color) p-6 flex-1 flex items-center justify-center max-w-lg w-full">
          <EmptyState
            icon={TrendingUp}
            title="No Stats Yet"
            description={
              <p>
                Your insights will appear here once you start completing tasks.
                Head over to the <strong className="text-primary">Tasks page</strong> and crush your first goal!
              </p>
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col gap-6">
      <PageHeader title="Statistics" subtitle="Track your productivity and crush goals." align="center" />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Progress Ring */}
        <div className="bg-(--card-bg) rounded-xl shadow-sm border border-(--border-color) p-6 flex flex-col items-center justify-center text-center">
          <h3 className="text-lg font-semibold mb-4 text-(--text-secondary) flex items-center gap-2">
            <Target size={18} className="text-primary" />
            Daily Goal
          </h3>
          
          <div className="relative w-32 h-32 flex items-center justify-center mb-4">
            <svg className="w-full h-full transform -rotate-90" viewBox="-5 -5 110 110">
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
                strokeDashoffset={251.2 - (251.2 * circlePercent) / 100}
                className="transition-all duration-1000 ease-out"
                strokeLinecap="round"
              />
              {isOverGoal && (
                <>
                  <circle cx="50" cy="50" r="44" fill="transparent" stroke="var(--color-primary-saturated)" strokeWidth="0" className="animate-pulse-ring-1" />
                  <circle cx="50" cy="50" r="48" fill="transparent" stroke="var(--color-primary)" strokeWidth="0" className="animate-pulse-ring-2" />
                </>
              )}
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-3xl font-bold">{displayPercent}%</span>
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
                  <span className="absolute -top-7 start-1/2 -translate-x-1/2 text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity bg-(--card-bg) border border-(--border-color) px-2 py-0.5 rounded shadow-sm text-(--text-primary)">
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
