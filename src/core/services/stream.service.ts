import { ChildProcessWithoutNullStreams } from 'child_process';
import { Observable } from 'rxjs';
import { STREAM_ENCODING } from '../../constants/index.js';

/**
 * Service for converting child process streams into RxJS observables.
 * Handles the conversion of stdout/stderr streams to reactive streams
 * for better integration with the application's reactive architecture.
 */
export class StreamService {
  streamToObservable<T>(stream: ChildProcessWithoutNullStreams): Observable<T> {
    const { stdout, stderr } = stream;

    return new Observable<T>((observer) => {
      const dataHandler = (data): void => observer.next(data);
      const bashErrorHandler = (error): void =>
        observer.error({ ...error, bash: true });
      const errorHandler = (error): void => observer.error(error);
      const endHandler = (): void => observer.complete();

      stdout.addListener('data', dataHandler);
      stdout.addListener('error', errorHandler);
      stdout.addListener('end', endHandler);

      stderr.addListener('data', bashErrorHandler);
      stderr.addListener('error', errorHandler);

      return () => {
        stdout.removeListener('data', dataHandler);
        stdout.removeListener('error', errorHandler);
        stdout.removeListener('end', endHandler);

        stderr.removeListener('data', bashErrorHandler);
        stderr.removeListener('error', errorHandler);
      };
    });
  }

  getStream<T>(child: ChildProcessWithoutNullStreams): Observable<T> {
    this.setEncoding(child, STREAM_ENCODING);
    return this.streamToObservable<T>(child);
  }

  private setEncoding(
    child: ChildProcessWithoutNullStreams,
    encoding: BufferEncoding,
  ): void {
    child.stdout.setEncoding(encoding);
    child.stderr.setEncoding(encoding);
  }
}
