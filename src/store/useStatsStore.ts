import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DailyGoal } from '../types';

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

import { createJSONStorage } from 'zustand/middleware';
import { tauriStorage } from './storage';

export const useStatsStore = create<StatsState>()(
  persist(
    (set) => ({
      dailyGoals: {},
      currentStreak: 0,
      longestStreak: 0,

      incrementCompletedToday: () => set((state) => {
        const today = getTodayString();
        const existing = state.dailyGoals[today] || { date: today, completedCount: 0, goal: 5 };
        
        const newCompleted = existing.completedCount + 1;
        let newStreak = state.currentStreak;
        let newLongest = state.longestStreak;
        
        // Very basic streak logic: if this is the first completion today, we might check if yesterday was completed.
        // For a robust app, we'd check if yesterday met the goal. We'll simplify for now.
        if (existing.completedCount < existing.goal && newCompleted >= existing.goal) {
          // Met goal today!
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
        const existing = state.dailyGoals[today] || { date: today, completedCount: 0, goal: 5 };
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
      storage: createJSONStorage(() => tauriStorage),
    }
  )
);
