# @philiprehberger/debounce-promise

[![CI](https://github.com/philiprehberger/ts-debounce-promise/actions/workflows/ci.yml/badge.svg)](https://github.com/philiprehberger/ts-debounce-promise/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/@philiprehberger/debounce-promise.svg)](https://www.npmjs.com/package/@philiprehberger/debounce-promise)
[![Last updated](https://img.shields.io/github/last-commit/philiprehberger/ts-debounce-promise)](https://github.com/philiprehberger/ts-debounce-promise/commits/main)

Debounced async functions that return the latest promise result

## Installation

```bash
npm install @philiprehberger/debounce-promise
```

## Usage

```ts
import { debounceAsync } from '@philiprehberger/debounce-promise';

const search = async (query: string) => {
  const res = await fetch(`/api/search?q=${query}`);
  return res.json();
};

const debouncedSearch = debounceAsync(search, 300);

// Only the last call resolves; earlier calls are rejected
const results = await debouncedSearch('hello');
```

### Cancel and Flush

```ts
import { debounceAsync } from '@philiprehberger/debounce-promise';

const debounced = debounceAsync(fetchData, 200);

debounced('query');

// Cancel all pending calls
debounced.cancel();

// Or flush immediately
const result = await debounced.flush();
```

### Leading Mode

```ts
import { debounceAsync } from '@philiprehberger/debounce-promise';

const debounced = debounceAsync(fetchData, 300, { leading: true });

// First call executes immediately
const result = await debounced('query');
```

### AbortSignal

```ts
import { debounceAsync } from '@philiprehberger/debounce-promise';

const controller = new AbortController();
const debounced = debounceAsync(fetchData, 300, { signal: controller.signal });

debounced('query');
controller.abort(); // cancels all pending calls
```

### Timeout

```ts
import { debounceAsync, DebounceTimeoutError } from '@philiprehberger/debounce-promise';

const debounced = debounceAsync(slowFetch, 200, { timeout: 1000 });

try {
  await debounced('query');
} catch (err) {
  if (err instanceof DebounceTimeoutError) {
    console.warn(`Timed out after ${err.timeoutMs}ms`);
  }
}

// Subsequent calls continue to work normally
const result = await debounced('query');
```

### Metrics

```ts
import { debounceAsync } from '@philiprehberger/debounce-promise';

const debounced = debounceAsync(fetchData, 100);

await Promise.allSettled([debounced('a'), debounced('b'), debounced('c')]);

const m = debounced.metrics();
// { calls: 3, executions: 1, rejections: 2, hits: 0 }

debounced.resetMetrics();
```

## API

| Function / Property | Description |
|---------------------|-------------|
| `debounceAsync(fn, wait, options?)` | Create a debounced async function |
| `debounced(...args)` | Call the debounced function; returns a promise |
| `debounced.cancel()` | Cancel all pending calls; rejects their promises |
| `debounced.flush()` | Execute immediately if pending; returns result or undefined |
| `debounced.metrics()` | Snapshot of `{ calls, executions, rejections, hits }` |
| `debounced.resetMetrics()` | Zero out all metrics counters |
| `DebounceTimeoutError` | Error raised when an execution exceeds `timeout` |

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `leading` | `boolean` | `false` | Execute on first call, then debounce |
| `signal` | `AbortSignal` | `undefined` | Cancel on abort |
| `timeout` | `number` | `undefined` | Reject queued callers via `DebounceTimeoutError` if the underlying call exceeds this many ms |

### Metrics

| Property | Type | Description |
|----------|------|-------------|
| `calls` | `number` | Total times the wrapped function was invoked |
| `executions` | `number` | Times the underlying function actually ran |
| `rejections` | `number` | Rejected callers (cancel/timeout/superseded) |
| `hits` | `number` | Callers who shared a result with another caller |

## Development

```bash
npm install
npm run build
npm test
```

## Support

If you find this project useful:

⭐ [Star the repo](https://github.com/philiprehberger/ts-debounce-promise)

🐛 [Report issues](https://github.com/philiprehberger/ts-debounce-promise/issues?q=is%3Aissue+is%3Aopen+label%3Abug)

💡 [Suggest features](https://github.com/philiprehberger/ts-debounce-promise/issues?q=is%3Aissue+is%3Aopen+label%3Aenhancement)

❤️ [Sponsor development](https://github.com/sponsors/philiprehberger)

🌐 [All Open Source Projects](https://philiprehberger.com/open-source-packages)

💻 [GitHub Profile](https://github.com/philiprehberger)

🔗 [LinkedIn Profile](https://www.linkedin.com/in/philiprehberger)

## License

[MIT](LICENSE)
