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

function makePorts(initialFlag = false): {
  ports: ChunkRecoveryPorts;
  reload: jest.Mock;
  state: { flag: boolean };
} {
  const state = { flag: initialFlag };
  const reload = jest.fn();
  const ports: ChunkRecoveryPorts = {
    hasFlag: () => state.flag,
    setFlag: () => {
      state.flag = true;
    },
    clearFlag: () => {
      state.flag = false;
    },
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

describe('attemptChunkRecovery — one-shot guard', () => {
  it('triggers a reload and sets the guard on the first attempt', () => {
    const { ports, reload, state } = makePorts(false);
    const reloaded = attemptChunkRecovery(ports);
    expect(reloaded).toBe(true);
    expect(reload).toHaveBeenCalledTimes(1);
    expect(state.flag).toBe(true);
  });

  it('does NOT reload again when the guard is already set (loop guard)', () => {
    const { ports, reload } = makePorts(true);
    const reloaded = attemptChunkRecovery(ports);
    expect(reloaded).toBe(false);
    expect(reload).not.toHaveBeenCalled();
  });

  it('a second consecutive attempt is exhausted (no reload loop)', () => {
    const { ports, reload } = makePorts(false);
    expect(attemptChunkRecovery(ports)).toBe(true);
    expect(attemptChunkRecovery(ports)).toBe(false);
    expect(reload).toHaveBeenCalledTimes(1);
  });
});

describe('clearChunkRecoveryFlag / reloadPage', () => {
  it('clearChunkRecoveryFlag releases the guard', () => {
    const { ports, state } = makePorts(true);
    clearChunkRecoveryFlag(ports);
    expect(state.flag).toBe(false);
  });

  it('reloadPage triggers a reload', () => {
    const { ports, reload } = makePorts();
    reloadPage(ports);
    expect(reload).toHaveBeenCalledTimes(1);
  });
});
