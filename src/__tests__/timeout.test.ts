import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { debounceAsync, DebounceTimeoutError } from '../../dist/index.js';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

describe('debounceAsync timeout', () => {
  it('should reject queued callers with DebounceTimeoutError when underlying call exceeds timeout', async () => {
    const slowFn = async (x: number) => {
      await sleep(200);
      return x;
    };
    const debounced = debounceAsync(slowFn, 20, { timeout: 50 });

    const p = debounced(1);

    await assert.rejects(p, (err: unknown) => {
      assert.ok(err instanceof DebounceTimeoutError);
      assert.equal((err as DebounceTimeoutError).timeoutMs, 50);
      assert.equal((err as Error).name, 'DebounceTimeoutError');
      return true;
    });
  });

  it('should reject all queued callers sharing the same execution on timeout', async () => {
    const slowFn = async (x: number) => {
      await sleep(200);
      return x;
    };
    const debounced = debounceAsync(slowFn, 20, { timeout: 40 });

    const p1 = debounced(1);
    const p2 = debounced(2);
    const p3 = debounced(3);

    // p1 and p2 are superseded (rejected with 'Debounced'); p3 should hit timeout
    await assert.rejects(p1, { message: 'Debounced' });
    await assert.rejects(p2, { message: 'Debounced' });
    await assert.rejects(p3, (err: unknown) => err instanceof DebounceTimeoutError);
  });

  it('should allow subsequent calls to work normally after a timeout', async () => {
    let invocation = 0;
    const fn = async (x: number) => {
      invocation++;
      if (invocation === 1) {
        await sleep(200);
      }
      return x * 10;
    };
    const debounced = debounceAsync(fn, 20, { timeout: 50 });

    await assert.rejects(debounced(1), (err: unknown) => err instanceof DebounceTimeoutError);

    // Wait so the slow first invocation does not interfere
    await sleep(60);

    const result = await debounced(7);
    assert.equal(result, 70);
  });

  it('should not reject if underlying call resolves before timeout', async () => {
    const fn = async (x: number) => x + 1;
    const debounced = debounceAsync(fn, 10, { timeout: 200 });

    const result = await debounced(41);
    assert.equal(result, 42);
  });
});

describe('debounceAsync metrics', () => {
  it('should expose initial zeroed metrics', () => {
    const fn = async (x: number) => x;
    const debounced = debounceAsync(fn, 50);

    const m = debounced.metrics();
    assert.deepEqual(m, { calls: 0, executions: 0, rejections: 0, hits: 0 });
  });

  it('should count calls, executions, rejections, and hits across rapid invocations', async () => {
    const fn = async (x: number) => x;
    const debounced = debounceAsync(fn, 30);

    const p1 = debounced(1);
    const p2 = debounced(2);
    const p3 = debounced(3);

    await assert.rejects(p1, { message: 'Debounced' });
    await assert.rejects(p2, { message: 'Debounced' });
    const result = await p3;
    assert.equal(result, 3);

    const m = debounced.metrics();
    assert.equal(m.calls, 3);
    assert.equal(m.executions, 1);
    assert.equal(m.rejections, 2);
    assert.equal(m.hits, 0);
  });

  it('should count cancel rejections', async () => {
    const fn = async (x: number) => x;
    const debounced = debounceAsync(fn, 100);

    const p = debounced(1);
    debounced.cancel();
    await assert.rejects(p, { message: 'Debounced' });

    const m = debounced.metrics();
    assert.equal(m.calls, 1);
    assert.equal(m.executions, 0);
    assert.equal(m.rejections, 1);
  });

  it('should count timeout rejections', async () => {
    const slowFn = async (x: number) => {
      await sleep(150);
      return x;
    };
    const debounced = debounceAsync(slowFn, 10, { timeout: 30 });

    await assert.rejects(debounced(1), (err: unknown) => err instanceof DebounceTimeoutError);

    const m = debounced.metrics();
    assert.equal(m.calls, 1);
    assert.equal(m.executions, 1);
    assert.equal(m.rejections, 1);
  });

  it('should reset metrics with resetMetrics()', async () => {
    const fn = async (x: number) => x;
    const debounced = debounceAsync(fn, 20);

    await debounced(1);
    debounced.resetMetrics();

    const m = debounced.metrics();
    assert.deepEqual(m, { calls: 0, executions: 0, rejections: 0, hits: 0 });
  });

  it('should return a copy of metrics, not a live reference', async () => {
    const fn = async (x: number) => x;
    const debounced = debounceAsync(fn, 10);

    const snapshot = debounced.metrics();
    await debounced(1);
    assert.equal(snapshot.calls, 0);
    assert.equal(debounced.metrics().calls, 1);
  });
});
