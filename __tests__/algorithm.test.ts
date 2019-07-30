import { Benchmark } from 'benchmark';
import { LinuxFilesService } from '../src/services/linux-files.service';

const suite = new Benchmark.Suite();
const linuxService = new LinuxFilesService();
const searchPath = '/home/nya';

console.log('---- Searching: ');
suite
  .add('Linux find', function() {
    linuxService.listDir(searchPath);
  })
  .add('Go script', function() {})
  .on('cycle', function(event: any) {
    console.log(String(event.target));
  })
  .on('complete', function(this: any) {
    console.log(
      'The fastest algorithm is ' + this.filter('fastest').map('name') + '\n',
    );
  })
  .run({ async: false });
