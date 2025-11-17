# Directory Listing Button

**Date:** 2025-11-17

## Context
Add a button in the renderer process that calls a method in the main process to list the directory contents of `/Users/chencheng/Documents/Code/github.com/neovateai/neovate-code-desktop`. The current Electron app has minimal IPC setup with only static system information exposed through the preload script.

## Discussion

### Display Format
The directory listing will show file and folder names only in a simple list format, without additional metadata like sizes, types, or tree structures.

### Error Handling
Errors (permission denied, directory doesn't exist, etc.) will be logged to console only with silent failure. The UI will receive an empty array and display nothing when errors occur.

### Configuration
The directory path will be hardcoded to the specific project directory. This provides simplicity while allowing easy future modification by changing a constant in the main process.

### Architecture Pattern
Three approaches were considered:
1. **IPC Invoke/Handle Pattern** (Selected) - Modern async/await pattern with clean error handling and type safety
2. IPC Send/On Pattern - Older pattern requiring more boilerplate and listener cleanup
3. Invoke with File System Watcher - Adds real-time updates but introduces unnecessary complexity

The invoke/handle pattern was chosen for its simplicity, modern best practices, and low complexity.

## Approach

Implement a unidirectional IPC communication flow using Electron's invoke/handle pattern:

1. Renderer displays a button that triggers an async call to `window.electron.listDirectory()`
2. Preload exposes the IPC method safely via contextBridge
3. Main process handles the request, reads the directory using Node.js `fs.promises.readdir()`
4. File list returns through the invoke chain as a string array
5. Renderer updates React state and displays the list

## Architecture

### Files Modified
- **src/main/main.ts** - Add `ipcMain.handle('list-directory')` handler
- **src/main/preload.ts** - Expose `listDirectory()` method via contextBridge
- **src/shared/types.ts** - Extend ElectronAPI interface with `listDirectory: () => Promise<string[]>`
- **src/renderer/App.tsx** - Add button, state management, and list display

### Data Flow
1. **Renderer → Preload:** Button onClick calls `window.electron.listDirectory()`, returns `Promise<string[]>`
2. **Preload → Main:** Uses `ipcRenderer.invoke('list-directory')` with no parameters
3. **Main Processing:**
   - Import `fs/promises` module
   - Define constant `PROJECT_DIR = '/Users/chencheng/Documents/Code/github.com/neovateai/neovate-code-desktop'`
   - Handler calls `await fs.readdir(PROJECT_DIR)`
   - Returns string array to preload
4. **Main → Renderer:** Promise resolves with file/folder names
5. **UI Update:** React state update triggers re-render with mapped list items

### Error Handling
- Main process wraps `fs.readdir()` in try/catch block
- On error: Log to console with `console.error()` and return empty array `[]`
- Renderer receives empty array with no special error state
- Silent failure ensures no UI disruption

### Type Safety
- Full TypeScript coverage across IPC boundaries
- `ElectronAPI` interface enforces correct method signature
- No `any` types - end-to-end type checking

### Security
- contextIsolation enabled (already configured)
- Path hardcoded in main process - renderer cannot request arbitrary paths
- Read-only operation with no file system modifications
- No user input involved, eliminating injection risks

### Component Implementation
- React state: `const [files, setFiles] = useState<string[]>([])`
- Button handler: Async function calling `window.electron?.listDirectory()`
- Conditional rendering: Display list only when `files.length > 0`
- List rendering: Map files to `<li>` elements with file names as keys and content

### Testing Strategy
- Manual testing via button click in dev mode (`npm run dev`)
- Verify file list matches actual directory contents (compare with `ls` command)
- Check browser console for errors during operation
- Optional production build test to verify preload bundling

### Future Extensibility
- Path constant can be easily modified or made dynamic
- Pattern established for adding additional IPC methods
- Can extend with filtering, sorting, or file metadata display
