// License: MIT
export type Empty = {}

export interface EventInstance<Args, Result, IsAsync extends boolean> {
  readonly event: Event<Args, Result, IsAsync>;
  readonly args: Args;
  result: Result | undefined;
  canceled: boolean;
}

type TogglePromise<T, IsAsync extends boolean> = IsAsync extends true ? Promise<T> : T;

export type EventHandler<Args, Result, IsAsync extends boolean = true> = (e: EventInstance<Args, Result, IsAsync>, args: Args) => void | TogglePromise<void, IsAsync>;

export type EventEmitter<Args, Result, IsAsync extends boolean = true> =
  void extends Args
  ? {
      (_?: any): TogglePromise<EventInstance<Args, Result, IsAsync>, IsAsync>;
      (_: any, result: Result): TogglePromise<EventInstance<Args, Result, IsAsync>, IsAsync>;
    }
  : {
      (args: Args, result?: Result): TogglePromise<EventInstance<Args, Result, IsAsync>, IsAsync>;
    };

export type Unsub = () => void;
export type EventPredicate<Args, Result, IsAsync extends boolean = true> = (e: EventInstance<Args, Result, IsAsync>, args: Args) => boolean;

export type Event<Args = void, Result = void, IsAsync extends boolean = true> = {
  /** Virtual field denoting the event's arguments type. Doesn't actually hold any value. */
  readonly '__TypedEvent__Args': Args;
  /** Virtual field denoting the event's result type. Doesn't actually hold any value. */
  readonly '__TypedEvent__Result': Result;

  (handler: EventHandler<Args, Result, IsAsync>): Unsub;
  once: (handler: EventHandler<Args, Result, IsAsync>) => Unsub;
  oncePred: (handler: EventHandler<Args, Result, IsAsync>, pred: (e: EventInstance<Args, Result, IsAsync>) => boolean) => Unsub;
  /** Wait for the next event matching the given predicate to be emitted, with an optional timeout. */
  expect: (pred: (e: EventInstance<Args, Result, IsAsync>) => boolean, timeout?: number) => Promise<EventInstance<Args, Result, IsAsync>>;
  emit: EventEmitter<Args, Result, IsAsync>;
  /** @deprecated Variant of `.wait` that resolves to only the event arguments. */
  async: () => Promise<Args>;
  /** @deprecated Variant of `.expect` that resolves to only the event arguments. */
  asyncPred: (pred: (e: EventInstance<Args, Result, IsAsync>) => boolean) => Promise<Args>;
  /** Wait for the next event to be emitted, with an optional timeout. */
  wait: (timeout?: number) => Promise<EventInstance<Args, Result, IsAsync>>;
}

export type AsyncEvent<Args = void, Result = void> = Event<Args, Result, true>;
export type SyncEvent<Args = void, Result = void> = Event<Args, Result, false>;
export type EventArgs<T extends Event<any, any, any>> = T['__TypedEvent__Args'];
export type EventResult<T extends Event<any, any, any>> = T['__TypedEvent__Result'];

function event<Args = void, Result = void, IsAsync extends boolean = boolean>(isAsync: IsAsync): Event<Args, Result, IsAsync> {
  const handlers = new Set<EventHandler<Args, Result, IsAsync>>();

  /** Register a new event handler to be called whenever an event is emitted. Returns its own unregistering function. */
  const register = ((handler: EventHandler<Args, Result, IsAsync>) => {
    handlers.add(handler);
    return () => {
      handlers.delete(handler);
    }
  }) as Event<Args, Result, IsAsync>;

  /** Execute the given `handler` exactly once upon the next emitted event. */
  register.once = (handler: EventHandler<Args, Result, IsAsync>) => {
    const unregister = register((e) => {
      unregister();
      return handler(e, e.args);
    });
    return unregister;
  }

  /** Execute the given `handler` exactly once, but only if the event matches the given `pred`. */
  register.oncePred = (handler: EventHandler<Args, Result, IsAsync>, pred: (e: EventInstance<Args, Result, IsAsync>) => boolean) => {
    const unregister = register((e) => {
      if (pred(e)) {
        unregister();
        return handler(e, e.args);
      }
    });
    return unregister;
  }

  register.expect = (pred: (e: EventInstance<Args, Result, IsAsync>) => boolean, timeout = Infinity) =>
    new Promise<EventInstance<Args, Result, IsAsync>>((resolve, reject) => {
      let done = false;
      const unregister = register((e) => {
        if (pred(e) && !done) {
          done = true;
          unregister();
          resolve(e);
        }
      });
      if (timeout !== Infinity) {
        setTimeout(() => {
          if (!done) {
            done = true;
            unregister();
            reject(new Error('Event.expect timed out'));
          }
        }, timeout);
      }
    });

  register.wait = (timeout?: number) => register.expect((e) => true, timeout);

  register.async = (timeout?: number) => register.expect((e) => true, timeout).then(e => e.args);
  register.asyncPred = (pred: (e: EventInstance<Args, Result, IsAsync>) => boolean, timeout?: number) => register.expect((e) => pred(e), timeout).then(e => e.args);

  /** Emit an event. */
  register.emit = ((args: Args, result?: Result) => {
    const event: EventInstance<Args, Result, IsAsync> = {
      event: register,
      args,
      result,
      canceled: false,
    };

    const results: any[] = [];
    for (const handler of handlers) {
      results.push(handler(event, args));
    }

    return isAsync ? Promise.all(results).then(() => event) : event;
  }) as EventEmitter<Args, Result, IsAsync>;

  return register;
}

export const AsyncEvent = <Args = void, Result = void>() => event<Args, Result, true>(true);
export const SyncEvent = <Args = void, Result = void>() => event<Args, Result, false>(false);
export const Event = AsyncEvent;

export default Event;
