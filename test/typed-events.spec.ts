import { describe, expect, test } from 'bun:test';
import { Event, SyncEvent } from '../src/index';

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

describe('Async Events', () => {
  test('register 1', () => {
    const event = Event<{ foo: string }, number>();
    event(e => {
      expect(e.args.foo).toBe('bar');
      expect(e.result).toBe(42);
    });
    event.emit({ foo: 'bar' }, 42);
  });

  test('register 2', async () => {
    const event = Event<void, number>();
    event(e => {
      e.result = 42;
    });
    const result = await event.emit();
    expect(result.result).toBe(42);
  });

  test('multicall sync', () => {
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

  test('multicall async', async () => {
    const event = Event();
    let counter = 0;
    event(async e => {
      await wait(10);
      counter++;
    });
    await Promise.all([event.emit(), event.emit(), event.emit()]);
    expect(counter).toBe(3);
  });

  test('multicall result', async () => {
    const event = Event<void, number>();
    event(e => {
      e.result ??= 42;
      e.result++;
    });
    let e = await event.emit();
    e = await event.emit(null, e.result!);
    expect(e.result).toBe(44);
  });

  test('once sync', () => {
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

  test('once async', async () => {
    const event = Event();
    let counter = 0;
    event.once(async e => {
      await wait(10);
      counter++;
    });
    await Promise.all([event.emit(), event.emit(), event.emit()]);
    expect(counter).toBe(1);
  });

  test('oncePred sync', () => {
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

  test('oncePred async', async () => {
    const event = Event<string>();
    let counter = 0;
    event.oncePred(async e => {
      await wait(10);
      counter++;
    }, e => e.args === 'foo');
    await Promise.all([event.emit('bar'), event.emit('foo'), event.emit('foo')]);
    expect(counter).toBe(1);
  });

  test('expect', async () => {
    const event = Event();

    // resolves
    setTimeout(() => event.emit(), 1);
    await expect(event.expect(() => true)).resolves.toBeTruthy();

    // rejects due to condition
    setTimeout(() => event.emit(), 1);
    await expect(event.expect(() => false, 10)).rejects.toThrow('Event.expect timed out');

    // rejects due to timeout
    setTimeout(() => event.emit(), 15);
    await expect(event.expect(() => true, 10)).rejects.toThrow('Event.expect timed out');
  });

  test('wait', async () => {
    const event = Event<string, number>();
    setTimeout(() => event.emit('foobar', 42), 10);
    await expect(event.wait()).resolves.toMatchObject({ args: 'foobar', result: 42 });
  });

  test('async', async () => {
    const event = Event<string>();
    setTimeout(() => event.emit('foo'), 10);
    await expect(event.async()).resolves.toBe('foo');
  });

  test('asyncPred', async () => {
    const event = Event<string>();
    const promise = event.asyncPred(e => !!e.args.match(/^[A-Z]/));
    event.emit('foo');
    event.emit('Bar');
    expect(await promise).toBe('Bar');
  });
});

describe('Sync Events', () => {
  test('register 1', () => {
    const event = SyncEvent<{ foo: string }, number>();
    event(e => {
      expect(e.args.foo).toBe('bar');
      expect(e.result).toBe(42);
    });
    const e = event.emit({ foo: 'bar' }, 42);
    expect(e).toMatchObject({ args: { foo: 'bar' }, result: 42 });
  });

  test('register 2', () => {
    const event = SyncEvent<void, number>();
    event(e => {
      e.result = 42;
    });
    const result = event.emit();
    expect(result).toMatchObject({ result: 42 });
  });

  test('multicall sync', () => {
    const event = SyncEvent();
    let counter = 0;
    event(e => {
      counter++;
    });
    event.emit();
    event.emit();
    event.emit();
    expect(counter).toBe(3);
  });

  test('multicall result', () => {
    const event = SyncEvent<void, number>();
    event(e => {
      e.result ??= 42;
      e.result++;
    });

    let e = event.emit();
    expect(e).toMatchObject({ result: 43 });

    e = event.emit(null, e.result!);
    expect(e).toMatchObject({ result: 44 });
  });

  test('once sync', () => {
    const event = SyncEvent();
    let counter = 0;
    event.once(e => {
      counter++;
    });
    event.emit();
    event.emit();
    event.emit();
    expect(counter).toBe(1);
  });

  test('oncePred sync', () => {
    const event = SyncEvent<string>();
    let counter = 0;
    event.oncePred(e => {
      counter++;
    }, e => e.args === 'foo');
    event.emit('bar');
    event.emit('foo');
    event.emit('foo');
    expect(counter).toBe(1);
  });

  test('expect', async () => {
    // expect still is async. the event itself isn't, but expect is designed to wait for a specific
    // event matching a specific condition
    const event = SyncEvent();

    // resolves
    setTimeout(() => event.emit(), 1);
    await expect(event.expect(() => true)).resolves.toBeTruthy();

    // rejects due to condition
    setTimeout(() => event.emit(), 10);
    await expect(event.expect(() => false, 10)).rejects.toThrow('Event.expect timed out');

    // rejects due to timeout
    setTimeout(() => event.emit(), 15);
    await expect(event.expect(() => true, 10)).rejects.toThrow('Event.expect timed out');
  });

  test('wait', async () => {
    const event = SyncEvent();
    setTimeout(() => event.emit(), 10);
    await expect(event.wait()).resolves.toBeTruthy();
  });

  test('async', async () => {
    const event = SyncEvent<string>();
    setTimeout(() => event.emit('foo'), 10);
    await expect(event.async()).resolves.toBe('foo');
  });

  test('asyncPred', async () => {
    const event = SyncEvent<string>();
    const promise = event.asyncPred(e => !!e.args.match(/^[A-Z]/));
    event.emit('foo');
    event.emit('Bar');
    expect(await promise).toBe('Bar');
  });
});
