// @ts-nocheck
import { Message } from './components/messages/Message';
import type { NormalizedMessage } from './client/types/message';

// Helper to generate UUIDs
let uuidCounter = 0;
const generateUuid = () => `test-uuid-${++uuidCounter}`;

// Generate sample messages for different scenarios
const createTestMessages = (): NormalizedMessage[] => {
  const messages: NormalizedMessage[] = [];

  // 1. Simple user message
  messages.push({
    type: 'message',
    role: 'user',
    content: 'Hello, can you help me with some code?',
    timestamp: new Date().toISOString(),
    uuid: generateUuid(),
    parentUuid: null,
  });

  // 2. Simple assistant message with text
  messages.push({
    type: 'message',
    role: 'assistant',
    content: [
      {
        type: 'text',
        text: "Of course! I'd be happy to help you with your code. What would you like to work on?",
      },
    ],
    text: "Of course! I'd be happy to help you with your code. What would you like to work on?",
    model: 'claude-3-sonnet',
    usage: {
      inputTokens: 100,
      outputTokens: 50,
      totalTokens: 150,
    },
    timestamp: new Date().toISOString(),
    uuid: generateUuid(),
    parentUuid: null,
  });

  // 3. User message with multi-line text
  messages.push({
    type: 'message',
    role: 'user',
    content: `I have a React component that needs refactoring.

Here's the code:
\`\`\`tsx
const MyComponent = () => {
  return <div>Hello World</div>;
};
\`\`\`

Can you improve it?`,
    timestamp: new Date().toISOString(),
    uuid: generateUuid(),
    parentUuid: null,
  });

  // 4. Assistant message with markdown
  messages.push({
    type: 'message',
    role: 'assistant',
    content: [
      {
        type: 'text',
        text: `Here's an improved version of your component:

## Changes Made

1. **Added TypeScript types** for better type safety
2. **Added props interface** for extensibility
3. **Improved styling** with Tailwind classes

\`\`\`tsx
interface MyComponentProps {
  name?: string;
  className?: string;
}

const MyComponent: React.FC<MyComponentProps> = ({ 
  name = 'World',
  className = ''
}) => {
  return (
    <div className={\`text-lg font-semibold \${className}\`}>
      Hello {name}
    </div>
  );
};
\`\`\`

This version is more **reusable** and **maintainable**.`,
      },
    ],
    text: 'Here is an improved version...',
    model: 'claude-3-opus',
    usage: {
      inputTokens: 200,
      outputTokens: 300,
      totalTokens: 500,
    },
    timestamp: new Date().toISOString(),
    uuid: generateUuid(),
    parentUuid: null,
  });

  // 5. Assistant message with reasoning (thinking)
  messages.push({
    type: 'message',
    role: 'assistant',
    content: [
      {
        type: 'reasoning',
        text: "Let me think about the best approach here... The user wants to improve performance, so I should consider memoization, lazy loading, and code splitting. I'll focus on the most impactful changes first.",
      },
      {
        type: 'text',
        text: 'Based on my analysis, here are the key optimizations I recommend:\n\n1. Use `React.memo()` for pure components\n2. Implement `useMemo` for expensive calculations\n3. Consider code splitting with `React.lazy()`',
      },
    ],
    text: 'Based on my analysis...',
    model: 'claude-3-sonnet',
    usage: {
      inputTokens: 150,
      outputTokens: 200,
      totalTokens: 350,
    },
    timestamp: new Date().toISOString(),
    uuid: generateUuid(),
    parentUuid: null,
  });

  // 6. Assistant message with tool use (pending - no result yet)
  const toolUseId1 = generateUuid();
  messages.push({
    type: 'message',
    role: 'assistant',
    content: [
      {
        type: 'text',
        text: "I'll read the file to understand the current implementation.",
      },
      {
        type: 'tool_use',
        id: toolUseId1,
        name: 'Read',
        input: {
          path: '/path/to/file.tsx',
        },
        displayName: 'Read File',
        description: 'Reading /path/to/file.tsx',
      },
    ],
    text: "I'll read the file...",
    model: 'claude-3-sonnet',
    usage: {
      inputTokens: 100,
      outputTokens: 80,
      totalTokens: 180,
    },
    timestamp: new Date().toISOString(),
    uuid: generateUuid(),
    parentUuid: null,
  });

  // 7. Assistant message with tool use (completed with result)
  const toolUseId2 = generateUuid();
  const assistantMsgUuid = generateUuid();
  messages.push({
    type: 'message',
    role: 'assistant',
    content: [
      {
        type: 'text',
        text: 'Let me check the package.json file.',
      },
      {
        type: 'tool_use',
        id: toolUseId2,
        name: 'Read',
        input: {
          path: '/project/package.json',
        },
        displayName: 'Read File',
        description: 'Reading /project/package.json',
      },
    ],
    text: 'Let me check the package.json...',
    model: 'claude-3-sonnet',
    usage: {
      inputTokens: 100,
      outputTokens: 80,
      totalTokens: 180,
    },
    timestamp: new Date().toISOString(),
    uuid: assistantMsgUuid,
    parentUuid: null,
  });

  // Tool result message (follows the assistant message)
  messages.push({
    type: 'message',
    role: 'user',
    content: [
      {
        type: 'tool_result',
        id: toolUseId2,
        name: 'Read',
        input: {
          path: '/project/package.json',
        },
        result: {
          llmContent:
            '{\n  "name": "my-project",\n  "version": "1.0.0",\n  "dependencies": {\n    "react": "^18.2.0"\n  }\n}',
          returnDisplay:
            '{\n  "name": "my-project",\n  "version": "1.0.0",\n  "dependencies": {\n    "react": "^18.2.0"\n  }\n}',
        },
      },
    ],
    timestamp: new Date().toISOString(),
    uuid: generateUuid(),
    parentUuid: assistantMsgUuid,
  });

  // 8. Assistant message with tool use (error result)
  const toolUseId3 = generateUuid();
  const assistantMsgUuid2 = generateUuid();
  messages.push({
    type: 'message',
    role: 'assistant',
    content: [
      {
        type: 'text',
        text: "I'll try to read the config file.",
      },
      {
        type: 'tool_use',
        id: toolUseId3,
        name: 'Read',
        input: {
          path: '/project/nonexistent.config',
        },
        displayName: 'Read File',
        description: 'Reading /project/nonexistent.config',
      },
    ],
    text: "I'll try to read...",
    model: 'claude-3-sonnet',
    usage: {
      inputTokens: 100,
      outputTokens: 80,
      totalTokens: 180,
    },
    timestamp: new Date().toISOString(),
    uuid: assistantMsgUuid2,
    parentUuid: null,
  });

  // Tool result with error
  messages.push({
    type: 'message',
    role: 'user',
    content: [
      {
        type: 'tool_result',
        id: toolUseId3,
        name: 'Read',
        input: {
          path: '/project/nonexistent.config',
        },
        result: {
          llmContent: 'ENOENT: no such file or directory',
          isError: true,
        },
      },
    ],
    timestamp: new Date().toISOString(),
    uuid: generateUuid(),
    parentUuid: assistantMsgUuid2,
  });

  // 9. Assistant message with diff viewer result
  const toolUseId4 = generateUuid();
  const assistantMsgUuid3 = generateUuid();
  messages.push({
    type: 'message',
    role: 'assistant',
    content: [
      {
        type: 'text',
        text: "I'll update the component to add the new feature.",
      },
      {
        type: 'tool_use',
        id: toolUseId4,
        name: 'StrReplace',
        input: {
          file_path: '/project/src/Button.tsx',
          old_string:
            'const Button = () => {\n  return <button>Click</button>;\n};',
          new_string:
            'const Button = ({ onClick, children }) => {\n  return (\n    <button onClick={onClick} className="btn">\n      {children}\n    </button>\n  );\n};',
        },
        displayName: 'Edit File',
        description: 'Editing /project/src/Button.tsx',
      },
    ],
    text: "I'll update the component...",
    model: 'claude-3-sonnet',
    usage: {
      inputTokens: 150,
      outputTokens: 120,
      totalTokens: 270,
    },
    timestamp: new Date().toISOString(),
    uuid: assistantMsgUuid3,
    parentUuid: null,
  });

  // Tool result with diff viewer
  messages.push({
    type: 'message',
    role: 'user',
    content: [
      {
        type: 'tool_result',
        id: toolUseId4,
        name: 'StrReplace',
        input: {
          file_path: '/project/src/Button.tsx',
          old_string:
            'const Button = () => {\n  return <button>Click</button>;\n};',
          new_string:
            'const Button = ({ onClick, children }) => {\n  return (\n    <button onClick={onClick} className="btn">\n      {children}\n    </button>\n  );\n};',
        },
        result: {
          llmContent: 'File updated successfully',
          returnDisplay: {
            type: 'diff_viewer',
            diff: '- const Button = () => {\n-   return <button>Click</button>;\n- };\n+ const Button = ({ onClick, children }) => {\n+   return (\n+     <button onClick={onClick} className="btn">\n+       {children}\n+     </button>\n+   );\n+ };',
          },
        },
      },
    ],
    timestamp: new Date().toISOString(),
    uuid: generateUuid(),
    parentUuid: assistantMsgUuid3,
  });

  // 10. Assistant message with todo result
  const toolUseId5 = generateUuid();
  const assistantMsgUuid4 = generateUuid();
  messages.push({
    type: 'message',
    role: 'assistant',
    content: [
      {
        type: 'text',
        text: "Here's my task list for this feature:",
      },
      {
        type: 'tool_use',
        id: toolUseId5,
        name: 'TodoWrite',
        input: {
          todos: [
            { id: '1', text: 'Create Button component', completed: true },
            { id: '2', text: 'Add styling', completed: true },
            { id: '3', text: 'Write tests', completed: false },
            { id: '4', text: 'Update documentation', completed: false },
          ],
        },
        displayName: 'Update Todos',
        description: 'Managing task list',
      },
    ],
    text: 'Here is my task list...',
    model: 'claude-3-sonnet',
    usage: {
      inputTokens: 100,
      outputTokens: 100,
      totalTokens: 200,
    },
    timestamp: new Date().toISOString(),
    uuid: assistantMsgUuid4,
    parentUuid: null,
  });

  // Tool result with todos
  messages.push({
    type: 'message',
    role: 'user',
    content: [
      {
        type: 'tool_result',
        id: toolUseId5,
        name: 'TodoWrite',
        input: {},
        result: {
          llmContent: 'Todos updated',
          returnDisplay: {
            type: 'todo_write',
            todos: [
              { id: '1', text: 'Create Button component', completed: true },
              { id: '2', text: 'Add styling', completed: true },
              { id: '3', text: 'Write tests', completed: false },
              { id: '4', text: 'Update documentation', completed: false },
            ],
          },
        },
      },
    ],
    timestamp: new Date().toISOString(),
    uuid: generateUuid(),
    parentUuid: assistantMsgUuid4,
  });

  // 11. System message
  messages.push({
    type: 'message',
    role: 'system',
    content: 'Session context has been updated with new workspace information.',
    timestamp: new Date().toISOString(),
    uuid: generateUuid(),
    parentUuid: null,
  });

  // 12. Empty assistant message
  messages.push({
    type: 'message',
    role: 'assistant',
    content: [],
    text: '',
    model: 'claude-3-sonnet',
    usage: {
      inputTokens: 50,
      outputTokens: 0,
      totalTokens: 50,
    },
    timestamp: new Date().toISOString(),
    uuid: generateUuid(),
    parentUuid: null,
  });

  // 13. User message with image (mock)
  messages.push({
    type: 'message',
    role: 'user',
    content: [
      {
        type: 'text',
        text: 'What do you see in this image?',
      },
      {
        type: 'image',
        // Small 1x1 transparent PNG as placeholder
        data: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        mimeType: 'image/png',
      },
    ],
    timestamp: new Date().toISOString(),
    uuid: generateUuid(),
    parentUuid: null,
  });

  // 14. Long user message
  messages.push({
    type: 'message',
    role: 'user',
    content: `This is a very long message to test how the UI handles extensive content. 

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. 

Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

Key points to consider:
- Point one is about performance optimization
- Point two covers code maintainability
- Point three addresses testing strategies
- Point four discusses deployment pipelines

What are your thoughts on all of this?`,
    timestamp: new Date().toISOString(),
    uuid: generateUuid(),
    parentUuid: null,
  });

  return messages;
};

export function TestMessages() {
  const testMessages = createTestMessages();

  return (
    <div
      style={{
        padding: '16px',
        backgroundColor: 'var(--bg-primary)',
        borderRadius: '8px',
        border: '1px solid var(--border-subtle)',
      }}
    >
      <div
        style={{
          marginBottom: '16px',
          fontSize: '16px',
          fontWeight: 600,
          color: 'var(--text-primary)',
          borderBottom: '1px solid var(--border-subtle)',
          paddingBottom: '8px',
        }}
      >
        Message Component Test Scenarios
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          maxHeight: '600px',
          overflowY: 'auto',
          padding: '8px',
        }}
      >
        {/* Section headers with messages */}
        <SectionHeader title="1. Simple User Message" />
        <Message message={testMessages[0]} allMessages={testMessages} />

        <SectionHeader title="2. Simple Assistant Message" />
        <Message message={testMessages[1]} allMessages={testMessages} />

        <SectionHeader title="3. User Message (Multi-line with Code)" />
        <Message message={testMessages[2]} allMessages={testMessages} />

        <SectionHeader title="4. Assistant Message (Markdown)" />
        <Message message={testMessages[3]} allMessages={testMessages} />

        <SectionHeader title="5. Assistant Message (with Reasoning/Thinking)" />
        <Message message={testMessages[4]} allMessages={testMessages} />

        <SectionHeader title="6. Assistant Message (Tool Use - Pending)" />
        <Message message={testMessages[5]} allMessages={testMessages} />

        <SectionHeader title="7. Assistant Message (Tool Use - Completed)" />
        <Message message={testMessages[6]} allMessages={testMessages} />

        <SectionHeader title="8. Assistant Message (Tool Use - Error)" />
        <Message message={testMessages[8]} allMessages={testMessages} />

        <SectionHeader title="9. Assistant Message (Tool Use - Diff Viewer)" />
        <Message message={testMessages[10]} allMessages={testMessages} />

        <SectionHeader title="10. Assistant Message (Tool Use - Todos)" />
        <Message message={testMessages[12]} allMessages={testMessages} />

        <SectionHeader title="11. System Message" />
        <Message message={testMessages[14]} allMessages={testMessages} />

        <SectionHeader title="12. Empty Assistant Message" />
        <Message message={testMessages[15]} allMessages={testMessages} />

        <SectionHeader title="13. User Message (with Image)" />
        <Message message={testMessages[16]} allMessages={testMessages} />

        <SectionHeader title="14. Long User Message" />
        <Message message={testMessages[17]} allMessages={testMessages} />
      </div>
    </div>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div
      style={{
        fontSize: '13px',
        fontWeight: 600,
        color: 'var(--text-secondary)',
        backgroundColor: 'var(--bg-secondary)',
        padding: '6px 12px',
        borderRadius: '4px',
        marginTop: '8px',
      }}
    >
      {title}
    </div>
  );
}

export default TestMessages;
