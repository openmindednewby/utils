/** Resolves with the work's result, or with the fallback when the work has not settled within the time limit. */
export async function settleWithin<T>(work: Promise<T>, timeoutMs: number, fallback: T): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<T>((resolve) => {
    timer = setTimeout(() => resolve(fallback), timeoutMs);
  });
  return Promise.race([work, timeout]).finally(() => clearTimeout(timer));
}

/** Settles like the work, or rejects with the made error when the work has not settled within the time limit. */
export function rejectWithin<T>(work: Promise<T>, timeoutMs: number, makeError: () => Error): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(makeError()), timeoutMs);
    void work.then(resolve, reject).finally(() => clearTimeout(timer));
  });
}
