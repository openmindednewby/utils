/** Starts a promise without awaiting it and swallows its rejection. */
export function fireAndForget(promise: Promise<unknown>): void {
  promise.catch(() => undefined);
}
