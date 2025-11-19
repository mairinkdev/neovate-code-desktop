# Message Type System Migration

**Date:** 2025-11-19

## Context

The current `Message` interface in `entities.ts` is too simple for the application's needs. It only supports basic fields (`uuid`, `role`, `content`, `timestamp`) but the application requires:
- Rich message content (text, images, files, tool uses, reasoning)
- Multiple message role types with different structures
- Tool execution tracking and results
- Proper type discrimination for assistant messages with usage tracking
- Support for both legacy and new tool result formats

The goal is to replace the current simple Message type with a comprehensive message type system extracted from a reference implementation.

## Discussion

### Migration Strategy
Three approaches were considered:
- **Keep both** - Maintain legacy types alongside new ones
- **Full replacement** - Replace everywhere (chosen)
- **Gradual** - Temporary aliases during transition

Decision: Full replacement (B) to avoid confusion and technical debt.

### Dependencies
The reference code included imports for `CANCELED_MESSAGE_TEXT`, `ToolResult`, and `randomUUID`. Decision was made that these are not directly related to the Message type definition itself and should not be included.

### File Organization
Three options explored:
- **Standalone message.ts** - All message and tool types together (chosen)
- **Two-file split** - Separate tool.ts and message.ts
- **Minimal extraction** - Defer tool types with placeholders

Decision: Approach A (standalone) for self-contained file, trading some mixing of concerns for simplicity.

### Scope - Types Only
Helper functions from the reference code (`createUserMessage()`, `isToolResultMessage()`, `getMessageText()`, etc.) were excluded. Only type definitions are included to keep the file focused.

### Zod Dependency
The `Tool` interface used zod generics (`Tool<TSchema extends z.ZodTypeAny>`). Since zod is not in the project, decision was to use `any` for schema-related types.

## Approach

Create a new standalone `message.ts` file containing all message-related types, and update `entities.ts` to import and use `NormalizedMessage` instead of the current simple `Message` interface.

**Key principles:**
- Extract to separate file for better organization
- Include tool types inline since they're referenced by message content
- Types only, no utility functions
- Full replacement of existing Message type

## Architecture

### New File: `src/renderer/client/types/message.ts`

**Content Part Types (discriminated unions):**
- `TextPart` - `{type: 'text', text: string}`
- `ImagePart` - `{type: 'image', data: string, mimeType: string}`
- `FilePart` - `{type: 'file', filename?: string, data: string, mimeType: string}`
- `ToolUsePart` - `{type: 'tool_use', id: string, name: string, input: Record<string, any>, displayName?: string, description?: string}`
- `ReasoningPart` - `{type: 'reasoning', text: string}`
- `ToolResultPart` - `{type: 'tool_result', id: string, name: string, input: Record<string, any>, result: ToolResult}`
- `ToolResultPart2` - `{type: 'tool-result', toolCallId: string, toolName: string, input: Record<string, any>, result: ToolResult}`

**Message Role Types:**
- `SystemMessage` - `{role: 'system', content: string}`
- `UserMessage` - `{role: 'user', content: UserContent, hidden?: boolean}`
  - `UserContent = string | Array<TextPart | ImagePart>`
- `AssistantMessage` - `{role: 'assistant', content: AssistantContent, text: string, model: string, usage: {...}}`
  - `AssistantContent = string | Array<TextPart | ReasoningPart | ToolUsePart>`
  - Usage includes token counts and cache metrics
- `ToolMessage` - `{role: 'user', content: ToolContent}` (legacy format)
  - `ToolContent = Array<ToolResultPart>`
- `ToolMessage2` - `{role: 'tool', content: ToolResultPart2[]}` (new format)

**Union Types:**
- `Message = SystemMessage | UserMessage | AssistantMessage | ToolMessage | ToolMessage2`
- `NormalizedMessage = Message & {type: 'message', timestamp: string, uuid: string, parentUuid: string | null, uiContent?: string}`

**Tool System Types:**
- `ToolUse` - `{name: string, params: Record<string, any>, callId: string}`
- `ToolResult` - `{llmContent: string | (TextPart | ImagePart)[], returnDisplay?: ReturnDisplay, isError?: boolean}`
- `ReturnDisplay` - Union of display types (string, DiffViewerReturnDisplay, TodoReadReturnDisplay, TodoWriteReturnDisplay)
- `Tool` - Full tool definition with execute function, approval settings (uses `any` for schema types)
- `ToolUseResult` - `{toolUse: ToolUse, result: any, approved: boolean}`
- `ApprovalCategory` - `'read' | 'write' | 'command' | 'network'`
- Supporting approval types: `ApprovalContext`, `ToolApprovalInfo`
- Display types: `TodoReadReturnDisplay`, `TodoWriteReturnDisplay`, `DiffViewerReturnDisplay`

**Utility Function:**
- `toolResultPart2ToToolResultPart()` - Converts between tool result formats

### Updated: `src/renderer/client/types/entities.ts`

**Changes:**
- Remove current `Message` interface (6 lines)
- Add import: `import type { NormalizedMessage } from './message'`
- Update `SessionData.messages` type from `Message[]` to `NormalizedMessage[]`
- Keep `RepoData`, `WorkspaceData`, `SessionData` interfaces unchanged otherwise

### Breaking Changes

**Type changes:**
- `Message.timestamp`: `number` → `string` (in NormalizedMessage)
- `Message.content`: `string` → `string | Array<various content parts>`
- New required fields: `type: 'message'`, `parentUuid: string | null`

**Impact:**
- Files importing `Message` from entities.ts need to import from message.ts instead
- Code expecting simple `{uuid, role, content, timestamp}` structure needs refactoring
- Message rendering components must handle rich content types
- Likely affected files: `store.tsx`, `WorkspacePanel.tsx`, any message display components

### Implementation Notes

- Total size: ~150-180 lines for message.ts
- No external dependencies (zod replaced with `any`)
- Assumes `TodoItem` type exists for todo display types
- Supports two tool result formats for backward compatibility
- NormalizedMessage preserves base message structure while adding metadata for storage/display
