// Type Guards
export { isValueDefined } from './guards/isValueDefined';
export { isNotEmptyArray } from './guards/isNotEmptyArray';
export { isNotEmptyString } from './guards/isNotEmptyString';
export { isNullOrUndefined } from './guards/isNullOrUndefined';
export { isEmptyArray } from './guards/isEmptyArray';
export { isEmptyString } from './guards/isEmptyString';

// Assertions
export { assertDefined } from './assertions/assertDefined';

// Error helpers
export { getErrorMessage } from './error/getErrorMessage';

// Formatting
export { formatDate } from './format/formatDate';

// Text sanitization (XSS defence-in-depth). Pure string work — no DOM.
//
// ⚠️ `sanitizeHtml` here ESCAPES entities (`<` → `&lt;`). It is NOT the DOMPurify
// scrubber of the same name in `@dloizides/rn-web-hooks`, which PARSES real DOM and
// strips tags. Two different jobs that the fork happened to give one name. They are
// deliberately in separate packages so no single import site can confuse them —
// see CHANGELOG for the rename follow-up.
export {
  sanitizeHtml,
  removeControlCharacters,
  sanitizeNotificationMessage,
  sanitizeText,
  sanitizeUrl,
} from './sanitize/sanitize';

// Navigation (framework-agnostic redirect escape hatch)
export { setRedirectHandler, redirectTo, resetRedirectHandler } from './navigation/redirect';

// Stale-chunk detection + one-shot reload guard (pairs with <AppErrorBoundary>)
export {
  isChunkLoadError,
  attemptChunkRecovery,
  clearChunkRecoveryFlag,
  reloadPage,
} from './chunkRecovery/chunkRecovery';
export type { ChunkRecoveryPorts } from './chunkRecovery/chunkRecovery';

// Re-export namespaced
export * as guards from './guards';
export * as assertions from './assertions';
export * as error from './error';
export * as format from './format';
export * as navigation from './navigation';
export * as chunkRecovery from './chunkRecovery';
export * as sanitize from './sanitize';
