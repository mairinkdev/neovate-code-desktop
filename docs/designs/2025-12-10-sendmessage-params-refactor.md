# sendMessage Parameters Refactor

**Date:** 2025-12-10

## Context

The `sendMessage` method in the Zustand store currently accepts a simple `{ message: string }` parameter. This limits the ability to pass additional context like plan mode, thinking level, and parent message UUID for features like forking conversations.

The goal is to extend the signature to support:
- `message: string | null` - Allow null for re-submitting with only mode changes
- `planMode: PlanMode` - normal/plan/brainstorm mode
- `parentUuid?: string` - For future fork/reply functionality  
- `think: ThinkingLevel` - null/low/medium/high thinking level

## Discussion

**Q: Should message allow null?**
- Yes, to support scenarios where user wants to re-submit with changed planMode/think without new text

**Q: Where should planMode and think values come from?**
- From session input state using `getSessionInput(sessionId)` in the store
- This keeps the data source centralized and consistent with existing session-scoped state management

## Approach

Refactor the `sendMessage` method to accept a structured params object, with values sourced from the session input state. The ChatInput component remains unchanged as it already passes message through `onSubmit`, and WorkspacePanel handles reading the additional parameters from session state.

## Architecture

### store.tsx

**Interface:**
```ts
sendMessage: (params: { 
  message: string | null;
  planMode: PlanMode;
  parentUuid?: string;
  think: ThinkingLevel;
}) => Promise<void>;
```

**Implementation:**
- Accept new params object
- Pass `params.planMode` to `session.send` request (replaces hardcoded `false`)
- Pass `params.think` to `session.send` request
- Use `params.parentUuid` if provided

### WorkspacePanel.tsx

**sendMessage function:**
```ts
const sendMessage = async (content: string) => {
  if (!content.trim() || isLoading) return;
  
  const inputState = getSessionInput(selectedSessionId || '');
  
  setIsLoading(true);
  try {
    await storeSendMessage({
      message: content,
      planMode: inputState.planMode,
      think: inputState.thinking,
    });
    setInputValue('');
  } finally {
    setIsLoading(false);
  }
};
```

**Required store selectors:**
- `getSessionInput` - to read planMode and thinking from session state
- Rename store's `sendMessage` to avoid collision with local function

### ChatInput.tsx

No changes required - already calls `onSubmit(value)` which flows through WorkspacePanel.

### Backend Contract

The `session.send` request payload:
```ts
{
  message: string | null,
  sessionId: string,
  cwd: string,
  planMode: 'normal' | 'plan' | 'brainstorm',
  think: null | 'low' | 'medium' | 'high',
  parentUuid?: string,
}
```
