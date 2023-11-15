import Event from '../src/index';

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

test('Typed Events: register sync', () => {
  const event = Event<{ foo: string }, number>();
  event(e => {
    expect(e.args.foo).toBe('bar');
    expect(e.result).toBe(42);
  });
  event.emit({ foo: 'bar' }, 42);
});

test('Typed Events: register async', async () => {
  const event = Event<void, number>();
  event(e => {
    e.result = 42;
  });
  const result = await event.emit();
  expect(result.result).toBe(42);
});

test('Typed Events: multicall sync', () => {
  const event = Event();
  let counter = 0;
  event(e => {
    counter++;
  });
  event.emit();
  event.emit();
  event.emit();
  expect(counter).toBe(3);
});

test('Typed Events: multicall async', async () => {
  const event = Event();
  let counter = 0;
  event(async e => {
    await wait(10);
    counter++;
  });
  await event.emit();
  await event.emit();
  await event.emit();
  expect(counter).toBe(3);
});

test('Typed Event: multicall result', async () => {
  const event = Event<void, number>();
  event(e => {
    e.result ??= 42;
    e.result++;
  });
  let e = await event.emit();
  e = await event.emit(null, e.result!);
  expect(e.result).toBe(44);
});

test('Typed Event: once sync', () => {
  const event = Event();
  let counter = 0;
  event.once(e => {
    counter++;
  });
  event.emit();
  event.emit();
  event.emit();
  expect(counter).toBe(1);
});

test('Typed Event: once async', async () => {
  const event = Event();
  let counter = 0;
  event.once(async e => {
    await wait(10);
    counter++;
  });
  await event.emit();
  await event.emit();
  await event.emit();
  expect(counter).toBe(1);
});

test('Typed Event: oncePred sync', () => {
  const event = Event<string>();
  let counter = 0;
  event.oncePred(e => {
    counter++;
  }, e => e.args === 'foo');
  event.emit('bar');
  event.emit('foo');
  event.emit('foo');
  expect(counter).toBe(1);
});

test('Typed Event: oncePred async', async () => {
  const event = Event<string>();
  let counter = 0;
  event.oncePred(async e => {
    await wait(10);
    counter++;
  }, e => e.args === 'foo');
  await event.emit('bar');
  await event.emit('foo');
  await event.emit('foo');
  expect(counter).toBe(1);
});

test('Typed Event: async', async () => {
  const event = Event<string>();
  const promise = event.async();
  event.emit('foo');
  expect(await promise).toBe('foo');
});

test('Typed Event: asyncPred', async () => {
  const event = Event<string>();
  const promise = event.asyncPred(e => !!e.args.match(/^[A-Z]/));
  event.emit('foo');
  event.emit('Bar');
  expect(await promise).toBe('Bar');
});
