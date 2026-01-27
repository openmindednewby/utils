/**
 * Checks if a value is an empty string or contains only whitespace.
 *
 * @param value - The value to check
 * @returns True if the value is an empty string or whitespace-only
 *
 * @example
 * ```typescript
 * isEmptyString('');          // true
 * isEmptyString('  ');        // true
 * isEmptyString('hello');     // false
 * isEmptyString(undefined);   // false (not a string)
 * isEmptyString(null);        // false (not a string)
 * ```
 */
export function isEmptyString(value: string | null | undefined): boolean {
  return typeof value === 'string' && value.trim().length === 0;
}
