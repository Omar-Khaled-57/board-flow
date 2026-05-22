import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { DailyGoal } from '../types';
import { getStorageAdapter } from './storage';

const DEFAULT_DAILY_GOAL = 5;

interface StatsState {
  dailyGoals: Record<string, DailyGoal>;
  currentStreak: number;
  longestStreak: number;

  incrementCompletedToday: () => void;
  setDailyGoal: (goal: number) => void;
}

const getTodayString = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const useStatsStore = create<StatsState>()(
  persist(
    (set) => ({
      dailyGoals: {},
      currentStreak: 0,
      longestStreak: 0,

      incrementCompletedToday: () => set((state) => {
        const today = getTodayString();
        const existing = state.dailyGoals[today] || { date: today, completedCount: 0, goal: DEFAULT_DAILY_GOAL };

        const newCompleted = existing.completedCount + 1;
        let newStreak = state.currentStreak;
        let newLongest = state.longestStreak;

        // Bump streak when the daily goal was met exactly by this completion
        if (existing.completedCount < existing.goal && newCompleted >= existing.goal) {
          newStreak += 1;
          if (newStreak > newLongest) {
            newLongest = newStreak;
          }
        }

        return {
          dailyGoals: {
            ...state.dailyGoals,
            [today]: { ...existing, completedCount: newCompleted }
          },
          currentStreak: newStreak,
          longestStreak: newLongest,
        };
      }),

      setDailyGoal: (goal: number) => set((state) => {
        const today = getTodayString();
        const existing = state.dailyGoals[today] || { date: today, completedCount: 0, goal: DEFAULT_DAILY_GOAL };
        return {
          dailyGoals: {
            ...state.dailyGoals,
            [today]: { ...existing, goal }
          }
        };
      })
    }),
    {
      name: 'boardflow-stats',
      storage: createJSONStorage(() => getStorageAdapter()),
      partialize: (state) => ({
        dailyGoals: state.dailyGoals,
        currentStreak: state.currentStreak,
        longestStreak: state.longestStreak,
      }),
    }
  )
);
