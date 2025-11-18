# Repository Sidebar Empty State

**Date:** 2025-11-18

## Context

The RepoSidebar component currently displays an accordion list of repositories and their workspaces. When no repositories exist, the sidebar shows an empty accordion structure with no guidance for users on how to get started. An empty state is needed to guide new users to click the add icon in the footer to add their first repository.

## Discussion

**When to show empty state:**
The empty state should appear only when there are zero repositories in the sidebar (`repos.length === 0`). It should not appear when repositories exist but have no workspaces.

**Empty state content:**
The design follows a minimal approach with:
- An icon to provide visual context
- A simple title: "No repositories"
- A brief hint directing users to the add button below

More elaborate options (detailed onboarding, numbered steps, illustrations) were considered but rejected in favor of simplicity.

**Implementation approach:**
Three approaches were evaluated:
1. **Conditional Wrapper** - Replace accordion with empty state when repos array is empty
2. **Empty Component Integration** - Use existing `ui/empty.tsx` component within scrollable area
3. **Accordion Empty Slot** - Maintain accordion structure with empty case

The final decision combined Approach A (Conditional Wrapper) with using the existing `Empty` component from the UI library for consistency with the design system.

## Approach

The empty state will replace the entire `<Accordion>` section when no repositories exist:

```typescript
<div className="flex-1 overflow-y-auto">
  {repos.length === 0 ? (
    <EmptyState />
  ) : (
    <Accordion>...</Accordion>
  )}
</div>
```

The empty state leverages the existing `Empty` UI component to maintain design consistency and provides minimal, clear guidance pointing users to the existing add button in the footer.

## Architecture

**Component Structure:**
- Location: `src/renderer/components/RepoSidebar.tsx`
- New import: `Empty`, `EmptyMedia`, `EmptyHeader`, `EmptyTitle`, `EmptyDescription` from `./ui/empty`
- Conditional rendering based on `repos.length === 0`

**EmptyState Implementation:**
```typescript
<Empty>
  <EmptyMedia variant="icon">
    <HugeiconsIcon 
      icon={FolderIcon} 
      size={48} 
      strokeWidth={1.5}
      style={{ color: 'var(--text-tertiary)' }}
    />
  </EmptyMedia>
  <EmptyHeader>
    <EmptyTitle>No repositories</EmptyTitle>
    <EmptyDescription>
      Click the + icon below to add your first repository
    </EmptyDescription>
  </EmptyHeader>
</Empty>
```

**Visual Design:**
- Uses `FolderIcon` (already imported) at 48px for visual emphasis
- Applies `var(--text-tertiary)` color to icon for subtle appearance
- Text centered and styled by Empty component's built-in layout
- Description references "below" to guide eyes toward existing footer add button

**State Transitions:**
- Empty → Populated: When first repo added, switches from empty state to accordion
- Populated → Empty: When last repo deleted (via existing `deleteRepo` action), shows empty state
- No additional click handlers needed - footer button already exists

**Edge Cases:**
- Initial load with no repos shows empty state immediately
- React handles DOM cleanup automatically during state transitions
- `repos` prop always defined (array, possibly empty)

**Testing:**
- Manual: Launch with no repos → verify empty state
- Manual: Add first repo → verify accordion appears
- Manual: Delete all repos → verify empty state returns
- Unit test: Render with `repos={[]}` → assert empty state content exists

**Scope:**
- Single file modification: `src/renderer/components/RepoSidebar.tsx`
- No store changes required
- No changes to other components
- Estimated: ~15 lines of code (1 import, conditional rendering)
