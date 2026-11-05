const LOCK = 0;
const PENDING = 1;
const QUEUED = 2;
const TOP = 3;
const IDLE = 4;
const SIGNAL = 5;
const STATE = 6;
const EXPLORED = 7;
const SLOTS = 8;

const UNLOCKED = 0;
const LOCKED = 1;
const CONTENDED = 2;

const RUNNING = 0;
const FINISHED = 1;
const STOPPED = 2;

const HEADER_BYTES = SLOTS * Int32Array.BYTES_PER_ELEMENT;
const LENGTH_BYTES = 4;
// Round-trips any string. UTF-8 would replace unpaired surrogates.
const ENCODING = 'utf16le';

/**
 * Scan state in shared memory.
 */
export class SharedScan {
  private readonly slots: Int32Array;
  private readonly paths: Buffer;

  constructor(readonly buffer: SharedArrayBuffer) {
    this.slots = new Int32Array(buffer, 0, SLOTS);
    this.paths = Buffer.from(buffer, HEADER_BYTES);
  }

  static create(root: string, capacity: number): SharedScan {
    const scan = new SharedScan(new SharedArrayBuffer(HEADER_BYTES + capacity));
    Atomics.store(scan.slots, PENDING, 1);
    scan.give([root]);
    return scan;
  }

  get pending(): number {
    return Atomics.load(this.slots, PENDING);
  }

  get explored(): number {
    return Atomics.load(this.slots, EXPLORED);
  }

  isRunning(): boolean {
    return Atomics.load(this.slots, STATE) === RUNNING;
  }

  isFinished(): boolean {
    return Atomics.load(this.slots, STATE) === FINISHED;
  }

  isEmpty(): boolean {
    return Atomics.load(this.slots, QUEUED) === 0;
  }

  hasIdleWorkers(): boolean {
    return Atomics.load(this.slots, IDLE) > 0;
  }

  /** Returns how many paths fit, taken from the start of the list. */
  give(paths: readonly string[]): number {
    this.lock();
    let top = Atomics.load(this.slots, TOP);
    let given = 0;
    for (const path of paths) {
      const length = Buffer.byteLength(path, ENCODING);
      const end = top + length + LENGTH_BYTES;
      if (end > this.paths.length) {
        break;
      }
      this.paths.write(path, top, ENCODING);
      this.paths.writeUInt32LE(length, top + length);
      top = end;
      given++;
    }
    Atomics.store(this.slots, TOP, top);
    Atomics.add(this.slots, QUEUED, given);
    this.unlock();

    if (given > 0 && this.hasIdleWorkers()) {
      this.wakeAll();
    }
    return given;
  }

  take(): string | undefined {
    if (this.isEmpty()) {
      return undefined;
    }
    this.lock();
    const path = this.pop();
    this.unlock();
    return path;
  }

  completeDirectory(subdirectories: number): void {
    Atomics.add(this.slots, EXPLORED, 1);
    const change = subdirectories - 1;
    if (Atomics.add(this.slots, PENDING, change) + change === 0) {
      this.end(FINISHED);
    }
  }

  stop(): void {
    this.end(STOPPED);
  }

  async waitForWork(): Promise<void> {
    const signal = Atomics.load(this.slots, SIGNAL);
    Atomics.add(this.slots, IDLE, 1);
    if (this.isEmpty() && this.isRunning()) {
      await Atomics.waitAsync(this.slots, SIGNAL, signal).value;
    }
    Atomics.sub(this.slots, IDLE, 1);
  }

  private pop(): string | undefined {
    if (this.isEmpty()) {
      return undefined;
    }
    const top = Atomics.load(this.slots, TOP);
    const length = this.paths.readUInt32LE(top - LENGTH_BYTES);
    const start = top - LENGTH_BYTES - length;
    Atomics.store(this.slots, TOP, start);
    Atomics.sub(this.slots, QUEUED, 1);
    return this.paths.toString(ENCODING, start, start + length);
  }

  private end(state: number): void {
    if (
      Atomics.compareExchange(this.slots, STATE, RUNNING, state) === RUNNING
    ) {
      this.wakeAll();
    }
  }

  private wakeAll(): void {
    Atomics.add(this.slots, SIGNAL, 1);
    Atomics.notify(this.slots, SIGNAL);
  }

  private lock(): void {
    let state = Atomics.compareExchange(this.slots, LOCK, UNLOCKED, LOCKED);
    while (state !== UNLOCKED) {
      const isContended =
        state === CONTENDED ||
        Atomics.compareExchange(this.slots, LOCK, LOCKED, CONTENDED) !==
          UNLOCKED;
      if (isContended) {
        Atomics.wait(this.slots, LOCK, CONTENDED);
      }
      state = Atomics.compareExchange(this.slots, LOCK, UNLOCKED, CONTENDED);
    }
  }

  private unlock(): void {
    if (Atomics.sub(this.slots, LOCK, 1) !== LOCKED) {
      Atomics.store(this.slots, LOCK, UNLOCKED);
      Atomics.notify(this.slots, LOCK, 1);
    }
  }
}
