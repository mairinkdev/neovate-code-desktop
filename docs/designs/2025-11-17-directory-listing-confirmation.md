# Directory Listing with Confirmation Dialog

**Date:** 2025-11-17

## Context
Enhance the existing directory listing feature by adding a confirmation step before executing the directory read operation. The current implementation allows users to click a button that directly triggers `fs.readdir()` in the main process. The goal is to implement bidirectional IPC communication where the main process can request confirmation from the renderer before proceeding with the operation.

## Discussion

### Communication Pattern
The design explored three IPC communication patterns:
1. **IPC invoke/handle both ways** - Modern async pattern but complex for bidirectional flow
2. **Send/on pattern** (Selected) - Traditional event-based bidirectional communication
3. **Combined pattern** - Mix of invoke and send, but inconsistent

The send/on pattern was chosen for clear bidirectional communication with explicit event handlers on both sides.

### Event Flow Architecture
Three approaches were considered for organizing the event chain:
1. **Linear Event Chain** (Selected) - Four distinct events in sequence with clear naming
2. **Request/Response Pair** - Reuses same event name with flags, fewer events but ambiguous
3. **State Machine Pattern** - Explicit state tracking, over-engineered for simple confirmation

The linear event chain was selected for its clarity and ease of debugging, despite having more event handlers.

### Confirmation UI
For the confirmation dialog, options included:
- **Native browser confirm dialog** (Selected) - `window.confirm()` with blocking behavior
- **Custom React modal** - Styled component with more flexibility
- **Electron native dialog** - OS-native appearance via `dialog.showMessageBox()`

The native browser confirm was chosen for simplicity and minimal code changes.

### Cancellation Feedback
When users cancel the operation:
- Display "Directory listing cancelled" message
- Show in a styled info box (blue background)
- Clear message on next successful directory listing

## Approach

Implement a bidirectional IPC communication flow using Electron's send/on pattern with four distinct events:

1. User clicks button → Renderer sends `request-list-directory` event
2. Main process receives request → Sends `confirm-list-directory` event with path back to renderer
3. Renderer shows `window.confirm()` dialog → Sends `confirm-response` event with boolean
4. Main process receives confirmation → Executes `fs.readdir()` or prepares cancellation message → Sends `directory-result` event
5. Renderer receives result → Updates UI with file list or displays cancellation/error message

## Architecture

### Files Modified
- **src/main/main.ts** - Replace invoke handler with send/on listeners, add two event handlers
- **src/main/preload.ts** - Replace invoke method with four new methods for bidirectional communication
- **src/shared/types.ts** - Update ElectronAPI interface with new method signatures
- **src/renderer/App.tsx** - Add event listeners in useEffect, add message state, modify button handler

### Event Chain Details

**Event 1: `request-list-directory`** (Renderer → Main)
- Payload: None
- Triggered by button click
- Preload method: `requestListDirectory: () => void`

**Event 2: `confirm-list-directory`** (Main → Renderer)
- Payload: `{ path: string }`
- Contains hardcoded project directory path to display in confirm dialog
- Preload method: `onConfirmRequest: (callback: (data: { path: string }) => void) => void`

**Event 3: `confirm-response`** (Renderer → Main)
- Payload: `{ confirmed: boolean }`
- Result from `window.confirm()` dialog
- Preload method: `sendConfirmResponse: (confirmed: boolean) => void`

**Event 4: `directory-result`** (Main → Renderer)
- Payload: `{ success: boolean, files?: string[], message?: string }`
- Contains file list on success, or error/cancellation message on failure
- Preload method: `onDirectoryResult: (callback: (data: DirectoryResult) => void) => void`

### Main Process Implementation
- Remove existing `ipcMain.handle('list-directory')` handler
- Add `ipcMain.on('request-list-directory', (event) => {...})`:
  - Sends `confirm-list-directory` event back to sender with `PROJECT_DIR` path
- Add `ipcMain.on('confirm-response', (event, { confirmed }) => {...})`:
  - If confirmed: Execute `fs.readdir(PROJECT_DIR)` and send success result
  - If not confirmed: Send `{ success: false, message: 'Directory listing cancelled' }`
  - Wrap `fs.readdir()` in try/catch, send error message on failure
  - All results sent via `event.sender.send('directory-result', result)`

### Preload Implementation
Expose four methods via contextBridge:
```typescript
requestListDirectory: () => ipcRenderer.send('request-list-directory')
onConfirmRequest: (callback) => ipcRenderer.on('confirm-list-directory', (_event, data) => callback(data))
sendConfirmResponse: (confirmed) => ipcRenderer.send('confirm-response', { confirmed })
onDirectoryResult: (callback) => ipcRenderer.on('directory-result', (_event, data) => callback(data))
```

Also expose cleanup methods:
```typescript
removeConfirmRequestListener: () => ipcRenderer.removeAllListeners('confirm-list-directory')
removeDirectoryResultListener: () => ipcRenderer.removeAllListeners('directory-result')
```

### Renderer Implementation
- Add `message` state: `const [message, setMessage] = useState<string>('')`
- Add `useEffect` hook to set up event listeners on mount:
  - `onConfirmRequest`: Shows `window.confirm()` with path, calls `sendConfirmResponse()`
  - `onDirectoryResult`: Updates `files` and `message` state based on result
  - Return cleanup function that removes both listeners
- Modify button handler to call `window.electron.requestListDirectory()`
- Display message in colored box (blue for cancellation, red for errors)
- Clear message when new successful listing appears
- File list only displays when `files.length > 0` and operation was successful

### Type Safety
Full TypeScript coverage with updated `ElectronAPI` interface:
```typescript
interface ElectronAPI {
  platform: string;
  versions: { node: string; chrome: string; electron: string };
  requestListDirectory: () => void;
  onConfirmRequest: (callback: (data: { path: string }) => void) => void;
  sendConfirmResponse: (confirmed: boolean) => void;
  onDirectoryResult: (callback: (data: { success: boolean; files?: string[]; message?: string }) => void) => void;
  removeConfirmRequestListener: () => void;
  removeDirectoryResultListener: () => void;
}
```

### Error Handling
- Main process: `fs.readdir()` errors return `{ success: false, message: error.message }`
- User cancellation: Returns `{ success: false, message: 'Directory listing cancelled' }`
- Renderer: Check `result.success` before updating file list
- Empty directory: Returns `{ success: true, files: [] }` - valid result with empty list

### Security
- Path remains hardcoded in main process - renderer cannot request arbitrary paths
- contextIsolation enabled
- Read-only operation with no file system modifications
- All IPC event payloads validated for correct types

### Event Listener Cleanup
- `useEffect` cleanup function removes listeners to prevent memory leaks
- Listeners removed when component unmounts
- Preload exposes explicit cleanup methods for both event listeners
