export interface DebounceAsyncOptions {
  leading?: boolean;
  signal?: AbortSignal;
  /**
   * Maximum time in milliseconds to wait for the underlying async function
   * to settle. If the call exceeds this duration, all queued callers are
   * rejected with `DebounceTimeoutError`. The wrapped function continues
   * to operate normally for subsequent invocations.
   */
  timeout?: number;
}

export interface DebounceMetrics {
  /** Total number of times the wrapped function was invoked. */
  calls: number;
  /** Number of times the underlying function actually ran. */
  executions: number;
  /** Rejected callers (cancel/timeout). */
  rejections: number;
  /** Callers who shared a result with another caller (calls - executions). */
  hits: number;
}

export interface DebouncedAsyncFunction<T extends (...args: any[]) => Promise<any>> {
  (...args: Parameters<T>): Promise<Awaited<ReturnType<T>>>;
  cancel(): void;
  flush(): Promise<Awaited<ReturnType<T>> | undefined>;
  metrics(): DebounceMetrics;
  resetMetrics(): void;
}
