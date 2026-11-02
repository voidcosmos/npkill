import { tmpdir } from 'os';
import { existsSync, renameSync, writeFileSync } from 'fs';
import { basename, dirname, join } from 'path';

import { Observable, Subject } from 'rxjs';
import {
  ILoggerService,
  LogEntry,
} from '../interfaces/logger-service.interface.js';

const LATEST_TAG = 'latest';
const OLD_TAG = 'old';

/**
 * Implementation of the logging service for npkill.
 * Manages application logs with different severity levels and provides
 * reactive streams for log observation and file output capabilities.
 */
export class LoggerService implements ILoggerService {
  private readonly log: LogEntry[] = [];
  private readonly newEntry$ = new Subject<LogEntry>();

  info(message: string): void {
    this.addToLog({
      type: 'info',
      timestamp: this.getTimestamp(),
      message,
    });
  }

  warn(message: string): void {
    this.addToLog({
      type: 'warn',
      timestamp: this.getTimestamp(),
      message,
    });
  }

  error(message: string): void {
    this.addToLog({
      type: 'error',
      timestamp: this.getTimestamp(),
      message,
    });
  }

  get(type: 'all' | 'info' | 'warn' | 'error' = 'all'): LogEntry[] {
    if (type === 'all') {
      return this.log;
    }

    return this.log.filter((entry) => entry.type === type);
  }

  getEntries$(): Observable<LogEntry> {
    return new Observable<LogEntry>((subscriber) => {
      let nextIndex = 0;
      const emitPendingEntries = (): void => {
        while (nextIndex < this.log.length && !subscriber.closed) {
          subscriber.next(this.log[nextIndex++]);
        }
      };

      const subscription = this.newEntry$.subscribe(emitPendingEntries);
      emitPendingEntries();
      return subscription;
    });
  }

  saveToFile(path: string): void {
    const convertTime = (timestamp: number): number => timestamp;

    const content: string = this.log.reduce((log, actual) => {
      const line = `[${convertTime(actual.timestamp)}](${actual.type}) ${
        actual.message
      }\n`;
      return log + line;
    }, '');

    this.rotateLogFile(path);
    writeFileSync(path, content);
  }

  getSuggestLogFilePath(): string {
    const filename = `npkill-${LATEST_TAG}.log`;
    return join(tmpdir(), filename);
  }

  private rotateLogFile(newLogPath: string): void {
    if (!existsSync(newLogPath)) {
      return; // Rotation is not necessary
    }
    const basePath = dirname(newLogPath);
    const logName = basename(newLogPath);
    const oldLogName = logName.replace(LATEST_TAG, OLD_TAG);
    const oldLogPath = join(basePath, oldLogName);
    renameSync(newLogPath, oldLogPath);
  }

  private addToLog(entry: LogEntry): void {
    this.log.push(entry);
    this.newEntry$.next(entry);
  }

  private getTimestamp(): number {
    return new Date().getTime();
  }
}
