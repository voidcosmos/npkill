import { Dirent, readdirSync } from 'node:fs';
import { basename, join } from 'node:path';
import { setImmediate as yieldToEventLoop } from 'node:timers/promises';
import { GLOBAL_IGNORE } from '../../constants/global-ignored.constants.js';
import { TargetMatcher } from '../targets/index.js';
import { WorkerScanOptions } from './files.worker.service.js';
import { SharedScan } from './shared-scan.js';

const SLICE_MS = 10;
const KEPT_SUBDIRECTORIES = 1;

interface ScanEntry {
  path: string;
  isTarget: boolean;
}

/**
 * Explores depth first in slices, so the worker still answers other
 * requests, and gives the pending folders to idle workers.
 */
export class ScanWalker {
  private readonly matcher: TargetMatcher;
  private readonly pending: string[] = [];
  private found: string[] = [];

  constructor(
    private readonly shared: SharedScan,
    private readonly options: WorkerScanOptions,
    private readonly onSlice: (found: string[]) => void,
  ) {
    this.matcher = new TargetMatcher(options.targets);
  }

  async run(): Promise<void> {
    while (this.shared.isRunning()) {
      if (this.exploreSlice()) {
        await yieldToEventLoop();
      } else {
        await this.shared.waitForWork();
      }
    }
  }

  private exploreSlice(): boolean {
    const deadline = performance.now() + SLICE_MS;
    let explored = 0;
    while (this.shared.isRunning() && performance.now() < deadline) {
      const path = this.pending.pop() ?? this.shared.take();
      if (path === undefined) {
        break;
      }
      this.explore(path);
      explored++;
    }

    if (explored > 0) {
      this.onSlice(this.found);
      this.found = [];
    }
    return explored > 0;
  }

  private explore(path: string): void {
    let subdirectories = 0;
    for (const entry of this.readEntries(path)) {
      if (entry.isTarget) {
        this.found.push(entry.path);
      } else {
        this.pending.push(entry.path);
        subdirectories++;
      }
    }
    this.shared.completeDirectory(subdirectories);
    this.share();
  }

  private share(): void {
    const surplus = this.pending.length - KEPT_SUBDIRECTORIES;
    const isWanted = this.shared.hasIdleWorkers() || this.shared.isEmpty();
    if (surplus > 0 && isWanted) {
      const given = this.shared.give(this.pending.slice(0, surplus));
      this.pending.splice(0, given);
    }
  }

  private readEntries(path: string): ScanEntry[] {
    const dirents = readDirents(path);
    const entries: ScanEntry[] = [];
    for (const dirent of dirents) {
      this.newDirEntry(path, dirent, entries);
    }

    const hasCandidates = entries.some((candidate) => candidate.isTarget);
    if (!hasCandidates) {
      return entries;
    }
    const names = new Set(dirents.map((dirent) => dirent.name));
    return this.recognizeTargets(entries, names);
  }

  private newDirEntry(path: string, entry: Dirent, results: ScanEntry[]): void {
    if (entry.isSymbolicLink() || !entry.isDirectory()) {
      return;
    }

    const isTarget = this.matcher.isCandidate(entry.name);

    if (this.isIgnored(entry.name) && !isTarget) {
      return;
    }

    const subpath = join(path, entry.name);

    if (this.isExcluded(subpath)) {
      return;
    }

    results.push({
      path: subpath,
      isTarget,
    });
  }

  private isIgnored(name: string): boolean {
    return this.options.useDefaultIgnore !== false && GLOBAL_IGNORE.has(name);
  }

  private isExcluded(path: string): boolean {
    if (this.options.exclude == null) {
      return false;
    }
    return this.options.exclude.some((ex) => path.includes(ex));
  }

  private recognizeTargets(
    entries: ScanEntry[],
    siblings: ReadonlySet<string>,
  ): ScanEntry[] {
    const results: ScanEntry[] = [];
    for (const { path, isTarget } of entries) {
      const isRecognized = isTarget && this.matcher.matches(path, siblings);
      if (isRecognized || !this.isIgnored(basename(path))) {
        results.push({ path, isTarget: isRecognized });
      }
    }
    return results;
  }
}

function readDirents(path: string): Dirent[] {
  try {
    return readdirSync(path, { withFileTypes: true });
  } catch {
    return [];
  }
}
