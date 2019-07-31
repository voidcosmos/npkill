import { Benchmark } from 'benchmark';
import { LinuxFilesService } from '../src/services/linux-files.service';
import { WindowsFilesService } from '../src/services/windows-files.service';

const suite = new Benchmark.Suite();
const linuxService = new LinuxFilesService();
const windowsService = new WindowsFilesService();
const searchPath = '/home/nya';

console.log('---- Searching: ');
suite
  .add('Linux find', function() {
    linuxService.listDir(searchPath);
  })
  .add('Go script', function() {
    windowsService.listDir(searchPath);
  })
  .on('cycle', function(event: any) {
    console.log(String(event.target));
  })
  .on('complete', function(this: any) {
    console.log(
      'The fastest algorithm is ' + this.filter('fastest').map('name') + '\n',
    );
  })
  .run({ async: false });
