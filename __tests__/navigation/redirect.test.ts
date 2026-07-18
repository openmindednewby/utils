import {
  redirectTo,
  setRedirectHandler,
  resetRedirectHandler,
} from '../../src/navigation/redirect';

type GlobalWithWindow = typeof globalThis & { window?: unknown };

const g = globalThis as GlobalWithWindow;
const originalWindow = g.window;

/** Minimal window stub: records `location.replace` calls. */
function stubWindow(
  location: Partial<{ pathname: string; search: string; hash: string }> = {},
  replace: () => void = jest.fn(),
): jest.Mock {
  const replaceMock = replace as jest.Mock;
  g.window = {
    location: {
      pathname: location.pathname ?? '/start',
      search: location.search ?? '',
      hash: location.hash ?? '',
      replace: replaceMock,
    },
  };
  return replaceMock;
}

function removeWindow(): void {
  delete g.window;
}

beforeEach(() => {
  resetRedirectHandler();
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
  g.window = originalWindow;
});

describe('redirectTo — queueing (no handler, no window)', () => {
  it('queues redirects and flushes them in order once a handler is set', () => {
    removeWindow();
    const handler = jest.fn();

    redirectTo('/a');
    redirectTo('/b');
    expect(handler).not.toHaveBeenCalled();

    setRedirectHandler(handler);

    expect(handler).toHaveBeenCalledTimes(2);
    expect(handler).toHaveBeenNthCalledWith(1, '/a');
    expect(handler).toHaveBeenNthCalledWith(2, '/b');
  });

  it('swallows a throw from the handler while draining the queue', () => {
    removeWindow();
    const handler = jest.fn(() => {
      throw new Error('router not ready');
    });

    redirectTo('/a');
    expect(() => setRedirectHandler(handler)).not.toThrow();
    expect(handler).toHaveBeenCalledTimes(1);
  });
});

describe('redirectTo — with a registered handler', () => {
  it('calls the handler immediately', () => {
    removeWindow();
    const handler = jest.fn();
    setRedirectHandler(handler);

    redirectTo('/c');

    expect(handler).toHaveBeenCalledWith('/c');
  });

  it('falls back to window.location.replace when the handler throws', () => {
    const replace = stubWindow({ pathname: '/start' });
    setRedirectHandler(() => {
      throw new Error('boom');
    });

    redirectTo('/d');

    expect(replace).toHaveBeenCalledWith('/d');
  });

  it('queues when the handler throws and there is no window', () => {
    removeWindow();
    setRedirectHandler(() => {
      throw new Error('boom');
    });
    redirectTo('/e');

    // The failed redirect was queued — a later working handler receives it.
    const good = jest.fn();
    setRedirectHandler(good);
    expect(good).toHaveBeenCalledWith('/e');
  });
});

describe('redirectTo — watchdog fallback', () => {
  it('forces a hard navigation when the handler did not change the location', () => {
    const replace = stubWindow({ pathname: '/start' });
    setRedirectHandler(jest.fn()); // a router that silently does nothing

    redirectTo('/target');
    expect(replace).not.toHaveBeenCalled();

    jest.runAllTimers();

    expect(replace).toHaveBeenCalledWith('/target');
  });

  it('does NOT force a navigation when the handler did change the location', () => {
    const replace = jest.fn();
    stubWindow({ pathname: '/start' }, replace);
    setRedirectHandler(() => {
      // simulate a router that really navigated
      stubWindow({ pathname: '/target' }, replace);
    });

    redirectTo('/target');
    jest.runAllTimers();

    expect(replace).not.toHaveBeenCalled();
  });

  it('ignores a throw raised inside the watchdog', () => {
    stubWindow({ pathname: '/start' });
    setRedirectHandler(() => {
      // window disappears before the watchdog fires (unmount/teardown)
      Object.defineProperty(g, 'window', {
        configurable: true,
        get() {
          throw new Error('window gone');
        },
      });
    });

    redirectTo('/target');
    expect(() => jest.runAllTimers()).not.toThrow();
  });

  it('does not schedule a watchdog when there is no window', () => {
    removeWindow();
    const handler = jest.fn();
    setRedirectHandler(handler);

    redirectTo('/f');

    expect(() => jest.runAllTimers()).not.toThrow();
    expect(handler).toHaveBeenCalledTimes(1);
  });
});

describe('redirectTo — no handler, window present', () => {
  it('navigates hard via window.location.replace', () => {
    const replace = stubWindow();

    redirectTo('/g');

    expect(replace).toHaveBeenCalledWith('/g');
  });

  it('queues when window.location.replace throws', () => {
    stubWindow({}, jest.fn(() => {
      throw new Error('blocked');
    }));

    redirectTo('/h');

    removeWindow();
    const handler = jest.fn();
    setRedirectHandler(handler);
    expect(handler).toHaveBeenCalledWith('/h');
  });
});

describe('path normalization', () => {
  it.each([
    ['/(protected)/settings', '/settings'],
    ['/(auth)/login', '/login'],
    ['/(protected)/(tabs)/home', '/home'],
    ['/plain/path', '/plain/path'],
  ])('normalizes %s to %s', (input, expected) => {
    removeWindow();
    const handler = jest.fn();
    setRedirectHandler(handler);

    redirectTo(input);

    expect(handler).toHaveBeenCalledWith(expected);
  });

  it('normalizes a path that is entirely a group segment to the root', () => {
    removeWindow();
    const handler = jest.fn();
    setRedirectHandler(handler);

    redirectTo('/(protected)');

    expect(handler).toHaveBeenCalledWith('/');
  });

  it('normalizes queued paths on flush', () => {
    removeWindow();
    redirectTo('/(protected)/queued');

    const handler = jest.fn();
    setRedirectHandler(handler);

    expect(handler).toHaveBeenCalledWith('/queued');
  });
});

describe('resetRedirectHandler', () => {
  it('clears the handler and the queue', () => {
    removeWindow();
    const first = jest.fn();
    redirectTo('/queued');

    resetRedirectHandler();

    setRedirectHandler(first);
    expect(first).not.toHaveBeenCalled();
  });

  it('drops an empty queued path without invoking the handler', () => {
    removeWindow();
    const handler = jest.fn();
    setRedirectHandler(handler);
    expect(handler).not.toHaveBeenCalled();
  });
});
