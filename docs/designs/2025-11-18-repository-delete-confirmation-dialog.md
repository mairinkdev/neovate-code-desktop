# Repository Delete Confirmation Dialog

**Date:** 2025-11-18

## Context

The RepoSidebar component already has delete functionality implemented - users can click the info icon on a repository to open an info dialog, which contains a "Delete Repository" button that directly calls the `deleteRepo()` function from the store. However, this lacks a proper confirmation step for such a destructive action.

The goal is to add a two-step confirmation process:
1. Show the repository info dialog (existing)
2. When "Delete Repository" is clicked, show a confirmation dialog before actually deleting

## Discussion

Three approaches were explored for implementing the confirmation flow:

**Approach A: Alert Dialog (Destructive Action Pattern)**
- Use a separate AlertDialog component that appears on top of the info dialog
- Standard pattern for destructive actions with clear messaging
- Simple two-button choice: Cancel or Delete
- Trade-off: Two dialogs stacked might feel modal-heavy, but provides clear distinction for critical decision

**Approach B: Replace Content (Single Dialog Transform)**
- Transform the same dialog from info view to confirmation view
- Only one dialog visible at a time with smoother transition
- Trade-off: More complex state management, less obvious as a "critical decision moment"

**Approach C: Inline Confirmation (Two-Step Button)**
- First click changes button text, second click confirms
- Or require checkbox acknowledgment
- Trade-off: Less dramatic for destructive action, easier to accidentally confirm

**Selected Approach:** A - Alert Dialog pattern for its clarity and standard UX for destructive actions.

## Approach

Implement a two-dialog flow:
1. User clicks info icon → Info dialog opens (existing behavior)
2. User clicks "Delete Repository" → Confirmation AlertDialog appears on top
3. Confirmation dialog shows:
   - Warning title: "Delete Repository?"
   - Description listing repo name and workspace count with "cannot be undone" warning
   - Cancel button (closes alert, returns to info dialog)
   - Delete button (destructive variant, closes both dialogs, executes deletion)
4. On confirm → Both dialogs close, `deleteRepo()` is called
5. On cancel → Alert closes, info dialog remains open

## Architecture

### State Management

Add new state variable:
```typescript
const [alertDialogOpen, setAlertDialogOpen] = useState(false);
```

Keep existing states:
- `dialogOpen` - for info dialog
- `selectedRepoForDialog` - current repo being viewed

### Function Changes

**Modified `handleDeleteRepo`:**
- Change from directly calling `deleteRepo()`
- To: `setAlertDialogOpen(true)` to show confirmation

**New `handleConfirmDelete`:**
```typescript
const handleConfirmDelete = () => {
  if (selectedRepoForDialog) {
    deleteRepo(selectedRepoForDialog.path);
    setAlertDialogOpen(false);
    setDialogOpen(false);
    setSelectedRepoForDialog(null);
  }
};
```

**Enhanced `handleRepoInfoClick`:**
Reset alert state when opening new info dialog:
```typescript
const handleRepoInfoClick = (repo: RepoData, e: React.MouseEvent) => {
  e.stopPropagation();
  setAlertDialogOpen(false); // Ensure alert is closed
  setSelectedRepoForDialog(repo);
  setDialogOpen(true);
};
```

### Component Structure

**Import Addition:**
```typescript
import {
  AlertDialog,
  AlertDialogPopup,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogClose
} from './ui/alert-dialog';
```

**AlertDialog Content:**
- Title: "Delete Repository?"
- Description: Dynamic text showing repo name and workspace count
  - `"This will permanently delete '${repoName}' and its ${workspaceCount} workspace(s). This action cannot be undone."`
- Cancel button: Closes alert only (`setAlertDialogOpen(false)`)
- Delete button: Red/destructive variant, calls `handleConfirmDelete()`

### Edge Cases

1. **User clicks info icon on different repo while alert is open**
   - Reset alert state in `handleRepoInfoClick`

2. **User closes info dialog while alert is open**
   - Close both dialogs together via `onOpenChange` handler:
   ```typescript
   onOpenChange={(open) => {
     setDialogOpen(open);
     if (!open) setAlertDialogOpen(false);
   }}
   ```

3. **Deleted repo was selected**
   - Already handled by store's `deleteRepo()` which clears selections

### Store Integration

No changes needed to store. The existing `deleteRepo()` function (lines 183-223 in store.tsx) already handles:
- Cascading deletion of workspaces
- Cascading deletion of sessions
- Clearing UI selections if deleted repo was selected
- Proper immutable state updates

### Testing

Manual testing approach:
1. Open info dialog for a repository
2. Click "Delete Repository" button
3. Verify confirmation alert appears with correct repo name and workspace count
4. Test "Cancel" - alert closes, info dialog remains
5. Test "Delete" - both dialogs close, repo disappears from sidebar
6. Verify cascading deletes work (workspaces and sessions removed)
