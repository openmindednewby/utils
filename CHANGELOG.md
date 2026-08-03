# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.7.0] - 2026-08-03

### Added

- `toCsv(rows, columns)` + `CsvColumn<T>` — an RFC 4180 CSV serializer (header row + one row per
  item; quotes fields containing `,` `"` CR/LF; `null`/`undefined` → empty cell; empty rows yield
  the header line alone). Pure and DOM-free — the escaping is the whole risk surface, so it lives
  here where a unit test can hammer it, split from any browser download shell (an app-owned,
  side-effecting concern). Exported from the root and as the `csv` namespace + `@dloizides/utils/csv`
  subpath. Promoted from finreg-web's `utils/exportCsv.ts` (ZY-25) on its 2nd-consumer horizon; the
  9 RFC-4180 edge-case tests moved with it unchanged. The DOM `<a download>` shell that consumes it
  stays app-side until a 2nd consumer needs it.

## [1.4.0] - 2026-07-19

### Added

- `sanitizeHtml(text)` / `removeControlCharacters(text)` / `sanitizeNotificationMessage(message, maxLength?)` /
  `sanitizeText(text, maxLength?)` / `sanitizeUrl(url)` — XSS defence-in-depth for user-provided
  text: HTML-entity escaping, control/zero-width/BOM stripping (homograph + hidden-content
  attacks), length capping, and `javascript:`/`data:`/`vbscript:` URL blocking. Pure string
  work with no imports at all, so it is safe on web and native alike. Also exported as the
  `sanitize` namespace. Promoted from the byte-identical `src/utils/sanitize.ts` pair in
  erevna-web and katalogos-web (de-fork Wave 1); all 35 tests moved with it unchanged.

  ⚠️ **Naming hazard, inherited — do not "fix" by guessing.** The `sanitizeHtml` exported here
  ESCAPES entities (`<` → `&lt;`) and returns display-safe text. `@dloizides/rn-web-hooks`
  exports a DIFFERENT `sanitizeHtml` — a DOMPurify scrubber that PARSES real DOM and strips
  dangerous nodes. The fork gave two different jobs one name. They are kept in separate
  packages so no single import site can resolve both, and neither was renamed here because
  this wave is a provably-safe move, not a redesign. A follow-up should rename the escaping
  one to `escapeHtml`.

## [1.3.0] - 2026-07-19

### Added

- `isChunkLoadError(error)` / `attemptChunkRecovery(ports?)` / `clearChunkRecoveryFlag(ports?)` /
  `reloadPage(ports?)` + the `ChunkRecoveryPorts` type — stale-chunk detection and a one-shot
  guarded reload. After a deploy the browser can hold a stale `index.html` referencing hashed
  chunks that now 404; a single guarded `location.reload()` recovers silently, and the
  sessionStorage one-shot flag stops it becoming a reload LOOP when the reload does not help.
  Detection is a pure predicate; the storage + reload side effects are injectable ports.
  Promoted from the byte-identical `src/utils/chunkLoadRecovery.ts` triplets in kefi-web,
  erevna-web and katalogos-web (extract-on-2nd-use; this was the 3rd copy — the original file's
  own header predicted the move). Also exported as the `chunkRecovery` namespace.
  Pairs with `<AppErrorBoundary>` from `@dloizides/ui-feedback` ≥1.7.0, which consumes these as
  its `retryable` / `onMount` / `recover` injections.

## [1.2.0] - 2026-07-18

### Added

- `setRedirectHandler(handler)` / `redirectTo(path)` / `resetRedirectHandler()` — a
  framework-agnostic redirect escape hatch for non-React callers (axios 401 interceptors,
  auth providers) that need to navigate without a router hook. Falls back through
  registered handler → `window.location.replace` → a queue drained when the router mounts,
  and forces a hard navigation if the router silently failed to change the URL.
  Promoted from the byte-identical `lib/navigation.ts` twins in erevna-web and
  katalogos-web (de-fork wave W1.1). Also exported as the `navigation` namespace.

### Fixed

- The promoted watchdog guarded its `window` access with `try`/`catch` only; it now checks
  `typeof window !== 'undefined'` explicitly, so a non-browser host cannot reach a
  `ReferenceError` path at all. Surfaced by porting the code into a package whose tsconfig
  has no `DOM` lib.

## [1.1.0] - 2026-06-15

### Added

- `getErrorMessage(value, fallback?)` — extract a human-readable message from any error shape
  (Error / string / `{message}`). Consolidates the duplicated app-side `errorMessage` helper.
- `formatDate(date, locale, options?)` — locale-aware date formatting (pure; caller supplies the
  locale, e.g. from i18n). Backs the apps' `FD` helper. (Capability Wave C1, batch 6.)

## [1.0.0] - 2024-01-27

### Added

- Initial release
- Type guards:
  - `isValueDefined` - Check if value is not null or undefined
  - `isNotEmptyArray` - Check if value is a non-empty array
  - `isNotEmptyString` - Check if value is a non-empty string (after trim)
  - `isNullOrUndefined` - Check if value is null or undefined
  - `isEmptyArray` - Check if value is an empty array
  - `isEmptyString` - Check if value is empty or whitespace only
- Assertions:
  - `assertDefined` - Assert that value is defined (throws if null/undefined)
- Full TypeScript support with type narrowing
- ESM and CommonJS module support
- 100% test coverage
