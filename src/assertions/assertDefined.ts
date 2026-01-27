/**
 * Asserts that a value is defined (not null or undefined).
 * Throws an error if the value is null or undefined.
 *
 * @param value - The value to assert
 * @param message - Optional error message
 * @throws Error if value is null or undefined
 *
 * @example
 * ```typescript
 * const user = getUser(); // User | null
 * assertDefined(user, 'User must exist');
 * // user is now narrowed to User
 * console.log(user.name);
 * ```
 */
export function assertDefined<T>(
  value: T | null | undefined,
  message?: string
): asserts value is T {
  if (value === undefined || value === null) {
    throw new Error(message ?? 'Value must be defined');
  }
}
