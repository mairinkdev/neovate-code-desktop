# Extract Config Management to Zustand Store

**Date:** 2025-12-05

## Context

The `PreferencesPanel.tsx` component currently manages its own config state locally using `useState` and `useEffect`. It directly calls `request("config.list")` and `request("config.set")` to fetch and update global configuration.

The goal is to extract this config management logic into the central Zustand store, providing:
- Centralized config state accessible across the app
- Reusable actions for getting and setting config values
- Load-once caching pattern to avoid redundant API calls

## Discussion

### Config Scope
**Question:** Should the hook support global config only, or both global and project-level config?  
**Decision:** Support both scopes. While the initial implementation focuses on global config, the design allows for future project config support.

### API Style
**Options explored:**
1. Single hook returning `{ config, getConfig, setConfig, isLoading }`
2. Standalone async functions `getGlobalConfig()`, `setGlobalConfig()`
3. Add config state to existing Zustand store with actions

**Decision:** Zustand store approach. Config state and actions are added directly to the main store for consistency with the existing architecture.

### Caching Strategy
**Options explored:**
1. Load once, cache in store, manual refresh if needed
2. Always fetch fresh from backend
3. Load once and subscribe to backend changes via WebSocket

**Decision:** Load once and cache. Config rarely changes externally, and this provides the best performance.

### Architecture Pattern
**Options explored:**
- **A: Extend existing store.tsx** - Add config directly to main store
- **B: Separate configStore.ts** - Dedicated Zustand store for config
- **C: Slice pattern** - Composable slices merged into main store

**Decision:** Approach A (extend existing store). Simplest option, avoids multiple stores, and config logic is small enough not to warrant separation.

## Approach

Extend the main Zustand store in `store.tsx` with:
- Config state (`globalConfig`, `isConfigLoading`, `isConfigSaving`)
- Actions (`loadGlobalConfig`, `getGlobalConfigValue`, `setGlobalConfig`)

The `PreferencesPanel` component will be refactored to:
- Remove local state management for config
- Use store selectors for config state
- Call store actions for loading and updating config

Optimistic updates with automatic rollback on failure ensure responsive UI.

## Architecture

### State Shape

```ts
interface Store {
  // ... existing state

  // Config state
  globalConfig: Record<string, any> | null;
  isConfigLoading: boolean;
  isConfigSaving: boolean;

  // Config actions
  loadGlobalConfig: () => Promise<void>;
  getGlobalConfigValue: <T>(key: string, defaultValue?: T) => T | undefined;
  setGlobalConfig: (key: string, value: any) => Promise<boolean>;
}
```

### Action Implementations

**loadGlobalConfig:**
- Sets `isConfigLoading: true`
- Calls `request("config.list", { cwd: "/tmp" })`
- Stores result in `globalConfig`
- Sets `isConfigLoading: false`

**getGlobalConfigValue:**
- Reads from cached `globalConfig`
- Supports dot-notation paths (e.g., `"desktop.theme"` → `config.desktop.theme`)
- Returns `defaultValue` if path not found

**setGlobalConfig:**
- Performs optimistic update to local cache
- Sets `isConfigSaving: true`
- Calls `request("config.set", { cwd: "/tmp", isGlobal: true, key, value })`
- Reverts cache on failure
- Sets `isConfigSaving: false`
- Returns `boolean` success status

### Helper Function

Add to `src/renderer/lib/utils.ts`:

```ts
export function setNestedValue(
  obj: Record<string, any>,
  path: string,
  value: any
): Record<string, any> {
  const keys = path.split('.');
  let current = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    current[keys[i]] = current[keys[i]] ?? {};
    current = current[keys[i]];
  }
  current[keys[keys.length - 1]] = value;
  return obj;
}
```

### Files Modified

1. **`src/renderer/store.tsx`** - Add config state and actions
2. **`src/renderer/lib/utils.ts`** - Add `setNestedValue` helper
3. **`src/renderer/components/settings/PreferencesPanel.tsx`** - Refactor to use store

### PreferencesPanel Refactor

```tsx
export const PreferencesPanel = () => {
  const globalConfig = useStore((s) => s.globalConfig);
  const isConfigLoading = useStore((s) => s.isConfigLoading);
  const isConfigSaving = useStore((s) => s.isConfigSaving);
  const loadGlobalConfig = useStore((s) => s.loadGlobalConfig);
  const getGlobalConfigValue = useStore((s) => s.getGlobalConfigValue);
  const setGlobalConfig = useStore((s) => s.setGlobalConfig);

  useEffect(() => {
    if (!globalConfig) {
      loadGlobalConfig();
    }
  }, [globalConfig, loadGlobalConfig]);

  const theme = getGlobalConfigValue<ThemeValue>("desktop.theme", "system");

  const handleThemeChange = async (newTheme: ThemeValue) => {
    if (newTheme === theme || isConfigSaving) return;
    await setGlobalConfig("desktop.theme", newTheme);
  };

  // ... rest of component unchanged
};
```
