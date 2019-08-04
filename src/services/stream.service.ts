import { ChildProcessWithoutNullStreams } from 'child_process';

import { Observable } from 'rxjs';
import { STREAM_ENCODING } from '../constants/main.constants';

export class StreamService {
  streamToObservable(stream: ChildProcessWithoutNullStreams) {
    const { stdout, stderr } = stream;

    return new Observable(observer => {
      const dataHandler = data => observer.next(data);
      const bashErrorHandler = error => observer.next(new Error(error));
      const errorHandler = error => observer.error(error);
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

        stderr.removeListener('data', bashErrorHandler);
        stderr.removeListener('error', errorHandler);
      };
    });
  }

  getStream(child: ChildProcessWithoutNullStreams): Observable<{}> {
    this.setEncoding(child, STREAM_ENCODING);
    return this.streamToObservable(child);
  }

  private setEncoding(child: ChildProcessWithoutNullStreams, encoding: string) {
    child.stdout.setEncoding(encoding);
    child.stderr.setEncoding(encoding);
  }
}
