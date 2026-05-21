import { useEffect, useRef } from 'react';
import { useTodoStore } from '../store/useTodoStore';
import { sendNativeNotification } from '../utils/notifications';

// Hook to schedule native notifications exactly at a task's due time.
// It registers a timer for each pending task with a dueDate and clears
// timers when tasks are removed, completed, or marked as notified.
const useNotificationScheduler = () => {
  const todos = useTodoStore(state => state.todos);
  const updateTodo = useTodoStore(state => state.updateTodo);
  const notificationsEnabled = useTodoStore(state => state.settings.notificationsEnabled);

  // Keep a mutable map of active timers (id -> timeout reference).
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    if (!notificationsEnabled) {
      Object.values(timers.current).forEach(clearTimeout);
      timers.current = {};
      return;
    }

    // Remove timers for tasks that no longer exist.
    const existingIds = new Set(todos.map(t => t.id));
    Object.keys(timers.current).forEach(id => {
      if (!existingIds.has(id)) {
        clearTimeout(timers.current[id]);
        delete timers.current[id];
      }
    });

    todos.forEach(todo => {
      // Skip if already completed, notified, or has no due date.
      if (todo.completed || todo.notified || !todo.dueDate) return;

      // If a timer already exists for this todo, keep it.
      if (timers.current[todo.id]) return;

      const now = Date.now();
      const delay = Math.max(0, todo.dueDate - now);

      if (delay === 0) {
        // Due time already passed – notify immediately.
        sendNativeNotification('Task Due Soon', todo.title);
        updateTodo(todo.id, { notified: true });
        return;
      }

      // Schedule a notification for the exact due time.
      const timeout = setTimeout(() => {
        sendNativeNotification('Task Due Soon', todo.title);
        updateTodo(todo.id, { notified: true });
        delete timers.current[todo.id];
      }, delay);

      timers.current[todo.id] = timeout;
    });
  }, [todos, updateTodo, notificationsEnabled]);
};

export default useNotificationScheduler;
