import { useState } from 'react';
import { useTodoStore } from '../store/useTodoStore';
import TaskItem from './TaskItem';
import { Sparkles } from 'lucide-react';

interface TodoListProps {
  searchQuery?: string;
  filter?: 'all' | 'active' | 'completed';
  tagFilter?: string;
  showUnlistedOnly?: boolean;
  listId?: string;
}

const TodoList = ({ searchQuery = '', filter = 'all', tagFilter, showUnlistedOnly = false, listId }: TodoListProps) => {
  const todos = useTodoStore(state => state.todos);
  const settings = useTodoStore(state => state.settings);
  const reorderTodos = useTodoStore(state => state.reorderTodos);
  
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
    // Transparent image for drag ghost to avoid default browser ghost
    const img = new Image();
    img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    e.dataTransfer.setDragImage(img, 0, 0);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) {
      setDraggedId(null);
      return;
    }
    
    const sourceIndex = todos.findIndex(t => t.id === draggedId);
    const targetIndex = todos.findIndex(t => t.id === targetId);
    
    if (sourceIndex !== -1 && targetIndex !== -1) {
      reorderTodos(sourceIndex, targetIndex);
    }
    setDraggedId(null);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
  };

  // Filtering
  const filteredTodos = todos.filter(todo => {
    // list filter
    if (listId && todo.listId !== listId) {
      return false;
    }
    // task list tab filter
    if (tagFilter && !todo.tags.includes(tagFilter)) {
      return false;
    }
    if (showUnlistedOnly && todo.listId) {
      return false;
    }
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
          <Sparkles size={40} className="text-primary" />
        </div>
        <h3 className="text-xl font-bold text-(--text-primary) mb-3">No tasks right now</h3>
        <div className="mx-auto flex max-w-sm flex-col items-center gap-2 text-center text-sm leading-6">
          <p>Type naturally to auto-fill task details:</p>
          <p className="max-w-xs">
            <strong className="text-primary">Dates:</strong>{' '}
            write "tomorrow", "20 May 2027", "20/may/2027", or "20/05/27".
          </p>
          <p className="max-w-xs">
            <strong className="text-purple-500">Tags:</strong>{' '}
            use # to add tags, like "#home".
          </p>
          <p className="max-w-xs">
            <strong className="text-red-500">Priority:</strong>{' '}
            use "!!", "!high", "!med", or "!low".
          </p>
          <div className="mt-1 w-full rounded-full border border-(--border-color) bg-(--bg-color) px-4 py-2 text-center text-xs text-(--text-primary)">
            <em>Example: "Buy milk 20/05/27 !! #home"</em>
          </div>
        </div>
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
        <TaskItem 
          key={todo.id} 
          task={todo} 
          isDragging={draggedId === todo.id}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onDragEnd={handleDragEnd}
        />
      ))}
    </div>
  );
};

export default TodoList;
