/** Wraps an async action so a second call while the first runs does nothing: one Enter or tap, one request. */
export function singleFlight<T>(action: (input: T) => Promise<void>): (input: T) => void {
  let running = false;
  return (input: T): void => {
    if (running) {return;}
    running = true;
    action(input)
      .catch(() => undefined)
      .finally(() => {
        running = false;
      });
  };
}
