/**
 * Unit tests for chunkLoadRecovery — stale-chunk detection + one-shot reload guard.
 * Pure logic: detection predicate + the port-injected recovery side effects.
 */
import {
  attemptChunkRecovery,
  clearChunkRecoveryFlag,
  isChunkLoadError,
  reloadPage,
  type ChunkRecoveryPorts,
} from './chunkRecovery';

const COOLDOWN_MS = 60_000;

function makePorts(initialAttemptAt: number | null = null): {
  ports: ChunkRecoveryPorts;
  reload: jest.Mock;
  state: { attemptAt: number | null; clock: number };
} {
  const state = { attemptAt: initialAttemptAt, clock: 1_000_000 };
  const reload = jest.fn();
  const ports: ChunkRecoveryPorts = {
    readAttemptAt: () => state.attemptAt,
    recordAttemptAt: (at: number) => {
      state.attemptAt = at;
    },
    clearAttempt: () => {
      state.attemptAt = null;
    },
    now: () => state.clock,
    reload,
  };
  return { ports, reload, state };
}

describe('isChunkLoadError', () => {
  it('detects an error whose name is ChunkLoadError', () => {
    const error = Object.assign(new Error('boom'), { name: 'ChunkLoadError' });
    expect(isChunkLoadError(error)).toBe(true);
  });

  it.each([
    'Loading chunk 273 failed',
    'Loading CSS chunk 5 failed',
    'Failed to fetch dynamically imported module: https://app/_layout-abc.js',
    'error loading dynamically imported module',
    'Importing a module script failed',
    "Expected a JavaScript module script but the server responded with a MIME type of 'text/html'. is not a valid JavaScript MIME type",
  ])('detects stale-chunk message %p', (message) => {
    expect(isChunkLoadError(new Error(message))).toBe(true);
  });

  it('returns false for an ordinary error', () => {
    expect(isChunkLoadError(new Error('Cannot read properties of undefined'))).toBe(false);
  });

  it('returns false for non-Error values', () => {
    expect(isChunkLoadError('ChunkLoadError')).toBe(false);
    expect(isChunkLoadError(null)).toBe(false);
    expect(isChunkLoadError(undefined)).toBe(false);
  });
});

describe('attemptChunkRecovery — cooldown guard', () => {
  it('triggers a reload and records the attempt on the first attempt', () => {
    const { ports, reload, state } = makePorts(null);
    expect(attemptChunkRecovery(ports)).toBe(true);
    expect(reload).toHaveBeenCalledTimes(1);
    expect(state.attemptAt).toBe(state.clock);
  });

  it('does NOT reload again while a recorded attempt is inside the cooldown', () => {
    const { ports, reload, state } = makePorts(null);
    state.attemptAt = state.clock - 1;
    expect(attemptChunkRecovery(ports)).toBe(false);
    expect(reload).not.toHaveBeenCalled();
  });

  it('a second consecutive attempt is refused (no reload loop)', () => {
    const { ports, reload } = makePorts(null);
    expect(attemptChunkRecovery(ports)).toBe(true);
    expect(attemptChunkRecovery(ports)).toBe(false);
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('allows one more recovery after the cooldown expires (a genuinely later rollout)', () => {
    const { ports, reload, state } = makePorts(null);
    expect(attemptChunkRecovery(ports)).toBe(true);
    state.clock += COOLDOWN_MS;
    expect(attemptChunkRecovery(ports)).toBe(true);
    expect(reload).toHaveBeenCalledTimes(2);
  });
});

describe('lazy-route reload loop — the clean mount must not release a live guard', () => {
  /**
   * The defect this pins: on a lazy route the root boundary commits CLEAN (a Suspense
   * fallback renders) and the consumer's clean-mount hook fires BEFORE the dynamic import
   * rejects. Releasing the guard there re-armed recovery on every pass, so the reload ran
   * unbounded. Each iteration below is one full pass of that cycle.
   */
  it('bounds the loop to a single reload across repeated clean-mount-then-reject passes', () => {
    const { ports, reload, state } = makePorts(null);
    for (let pass = 0; pass < 5; pass += 1) {
      clearChunkRecoveryFlag(ports); // clean mount, fired before the chunk rejects
      attemptChunkRecovery(ports); // the post-commit chunk rejection
      state.clock += 2_000; // a reload-plus-boot cycle, well inside the cooldown
    }
    expect(reload).toHaveBeenCalledTimes(1);
  });
});

describe('clearChunkRecoveryFlag / reloadPage', () => {
  it('refuses to release a guard still inside its cooldown', () => {
    const { ports, state } = makePorts(null);
    state.attemptAt = state.clock - 1;
    clearChunkRecoveryFlag(ports);
    expect(state.attemptAt).toBe(state.clock - 1);
  });

  it('releases an expired guard', () => {
    const { ports, state } = makePorts(null);
    state.attemptAt = state.clock - COOLDOWN_MS;
    clearChunkRecoveryFlag(ports);
    expect(state.attemptAt).toBeNull();
  });

  it('reloadPage triggers a reload', () => {
    const { ports, reload } = makePorts();
    reloadPage(ports);
    expect(reload).toHaveBeenCalledTimes(1);
  });
});
