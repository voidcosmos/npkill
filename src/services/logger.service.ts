interface LogEntry {
  type: 'info' | 'error';
  timestamp: number;
  message: string;
}

export class LoggerService {
  private log: LogEntry[] = [];

  constructor() {}

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

  private addToLog(entry: LogEntry): void {
    this.log = [...this.log, entry];
  }

  private getTimestamp(): number {
    return new Date().getTime();
  }
}
