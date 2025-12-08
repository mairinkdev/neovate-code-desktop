# Cursor-Range Suggestion Filtering

## Problem

Currently, suggestions appear based on pattern matching before the cursor, but don't consider whether the cursor is actually within the token being typed.

**Current behavior:**
- `a @a.txt [cursor]` → shows suggestions (wrong)
- `a @a.txt[cursor]` → shows suggestions (correct)

**Desired behavior:**
- Only show suggestions when cursor is **within** the token bounds
- For `@` file tokens: cursor anywhere within `@...` range
- For `/` slash commands: cursor within the command portion (before first space), and only when `/` is at the start

## Examples

### File suggestions (`@`)
| Input | Cursor Position | Show? |
|-------|-----------------|-------|
| `a @a.txt ` | after space | No |
| `a @a.txt` | at end of token | Yes |
| `a @a.t` | mid-query | Yes |
| ` @a.txt` | before @ | Yes |
| `@a.t xt` | within token | Yes |

### Slash commands (`/`)
| Input | Cursor Position | Show? |
|-------|-----------------|-------|
| `/command ` | after space | No |
| `/command` | at end | Yes |
| `/com` | mid-command | Yes |
| `/command args` | in args | No |
| `text /cmd` | not at start | No |

## Design

### Approach: Utility Function + Hook Integration

Create a reusable utility function to detect if cursor is within a token range.

### New File: `src/renderer/lib/tokenUtils.ts`

```typescript
export interface TokenRange {
  startIndex: number;
  endIndex: number;
  fullMatch: string;
}

/**
 * Find all @-tokens in the string and return the one containing the cursor.
 * Handles both `@path` and `@"path with spaces"` formats.
 */
export function findAtTokenAtCursor(
  value: string,
  cursorPosition: number
): TokenRange | null {
  const pattern = /(?:^|\s)(@(?:"[^"]*"?|[^\s]*))/g;
  let match;
  
  while ((match = pattern.exec(value)) !== null) {
    const fullMatch = match[1];
    const startIndex = match.index + (match[0].length - fullMatch.length);
    const endIndex = startIndex + fullMatch.length;
    
    if (cursorPosition >= startIndex && cursorPosition <= endIndex) {
      return { startIndex, endIndex, fullMatch };
    }
  }
  
  return null;
}

/**
 * Check if cursor is in the command portion of a slash command.
 * Only valid when value starts with '/'.
 */
export function isCursorInSlashCommand(
  value: string,
  cursorPosition: number
): boolean {
  if (!value.startsWith('/')) return false;
  
  const firstSpace = value.indexOf(' ');
  const commandEndPos = firstSpace === -1 ? value.length : firstSpace;
  
  return cursorPosition <= commandEndPos;
}
```

### Changes to `useFileSuggestion.ts`

```typescript
import { findAtTokenAtCursor } from '../lib/tokenUtils';

const atMatch = useMemo((): MatchResult => {
  const tokenRange = findAtTokenAtCursor(value, cursorPosition);
  
  if (!tokenRange) {
    return {
      hasQuery: false,
      fullMatch: '',
      query: '',
      startIndex: -1,
      triggerType: null,
    };
  }

  const { startIndex, fullMatch } = tokenRange;
  // Query is text between @ and cursor (for partial matching during typing)
  let query = value.substring(startIndex + 1, cursorPosition);
  if (query.startsWith('"')) {
    query = query.slice(1).replace(/"$/, '');
  }

  return { 
    hasQuery: true, 
    fullMatch, 
    query, 
    startIndex, 
    triggerType: 'at' 
  };
}, [value, cursorPosition]);
```

### Changes to `useSlashCommands.ts`

Add `cursorPosition` to the hook interface:

```typescript
interface UseSlashCommandsProps {
  value: string;
  cursorPosition: number;  // NEW
  fetchCommands: () => Promise<SlashCommand[]>;
}

export function useSlashCommands({
  value,
  cursorPosition,
  fetchCommands,
}: UseSlashCommandsProps) {
  // ...

  const suggestions = useMemo(() => {
    if (!value.startsWith('/')) return [];
    
    // Only show when cursor is in command portion
    const firstSpace = value.indexOf(' ');
    const commandEndPos = firstSpace === -1 ? value.length : firstSpace;
    if (cursorPosition > commandEndPos) return [];

    const prefix = value.slice(1, cursorPosition).toLowerCase().trim();
    if (prefix === '') return commands;

    return commands
      .filter(
        (cmd) =>
          cmd.name.toLowerCase().startsWith(prefix) ||
          cmd.description.toLowerCase().includes(prefix),
      )
      .sort((a, b) => {
        const aMatch = a.name.toLowerCase().startsWith(prefix);
        const bMatch = b.name.toLowerCase().startsWith(prefix);
        if (aMatch && !bMatch) return -1;
        if (!aMatch && bMatch) return 1;
        return 0;
      });
  }, [value, cursorPosition, commands]);

  // ...
}
```

### Changes to `useInputHandlers.ts`

Pass `cursorPosition` to `useSlashCommands`:

```typescript
const slashCommands = useSlashCommands({ 
  value, 
  cursorPosition,  // NEW
  fetchCommands 
});
```

## Files to Modify

| File | Action |
|------|--------|
| `src/renderer/lib/tokenUtils.ts` | Create new utility file |
| `src/renderer/hooks/useFileSuggestion.ts` | Use `findAtTokenAtCursor()` |
| `src/renderer/hooks/useSlashCommands.ts` | Add `cursorPosition` param, filter by cursor position |
| `src/renderer/hooks/useInputHandlers.ts` | Pass `cursorPosition` to `useSlashCommands` |

## Edge Cases

1. **Empty query**: `@[cursor]` → show all files
2. **Quoted paths**: `@"path with[cursor] spaces"` → cursor within quotes
3. **Multiple @ tokens**: Only match the one containing cursor
4. **Tab trigger**: Keep existing `forceTabTrigger` behavior for non-@ completions
