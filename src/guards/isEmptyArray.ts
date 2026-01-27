/**
 * Type guard that checks if a value is an empty array.
 *
 * @param value - The value to check
 * @returns True if the value is an array with zero elements
 *
 * @example
 * ```typescript
 * const items: string[] = getItems();
 * if (isEmptyArray(items)) {
 *   console.log('No items found');
 * }
 * ```
 */
export function isEmptyArray<T>(
  value: readonly T[] | null | undefined
): value is readonly T[] & { readonly length: 0 } {
  return Array.isArray(value) && value.length === 0;
}
