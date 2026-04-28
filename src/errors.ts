/**
 * Error raised when a debounced async call exceeds its configured `timeout`.
 * All callers awaiting that execution receive this rejection. The wrapped
 * debounced function remains usable for subsequent invocations.
 */
export class DebounceTimeoutError extends Error {
  public readonly timeoutMs: number;

  constructor(timeoutMs: number) {
    super(`Debounced async call timed out after ${timeoutMs}ms`);
    this.name = 'DebounceTimeoutError';
    this.timeoutMs = timeoutMs;
    Object.setPrototypeOf(this, DebounceTimeoutError.prototype);
  }
}
