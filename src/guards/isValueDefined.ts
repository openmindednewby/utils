/**
 * Type guard that checks if a value is neither null nor undefined.
 *
 * @param value - The value to check
 * @returns True if the value is defined (not null and not undefined)
 *
 * @example
 * ```typescript
 * const value: string | null | undefined = getValue();
 * if (isValueDefined(value)) {
 *   // value is narrowed to string
 *   console.log(value.length);
 * }
 * ```
 */
export function isValueDefined<T>(value: T | null | undefined): value is T {
  return value !== undefined && value !== null;
}
