import { tmpdir } from 'os';
import { existsSync, renameSync, writeFileSync } from 'fs';
import { basename, dirname, join } from 'path';

interface LogEntry {
  type: 'info' | 'error';
  timestamp: number;
  message: string;
}

const LATEST_TAG = 'latest';
const OLD_TAG = 'old';

export class LoggerService {
  private log: LogEntry[] = [];

  info(message: string): void {
    this.addToLog({
      type: 'info',
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

  get(type: 'all' | 'info' | 'error' = 'all'): LogEntry[] {
    if (type === 'all') {
      return this.log;
    }

    return this.log.filter((entry) => entry.type === type);
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
    this.log = [...this.log, entry];
  }

  private getTimestamp(): number {
    return new Date().getTime();
  }
}
