/**
 * Type guard that checks if a value is null or undefined.
 *
 * @param value - The value to check
 * @returns True if the value is null or undefined
 *
 * @example
 * ```typescript
 * const value: string | null | undefined = getValue();
 * if (isNullOrUndefined(value)) {
 *   // value is narrowed to null | undefined
 *   console.log('Value is not set');
 * }
 * ```
 */
export function isNullOrUndefined(value: unknown): value is null | undefined {
  return value === undefined || value === null;
}
