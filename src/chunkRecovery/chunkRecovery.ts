/**
 * Detection + one-shot auto-recovery for stale-chunk load failures.
 *
 * WHY (UX Move 3, would have masked P0-01): after a deploy, the browser may hold
 * a stale `index.html` that references hashed JS chunks which now 404 — surfacing
 * as a `ChunkLoadError` / "failed to fetch dynamically imported module". A single
 * guarded `location.reload()` re-fetches the fresh entry + chunks and the app
 * recovers with no user-visible error. The sessionStorage one-shot flag prevents
 * a reload LOOP if the reload does not fix it (then the boundary shows a manual
 * Reload action instead).
 *
 * Pure + port-injectable: detection is a pure predicate; the storage + reload
 * side effects are ports (default to `window`) so unit tests run deterministically
 * in jsdom without a real navigation.
 *
 * Promoted from the byte-identical `src/utils/chunkLoadRecovery.ts` triplets in
 * kefi-web, erevna-web and katalogos-web (extract-on-2nd-use; this was the 3rd).
 * The original file's own header predicted this move. Pairs with
 * `<AppErrorBoundary>` from `@dloizides/ui-feedback`, which consumes these as its
 * `retryable` / `onMount` / `recover` injections.
 */

/**
 * The slice of `window` this module touches, declared structurally.
 *
 * WHY NOT `lib: ["DOM"]`: `@dloizides/utils` ships to Node consumers too, and its
 * tsconfig deliberately lists only `ES2020` (see `navigation/redirect.ts`, which
 * makes the same call). Declaring the few properties used here keeps every other
 * util in the package from reaching for browser globals absent on the server.
 */
interface ChunkRecoveryStorage {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
}

interface BrowserWindow {
  sessionStorage: ChunkRecoveryStorage;
  location: { reload: () => void };
}

declare const window: BrowserWindow | undefined;

/**
 * sessionStorage key holding the epoch-ms timestamp of the last auto-reload attempt.
 *
 * A TIMESTAMP, not the old boolean `ui.chunkReload.attempted`. The boolean was released
 * by the consumer on a clean mount, and a lazy route makes the mount clean: the root
 * boundary commits (a Suspense fallback renders), `componentDidMount` releases the guard,
 * and only THEN does the dynamic import reject with a 404 chunk. Recovery re-armed itself
 * on every pass, so the reload loop the guard exists to bound ran unbounded.
 */
const CHUNK_RELOAD_AT = 'ui.chunkReload.attemptedAt';

/**
 * How long one recorded attempt keeps blocking a second automatic reload.
 *
 * WHY A WINDOW RATHER THAN A COUNTER: attempt-counting bounds the loop too, but a counter
 * has to be reset by somebody, and the only place a consumer can put that reset is a clean
 * mount — the exact release that caused this defect. A window expires by itself, so there is
 * no release call to fire at the wrong moment. One minute is far longer than a reload-plus-boot
 * cycle (single-digit seconds, which is what the loop runs at) and far shorter than the gap to
 * a genuinely later, unrelated rollout, which is still allowed to auto-recover once.
 */
const RECOVERY_COOLDOWN_MS = 60_000;

/** Messages/names emitted by webpack/metro/vite/Safari for a stale-chunk failure. */
const CHUNK_ERROR_PATTERNS: readonly RegExp[] = [
  /ChunkLoadError/i,
  /Loading chunk [\w-]+ failed/i,
  /Loading CSS chunk/i,
  /Failed to fetch dynamically imported module/i,
  /error loading dynamically imported module/i,
  /Importing a module script failed/i,
  /is not a valid JavaScript MIME type/i,
];

/** Injectable side-effect ports; default to the real `window`. */
export interface ChunkRecoveryPorts {
  /** Epoch-ms of the last recorded attempt, or `null` when none is stored. */
  readAttemptAt: () => number | null;
  recordAttemptAt: (at: number) => void;
  clearAttempt: () => void;
  reload: () => void;
  now: () => number;
}

/** True when `error` looks like a stale-chunk / failed-dynamic-import failure. */
export function isChunkLoadError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }
  if (error.name === 'ChunkLoadError') {
    return true;
  }
  const haystack = `${error.name} ${error.message}`;
  return CHUNK_ERROR_PATTERNS.some((pattern) => pattern.test(haystack));
}

function resolveStorage(): ChunkRecoveryStorage | undefined {
  if (typeof window === 'undefined') {
    return undefined;
  }
  try {
    return window.sessionStorage;
  } catch {
    return undefined;
  }
}

function defaultPorts(): ChunkRecoveryPorts {
  const storage = resolveStorage();
  const hasWindow = typeof window !== 'undefined';
  return {
    readAttemptAt: (): number | null => {
      const raw = storage?.getItem(CHUNK_RELOAD_AT);
      if (raw === null || raw === undefined || raw === '') {
        return null;
      }
      const parsed = Number(raw);
      return Number.isFinite(parsed) ? parsed : null;
    },
    recordAttemptAt: (at: number): void => {
      storage?.setItem(CHUNK_RELOAD_AT, String(at));
    },
    clearAttempt: (): void => {
      storage?.removeItem(CHUNK_RELOAD_AT);
    },
    now: (): number => Date.now(),
    reload: (): void => {
      if (hasWindow) {
        window.location.reload();
      }
    },
  };
}

/** True when a recorded attempt is still inside the cooldown window. */
function isWithinCooldown(attemptedAt: number | null, now: number): boolean {
  return attemptedAt !== null && now - attemptedAt < RECOVERY_COOLDOWN_MS;
}

/**
 * Attempt a guarded reload to recover from a stale-chunk error.
 * Returns `true` when a reload was triggered, `false` while the cooldown from the previous
 * attempt is still running (the caller then shows a manual Reload action, never a loop).
 *
 * `recordAttemptAt` and `reload` stay synchronous and adjacent so the record survives the
 * navigation that follows.
 */
export function attemptChunkRecovery(ports: ChunkRecoveryPorts = defaultPorts()): boolean {
  const now = ports.now();
  if (isWithinCooldown(ports.readAttemptAt(), now)) {
    return false;
  }
  ports.recordAttemptAt(now);
  ports.reload();
  return true;
}

/**
 * Release the guard after a clean load — but ONLY once the cooldown has expired.
 *
 * Consumers call this from the root boundary's clean-mount hook, and on a lazy route that
 * mount happens BEFORE the chunk rejects. Refusing to clear a live record is what makes the
 * bound hold no matter when the consumer calls this: an expired record permits recovery
 * anyway, so clearing it only tidies storage, while a live one is left alone.
 */
export function clearChunkRecoveryFlag(ports: ChunkRecoveryPorts = defaultPorts()): void {
  if (isWithinCooldown(ports.readAttemptAt(), ports.now())) {
    return;
  }
  ports.clearAttempt();
}

/** Manually reload the page (the Reload action). */
export function reloadPage(ports: ChunkRecoveryPorts = defaultPorts()): void {
  ports.reload();
}
