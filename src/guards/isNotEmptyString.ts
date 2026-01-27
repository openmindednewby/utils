/**
 * Checks if a value is a non-empty string (after trimming whitespace).
 *
 * @param value - The value to check
 * @returns True if the value is a string with non-whitespace content
 *
 * @example
 * ```typescript
 * isNotEmptyString('hello');     // true
 * isNotEmptyString('  ');        // false
 * isNotEmptyString('');          // false
 * isNotEmptyString(undefined);   // false
 * ```
 */
export function isNotEmptyString(value: string | null | undefined): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}
