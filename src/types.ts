export interface DebounceAsyncOptions {
  leading?: boolean;
  signal?: AbortSignal;
}

export interface DebouncedAsyncFunction<T extends (...args: any[]) => Promise<any>> {
  (...args: Parameters<T>): Promise<Awaited<ReturnType<T>>>;
  cancel(): void;
  flush(): Promise<Awaited<ReturnType<T>> | undefined>;
}
