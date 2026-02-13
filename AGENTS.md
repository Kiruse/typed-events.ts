# Agent Guidelines for @kiruse/typed-events.ts

## Project Overview

This is a TypeScript library providing a typed event system with both async and sync event support. The codebase is small (~135 lines) and focuses on providing type-safe event emission and handling.

## Commands

### Build
```bash
npm run build
```
Compiles TypeScript to `dist/` and minifies with uglifyjs.

### Test
```bash
npm test
```
Runs all Jest tests.

### Single Test
```bash
npm test -- --testNamePattern="pattern"
```
Run tests matching a specific name pattern. Example:
```bash
npm test -- --testNamePattern="once sync"
```

### Type Check
```bash
npx tsc --noEmit
```

## Code Style Guidelines

### TypeScript Configuration
- Target: ES2015
- Module: CommonJS
- Strict mode: enabled
- Declaration files: generated

### Imports
- Use named imports: `import { Event, SyncEvent } from '../src/index';`
- Relative paths for local imports

### Formatting
- 2-space indentation
- No semicolons at line endings
- Opening brace on same line
- Max line length: ~100 characters (soft limit)

### Naming Conventions
- **Types/Interfaces**: PascalCase (e.g., `EventInstance`, `EventHandler`)
- **Functions/Variables**: camelCase (e.g., `event`, `register`, `handlers`)
- **Constants**: camelCase (e.g., `isAsync`)
- **Type parameters**: PascalCase (e.g., `Args`, `Result`, `IsAsync`)

### Type Definitions
- Use inline types where concise: `(args: Args, result?: Result) => void`
- Use interfaces for complex objects: `interface EventInstance<Args, Result, IsAsync>`
- Use type aliases for unions/tuples: `type Unsub = () => void;`
- Prefer generics over `any`

### Function Declarations
```typescript
// Prefer this style for functions
function event<Args = void, Result = void, IsAsync extends boolean = boolean>(isAsync: IsAsync): Event<Args, Result, IsAsync> {
  // ...
}
```

### Error Handling
- Use standard Error objects with descriptive messages
- Example: `reject(new Error('Event.expect timed out'))`

### Testing
- Use Jest with ts-jest preset
- Test file location: `test/typed-events.spec.ts`
- Use `describe` blocks for grouping related tests
- Use `test` (not `it`) for individual test cases
- Prefer async/await over callbacks
- Use `expect()` assertions with matchers like `toBe()`, `toMatchObject()`, `resolves`, `rejects`

### Deprecation
- Mark deprecated APIs with `@deprecated` JSDoc comment
- Provide alternative API in deprecation message

## Project Structure

```
src/
  index.ts          # Main source - contains all exports
test/
  typed-events.spec.ts  # Test suite
dist/               # Build output (generated)
```

## Key Types

| Type | Description |
|------|-------------|
| `Event<Args, Result, IsAsync>` | Main event type with handler registration |
| `AsyncEvent<Args, Result>` | Convenience type for async events |
| `SyncEvent<Args, Result>` | Convenience type for sync events |
| `EventHandler<Args, Result, IsAsync>` | Handler function signature |
| `EventInstance<Args, Result, IsAsync>` | Event instance passed to handlers |
| `Unsub` | Unsubscribe function type |

## Common Patterns

### Creating Events
```typescript
const event = Event<{ foo: string }, number>();
const syncEvent = SyncEvent<string>();
```

### Registering Handlers
```typescript
const unregister = event((e, args) => {
  console.log(args.foo, e.result);
});
```

### Emitting Events
```typescript
await event.emit({ foo: 'bar' }, 42);  // async
event.emit({ foo: 'bar' }, 42);         // sync
```

### One-time Handlers
```typescript
event.once((e, args) => { /* ... */ });
event.oncePred((e, args) => { /* ... */ }, pred);
```

### Waiting for Events
```typescript
const instance = await event.expect(pred, timeout);
const args = await event.async();
const instance = await event.wait(timeout);
```
