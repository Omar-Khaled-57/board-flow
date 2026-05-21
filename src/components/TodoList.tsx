import { useTodoStore } from '../store/useTodoStore';
import TaskItem from './TaskItem';

interface TodoListProps {
  searchQuery?: string;
  filter?: 'all' | 'active' | 'completed';
}

const TodoList = ({ searchQuery = '', filter = 'all' }: TodoListProps) => {
  const todos = useTodoStore(state => state.todos);
  const settings = useTodoStore(state => state.settings);

  // Filtering
  const filteredTodos = todos.filter(todo => {
    // text search
    if (searchQuery.trim() && !todo.title.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    // status filter
    if (filter === 'active' && todo.completed) return false;
    if (filter === 'completed' && !todo.completed) return false;
    return true;
  });

  // Sorting logic based on settings
  const sortedTodos = [...filteredTodos].sort((a, b) => {
    if (settings.completedToBottom) {
      if (a.completed && !b.completed) return 1;
      if (!a.completed && b.completed) return -1;
    }
    // Maintain original insertion order based on createdAt
    if (settings.addToTop) {
      return b.createdAt - a.createdAt;
    }
    return a.createdAt - b.createdAt;
  });

  if (todos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center text-(--text-secondary)">
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
          <span className="text-4xl">✨</span>
        </div>
        <h3 className="text-xl font-bold text-(--text-primary) mb-2">You're all caught up!</h3>
        <p className="max-w-xs text-sm">
          Type naturally above to add a task, for example: <br/>
          <span className="italic text-(--text-primary)">"Review pull requests tomorrow at 10am"</span>
        </p>
      </div>
    );
  }

  if (sortedTodos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center text-(--text-secondary)">
        <span className="text-5xl mb-4 opacity-50">🔍</span>
        <p className="text-lg font-medium">No tasks match your filters</p>
        <p>Try changing your search terms or filter settings.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {sortedTodos.map(todo => (
        <TaskItem key={todo.id} task={todo} />
      ))}
    </div>
  );
};

export default TodoList;
