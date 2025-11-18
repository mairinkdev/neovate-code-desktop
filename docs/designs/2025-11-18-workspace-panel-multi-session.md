# WorkspacePanel with Multi-Session Support

**Date:** 2025-11-18

## Context

The current `SessionPanel` component displays a single session's chat interface. However, the application's data model shows that workspaces can contain multiple sessions (`workspace.sessionIds: string[]`). To better align the UI with this architecture, we need to rename `SessionPanel` to `WorkspacePanel` and enable it to display all sessions within a workspace, allowing users to switch between them.

The goal is to provide a multi-session view where users can see and interact with all sessions belonging to a workspace, rather than being limited to viewing one session at a time.

## Discussion

### Key Questions & Decisions

**Session Display Approach:**
Three options were considered:
- Show all sessions with tabs/list to switch between them (CHOSEN)
- Show only currently selected session
- Show workspace overview without session details

Decision: Show all sessions with the ability to switch between them for maximum visibility and quick access.

**Message Sending:**
Two options explored:
- Handler receives `(sessionId, content)` to identify target session (CHOSEN)
- Handler receives only `(content)` and component tracks active session internally

Decision: Explicit session ID in handler for clearer data flow and flexibility.

**Session Switching UI:**
Four patterns considered:
- Horizontal tabs (CHOSEN)
- Vertical sidebar list
- Dropdown selector
- Minimal approach with no UI initially

Decision: Horizontal tabs matching the existing tab pattern in the codebase for consistency.

**Existing Tab Bar:**
The component currently has "Chat/Files/Terminal" tabs. Two approaches:
- Nested tabs (sessions at top, Chat/Files/Terminal below)
- Remove Chat/Files/Terminal tabs (CHOSEN)

Decision: Simplify by removing the existing tab bar and only showing session tabs.

### Alternative Approaches Explored

**Approach A: Minimal Refactor** - Keep compound component pattern, add session tabs, track active session internally. ✅ CHOSEN
- Smallest code change
- Self-contained logic
- Slightly more complex component

**Approach B: Split Responsibilities** - Separate WorkspacePanel and SessionView components.
- Clear separation of concerns
- More components to manage

**Approach C: Fully Controlled** - Parent manages active session via props.
- Single source of truth in store
- More prop drilling

Decision: Approach A chosen for minimal disruption while achieving the goal.

## Approach

`SessionPanel` will be renamed to `WorkspacePanel` and refactored to support multiple sessions within a workspace:

1. **Props change**: Accept `workspace: WorkspaceData` instead of `session: SessionData`
2. **Callback update**: `onSendMessage` signature becomes `(sessionId: string, content: string) => Promise<void>`
3. **Session tabs**: Replace existing "Chat/Files/Terminal" tabs with session tabs showing all workspace sessions
4. **Internal state**: Track `activeSessionId` to determine which session's messages to display
5. **Context rename**: `SessionContext` → `WorkspaceContext` with expanded data including all sessions and active session

The component maintains the compound component pattern (`WorkspacePanel.Header`, `WorkspacePanel.Messages`, etc.) to minimize structural changes while adding multi-session capabilities.

## Architecture

### Component Structure

```typescript
<WorkspaceContext.Provider value={contextValue}>
  <div className="flex flex-col h-full">
    <WorkspacePanel.Header />        // Updated: shows workspace info
    <WorkspacePanel.SessionTabs />   // NEW: replaces old TabBar
    <WorkspacePanel.WorkspaceInfo />
    <WorkspacePanel.Messages />      // Uses active session
    <WorkspacePanel.ChatInput />     // Sends to active session
  </div>
</WorkspaceContext.Provider>
```

### Props Interface

```typescript
interface WorkspacePanelProps {
  workspace: WorkspaceData;  // Contains id, repoPath, branch, sessionIds[]
  onSendMessage: (sessionId: string, content: string) => Promise<void>;
}
```

### Context Structure

**WorkspaceContext** (renamed from SessionContext):
```typescript
interface WorkspaceContextType {
  workspace: WorkspaceData;
  activeSession: SessionData | null;
  allSessions: SessionData[];
  activeSessionId: string | null;
  setActiveSessionId: (id: string) => void;
  messages: Message[];
  inputValue: string;
  isLoading: boolean;
  sendMessage: (content: string) => Promise<void>;
  setInputValue: (value: string) => void;
}
```

### State Management

**Internal State:**
```typescript
const [inputValue, setInputValue] = useState('');
const [isLoading, setIsLoading] = useState(false);
const [activeSessionId, setActiveSessionId] = useState<string | null>(
  workspace.sessionIds[0] || null
);
```

**Store Integration:**
```typescript
// Fetch all sessions for the workspace
const allSessions = workspace.sessionIds
  .map(id => useStore(state => state.sessions[id]))
  .filter(Boolean);

// Get the active session
const activeSession = activeSessionId 
  ? useStore(state => state.sessions[activeSessionId])
  : null;
```

### Data Flow

**Message Sending:**
1. User types in ChatInput for active session
2. Clicks send → calls `sendMessage(content)` from context
3. Context wrapper calls `onSendMessage(activeSessionId, content)`
4. Parent (MainLayout) handles API call/store update
5. Store update triggers re-render with new message
6. Messages component displays updated list

**Session Switching:**
1. User clicks different session tab
2. `setActiveSessionId(newSessionId)` updates local state
3. Context recomputes `activeSession` and `messages`
4. Messages component re-renders with new session's messages
5. Input field resets to empty string

### UI Components

**Header Updates:**
- Title: "Workspace: {branch name}"
- Subtitle: Shows repo path
- Keeps "Open in Editor" button

**SessionTabs (NEW):**
- Horizontal tabs for each session
- Tab label: "Session {first 8 chars of id}"
- Active tab: blue bottom border (2px solid #0070f3)
- Click to switch active session
- Empty state: "No sessions yet" if workspace has no sessions
- Future consideration: Overflow handling for many sessions (limit to 5-10 visible)

**WorkspaceInfo:**
- Shows branch/status info from workspace instead of session

**Messages:**
- Displays messages from `activeSession.messages`
- Empty states:
  - No active session: "Select a session to view messages"
  - Active session, no messages: "No messages yet. Start a conversation!"

**ChatInput:**
- Calls `onSendMessage(activeSessionId, content)`
- Disabled if no active session exists
- Clears input after successful send
- Loading state tied to active session

### Parent Component Changes

**MainLayout updates:**
```typescript
// Before:
<SessionPanel 
  session={selectedSession}
  onSendMessage={handleSendMessage}  // (content: string) => Promise<void>
/>

// After:
<WorkspacePanel 
  workspace={selectedWorkspace}
  onSendMessage={handleSendMessageToSession}  // (sessionId, content) => Promise<void>
/>
```

### Error Handling

- Invalid session IDs in `workspace.sessionIds` → Filtered out silently
- Active session deleted → Auto-switch to first available session
- All sessions deleted → Show empty state
- Send message fails → Show error (existing error handling pattern)
- Rapid tab switching → Let pending sends complete

### Implementation Checklist

1. Rename file: `SessionPanel.tsx` → `WorkspacePanel.tsx`
2. Update component name throughout file
3. Rename context and hook: `SessionContext` → `WorkspaceContext`, `useSessionContext` → `useWorkspaceContext`
4. Change props interface to accept `workspace` and update `onSendMessage` signature
5. Add `activeSessionId` state and session fetching logic
6. Update context value to include workspace data and active session
7. Replace `TabBar` with new `SessionTabs` component
8. Update `Header` to display workspace information
9. Update `Messages` and `ChatInput` to work with active session
10. Update `MainLayout` to pass workspace and new callback
11. Handle empty states and error cases
12. Update imports in other files referencing SessionPanel
13. Test session switching, message sending, and edge cases

### Complexity Assessment

**Medium refactor:**
- Core message/chat logic remains unchanged
- Main changes: renaming, session tabs UI, active session state
- Estimated effort: 2-3 hours including testing

