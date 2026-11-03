import { Observable } from 'rxjs';

/**
 * Represents an individual entry in the log.
 */
export interface LogEntry {
  type: 'info' | 'warn' | 'error';
  timestamp: number;
  message: string;
}

/**
 * Interface for a logging service that allows logging messages
 * of different types, retrieving them, and saving them to a file.
 */
export interface ILoggerService {
  /**
   * Logs an info message.
   * @param message The message to log.
   */
  info(message: string): void;

  /**
   * Logs a warning message.
   * @param message The message to log.
   */
  warn(message: string): void;

  /**
   * Logs an error message.
   * @param message The message to log.
   */
  error(message: string): void;

  /**
   * Gets log entries filtered by type.
   * @param type The type of entries to retrieve ('all', 'info', 'warn', 'error'). Default is 'all'.
   * @returns An array of log entries.
   */
  get(type?: 'all' | 'info' | 'warn' | 'error'): LogEntry[];

  /**
   * Gets an Observable that emits the entries already logged and then each
   * new entry as it is logged.
   * @returns An Observable of log entries, one at a time.
   */
  getEntries$(): Observable<LogEntry>;

  /**
   * Saves the current log content to a specified file.
   * Rotates the log file if one with the same name already exists.
   * @param path The full path of the file where the log will be saved.
   */
  saveToFile(path: string): void;

  /**
   * Suggests a default file path to save the log,
   * usually in the system's temporary directory.
   * @returns The suggested file path.
   */
  getSuggestLogFilePath(): string;
}
