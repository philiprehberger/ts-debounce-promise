import type { DebounceAsyncOptions, DebouncedAsyncFunction } from './types';

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

  function rejectAllPending(): void {
    for (const pair of pendingPairs) {
      pair.reject(new Error('Debounced'));
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

    // Reject all earlier pending promises
    const earlier = pendingPairs.filter(
      (p) => p.resolve !== resolve || p.reject !== reject,
    );
    for (const pair of earlier) {
      pair.reject(new Error('Debounced'));
    }
    pendingPairs = [];

    latestArgs = undefined;
    latestResolve = undefined;
    latestReject = undefined;
    timer = undefined;
    hasLeadingCall = false;

    try {
      const result = await fn(...args);
      resolve(result);
    } catch (error) {
      reject(error);
    }
  }

  const debounced = function (
    ...args: Parameters<T>
  ): Promise<Awaited<ReturnType<T>>> {
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
        pair.reject(new Error('Debounced'));
      }
      pendingPairs = [];
      latestArgs = undefined;
      latestResolve = undefined;
      latestReject = undefined;
      hasLeadingCall = false;

      try {
        const result = await fn(...args);
        resolve(result);
        return result;
      } catch (error) {
        reject(error);
        throw error;
      }
    }

    return undefined;
  };

  if (options.signal) {
    options.signal.addEventListener('abort', () => {
      debounced.cancel();
    });
  }

  return debounced;
}
