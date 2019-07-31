import { ChildProcessWithoutNullStreams, exec, spawn } from 'child_process';

import { Observable } from 'rxjs';

export class WindowsFilesService {
  public getFolderSize(path: string): Observable<any> {
    const du = spawn('du', ['-sm', path, '--max-depth', '0']);
    const cut = spawn('cut', ['-f', '1']);

    du.stdout.pipe(cut.stdin);
    this.setEncoding(cut);

    return this.streamToObservable(cut);
  }

  public listDir(path: string): Observable<any> {
    const stream = this.getStream(path);
    return this.streamToObservable(stream);
  }

  private getStream(path: string) {
    const child = spawn('./src/utils/windows-find', [path]);
    this.setEncoding(child);
    return child;
  }

  public splitData(data: string) {
    return data.split('\n');
  }

  private setEncoding(child: ChildProcessWithoutNullStreams) {
    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
  }

  private streamToObservable(stream: ChildProcessWithoutNullStreams) {
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
}

const w = new WindowsFilesService();
w.listDir('/').subscribe(
  data => {
    if (data instanceof Error) {
      console.log('ERROR', data.message);
    } else {
      const folders = w.splitData(data);
      folders.map(folder =>
        w
          .getFolderSize(folder)
          .subscribe(size => console.log('FOLDER', folder, 'SIZE', size)),
      );
    }
  },
  error => console.log('ERROR', error, 'ERROR'),
  () => console.log('Bitchez pls, complete'),
);
