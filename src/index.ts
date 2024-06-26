// License: MIT
export type Empty = {}

export interface EventInstance<Args, Result> {
  readonly event: ReturnType<typeof Event<Args, Result>>;
  readonly args: Args;
  result: Result | undefined;
  canceled: boolean;
}

export type EventHandler<Args, Result> = (e: EventInstance<Args, Result>) => void | Promise<void>;

export type EventEmitter<Args, Result> =
  void extends Args
  ? {
      (_?: any): Promise<EventInstance<Args, Result>>;
      (_: any, result: Result): Promise<EventInstance<Args, Result>>;
    }
  : {
      (args: Args, result?: Result): Promise<EventInstance<Args, Result>>;
    };

export function Event<Args = void, Result = void>() {
  const handlers = new Set<EventHandler<Args, Result>>();

  /** Register a new event handler to be called whenever an event is emitted. Returns its own unregistering function. */
  const register = (handler: EventHandler<Args, Result>) => {
    handlers.add(handler);
    return () => {
      handlers.delete(handler);
    }
  }

  /** Execute the given `handler` exactly once upon the next emitted event. */
  register.once = (handler: EventHandler<Args, Result>) => {
    const unregister = register(async (e) => {
      unregister();
      await handler(e);
    });
    return unregister;
  }

  /** Execute the given `handler` exactly once, but only if the event matches the given `pred`. */
  register.oncePred = (handler: EventHandler<Args, Result>, pred: (e: EventInstance<Args, Result>) => boolean) => {
    const unregister = register(async (e) => {
      if (pred(e)) {
        unregister();
        await handler(e);
      }
    });
    return unregister;
  }

  register.expect = (pred: (e: EventInstance<Args, Result>) => boolean, timeout = Infinity) =>
    new Promise<EventInstance<Args, Result>>((resolve, reject) => {
      let done = false;
      const unregister = register(async (e) => {
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

  /** Promise-wrapper around `.once`. */
  register.async = () => new Promise((resolve) => {
    register.once(({ args }) => resolve(args));
  });

  /** Promise-wrapper around `.oncePred`. */
  register.asyncPred = (pred: (e: EventInstance<Args, Result>) => boolean) => new Promise((resolve) => {
    register.oncePred(({ args }) => resolve(args), pred);
  });

  /** Emit an event. */
  register.emit = (async (args: Args, result?: Result) => {
    const event: EventInstance<Args, Result> = {
      event: register,
      args,
      result,
      canceled: false,
    };
    for (const handler of handlers) {
      await handler(event);
    }
    return event;
  }) as EventEmitter<Args, Result>;

  return register;
}

export type Event<Args = void, Result = void> = ReturnType<typeof Event<Args, Result>>;
export default Event;
