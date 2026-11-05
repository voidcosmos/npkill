import { describe, expect, it } from '@jest/globals';
import { setImmediate } from 'node:timers/promises';

import { SharedScan } from '../../../../src/core/services/files/shared-scan.js';

function startedScan(): SharedScan {
  const scan = SharedScan.create('/root', 64);
  scan.take();
  return scan;
}

describe('SharedScan', () => {
  it('starts with the root as the only pending folder', () => {
    const scan = SharedScan.create('/root', 64);

    expect(scan.pending).toBe(1);
    expect(scan.take()).toBe('/root');
    expect(scan.take()).toBeUndefined();
  });

  it('gives back the last folder first', () => {
    const scan = startedScan();

    scan.give(['/root/a', '/root/b']);

    expect(scan.take()).toBe('/root/b');
    expect(scan.take()).toBe('/root/a');
  });

  it('keeps any path, even with names that are not valid Unicode', () => {
    const scan = startedScan();
    const path = '/root/añø/文件/\uD800';

    scan.give([path]);

    expect(scan.take()).toBe(path);
  });

  it('takes only the folders that fit and says how many', () => {
    const scan = startedScan();

    expect(scan.give(['/root/aaaa', '/root/bbbb', '/root/c'])).toBe(2);
    expect(scan.take()).toBe('/root/bbbb');
  });

  it('finishes when the last pending folder is explored', () => {
    const scan = startedScan();

    scan.completeDirectory(2);
    expect(scan.isRunning()).toBe(true);
    expect(scan.pending).toBe(2);

    scan.completeDirectory(0);
    scan.completeDirectory(0);
    expect(scan.isFinished()).toBe(true);
    expect(scan.explored).toBe(3);
  });

  it('does not finish once stopped', () => {
    const scan = startedScan();

    scan.stop();
    scan.completeDirectory(0);

    expect(scan.isRunning()).toBe(false);
    expect(scan.isFinished()).toBe(false);
  });

  it('keeps an idle worker waiting while there is nothing to do', async () => {
    const scan = startedScan();
    const waiting = scan.waitForWork();

    await setImmediate();
    expect(scan.hasIdleWorkers()).toBe(true);

    scan.stop();
    await waiting;
  });

  it('wakes an idle worker when folders arrive', async () => {
    const scan = startedScan();
    const waiting = scan.waitForWork();

    expect(scan.hasIdleWorkers()).toBe(true);
    scan.give(['/root/a']);
    await waiting;

    expect(scan.hasIdleWorkers()).toBe(false);
    expect(scan.take()).toBe('/root/a');
  });

  it('wakes idle workers when the scan ends', async () => {
    const scan = startedScan();
    const waiting = scan.waitForWork();

    scan.completeDirectory(0);
    await waiting;

    expect(scan.isFinished()).toBe(true);
  });
});
