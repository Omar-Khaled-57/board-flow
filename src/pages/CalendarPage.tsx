import { useState, useMemo } from 'react';
import { useTodoStore } from '../store/useTodoStore';
import { format, startOfWeek, addDays, startOfMonth, endOfMonth, endOfWeek, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import clsx from 'clsx';

const CalendarPage = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const todos = useTodoStore(state => state.todos);

  // Build a Map keyed by date string for O(1) lookup per cell instead of O(n) filter
  const todosByDate = useMemo(() => {
    const map = new Map<string, typeof todos>();
    for (const t of todos) {
      if (!t.dueDate) continue;
      const key = format(new Date(t.dueDate), 'yyyy-MM-dd');
      const arr = map.get(key);
      if (arr) arr.push(t);
      else map.set(key, [t]);
    }
    return map;
  }, [todos]);

  const hasScheduledTasks = useMemo(() => todosByDate.size > 0, [todosByDate]);

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const renderDays = () => {
    const longFormat = "EEEE";
    const shortFormat = "EEE";
    const days = [];
    let startDateOfWeek = startOfWeek(currentMonth);
    for (let i = 0; i < 7; i++) {
      const day = addDays(startDateOfWeek, i);
      days.push(
        <div className="font-semibold text-center py-2 text-(--text-secondary) text-sm" key={i}>
          <span className="hidden portrait:inline">{format(day, shortFormat)}</span>
          <span className="portrait:hidden">{format(day, longFormat)}</span>
        </div>
      );
    }
    return <div className="grid grid-cols-7 mb-2">{days}</div>;
  };

  const renderCells = () => {
    const rows = [];
    let days = [];
    let day = startDate;
    let formattedDate = "";

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        formattedDate = format(day, "d");
        const dayKey = format(day, 'yyyy-MM-dd');
        const dayTodos = todosByDate.get(dayKey) || [];

        days.push(
          <div
            className={clsx(
              "min-h-25 p-2 border-r border-b border-(--border-color) transition-colors",
              !isSameMonth(day, monthStart) ? "bg-gray-50/50 dark:bg-gray-800/10 text-gray-400" : "bg-(--card-bg) text-(--text-primary) hover:bg-primary-light dark:hover:bg-primary/10 cursor-pointer"
            )}
            key={day.getTime()}
          >
            <div className="flex justify-end">
              <span className={clsx(
                "w-6 h-6 flex items-center justify-center rounded-full text-sm",
                isSameDay(day, new Date()) ? "bg-primary text-white font-bold" : ""
              )}>
                {formattedDate}
              </span>
            </div>

            <div className="mt-2 space-y-1">
              {dayTodos.slice(0, 3).map(todo => (
                <div
                  key={todo.id}
                  className={clsx(
                    "text-xs truncate px-1.5 py-0.5 rounded",
                    todo.completed ? "bg-gray-100 text-gray-500 line-through dark:bg-gray-800" : "bg-primary text-white"
                  )}
                >
                  {todo.title}
                </div>
              ))}
              {dayTodos.length > 3 && (
                <div className="text-xs text-(--text-secondary) font-medium pl-1">
                  +{dayTodos.length - 3} more
                </div>
              )}
            </div>
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div className="grid grid-cols-7" key={day.getTime()}>
          {days}
        </div>
      );
      days = [];
    }
    return <div className="border-t border-l border-(--border-color) rounded-xl overflow-hidden">{rows}</div>;
  };

  return (
    <div className="h-full flex flex-col gap-6">
      <header className="bg-primary -mx-4 md:-mx-8 -mt-4 md:-mt-8 mb-6 px-6 md:px-12 pt-12 pb-14 md:pb-16 arch-bottom shadow-lg shadow-primary/20 relative overflow-hidden flex flex-col min-aspect-4-3:flex-row min-aspect-4-3:items-center justify-between gap-6">
        <div className="absolute top-4 left-4 w-16 h-16 rounded-full border-4 border-(--text-on-primary) opacity-30 pointer-events-none" />
        <div className="absolute bottom-8 -right-5 w-32 h-32 rounded-full bg-(--text-on-primary) opacity-20 pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-(--text-on-primary) opacity-10 pointer-events-none" />

        <div className="z-10 relative">
          <h1 className="text-4xl md:text-5xl font-black drop-shadow-md text-(--text-on-primary)">
            Calendar
          </h1>
          <p className="mt-2 font-medium text-(--text-on-primary) opacity-80">Schedule and due dates</p>
        </div>

        <div className="flex items-center justify-between w-full min-aspect-4-3:w-auto min-aspect-4-3:min-w-75 bg-(--text-on-primary)/10 backdrop-blur-sm border border-(--text-on-primary)/20 text-(--text-on-primary) p-2 rounded-3xl shadow-sm z-10 relative">
          <button onClick={prevMonth} className="p-2 hover:bg-(--text-on-primary)/20 rounded-2xl transition-all" aria-label="Previous month">
            <ChevronLeft size={20} />
          </button>
          <span className="font-bold text-lg text-center flex-1 drop-shadow-sm">
            {format(currentMonth, "MMMM yyyy")}
          </span>
          <button onClick={nextMonth} className="p-2 hover:bg-(--text-on-primary)/20 rounded-2xl transition-all" aria-label="Next month">
            <ChevronRight size={20} />
          </button>
        </div>
      </header>

      <div className="flex-1 bg-(--card-bg) rounded-xl shadow-sm border border-(--border-color) p-6 overflow-y-auto">
        {!hasScheduledTasks ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-(--text-secondary) py-12">
             <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
               <CalendarIcon size={40} className="text-primary" />
             </div>
             <h2 className="text-2xl font-bold text-(--text-primary) mb-2">No Scheduled Tasks</h2>
             <p className="max-w-md text-sm">
               Tasks with dates or times will appear here. Try adding a due date to a task to see it on the calendar!
             </p>
          </div>
        ) : (
          <>
            {renderDays()}
            {renderCells()}
          </>
        )}
      </div>
    </div>
  );
};

export default CalendarPage;
