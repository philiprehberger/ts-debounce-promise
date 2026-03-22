import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { debounceAsync } from '../../dist/index.js';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

describe('debounceAsync', () => {
  it('should return a promise with the result', async () => {
    const fn = async (x: number) => x * 2;
    const debounced = debounceAsync(fn, 50);

    const result = await debounced(5);
    assert.equal(result, 10);
  });

  it('should only resolve the last call on rapid calls', async () => {
    let callCount = 0;
    const fn = async (x: number) => {
      callCount++;
      return x;
    };
    const debounced = debounceAsync(fn, 50);

    const p1 = debounced(1);
    const p2 = debounced(2);
    const p3 = debounced(3);

    // p1 and p2 should reject
    await assert.rejects(p1, { message: 'Debounced' });
    await assert.rejects(p2, { message: 'Debounced' });

    const result = await p3;
    assert.equal(result, 3);
    assert.equal(callCount, 1);
  });

  it('should reject pending calls on cancel', async () => {
    const fn = async (x: number) => x;
    const debounced = debounceAsync(fn, 100);

    const p = debounced(1);
    debounced.cancel();

    await assert.rejects(p, { message: 'Debounced' });
  });

  it('should execute immediately on flush', async () => {
    let callCount = 0;
    const fn = async (x: number) => {
      callCount++;
      return x * 3;
    };
    const debounced = debounceAsync(fn, 1000);

    const p = debounced(7);
    const flushResult = await debounced.flush();

    assert.equal(flushResult, 21);
    assert.equal(callCount, 1);

    const result = await p;
    assert.equal(result, 21);
  });

  it('should call immediately in leading mode', async () => {
    let callCount = 0;
    const fn = async (x: number) => {
      callCount++;
      return x;
    };
    const debounced = debounceAsync(fn, 100, { leading: true });

    const result = await debounced(42);
    assert.equal(result, 42);
    assert.equal(callCount, 1);
  });

  it('should cancel on AbortSignal', async () => {
    const fn = async (x: number) => x;
    const controller = new AbortController();
    const debounced = debounceAsync(fn, 100, { signal: controller.signal });

    const p = debounced(1);
    controller.abort();

    await assert.rejects(p, { message: 'Debounced' });
  });

  it('should return undefined from flush when nothing pending', async () => {
    const fn = async () => 'value';
    const debounced = debounceAsync(fn, 50);

    const result = await debounced.flush();
    assert.equal(result, undefined);
  });
});
