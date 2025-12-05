# Todo Component Extraction

## Overview

Extract the inline Todo display from `ToolMessage.tsx` into separate `TodoList` and `TodoItem` components with enhanced styling and status icons.

## Files to Create

### `src/renderer/components/messages/TodoItem.tsx`

```tsx
import { HugeiconsIcon } from '@hugeicons/react';
import {
  CheckmarkCircleIcon,
  ClockIcon,
} from '@hugeicons/core-free-icons';

interface TodoItemProps {
  id: string;
  content: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
}

export function TodoItem({ content, status, priority }: TodoItemProps) {
  const getStatusIcon = () => {
    switch (status) {
      case 'completed':
        return <HugeiconsIcon icon={CheckmarkCircleIcon} size={16} color="#22c55e" strokeWidth={1.5} />;
      case 'in_progress':
        return <HugeiconsIcon icon={ClockIcon} size={16} color="#f59e0b" strokeWidth={1.5} />;
      default:
        return (
          <div style={{
            width: 16,
            height: 16,
            borderRadius: '50%',
            border: '2px solid var(--text-secondary)',
          }} />
        );
    }
  };

  const getPriorityColor = () => {
    switch (priority) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      default: return null;
    }
  };

  const priorityColor = getPriorityColor();

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      padding: '6px 0',
      gap: '8px',
    }}>
      {getStatusIcon()}
      <span style={{
        flex: 1,
        color: 'var(--text-primary)',
        textDecoration: status === 'completed' ? 'line-through' : 'none',
        opacity: status === 'completed' ? 0.7 : 1,
      }}>
        {content}
      </span>
      {priorityColor && (
        <div style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          backgroundColor: priorityColor,
        }} />
      )}
    </div>
  );
}
```

### `src/renderer/components/messages/TodoList.tsx`

```tsx
import { TodoItem } from './TodoItem';

interface Todo {
  id: string;
  content?: string;
  text?: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority?: 'low' | 'medium' | 'high';
  completed?: boolean;
}

interface TodoListProps {
  todos: Todo[];
}

export function TodoList({ todos }: TodoListProps) {
  if (!todos || todos.length === 0) {
    return null;
  }

  return (
    <div style={{
      backgroundColor: 'var(--bg-primary)',
      border: '1px solid var(--border-subtle)',
      borderRadius: '6px',
      padding: '12px',
      fontSize: '13px',
    }}>
      <div style={{
        fontWeight: 600,
        marginBottom: '8px',
        color: 'var(--text-primary)',
      }}>
        Todos
      </div>
      {todos.map((todo) => (
        <TodoItem
          key={todo.id}
          id={todo.id}
          content={todo.content || todo.text || ''}
          status={todo.completed ? 'completed' : (todo.status || 'pending')}
          priority={todo.priority || 'medium'}
        />
      ))}
    </div>
  );
}
```

## Files to Modify

### `src/renderer/components/messages/ToolMessage.tsx`

Replace the inline todo JSX (lines 128-168) with:

```tsx
import { TodoList } from './TodoList';

// In the component, replace the todo_read/todo_write block with:
{!toolResult.result.isError &&
  toolResult.result.returnDisplay &&
  typeof toolResult.result.returnDisplay === 'object' &&
  (toolResult.result.returnDisplay.type === 'todo_read' ||
    toolResult.result.returnDisplay.type === 'todo_write') && (
  <TodoList todos={toolResult.result.returnDisplay.todos} />
)}
```

### `src/renderer/components/messages/index.ts`

Add exports:

```tsx
export { TodoList } from './TodoList';
export { TodoItem } from './TodoItem';
```

## Icon Usage

From `@hugeicons/core-free-icons`:
- `CheckmarkCircleIcon` - completed status (green)
- `ClockIcon` - in_progress status (amber)
- Custom circle div - pending status (gray border)

## Priority Indicators

- `high` - red dot (8px)
- `medium` - amber dot (8px)
- `low` - no indicator
