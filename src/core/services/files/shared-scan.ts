/*
 * header (Int32 fields)      stack (UTF-16 paths)
 * +------+------------+-----+------+-----+------+-----+--------+
 * | LOCK | UNEXPLORED | ... | path | len | path | len |  free  |
 * +------+------------+-----+------+-----+------+-----+--------+
 *                                                     ^ STACK_TOP
 *
 * STACK_TOP is the header field with the byte where the last path ends. Each
 * path goes before its length, so the last one is read backwards from there.
 * Workers take the last path and give back the folders they will not explore
 * soon. The lock guards the stack. The scan finishes when UNEXPLORED,
 * the folders found and not explored yet, reaches zero. Idle workers sleep on
 * WAKE_UPS until new folders arrive or the scan ends.
 */
const LOCK = 0;
const UNEXPLORED = 1;
const STACK_SIZE = 2;
const STACK_TOP = 3;
const IDLE_WORKERS = 4;
const WAKE_UPS = 5;
const STATUS = 6;
const EXPLORED = 7;
const HEADER_FIELDS = 8;

const UNLOCKED = 0;
const LOCKED = 1;
const CONTENDED = 2;

const RUNNING = 0;
const FINISHED = 1;
const STOPPED = 2;

const HEADER_BYTES = HEADER_FIELDS * Int32Array.BYTES_PER_ELEMENT;
const LENGTH_BYTES = 4;
// Round-trips any string. UTF-8 would replace unpaired surrogates.
const ENCODING = 'utf16le';

/**
 * Scan state in shared memory.
 */
export class SharedScan {
  private readonly header: Int32Array;
  private readonly stack: Buffer;

  constructor(readonly buffer: SharedArrayBuffer) {
    this.header = new Int32Array(buffer, 0, HEADER_FIELDS);
    this.stack = Buffer.from(buffer, HEADER_BYTES);
  }

  static create(root: string, capacity: number): SharedScan {
    const scan = new SharedScan(new SharedArrayBuffer(HEADER_BYTES + capacity));
    Atomics.store(scan.header, UNEXPLORED, 1);
    scan.give([root]);
    return scan;
  }

  get unexplored(): number {
    return Atomics.load(this.header, UNEXPLORED);
  }

  get explored(): number {
    return Atomics.load(this.header, EXPLORED);
  }

  isRunning(): boolean {
    return Atomics.load(this.header, STATUS) === RUNNING;
  }

  isFinished(): boolean {
    return Atomics.load(this.header, STATUS) === FINISHED;
  }

  isEmpty(): boolean {
    return Atomics.load(this.header, STACK_SIZE) === 0;
  }

  hasIdleWorkers(): boolean {
    return Atomics.load(this.header, IDLE_WORKERS) > 0;
  }

  /** Returns how many paths fit, taken from the start of the list. */
  give(paths: readonly string[]): number {
    this.lock();
    let top = Atomics.load(this.header, STACK_TOP);
    let given = 0;
    for (const path of paths) {
      const length = Buffer.byteLength(path, ENCODING);
      const end = top + length + LENGTH_BYTES;
      if (end > this.stack.length) {
        break;
      }
      this.stack.write(path, top, ENCODING);
      this.stack.writeUInt32LE(length, top + length);
      top = end;
      given++;
    }
    Atomics.store(this.header, STACK_TOP, top);
    Atomics.add(this.header, STACK_SIZE, given);
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

  completeFolder(subfolders: number): void {
    Atomics.add(this.header, EXPLORED, 1);
    const change = subfolders - 1;
    if (Atomics.add(this.header, UNEXPLORED, change) + change === 0) {
      this.end(FINISHED);
    }
  }

  stop(): void {
    this.end(STOPPED);
  }

  async waitForWork(): Promise<void> {
    const wakeUps = Atomics.load(this.header, WAKE_UPS);
    Atomics.add(this.header, IDLE_WORKERS, 1);
    if (this.isEmpty() && this.isRunning()) {
      await Atomics.waitAsync(this.header, WAKE_UPS, wakeUps).value;
    }
    Atomics.sub(this.header, IDLE_WORKERS, 1);
  }

  private pop(): string | undefined {
    if (this.isEmpty()) {
      return undefined;
    }
    const top = Atomics.load(this.header, STACK_TOP);
    const length = this.stack.readUInt32LE(top - LENGTH_BYTES);
    const start = top - LENGTH_BYTES - length;
    Atomics.store(this.header, STACK_TOP, start);
    Atomics.sub(this.header, STACK_SIZE, 1);
    return this.stack.toString(ENCODING, start, start + length);
  }

  private end(status: number): void {
    if (
      Atomics.compareExchange(this.header, STATUS, RUNNING, status) === RUNNING
    ) {
      this.wakeAll();
    }
  }

  private wakeAll(): void {
    Atomics.add(this.header, WAKE_UPS, 1);
    Atomics.notify(this.header, WAKE_UPS);
  }

  private lock(): void {
    let state = Atomics.compareExchange(this.header, LOCK, UNLOCKED, LOCKED);
    while (state !== UNLOCKED) {
      const isContended =
        state === CONTENDED ||
        Atomics.compareExchange(this.header, LOCK, LOCKED, CONTENDED) !==
          UNLOCKED;
      if (isContended) {
        Atomics.wait(this.header, LOCK, CONTENDED);
      }
      state = Atomics.compareExchange(this.header, LOCK, UNLOCKED, CONTENDED);
    }
  }

  private unlock(): void {
    if (Atomics.sub(this.header, LOCK, 1) !== LOCKED) {
      Atomics.store(this.header, LOCK, UNLOCKED);
      Atomics.notify(this.header, LOCK, 1);
    }
  }
}
