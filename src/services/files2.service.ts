import * as getSize from 'get-folder-size';

import { ChildProcessWithoutNullStreams, spawn } from 'child_process';

import { of } from 'rxjs';

export class FilesService2 {
  public async getFolderSize(path: string) {
    /* const command = spawn('du', ['-h', path, '--max-depth', 0, | cut -f 1]) */
    const du = spawn('du', ['-h', path, '--max-depth', '0']);
    const cut = spawn('cut', ['-f', '1']);

    du.stdout.pipe(cut.stdin);

    for await (const data of cut.stdout) {
      return data;
    }
  }

  public listDir(path: string) {
    const stream = this.getStream(path);
    stream.stderr.on('error', error => console.log('Process ERROR', error));
    stream.stdout.on('data', data => console.log(data));
    stream.stderr.on('data', error => console.error(error));
    stream.on('end', () => console.log('search completed :)'));
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
}

const fs = new FilesService2();
fs.listDir('/');
