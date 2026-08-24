import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { DailyGoal } from '../types';
import { getStorageAdapter } from './storage';
import { dailyGoalSchema } from '../schemas';
import { sendNativeNotification } from '../utils/notifications';

const DEFAULT_DAILY_GOAL = 5;

interface StatsState {
  dailyGoals: Record<string, DailyGoal>;
  currentStreak: number;
  longestStreak: number;

  _hasHydrated: boolean;

  incrementCompletedToday: () => void;
  setDailyGoal: (goal: number) => void;
  clearStats: () => void;

  getTodayGoal: () => DailyGoal | undefined;
  getTodayCompletion: () => number;
}

export const getTodayString = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const useStatsStore = create<StatsState>()(
  persist(
    (set, get) => ({
      _hasHydrated: false,
      dailyGoals: {},
      currentStreak: 0,
      longestStreak: 0,

      getTodayGoal: () => {
        const today = getTodayString();
        return get().dailyGoals[today];
      },

      getTodayCompletion: () => {
        const goal = get().getTodayGoal();
        if (!goal) return 0;
        return goal.goal > 0 ? Math.min(goal.completedCount / goal.goal, 1) : 0;
      },

      incrementCompletedToday: () => {
        let justReachedGoal = false;

        set((state) => {
          const today = getTodayString();
          const existing = state.dailyGoals[today] || { date: today, completedCount: 0, goal: DEFAULT_DAILY_GOAL };

          const newCompleted = existing.completedCount + 1;
          let newStreak = state.currentStreak;
          let newLongest = state.longestStreak;

          justReachedGoal = existing.completedCount < existing.goal && newCompleted >= existing.goal;

          if (justReachedGoal) {
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
        });

        if (justReachedGoal) {
          sendNativeNotification('Goal Achieved 🎯', 'All tasks completed for today. Nice work.', 'icons/Notifications/target.png');
        }
      },

      setDailyGoal: (goal: number) => set((state) => {
        const today = getTodayString();
        const existing = state.dailyGoals[today] || { date: today, completedCount: 0, goal: DEFAULT_DAILY_GOAL };
        return {
          dailyGoals: {
            ...state.dailyGoals,
            [today]: { ...existing, goal }
          }
        };
      }),

      clearStats: () => set({
        dailyGoals: {},
        currentStreak: 0,
        longestStreak: 0,
      }),
    }),
    {
      name: 'boardflow-stats',
      storage: createJSONStorage(() => getStorageAdapter()),
      partialize: (state) => ({
        dailyGoals: state.dailyGoals,
        currentStreak: state.currentStreak,
        longestStreak: state.longestStreak,
      }),
      merge: (persisted, current) => {
        const p = persisted as Partial<StatsState>;
        const dailyGoals: Record<string, DailyGoal> = {};
        if (p.dailyGoals && typeof p.dailyGoals === 'object') {
          for (const [date, goal] of Object.entries(p.dailyGoals)) {
            const result = dailyGoalSchema.safeParse(goal);
            if (result.success) dailyGoals[date] = result.data;
          }
        }
        return {
          ...current,
          ...p,
          dailyGoals,
          currentStreak: typeof p.currentStreak === 'number' && Number.isFinite(p.currentStreak) ? p.currentStreak : 0,
          longestStreak: typeof p.longestStreak === 'number' && Number.isFinite(p.longestStreak) ? p.longestStreak : 0,
        };
      },
      onRehydrateStorage: () => () => {
        // Set unconditionally (also on hydration errors, where `state`
        // would be undefined) so the boot splash never waits on us.
        useStatsStore.setState({ _hasHydrated: true });
      },
    }
  )
);
