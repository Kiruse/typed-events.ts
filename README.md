# @kiruse/typed-events

Type-safe event system for TypeScript with result propagation and handler composition.

## Installation

```bash
npm install @kiruse/typed-events
```

## Usage

### Basic Event

```typescript
import { Event } from '@kiruse/typed-events';

// First generic: event arguments type
// Second generic: optional result type (propagated through handlers)
const click = Event<{ x: number; y: number }, number>();

// Register handler
const unsub = click((event, args) => {
  console.log(`Clicked at ${args.x}, ${args.y}`);
  event.result ??= 0;
  event.result++; // Increment click count
  return; // Can return promise for async events
});

// Emit event
const result = await click.emit({ x: 100, y: 200 });
console.log(result.result); // 1

// Unsubscribe
unsub();
```

### One-time Handlers

```typescript
const event = Event<{ value: string }>();

// Execute handler once, then auto-unsubscribe
event.once((e, args) => {
  console.log('First emission:', args.value);
});

// Execute handler once, but only if predicate passes
event.oncePred((e) => e.args.value.startsWith('valid'), (e, args) => {
  console.log('Matched:', args.value);
});
```

### Waiting for Events

```typescript
const event = Event<{ id: number }>();

// Wait for next event (any)
const next = await event.wait();

// Wait with timeout (throws on timeout)
try {
  await event.wait(5000); // 5 second timeout
} catch {
  console.log('Timed out');
}

// Wait for matching predicate
const matched = await event.expect((e) => e.args.id > 100);

// Async convenience methods
const args = await event.async();           // Wait for any event
const args = await event.asyncPred((e) => e.args.id > 100); // Wait for matching
```

### Sync Events

Synchronous events that don't return promises:

```typescript
import { SyncEvent } from '@kiruse/typed-events';

const sync = SyncEvent<{ data: string }>();

sync((e, args) => {
  console.log(args.data);
});

// Returns event directly, not Promise
const result = sync.emit({ data: 'test' });
```

### Event Composition

Handlers can modify `event.result`, which accumulates through the handler chain:

```typescript
const calc = Event<{ a: number; b: number }, number>();

calc((e, args) => {
  e.result = args.a + args.b; // 10 + 5 = 15
});

calc((e) => {
  e.result *= 2; // 15 * 2 = 30
});

const result = await calc.emit({ a: 10, b: 5 });
console.log(result.result); // 30
```

### Event Cancellation

Handlers can mark events as canceled:

```typescript
const event = Event<{ action: string }>();

event((e, args) => {
  if (args.action === 'abort') {
    e.canceled = true;
  }
});

const result = await event.emit({ action: 'abort' });
console.log(result.canceled); // true
```

## API

### Event Properties

- `event.args` - Arguments passed to emit
- `event.result` - Accumulated result (starts undefined)
- `event.canceled` - Whether any handler canceled the event

### Event Methods

- `event(handler)` - Register handler, returns unsubscribe function
- `event.once(handler)` - Register one-time handler
- `event.oncePred(pred, handler)` - Register conditional one-time handler
- `event.emit(args, result?)` - Fire event, returns event instance
- `event.wait(timeout?)` - Promise resolving on next event
- `event.expect(pred, timeout?)` - Promise resolving when predicate matches
- `event.async()` - Promise resolving with args on next event
- `event.asyncPred(pred, timeout?)` - Promise resolving with args when pred matches

### Types

- `Event<Args, Result>` - Async event (default)
- `SyncEvent<Args, Result>` - Synchronous event
- `AsyncEvent<Args, Result>` - Alias for Event
- `EventHandler<Args, Result, IsAsync>` - Handler function type
- `EventInstance<Args, Result, IsAsync>` - Event instance type
- `Unsub` - Unsubscribe function

## License

MIT
