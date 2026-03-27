# @philiprehberger/debounce-promise

[![CI](https://github.com/philiprehberger/ts-debounce-promise/actions/workflows/ci.yml/badge.svg)](https://github.com/philiprehberger/ts-debounce-promise/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/@philiprehberger/debounce-promise)](https://www.npmjs.com/package/@philiprehberger/debounce-promise)
[![License](https://img.shields.io/github/license/philiprehberger/ts-debounce-promise)](LICENSE)
[![Sponsor](https://img.shields.io/badge/sponsor-GitHub%20Sponsors-ec6cb9)](https://github.com/sponsors/philiprehberger)

Debounced async functions that return the latest promise result.

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

## API

| Function / Property | Description |
|---------------------|-------------|
| `debounceAsync(fn, wait, options?)` | Create a debounced async function |
| `debounced(...args)` | Call the debounced function; returns a promise |
| `debounced.cancel()` | Cancel all pending calls; rejects their promises |
| `debounced.flush()` | Execute immediately if pending; returns result or undefined |

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `leading` | `boolean` | `false` | Execute on first call, then debounce |
| `signal` | `AbortSignal` | `undefined` | Cancel on abort |

## Development

```bash
npm install
npm run build
npm test
npm run typecheck
```

## License

MIT
