# @kiruse/typed-events
*Typed Events* are an alternative event system designed for TypeScript. While there's obviously nothing functionally wrong with the standard `EventEmitter` system, it was built for JavaScript before TypeScript was even conceived. The objective of this library is simply to offer an event system which feels more natural to TypeScript.

## Installation
Install via npm:

```
$ npm install @kiruse/typed-events
```

## Usage
```typescript
import Event from '@kiruse/typed-events';

// First generic parameter is the `event.args` field, second is the optional `event.result` field.
const event = Event<{ foo: string }, number>();

const unsub = event(e => {
  console.log(e.args);
  e.result ??= 42;
  e.result++;
});
event.once(e => {
  e.result ??= 42;
  e.result /= 2;
});

const e = await event.emit({ foo: 'bar' });
console.log(e.result); // 21.5
unsub();
```
