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

/** sessionStorage key for the one-shot auto-reload guard. */
const CHUNK_RELOAD_FLAG = 'ui.chunkReload.attempted';

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
  hasFlag: () => boolean;
  setFlag: () => void;
  clearFlag: () => void;
  reload: () => void;
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
    hasFlag: () => Boolean(storage?.getItem(CHUNK_RELOAD_FLAG)),
    setFlag: (): void => {
      storage?.setItem(CHUNK_RELOAD_FLAG, '1');
    },
    clearFlag: (): void => {
      storage?.removeItem(CHUNK_RELOAD_FLAG);
    },
    reload: (): void => {
      if (hasWindow) {
        window.location.reload();
      }
    },
  };
}

/**
 * Attempt a one-shot reload to recover from a stale-chunk error.
 * Returns `true` when a reload was triggered, `false` when the one-shot guard was
 * already spent (the caller then shows a manual Reload action, never a loop).
 */
export function attemptChunkRecovery(ports: ChunkRecoveryPorts = defaultPorts()): boolean {
  if (ports.hasFlag()) {
    return false;
  }
  ports.setFlag();
  ports.reload();
  return true;
}

/** Clear the one-shot guard after a clean load so a FUTURE deploy can auto-recover. */
export function clearChunkRecoveryFlag(ports: ChunkRecoveryPorts = defaultPorts()): void {
  ports.clearFlag();
}

/** Manually reload the page (the Reload action). */
export function reloadPage(ports: ChunkRecoveryPorts = defaultPorts()): void {
  ports.reload();
}
