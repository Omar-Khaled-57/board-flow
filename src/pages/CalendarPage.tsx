import { useState, useMemo } from 'react';
import { useTodoStore } from '../store/useTodoStore';
import { format, startOfWeek, addDays, startOfMonth, endOfMonth, endOfWeek, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, CheckCircle2, Circle } from 'lucide-react';
import clsx from 'clsx';
import PageHeader from '../components/PageHeader';
import EmptyState from '../components/EmptyState';

const CalendarPage = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const todos = useTodoStore(state => state.todos);

  // Parse 'yyyy-MM-dd' as a LOCAL date; `new Date(key)` would treat it as
  // UTC midnight and land on the previous day in negative UTC offsets.
  const parseLocalDateKey = (key: string) => {
    const [y, m, d] = key.split('-').map(Number);
    return new Date(y, m - 1, d);
  };

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

  const selectedTodos = useMemo(() => {
    if (!selectedDate) return [];
    return todosByDate.get(selectedDate) || [];
  }, [selectedDate, todosByDate]);

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    if (d.getHours() === 0 && d.getMinutes() === 0) return null;
    return format(d, 'h:mm a');
  };

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
        const isSelected = selectedDate === dayKey;

        days.push(
          <div
            className={clsx(
              "min-h-25 p-2 border-e border-b border-(--border-color) transition-all",
              !isSameMonth(day, monthStart) ? "bg-gray-50/50 dark:bg-gray-800/10 text-gray-400" : "bg-(--card-bg) text-(--text-primary) cursor-pointer",
              isSelected
                ? "ring-2 ring-primary ring-inset bg-primary-light dark:bg-primary/10"
                : "hover:bg-primary-light dark:hover:bg-primary/10"
            )}
            key={day.getTime()}
            onClick={() => setSelectedDate(isSelected ? null : dayKey)}
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
                <div className="text-xs text-(--text-secondary) font-medium ps-1">
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
    return <div className="border-t border-s border-(--border-color) rounded-xl overflow-hidden">{rows}</div>;
  };

  return (
    <div className="h-full flex flex-col gap-6">
      <PageHeader title="Calendar" subtitle="Schedule and due dates">
        <div className="flex items-center justify-between w-full bg-(--text-on-primary)/10 backdrop-blur-sm border border-(--text-on-primary)/20 text-(--text-on-primary) p-2 rounded-3xl shadow-sm z-10">
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
      </PageHeader>

      <div className="flex-1 flex flex-col gap-4">
        <div className="bg-(--card-bg) rounded-xl shadow-sm border border-(--border-color) p-6 overflow-y-auto">
          {!hasScheduledTasks ? (
            <EmptyState
              icon={CalendarIcon}
              title="No Scheduled Tasks"
              iconSize={40}
              description={
                <p className="max-w-md text-sm">
                  <strong className="text-primary">Tasks</strong> with <strong className="text-primary">dates</strong> or <strong className="text-primary">times</strong> will appear here. Try adding a due date to a task to see it on the calendar.
                </p>
              }
            />
          ) : (
            <>
              {renderDays()}
              {renderCells()}
            </>
          )}
        </div>

        {selectedDate && (
          <div className="bg-(--card-bg) rounded-xl shadow-sm border border-(--border-color) p-6 animate-fade-slide-down">
            <h3 className="text-lg font-bold text-(--text-primary)">
              Tasks for {format(parseLocalDateKey(selectedDate), 'EEEE, MMMM d, yyyy')}
            </h3>
            <p className="text-sm text-(--text-secondary) mb-4">({selectedTodos.length} task{selectedTodos.length !== 1 ? 's' : ''})</p>

            {selectedTodos.length === 0 ? (
              <p className="text-sm text-(--text-secondary)">No tasks for this day.</p>
            ) : (
              <div className="space-y-2">
                {selectedTodos.map(todo => (
                  <div
                    key={todo.id}
                    className={clsx(
                      "flex items-start gap-3 p-3 rounded-lg border transition-colors",
                      todo.completed
                        ? "bg-gray-50/50 dark:bg-gray-800/20 border-transparent opacity-60"
                        : "bg-(--bg-color) border-(--border-color) hover:border-primary/30"
                    )}
                  >
                    <div className="mt-0.5 shrink-0">
                      {todo.completed
                        ? <CheckCircle2 size={18} className="text-success" />
                        : <Circle size={18} className="text-gray-400" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={clsx(
                        "text-sm font-medium",
                        todo.completed ? "text-gray-500 line-through" : "text-(--text-primary)"
                      )}>
                        {todo.title}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs">
                        {formatTime(todo.dueDate!) && (
                          <span className="flex items-center gap-1 text-primary">
                            <Clock size={12} />
                            {formatTime(todo.dueDate!)}
                          </span>
                        )}
                        {todo.priority !== 'medium' && (
                          <span className={clsx(
                            "px-1.5 py-0.5 rounded font-semibold capitalize",
                            todo.priority === 'high' ? "text-red-500 bg-red-500/10" : "text-green-500 bg-green-500/10"
                          )}>
                            {todo.priority}
                          </span>
                        )}
                        {todo.tags.map(t => (
                          <span key={t} className="text-primary tag-pill px-1.5 py-0.5 rounded">
                            #{t}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CalendarPage;
