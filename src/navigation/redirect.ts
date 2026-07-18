/**
 * Framework-agnostic redirect escape hatch.
 *
 * WHY THIS EXISTS: non-React code (an axios 401 interceptor, an auth provider's
 * token-refresh failure path) needs to navigate, but has no access to a router
 * hook. The app registers its router's push/replace once via `setRedirectHandler`;
 * everything else calls `redirectTo` and does not care which router is mounted.
 *
 * Three layers of fallback, in order:
 *  1. the registered handler (the app's router),
 *  2. `window.location.replace` if no handler is registered yet,
 *  3. a queue, drained on the next `setRedirectHandler` call — so a redirect fired
 *     before the router mounts is not silently dropped.
 *
 * Layer 1 additionally schedules a watchdog: some routers accept a `push` for a
 * route they cannot resolve and leave the URL untouched, which strands the user on
 * the page they were supposed to leave. If the location has not changed after
 * `NAVIGATION_CHECK_DELAY_MS`, a hard `window.location.replace` is forced.
 *
 * Promoted from the byte-identical `lib/navigation.ts` twins in erevna-web and
 * katalogos-web. Pure DOM + timers — no React, no router, no framework import.
 */

/**
 * The slice of `window` this module touches, declared structurally.
 *
 * WHY NOT `lib: ["DOM"]`: `@dloizides/utils` ships to Node consumers too, and its
 * tsconfig deliberately lists only `ES2020`. Adding DOM globally would let every
 * other util in the package reach for browser globals that are absent at runtime
 * on the server. Declaring the ~4 properties used here keeps that door shut.
 */
interface BrowserWindow {
  location: {
    pathname: string;
    search: string;
    hash: string;
    replace: (url: string) => void;
  };
}

declare const window: BrowserWindow | undefined;

/** Delay in ms before checking whether the registered handler actually navigated. */
const NAVIGATION_CHECK_DELAY_MS = 150;

let redirectHandler: ((path: string) => void) | null = null;
const queuedRedirects: string[] = [];

/**
 * Strips Expo-Router group segments — `/(protected)/settings` → `/settings`.
 * Group folders are a routing-config device and never appear in a real URL, so a
 * raw group path handed to `window.location` would 404.
 */
function normalizeRouterPath(path: string): string {
  const normalized = path.replace(/\/\([^/]+\)/g, '');
  return normalized === '' ? '/' : normalized;
}

/** Current location as path+search+hash, or null outside a browser (SSR/native). */
function getCurrentLocation(): string | null {
  if (typeof window === 'undefined') return null;
  return `${window.location.pathname}${window.location.search}${window.location.hash}`;
}

/** Force a hard navigation if the registered handler left the location unchanged. */
function scheduleFallbackNavigation(before: string, normalized: string): void {
  setTimeout(() => {
    try {
      const after = getCurrentLocation();
      if (after === before && typeof window !== 'undefined') window.location.replace(normalized);
    } catch {
      /* ignore — window may have gone away (unmount/teardown) */
    }
  }, NAVIGATION_CHECK_DELAY_MS);
}

/** Attempt a hard browser navigation. Returns false outside a browser or on throw. */
function tryWindowNavigation(normalized: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    window.location.replace(normalized);
    return true;
  } catch {
    return false;
  }
}

/**
 * Register the app's router navigate function and drain any redirects that were
 * queued before it mounted. Call once, from the root layout.
 */
export function setRedirectHandler(h: (path: string) => void): void {
  redirectHandler = h;
  while (queuedRedirects.length > 0) {
    const p = queuedRedirects.shift();
    try {
      if (typeof p === 'string' && p.length > 0) h(normalizeRouterPath(p));
    } catch {
      /* swallow; the handler may still not be ready */
    }
  }
}

/**
 * Navigate to `path` from anywhere, including outside React.
 * Safe to call before the router mounts — the redirect is queued and replayed.
 */
export function redirectTo(path: string): void {
  const normalized = normalizeRouterPath(path);
  if (redirectHandler) {
    const before = getCurrentLocation();
    try {
      redirectHandler(normalized);
      if (typeof before === 'string') scheduleFallbackNavigation(before, normalized);
      return;
    } catch {
      /* fall through to a hard navigation */
    }
  }
  if (tryWindowNavigation(normalized)) return;
  queuedRedirects.push(normalized);
}

/**
 * Clear the registered handler and any queued redirects.
 * Exists for tests — module state otherwise leaks between cases.
 */
export function resetRedirectHandler(): void {
  redirectHandler = null;
  queuedRedirects.length = 0;
}
