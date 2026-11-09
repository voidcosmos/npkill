import { afterEach, describe, expect, it } from '@jest/globals';
import { join } from 'node:path';
import { firstValueFrom } from 'rxjs';
import type { LogEntry } from '../../src/index.js';
import {
  createNpkill,
  stopCreatedInstances,
} from './support/npkill-package.js';
import { createTempDir, observe, removeTempDirs } from './support/helpers.js';

afterEach(() => {
  stopCreatedInstances();
  removeTempDirs();
});

function collectLogs(npkill: ReturnType<typeof createNpkill>): {
  entries: LogEntry[];
  stop: () => void;
} {
  const entries: LogEntry[] = [];
  const subscription = npkill
    .getLogs$()
    .subscribe((entry) => entries.push(entry));
  return { entries, stop: () => subscription.unsubscribe() };
}

describe('getLogs$', () => {
  it('emits the entries written before subscribing', async () => {
    const npkill = createNpkill();

    const outcome = await observe(npkill.getLogs$(), 300);

    expect(outcome.completed).toBe(false);
    expect(outcome.error).toBeUndefined();
    expect(outcome.values.length).toBeGreaterThan(0);
    outcome.values.forEach((entry) =>
      expect(entry).toEqual({
        type: expect.stringMatching(/^(info|warn|error)$/),
        timestamp: expect.any(Number),
        message: expect.any(String),
      }),
    );
  });

  it('keeps emitting each new entry', async () => {
    const npkill = createNpkill();
    const path = join(createTempDir(), 'node_modules');
    const logs = collectLogs(npkill);
    const entriesBefore = logs.entries.length;

    await firstValueFrom(npkill.delete$(path, { dryRun: true }));
    logs.stop();

    expect(logs.entries.slice(entriesBefore)).toContainEqual(
      expect.objectContaining({ message: expect.stringContaining(path) }),
    );
  });

  it('does not record the arguments of the host process', async () => {
    const outcome = await observe(createNpkill().getLogs$(), 300);

    expect(outcome.values.map(({ message }) => message)).not.toContain(
      process.argv.join(' '),
    );
  });

  it('only emits the entries of its own instance', async () => {
    const npkill = createNpkill();
    const otherNpkill = createNpkill();
    const path = join(createTempDir(), 'node_modules');
    const logs = collectLogs(otherNpkill);
    const entriesBefore = logs.entries.length;

    await firstValueFrom(npkill.delete$(path, { dryRun: true }));
    logs.stop();

    expect(logs.entries).toHaveLength(entriesBefore);
    expect(logs.entries).not.toContainEqual(
      expect.objectContaining({ message: expect.stringContaining(path) }),
    );
  });
});
