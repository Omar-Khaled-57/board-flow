import { Flame, Target, Trophy } from 'lucide-react';
import { format, subDays } from 'date-fns';
import { useStatsStore } from '../store/useStatsStore';
import PageHeader from '../components/PageHeader';

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

  const last7DaysData = Array.from({ length: 7 }).map((_, i) => {
    const date = subDays(new Date(), 6 - i);
    const dateString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const dayStats = stats.dailyGoals[dateString] || { completedCount: 0, goal: 5 };
    const safeGoal = dayStats.goal > 0 ? dayStats.goal : 1;
    const percent = Math.min(100, Math.round((dayStats.completedCount / safeGoal) * 100)) || 0;
    return {
      dayName: format(date, 'EEE'),
      dateStr: format(date, 'd MMM'),
      percent,
      completed: dayStats.completedCount
    };
  });

  const SVG_W = 700;
  const SVG_H = 180;
  const PAD_X = 10;
  const PAD_TOP = 16;
  const PAD_BOTTOM = 4;

  const wavePoints = last7DaysData.map((d, i) => ({
    x: PAD_X + (i / (last7DaysData.length - 1)) * (SVG_W - PAD_X * 2),
    y: PAD_TOP + (SVG_H - PAD_TOP - PAD_BOTTOM) * (1 - d.percent / 100),
  }));

  const waveLinePath = (() => {
    const pts = wavePoints;
    if (pts.length < 2) return '';
    let path = `M ${pts[0].x},${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p = pts[i];
      const n = pts[i + 1];
      const prev = pts[Math.max(0, i - 1)];
      const after = pts[Math.min(pts.length - 1, i + 2)];
      const dx = (n.x - prev.x) * 0.3;
      const dy = (n.y - prev.y) * 0.3;
      const dx2 = (after.x - p.x) * 0.3;
      const dy2 = (after.y - p.y) * 0.3;
      const cp1x = Math.max(PAD_X, Math.min(SVG_W - PAD_X, p.x + dx));
      const cp1y = Math.max(PAD_TOP, Math.min(SVG_H - PAD_BOTTOM, p.y + dy));
      const cp2x = Math.max(PAD_X, Math.min(SVG_W - PAD_X, n.x - dx2));
      const cp2y = Math.max(PAD_TOP, Math.min(SVG_H - PAD_BOTTOM, n.y - dy2));
      path += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${n.x},${n.y}`;
    }
    return path;
  })();

  const waveFillPath = `${waveLinePath} L ${SVG_W - PAD_X},${SVG_H} L ${PAD_X},${SVG_H} Z`;

  return (
    <div className="h-full flex flex-col gap-6">
      <PageHeader title="Statistics" subtitle="Track your productivity and crush goals." />
      
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
        <div className="h-48 overflow-hidden">
          <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} className="w-full h-full" preserveAspectRatio="none">
            <defs>
              <linearGradient id="waveFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.28" />
                <stop offset="60%" stopColor="var(--color-primary)" stopOpacity="0.06" />
                <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0.01" />
              </linearGradient>
              <pattern id="gridH" width={SVG_W} height="30" patternUnits="userSpaceOnUse">
                <line x1="0" y1="30" x2={SVG_W} y2="30" stroke="var(--color-primary)" strokeOpacity="0.10" strokeWidth="1" />
              </pattern>
              <pattern id="gridV" width="40" height={SVG_H} patternUnits="userSpaceOnUse">
                <line x1="40" y1="0" x2="40" y2={SVG_H} stroke="var(--color-primary)" strokeOpacity="0.10" strokeWidth="1" />
              </pattern>
              <linearGradient id="gridFade" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopOpacity="1" />
                <stop offset="50%" stopOpacity="0.3" />
                <stop offset="100%" stopOpacity="0" />
              </linearGradient>
              <mask id="gridMask">
                <rect x="0" y="0" width={SVG_W} height={SVG_H} fill="url(#gridFade)" />
              </mask>
              <clipPath id="waveClip">
                <path d={waveFillPath} />
              </clipPath>
            </defs>
            <path d={waveFillPath} fill="url(#waveFill)" />
            <g mask="url(#gridMask)" clipPath="url(#waveClip)">
              <rect x="0" y="0" width={SVG_W} height={SVG_H} fill="url(#gridH)" />
              <rect x="0" y="0" width={SVG_W} height={SVG_H} fill="url(#gridV)" />
            </g>
            <path d={waveLinePath} fill="none" stroke="var(--color-primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div className="flex justify-between mt-3">
          {last7DaysData.map((data, i) => (
            <div key={i} className="flex-1 text-center" title={`${data.completed} completed`}>
              <div className="text-[11px] text-(--text-secondary) font-semibold leading-tight">{data.dayName}</div>
              <div className="text-[10px] text-(--text-secondary) opacity-60 leading-tight">{data.dateStr}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StatsPage;
