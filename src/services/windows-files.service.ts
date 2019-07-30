import { exec } from 'child_process';

export class WindowsFilesService {
  public listDir(path: string) {
    exec('find.exe', function(err, data) {
      console.log(err);
      console.log(data.toString());
    });
  }
}
