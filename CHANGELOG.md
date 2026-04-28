# Changelog

## 0.2.0 (2026-04-27)
- Add `timeout` option rejecting queued callers via `DebounceTimeoutError`
- Add `metrics()` and `resetMetrics()` for call/execution/rejection counters
- Compliance: README aligned with template

## 0.1.2

- Standardize README to 3-badge format with emoji Support section
- Update CI actions to v5 for Node.js 24 compatibility
- Add GitHub issue templates, dependabot config, and PR template

## 0.1.1

- Standardize README badges

## 0.1.0 (2026-03-21)

- Initial release
- `debounceAsync()` with promise return values
- `cancel()` and `flush()` controls
- Leading mode for immediate first execution
- AbortSignal support for cancellation
