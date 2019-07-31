import * as getSize from 'get-folder-size';

import { ChildProcessWithoutNullStreams, exec, spawn } from 'child_process';
import { Observable, from, observable, of, throwError } from 'rxjs';
import { catchError, map, mergeMap, switchMap } from 'rxjs/operators';

export class LinuxFilesService {
  public folders: Array<String> = [];

  public getFolderSize(path: string): Observable<any> {
    const du = spawn('du', ['-sm', path, '--max-depth', '0']);
    const cut = spawn('cut', ['-f', '1']);

    du.stdout.pipe(cut.stdin);
    this.setEncoding(cut);

    return this.convertStream(cut);
  }

  public listDir(path: string): Observable<any> {
    const stream = this.getStream(path);
    return this.convertStream(stream);
  }

  private getStream(path: string) {
    const child = spawn('find', [
      path,
      '-name',
      'node_modules',
      '-type',
      'd',
      '-prune',
    ]);
    this.setEncoding(child);
    return child;
  }

  public splitData(data: string) {
    return data.split('\n');
  }

  public getUserHomePath() {
    return require('os').homedir();
  }

  private setEncoding(child: ChildProcessWithoutNullStreams) {
    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
  }

  private convertStream(stream: ChildProcessWithoutNullStreams) {
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
/* const fs = new LinuxFilesService();

fs.listDir('/home/nya')
  .pipe(
    switchMap(value => {
      return of(value).pipe(
        catchError((error: Error) => {
          return of(error);
        }),
      );
    }),
  )
  .subscribe(
    x => {
      if (x instanceof Error) {
        console.log('ERROR', x.message);
      } else {
        const folders = fs.splitData(x);
        folders.map(folder =>
          fs
            .getFolderSize(folder)
            .subscribe(size => console.log('FOLDER', folder, 'SIZE', size)),
        );
      }
    },
    x => console.log('ERROR', x, 'ERROR'),
    () => console.log('Bitchez pls, complete'),
  ); */
