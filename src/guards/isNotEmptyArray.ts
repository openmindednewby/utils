/**
 * Type guard that checks if a value is a non-empty array.
 *
 * @param value - The value to check
 * @returns True if the value is an array with at least one element
 *
 * @example
 * ```typescript
 * const items: string[] | undefined = getItems();
 * if (isNotEmptyArray(items)) {
 *   // items is narrowed to string[] with at least one element
 *   console.log(items[0]); // Safe to access
 * }
 * ```
 */
export function isNotEmptyArray<T>(
  value: readonly T[] | null | undefined
): value is readonly T[] & { readonly length: number } {
  return Array.isArray(value) && value.length > 0;
}
