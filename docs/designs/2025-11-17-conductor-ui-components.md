# Conductor UI Component Architecture

**Date:** 2025-11-17

## Context

The goal is to implement a Conductor-style workspace and collaboration interface as pure UI components. The application requires:

- A multi-panel layout with sidebar, center content, changes panel, and terminal
- Workspace management capabilities (creating, switching, organizing repositories and workspaces)
- Real-time collaboration features (chat messages, file changes tracking, terminal output)
- Clean separation between presentation (UI components) and logic (Zustand store)

The existing infrastructure includes a Zustand store with WebSocket connectivity for server communication, and a normalized data structure based on Repos → Workspaces → Sessions.

## Discussion

### Key Design Decisions

**Data Flow Architecture:**
- All server data flows through WebSocket using existing store infrastructure
- Mutations (creating workspaces, sending messages, file operations) trigger WebSocket requests
- UI state (tab selection, sidebar expansion, input focus) stays local in component contexts
- Store updates happen via WebSocket events from the server

**Component Structure Approach:**
Three approaches were considered:
1. **Flat components with props drilling** - Simple but leads to large container components
2. **Smart components with direct store access** - More flexible but harder to test in isolation
3. **Compound components with context** - Most flexible and composable (selected)

The compound component approach was chosen for maximum flexibility and composability as the application grows.

**Data Model Alignment:**
Initial design assumed workspace folders at the top level, but reviewing `2025-11-17-store-data-structure.md` revealed the actual hierarchy: Repos → Workspaces → Sessions. The architecture was revised to match:
- What appears as "workspace folders" (tnf, takumi) are actually **Repos**
- Items underneath (amsterdam, curitiba) are **Workspaces** within those repos
- The center panel shows **Session** data with messages and workspace context

## Approach

Use **compound components with isolated contexts** to create a scalable, maintainable UI architecture:

1. Split the UI into 4 major section contexts, each managing its own domain
2. Each context subscribes to specific store slices using selectors for optimal performance
3. Compound children consume context without prop drilling
4. Store all components in a flat file structure at `src/renderer/components/`
5. Each component file contains all its compound children to keep related code together

## Architecture

### Component Organization

**File Structure:**
```
src/renderer/
├─ components/
│  ├─ RepoSidebar.tsx           (Left sidebar - repos & workspaces)
│  ├─ SessionPanel.tsx          (Center panel - session, messages, chat)
│  ├─ WorkspaceChanges.tsx      (Right sidebar - file changes)
│  ├─ Terminal.tsx              (Bottom panel - terminal I/O)
│  ├─ MainLayout.tsx            (Root layout composition)
│  └─ index.ts                  (Barrel exports)
├─ hooks/
│  ├─ useRepoContext.ts
│  ├─ useSessionContext.ts
│  ├─ useWorkspaceChangesContext.ts
│  ├─ useTerminalContext.ts
│  └─ index.ts
```

### Section Contexts

#### 1. RepoContext (Left Sidebar)
**Purpose:** Manage repository and workspace tree navigation

**Store Subscriptions:**
- `repos` - Repository list and metadata
- `workspaces` - Workspaces mapped by repo
- `selectedRepoPath` - Currently selected repository
- `selectedWorkspaceId` - Currently selected workspace

**Compound Components:**
- `<RepoSidebar>` - Root with context provider
- `<RepoSidebar.Header>` - Window controls, home button
- `<RepoSidebar.Folder>` - Repository folder item (collapsible)
- `<RepoSidebar.Workspace>` - Workspace item with branch/time info
- `<RepoSidebar.NewWorkspace>` - Button to create new workspace
- `<RepoSidebar.Footer>` - Add repository, settings buttons

**Context Data:**
```typescript
{
  repos: Repo[],
  selectedRepo: Repo | null,
  expandedFolders: Set<string>,
  selectRepo: (path: string) => void,
  selectWorkspace: (id: string) => void,
  toggleFolder: (path: string) => void
}
```

#### 2. SessionContext (Center Panel)
**Purpose:** Display session content, messages, and handle chat input

**Store Subscriptions:**
- `sessions` - All sessions
- `selectedSessionId` - Active session ID
- `messages` - Message history filtered by session
- `currentWorkspace` - Workspace metadata for display

**Compound Components:**
- `<SessionPanel>` - Root with context provider
- `<SessionPanel.Header>` - Workspace name, folder path, open button
- `<SessionPanel.TabBar>` - Tabs for multiple sessions/files
- `<SessionPanel.Tab>` - Individual tab item
- `<SessionPanel.WorkspaceInfo>` - Branch details, creation status
- `<SessionPanel.Messages>` - Scrollable message list
- `<SessionPanel.Message>` - Individual message bubble
- `<SessionPanel.ChatInput>` - Input area with toolbar
- `<SessionPanel.Toolbar>` - Quick action buttons
- `<SessionPanel.SendButton>` - Submit message button

**Context Data:**
```typescript
{
  session: Session | null,
  messages: Message[],
  inputValue: string,
  isLoading: boolean,
  sendMessage: (content: string) => Promise<void>,
  setInputValue: (value: string) => void
}
```

#### 3. WorkspaceChangesContext (Right Sidebar)
**Purpose:** Display file changes for the selected workspace

**Store Subscriptions:**
- `workspace.gitState.pendingChanges` - Modified files
- `workspace.context.activeFiles` - Currently open files

**Compound Components:**
- `<WorkspaceChanges>` - Root with context provider
- `<WorkspaceChanges.Header>` - View toggle (Changes/All Files), search
- `<WorkspaceChanges.FileList>` - File item list
- `<WorkspaceChanges.FileItem>` - Individual file with diff stats
- `<WorkspaceChanges.EmptyState>` - Empty state message

**Context Data:**
```typescript
{
  changes: FileChange[],
  viewMode: 'changes' | 'all-files',
  changesCount: number,
  setViewMode: (mode: 'changes' | 'all-files') => void
}
```

#### 4. TerminalContext (Bottom Panel)
**Purpose:** Display terminal output and handle command input

**Store Subscriptions:**
- Terminal output (may need to add to `WorkspaceData.context`)
- Terminal history

**Compound Components:**
- `<Terminal>` - Root with context provider
- `<Terminal.Tabs>` - Terminal tab switcher
- `<Terminal.Tab>` - Individual terminal tab
- `<Terminal.Output>` - Scrollable output area
- `<Terminal.Line>` - Individual output line
- `<Terminal.Input>` - Command input field

**Context Data:**
```typescript
{
  lines: TerminalLine[],
  activeTab: string,
  inputValue: string,
  executeCommand: (command: string) => Promise<void>
}
```

### Data Flow Patterns

**Reading Data (via selectors):**
```typescript
// Context providers subscribe with selectors
const repos = useStore(state => state.repos)
const session = useStore(state => 
  state.sessions.find(s => s.id === state.selectedSessionId)
)
const workspace = useStore(state =>
  state.workspaces.find(w => w.id === state.selectedWorkspaceId)
)
```

**Mutations (via WebSocket):**
- User clicks "New workspace" → `createWorkspace(repoPath)` → WebSocket request → Server updates → Event triggers store update
- User sends message → `sendMessage(sessionId, content)` → WebSocket request → Server broadcasts → `onEvent('message')` updates store
- User switches workspace → `selectWorkspace(workspaceId)` → WebSocket loads data → Updates store
- File operations → `commitChanges(files)` → WebSocket request → Updates `workspace.gitState`

**Local UI State:**
- Sidebar collapsed/expanded folders (in RepoContext)
- Active tab index (in SessionContext, TerminalContext)
- Input field values before submission
- View mode toggles (Changes vs All Files)

### Component Tree

```
<App>
  └─ <MainLayout>
      ├─ <RepoSidebar>
      │   ├─ <RepoSidebar.Header>
      │   ├─ <RepoSidebar.Folder>
      │   │   ├─ <RepoSidebar.Workspace>
      │   │   └─ <RepoSidebar.NewWorkspace>
      │   └─ <RepoSidebar.Footer>
      │
      ├─ <SessionPanel>
      │   ├─ <SessionPanel.Header>
      │   ├─ <SessionPanel.TabBar>
      │   │   └─ <SessionPanel.Tab>
      │   ├─ <SessionPanel.WorkspaceInfo>
      │   ├─ <SessionPanel.Messages>
      │   │   └─ <SessionPanel.Message>
      │   └─ <SessionPanel.ChatInput>
      │       ├─ <SessionPanel.Toolbar>
      │       └─ <SessionPanel.SendButton>
      │
      ├─ <WorkspaceChanges>
      │   ├─ <WorkspaceChanges.Header>
      │   ├─ <WorkspaceChanges.FileList>
      │   │   └─ <WorkspaceChanges.FileItem>
      │   └─ <WorkspaceChanges.EmptyState>
      │
      └─ <Terminal>
          ├─ <Terminal.Tabs>
          │   └─ <Terminal.Tab>
          ├─ <Terminal.Output>
          │   └─ <Terminal.Line>
          └─ <Terminal.Input>
```

### Implementation Notes

**Compound Component Pattern:**
Each file exports a root component with attached compound children:

```typescript
// RepoSidebar.tsx
export const RepoSidebar = () => {
  // Context provider + layout
}

RepoSidebar.Header = () => { /* ... */ }
RepoSidebar.Folder = () => { /* ... */ }
RepoSidebar.Workspace = () => { /* ... */ }
// etc.
```

**Context Hooks:**
Each context provides a custom hook for children to consume:

```typescript
// hooks/useRepoContext.ts
export function useRepoContext() {
  const context = useContext(RepoContext)
  if (!context) {
    throw new Error('useRepoContext must be used within RepoSidebar')
  }
  return context
}
```

**Props Pattern:**
- Root components accept only layout/styling props (className, style)
- Compound children use context, may accept ID overrides for specific use cases
- Pure leaf components (icons, buttons) accept standard props

**Error & Loading States:**
Each context tracks loading and error states from store mutations, passing them to children for appropriate UI feedback (spinners, error messages, retry buttons).
