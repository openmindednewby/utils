/**
 * RFC 4180 CSV serialization — the pure, DOM-free core of "export the rows on screen to CSV".
 *
 * The escaping is the whole risk surface: a comma, a quote or a newline inside a value (a
 * counterparty name, an address) is exactly what turns one row into two columns or two rows in a
 * spreadsheet. So the serializer lives here as a pure, total function a unit test can hammer, split
 * from any browser download shell (which is a side-effecting, app-owned concern).
 *
 * Promoted from finreg-web's `utils/exportCsv.ts` (ZY-25) — the escaping logic is universal across
 * the fleet; the DOM `<a download>` shell that consumes it stays in the app until a 2nd consumer.
 */
import { isValueDefined } from '../guards/isValueDefined';

/** One column of a CSV export: a (caller-localized) header and how to read the cell from a row. */
export interface CsvColumn<T> {
  /** The column header — already localized by the caller. */
  header: string;
  /** Reads the cell value from a row. `null`/`undefined` become an empty cell. */
  value: (row: T) => string | number | null | undefined;
}

/** RFC 4180: a field must be quoted when it contains a quote, a comma, or a line break. */
const NEEDS_QUOTING = /["',\r\n]/;

// A more permissive test than strictly required (it also quotes apostrophes), so a value like
// O'Brien is never split by a spreadsheet that treats a leading quote specially — harmless, and it
// keeps the rule to one regex.
const QUOTE = '"';
const ESCAPED_QUOTE = '""';
/** Every embedded quote, so each is doubled per RFC 4180 (ES2020-safe; no `replaceAll`). */
const EVERY_QUOTE = /"/g;

/** RFC 4180 uses CRLF between records; Excel and Sheets both require it. */
const ROW_SEPARATOR = '\r\n';
const FIELD_SEPARATOR = ',';

/** Quote and escape a single field per RFC 4180. `null`/`undefined` → an empty field. */
function escapeField(raw: string | number | null | undefined): string {
  const text = isValueDefined(raw) ? String(raw) : '';
  if (!NEEDS_QUOTING.test(text)) {
    return text;
  }
  return `${QUOTE}${text.replace(EVERY_QUOTE, ESCAPED_QUOTE)}${QUOTE}`;
}

/**
 * Serialize rows to an RFC 4180 CSV string — a header row followed by one row per item.
 *
 * Pure and total: an empty `rows` yields the header line alone, which opens as an empty-but-labelled
 * spreadsheet rather than a zero-byte file the operator cannot tell apart from a failure.
 */
export function toCsv<T>(rows: readonly T[], columns: ReadonlyArray<CsvColumn<T>>): string {
  const headerLine = columns.map((column) => escapeField(column.header)).join(FIELD_SEPARATOR);

  const dataLines = rows.map((row) =>
    columns.map((column) => escapeField(column.value(row))).join(FIELD_SEPARATOR),
  );

  return [headerLine, ...dataLines].join(ROW_SEPARATOR);
}
