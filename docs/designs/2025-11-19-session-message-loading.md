# Session Message Loading

**Date:** 2025-11-19

## Context

The WorkspacePanel component currently manages session selection locally with `activeSessionId` state, separate from the store's `selectedSessionId`. Messages are stored as a single flat array in the store, not organized by session. When a user selects a session, messages should be fetched from the backend and displayed, but this functionality doesn't exist yet.

The goal is to:
- Load messages automatically when a session is selected or changes
- Store messages per-session to enable instant switching between sessions
- Unify session selection by removing duplicate state (local vs store)
- Fetch messages via `session.messages.list` endpoint with `{cwd, sessionId}` parameters

## Discussion

### Key Questions & Decisions

**1. Where should message loading happen?**
- **Decision:** Unify session selection - remove local `activeSessionId` from WorkspacePanel and use only `store.selectedSessionId` everywhere
- This eliminates duplication and makes session selection a single source of truth

**2. Should messages be cleared when switching sessions?**
- **Decision:** Track messages per session using `Record<sessionId, NormalizedMessage[]>` structure
- Allows instant switching between sessions after initial load
- No flickering or clearing of old messages while loading new ones

**3. How should we handle loading and error states?**
- **Decision:** Simple approach - fetch and update messages silently
- If fetch fails, log to console and keep current messages
- No loading spinners or error toast notifications needed for MVP

### Explored Approaches

**Approach 1: useEffect in WorkspacePanel** ✅ Selected
- Add `useEffect` that watches `store.selectedSessionId`
- Component calls `store.request()` and `store.setMessages()`
- Simple and straightforward, keeps fetching logic in UI layer

**Approach 2: Store Action for Message Loading**
- Create `store.loadMessages(sessionId)` action
- Store handles cwd lookup, request, and update internally
- Better separation but slightly more complex

**Approach 3: Automatic Loading via Middleware**
- Override `selectSession` to auto-trigger message loading
- Most automatic but tighter coupling between selection and loading

## Approach

Use a `useEffect` hook in WorkspacePanel that triggers when `selectedSessionId` changes. The effect will:
1. Look up the current workspace to get `cwd`
2. Call the backend `session.messages.list` endpoint
3. Update the store with fetched messages for that specific session

Messages are stored per-session in a Record structure, enabling instant switching between previously-loaded sessions.

## Architecture

### Store Changes (`src/renderer/store.tsx`)

**State Update:**
```typescript
// Before
messages: NormalizedMessage[]

// After
messages: Record<string, NormalizedMessage[]>
```

**Action Updates:**
```typescript
// Update setMessages signature
setMessages: (sessionId: string, messages: NormalizedMessage[]) => void

// Implementation
setMessages: (sessionId: string, messages: NormalizedMessage[]) => {
  set((state) => ({
    messages: {
      ...state.messages,
      [sessionId]: messages,
    },
  }));
}

// Update addMessage for compatibility
addMessage: (sessionId: string, message: NormalizedMessage) => {
  set((state) => ({
    messages: {
      ...state.messages,
      [sessionId]: [...(state.messages[sessionId] || []), message],
    },
  }));
}
```

### WorkspacePanel Changes (`src/renderer/components/WorkspacePanel.tsx`)

**Remove Local State:**
- Delete `const [activeSessionId, setActiveSessionId] = useState<string | null>(null)`
- Replace with store selectors:
  - `const selectedSessionId = useStore(state => state.selectedSessionId)`
  - `const selectSession = useStore(state => state.selectSession)`

**Add Message Fetching Effect:**
```typescript
useEffect(() => {
  if (!selectedSessionId || !selectedWorkspaceId) return;
  
  const workspace = workspaces[selectedWorkspaceId];
  if (!workspace) return;

  const fetchMessages = async () => {
    try {
      const response = await request('session.messages.list', {
        cwd: workspace.worktreePath,
        sessionId: selectedSessionId
      });
      if (response.success) {
        setMessages(selectedSessionId, response.data.messages);
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  };

  fetchMessages();
}, [selectedSessionId, selectedWorkspaceId]);
```

**Update Component References:**
- Replace all `activeSessionId` with `selectedSessionId`
- Replace all `setActiveSessionId` with `selectSession`
- Update session validation effect to use store action
- Pass messages to child components: `messages={messages[selectedSessionId] || []}`

### Data Flow

1. User clicks session tab → `selectSession(id)` updates `store.selectedSessionId`
2. `useEffect` detects change → fetches messages from backend
3. Backend returns `{success: true, data: {messages: NormalizedMessage[]}}`
4. `setMessages(sessionId, messages)` updates `store.messages[sessionId]`
5. Component re-renders with messages from `messages[selectedSessionId]`

### Error Handling

- **Failed fetch:** Catch silently, log to console, don't update messages
- **Missing workspace:** Early return, prevents invalid `cwd`
- **Rapid session switching:** Each fetch completes independently, last response wins
- **Empty messages:** Display existing "No messages yet" empty state
- **Deleted session:** Handled by existing session validation effect

### Edge Cases

- First-time session with no messages returns empty array
- Session switching is instant after initial load (messages cached by sessionId)
- Workspace change clears session selection (existing behavior)
- No race condition handling needed - messages keyed by sessionId
