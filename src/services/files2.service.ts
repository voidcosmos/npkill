import * as getSize from 'get-folder-size';

import { ChildProcessWithoutNullStreams, exec, spawn } from 'child_process';
import { Observable, of } from 'rxjs';

import { map } from 'rxjs/operators';

export class FilesService2 {
  public folders: Array<String> = [];

  public getFolderSize(path: string): Observable<any> {
    const du = spawn('du', ['-h', path, '--max-depth', '0']);
    const cut = spawn('cut', ['-f', '1']);

    du.stdout.pipe(cut.stdin);
    this.setEncoding(cut);

    return this.convertStream(cut);
  }

  /*  public getFolderSize(path: string) {
    return exec(`du -h ${path} --max-depth 0 | cut -f 1`);
  } */

  public listDir(path: string): Observable<any> {
    const stream = this.getStream(path);
    /* stream.stderr.on('error', error => console.log('Process ERROR', error));
    stream.stdout.on('data', data => {
      const folders = this.splitData(data);
      folders.map(folder =>
        this.getFolderSize(folder).stdout.on('data', size =>
          console.log(folder, size),
        ),
      );
    });
    stream.stderr.on('data', error => error); */

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

  private isDirectorySafeToDelete(path) {
    return path !== '/';
  }

  private setEncoding(child: ChildProcessWithoutNullStreams) {
    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
  }

  private convertStream(stream: ChildProcessWithoutNullStreams) {
    const { stdout, stderr } = stream;

    return new Observable(observer => {
      const dataHandler = data => observer.next(data);
      const errorHandler = error => observer.error(error);
      const endHandler = () => observer.complete();

      stdout.addListener('data', dataHandler);
      stdout.addListener('error', errorHandler);
      stdout.addListener('end', endHandler);

      stderr.addListener('data', errorHandler);
      stderr.addListener('error', errorHandler);

      return () => {
        stdout.removeListener('data', dataHandler);
        stdout.removeListener('error', errorHandler);
        stdout.removeListener('end', endHandler);

        stderr.removeListener('data', errorHandler);
        stderr.removeListener('error', errorHandler);
      };
    });
  }
}

/* const fs = new FilesService2();
fs.listDir('/home').subscribe(
  value => {
    const folders = fs.splitData(value);
    folders.map(folder => {
      fs.getFolderSize(folder).subscribe(size =>
        console.log('FOLDER', folder, 'SIZE', size),
      );
    });
  },
  error => {
    console.log(error);
  },
  () => {
    console.log('Search finished :)');
  },
); */
