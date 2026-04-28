import { DebounceTimeoutError } from './errors';
import type {
  DebounceAsyncOptions,
  DebounceMetrics,
  DebouncedAsyncFunction,
} from './types';

export function debounceAsync<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  wait: number,
  options: DebounceAsyncOptions = {},
): DebouncedAsyncFunction<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let latestArgs: Parameters<T> | undefined;
  let latestResolve: ((value: Awaited<ReturnType<T>>) => void) | undefined;
  let latestReject: ((reason: unknown) => void) | undefined;
  let pendingPairs: Array<{
    resolve: (value: Awaited<ReturnType<T>>) => void;
    reject: (reason: unknown) => void;
  }> = [];
  let hasLeadingCall = false;

  const metrics: DebounceMetrics = {
    calls: 0,
    executions: 0,
    rejections: 0,
    hits: 0,
  };

  function rejectAllPending(reason: unknown = new Error('Debounced')): void {
    for (const pair of pendingPairs) {
      metrics.rejections++;
      pair.reject(reason);
    }
    pendingPairs = [];
  }

  function cleanup(): void {
    if (timer !== undefined) {
      clearTimeout(timer);
      timer = undefined;
    }
    latestArgs = undefined;
    latestResolve = undefined;
    latestReject = undefined;
    hasLeadingCall = false;
  }

  async function execute(): Promise<void> {
    if (!latestArgs || !latestResolve || !latestReject) {
      return;
    }

    const args = latestArgs;
    const resolve = latestResolve;
    const reject = latestReject;

    // Reject all earlier pending promises (callers superseded by the latest call)
    const earlier = pendingPairs.filter(
      (p) => p.resolve !== resolve || p.reject !== reject,
    );
    for (const pair of earlier) {
      metrics.rejections++;
      pair.reject(new Error('Debounced'));
    }

    // Callers that share the result with the winning caller (excluding the winner itself)
    const winnerPairs = pendingPairs.filter(
      (p) => p.resolve === resolve && p.reject === reject,
    );
    if (winnerPairs.length > 1) {
      metrics.hits += winnerPairs.length - 1;
    }
    pendingPairs = [];

    latestArgs = undefined;
    latestResolve = undefined;
    latestReject = undefined;
    timer = undefined;
    hasLeadingCall = false;

    metrics.executions++;

    const timeoutMs = options.timeout;
    let timeoutHandle: ReturnType<typeof setTimeout> | undefined;
    let timedOut = false;

    try {
      let result: Awaited<ReturnType<T>>;
      if (typeof timeoutMs === 'number' && timeoutMs >= 0) {
        result = await new Promise<Awaited<ReturnType<T>>>(
          (settleResolve, settleReject) => {
            timeoutHandle = setTimeout(() => {
              timedOut = true;
              settleReject(new DebounceTimeoutError(timeoutMs));
            }, timeoutMs);

            Promise.resolve()
              .then(() => fn(...args))
              .then(
                (value) => {
                  if (timedOut) return;
                  if (timeoutHandle !== undefined) clearTimeout(timeoutHandle);
                  settleResolve(value);
                },
                (err) => {
                  if (timedOut) return;
                  if (timeoutHandle !== undefined) clearTimeout(timeoutHandle);
                  settleReject(err);
                },
              );
          },
        );
      } else {
        result = await fn(...args);
      }
      resolve(result);
    } catch (error) {
      if (error instanceof DebounceTimeoutError) {
        metrics.rejections++;
      }
      reject(error);
    }
  }

  const debounced = function (
    ...args: Parameters<T>
  ): Promise<Awaited<ReturnType<T>>> {
    metrics.calls++;
    return new Promise<Awaited<ReturnType<T>>>((resolve, reject) => {
      latestArgs = args;
      latestResolve = resolve;
      latestReject = reject;
      pendingPairs.push({ resolve, reject });

      if (options.leading && !hasLeadingCall) {
        hasLeadingCall = true;
        execute();
        return;
      }

      if (timer !== undefined) {
        clearTimeout(timer);
      }

      timer = setTimeout(() => {
        execute();
      }, wait);
    });
  } as DebouncedAsyncFunction<T>;

  debounced.cancel = function (): void {
    rejectAllPending();
    cleanup();
  };

  debounced.flush = async function (): Promise<
    Awaited<ReturnType<T>> | undefined
  > {
    if (timer !== undefined && latestArgs && latestResolve && latestReject) {
      clearTimeout(timer);
      timer = undefined;

      const args = latestArgs;
      const resolve = latestResolve;
      const reject = latestReject;

      const earlier = pendingPairs.filter(
        (p) => p.resolve !== resolve || p.reject !== reject,
      );
      for (const pair of earlier) {
        metrics.rejections++;
        pair.reject(new Error('Debounced'));
      }

      const winnerPairs = pendingPairs.filter(
        (p) => p.resolve === resolve && p.reject === reject,
      );
      if (winnerPairs.length > 1) {
        metrics.hits += winnerPairs.length - 1;
      }
      pendingPairs = [];
      latestArgs = undefined;
      latestResolve = undefined;
      latestReject = undefined;
      hasLeadingCall = false;

      metrics.executions++;

      const timeoutMs = options.timeout;

      try {
        let result: Awaited<ReturnType<T>>;
        if (typeof timeoutMs === 'number' && timeoutMs >= 0) {
          result = await new Promise<Awaited<ReturnType<T>>>(
            (settleResolve, settleReject) => {
              let timedOut = false;
              const handle = setTimeout(() => {
                timedOut = true;
                settleReject(new DebounceTimeoutError(timeoutMs));
              }, timeoutMs);

              Promise.resolve()
                .then(() => fn(...args))
                .then(
                  (value) => {
                    if (timedOut) return;
                    clearTimeout(handle);
                    settleResolve(value);
                  },
                  (err) => {
                    if (timedOut) return;
                    clearTimeout(handle);
                    settleReject(err);
                  },
                );
            },
          );
        } else {
          result = await fn(...args);
        }
        resolve(result);
        return result;
      } catch (error) {
        if (error instanceof DebounceTimeoutError) {
          metrics.rejections++;
        }
        reject(error);
        throw error;
      }
    }

    return undefined;
  };

  debounced.metrics = function (): DebounceMetrics {
    return { ...metrics };
  };

  debounced.resetMetrics = function (): void {
    metrics.calls = 0;
    metrics.executions = 0;
    metrics.rejections = 0;
    metrics.hits = 0;
  };

  if (options.signal) {
    options.signal.addEventListener('abort', () => {
      debounced.cancel();
    });
  }

  return debounced;
}
