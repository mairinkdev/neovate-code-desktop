import type { ToolPair } from './types';
import { DiffViewer } from './DiffViewer';
import { TodoList } from './TodoList';
import type { TodoItemProps } from './TodoItem';

interface ToolMessageProps {
  pair: ToolPair;
}

/**
 * Extract content value handling both string and inputKey reference formats
 */
function extractValue(
  value: any,
  input: Record<string, any>,
): string | undefined {
  if (typeof value === 'string') {
    return value;
  }
  if (value && typeof value === 'object' && 'inputKey' in value) {
    return input[value.inputKey];
  }
  return undefined;
}

/**
 * ToolMessage component
 * Renders a tool use paired with its result (if available)
 */
export function ToolMessage({ pair }: ToolMessageProps) {
  const { toolUse, toolResult } = pair;

  // Get display name or fallback to tool name
  const displayName = toolUse.displayName || toolUse.name;

  return (
    <div style={{}}>
      {/* Tool header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          marginBottom: '8px',
        }}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          style={{ marginRight: '8px', color: 'var(--text-secondary)' }}
        >
          <path
            fill="currentColor"
            d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0zm.75 4.5v3.25h3.25v1.5h-3.25v3.25h-1.5v-3.25h-3.25v-1.5h3.25V4.5h1.5z"
          />
        </svg>
        <span
          style={{
            fontWeight: 600,
            fontSize: '14px',
            color: 'var(--text-primary)',
          }}
        >
          {displayName}
        </span>
        {toolUse.description && (
          <span
            style={{
              fontSize: '13px',
              color: 'var(--text-secondary)',
              marginLeft: '8px',
            }}
          >
            {toolUse.description}
          </span>
        )}
        {!toolResult && (
          <span
            style={{
              marginLeft: '8px',
              fontSize: '12px',
              color: '#f59e0b',
              fontStyle: 'italic',
            }}
          >
            (pending...)
          </span>
        )}
      </div>

      {/* Tool result */}
      {toolResult && (
        <div style={{ paddingLeft: '16px' }}>
          {/* Error handling */}
          {toolResult.result.isError && (
            <div
              style={{
                color: '#ef4444',
                fontSize: '13px',
                padding: '8px',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                borderRadius: '4px',
                fontFamily: 'monospace',
              }}
            >
              Error: {getResultText(toolResult.result)}
            </div>
          )}

          {/* Diff viewer */}
          {!toolResult.result.isError &&
            toolResult.result.returnDisplay &&
            typeof toolResult.result.returnDisplay === 'object' &&
            toolResult.result.returnDisplay.type === 'diff_viewer' && (
              <DiffViewer
                originalContent={
                  extractValue(
                    toolUse.input.old_string || toolUse.input.originalContent,
                    toolUse.input,
                  ) || ''
                }
                newContent={
                  extractValue(
                    toolUse.input.new_string || toolUse.input.newContent,
                    toolUse.input,
                  ) || ''
                }
                filePath={
                  toolUse.input.file_path || toolUse.input.filePath || 'file'
                }
              />
            )}

          {/* Todo displays */}
          {!toolResult.result.isError &&
            toolResult.result.returnDisplay &&
            typeof toolResult.result.returnDisplay === 'object' &&
            (toolResult.result.returnDisplay.type === 'todo_read' ||
              toolResult.result.returnDisplay.type === 'todo_write') && (
              <TodoList
                todos={toolResult.result.returnDisplay.todos.map(
                  (todo: any): TodoItemProps => ({
                    id: todo.id,
                    content: todo.content || todo.text,
                    status:
                      todo.status || (todo.completed ? 'completed' : 'pending'),
                    priority: todo.priority || 'medium',
                  }),
                )}
              />
            )}

          {/* Default text result */}
          {!toolResult.result.isError &&
            (!toolResult.result.returnDisplay ||
              typeof toolResult.result.returnDisplay === 'string') && (
              <div
                style={{
                  fontSize: '13px',
                  color: 'var(--text-primary)',
                  whiteSpace: 'pre-wrap',
                  fontFamily: 'monospace',
                  backgroundColor: 'var(--bg-primary)',
                  padding: '8px',
                  borderRadius: '4px',
                }}
              >
                {getResultText(toolResult.result)}
              </div>
            )}
        </div>
      )}
    </div>
  );
}

/**
 * Extract text from tool result
 */
function getResultText(result: any): string {
  if (typeof result.returnDisplay === 'string') {
    return result.returnDisplay;
  }

  if (typeof result.llmContent === 'string') {
    return result.llmContent;
  }

  if (Array.isArray(result.llmContent)) {
    return result.llmContent
      .filter((part: any) => part.type === 'text')
      .map((part: any) => part.text)
      .join('\n');
  }

  return JSON.stringify(result, null, 2);
}
