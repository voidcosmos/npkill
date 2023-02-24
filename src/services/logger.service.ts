import { tmpdir } from 'os';
import { writeFileSync } from 'fs';

interface LogEntry {
  type: 'info' | 'error';
  timestamp: number;
  message: string;
}

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
    if (type === 'all') return this.log;

    return this.log.filter((entry) => entry.type === type);
  }

  saveToFile(path: string): void {
    const convertTime = (timestamp: number) => timestamp;

    const content: string = this.log.reduce((log, actual) => {
      const line = `[${convertTime(actual.timestamp)}](${actual.type}) ${
        actual.message
      }\n`;
      return log + line;
    }, '');

    writeFileSync(path, content);
  }

  getSuggestLogfilePath(): string {
    const timestamp = new Date().getTime();
    return `${tmpdir()}/npkill-${timestamp}.log`;
  }

  private addToLog(entry: LogEntry): void {
    this.log = [...this.log, entry];
  }

  private getTimestamp(): number {
    return new Date().getTime();
  }
}
