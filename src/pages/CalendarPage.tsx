import { useState } from 'react';
import { useTodoStore } from '../store/useTodoStore';
import { format, startOfWeek, addDays, startOfMonth, endOfMonth, endOfWeek, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import clsx from 'clsx';

const CalendarPage = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const todos = useTodoStore(state => state.todos);

  const hasScheduledTasks = todos.some(t => t.dueDate);

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const renderDays = () => {
    const dateFormat = "EEEE";
    const days = [];
    let startDateOfWeek = startOfWeek(currentMonth);
    for (let i = 0; i < 7; i++) {
      days.push(
        <div className="font-semibold text-center py-2 text-(--text-secondary) text-sm" key={i}>
          {format(addDays(startDateOfWeek, i), dateFormat)}
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
        const cloneDay = day;
        
        // Find todos for this day
        const dayTodos = todos.filter(t => t.dueDate && isSameDay(new Date(t.dueDate), cloneDay));

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
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Calendar</h1>
          <p className="text-(--text-secondary) mt-1">Schedule and due dates</p>
        </div>
        
        <div className="flex items-center gap-4 bg-(--card-bg) border border-(--border-color) p-2 rounded-xl shadow-sm">
          <button onClick={prevMonth} className="p-1 hover:bg-primary-light dark:hover:bg-primary/20 rounded-lg transition-colors" title="Previous Month">
            <ChevronLeft size={20} />
          </button>
          <span className="font-semibold text-lg min-w-30 text-center">
            {format(currentMonth, "MMMM yyyy")}
          </span>
          <button onClick={nextMonth} className="p-1 hover:bg-primary-light dark:hover:bg-primary/20 rounded-lg transition-colors" title="Next Month">
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
