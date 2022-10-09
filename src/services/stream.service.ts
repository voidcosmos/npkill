import { ChildProcessWithoutNullStreams } from 'child_process';
import { Observable } from 'rxjs';
import { STREAM_ENCODING } from '../constants/index.js';

export class StreamService {
  streamToObservable<T>(stream: ChildProcessWithoutNullStreams) {
    const { stdout, stderr } = stream;

    return new Observable<T>((observer) => {
      const dataHandler = (data) => observer.next(data);
      const bashErrorHandler = (error) =>
        observer.error({ ...error, bash: true });
      const errorHandler = (error) => observer.error(error);
      const endHandler = () => observer.complete();

      stdout.addListener('data', dataHandler);
      stdout.addListener('error', errorHandler);
      stdout.addListener('end', endHandler);

      stderr.addListener('data', bashErrorHandler);
      stderr.addListener('error', errorHandler);

      return () => {
        stdout.removeListener('data', dataHandler);
        stdout.removeListener('error', errorHandler);
        stdout.removeListener('end', endHandler);

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
  ) {
    child.stdout.setEncoding(encoding);
    child.stderr.setEncoding(encoding);
  }
}
