# Fetch Sessions from Backend

**Date:** 2025-11-19

## Context

The WorkspacePanel component currently has hardcoded empty sessions state. We need to fetch real session data from the backend when a workspace is selected. The backend provides a `sessions.list` endpoint that takes `{cwd}` (workspace path) and returns session data.

Additionally, the current data model stores `sessionIds` arrays in both the WorkspaceData entity and manages them separately, which creates unnecessary state synchronization complexity.

## Discussion

### Key Decisions

**1. Session replacement strategy:**
- Chose to replace sessions completely on fetch rather than merging
- Clean state management: fetched data is source of truth
- Simpler logic, avoids duplicate handling

**2. Storage location:**
- Store sessions in Zustand store rather than component state
- Consistent with how repos and workspaces are managed
- Sessions are keyed by workspaceId: `sessions: Record<string, SessionData[]>`
- Enables sharing session data across components if needed

**3. SessionIds removal:**
- Remove `sessionIds: string[]` from WorkspaceData and store
- Redundant with actual session objects
- Simplifies workspace CRUD operations
- Session list is derived from the sessions store

## Approach

When `selectedWorkspaceId` changes in WorkspacePanel:
1. Fetch sessions from backend using `sessions.list` with workspace's `worktreePath` as `cwd`
2. Store the response in Zustand store keyed by workspaceId
3. Component reads sessions from store instead of local state
4. Handle loading/error states gracefully

This decouples session data from workspace entities while maintaining proper workspace-to-sessions relationships through the workspaceId key.

## Architecture

### Data Structure Changes

**src/renderer/client/types/entities.ts:**
```typescript
// REMOVE from WorkspaceData:
sessionIds: string[];
```

**src/renderer/store.tsx:**
```typescript
// ADD to StoreState:
sessions: Record<string, SessionData[]>;  // keyed by workspaceId

// ADD to StoreActions:
setSessions: (workspaceId: string, sessions: SessionData[]) => void;

// REMOVE sessionIds handling from:
- addWorkspace
- updateWorkspace
- deleteWorkspace
```

### Session Fetching in WorkspacePanel

**useEffect hook:**
```typescript
useEffect(() => {
  if (!selectedWorkspaceId) return;
  
  const workspace = workspaces[selectedWorkspaceId];
  if (!workspace) return;
  
  const fetchSessions = async () => {
    setSessionsLoading(true);
    try {
      const response = await request('sessions.list', { 
        cwd: workspace.worktreePath 
      });
      
      if (response.success) {
        setSessions(selectedWorkspaceId, response.data.sessions);
      }
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
      setSessions(selectedWorkspaceId, []);
    } finally {
      setSessionsLoading(false);
    }
  };
  
  fetchSessions();
}, [selectedWorkspaceId]);
```

**Reading sessions:**
```typescript
// Replace local state with:
const allSessions = useStore(state => 
  state.sessions[selectedWorkspaceId] || []
);
```

### Active Session Management

- Keep `activeSessionId` in component state (UI-only concern)
- When sessions load, validate activeSessionId exists in new list
- If invalid, reset to first session or null
- Prevents stale session references after refetch

### Error Handling

- Wrap request in try/catch
- On error: log to console, set empty array for workspace
- Show loading state during fetch
- Fail gracefully without blocking UI

### Implementation Notes

- Remove sessionIds from sendMessage logic (already creates sessions on-demand)
- Clean up any sessionIds references in workspace operations
- Optional: Debounce rapid workspace switches to avoid duplicate requests
