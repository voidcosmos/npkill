import { exec } from 'child_process';
import { IDeletionStrategy } from '../deletion-strategy.interface.js';

export class PerlDeletionStrategy implements IDeletionStrategy {
  readonly name = 'perl';

  async isAvailable(): Promise<boolean> {
    return new Promise((resolve) => {
      exec('command -v perl', (error) => {
        if (error) {
          resolve(false);
          return;
        }

        // Check if File::Path module is available
        exec('perl -e "use File::Path qw(remove_tree);"', (perlError) => {
          resolve(perlError === null);
        });
      });
    });
  }

  async delete(path: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const perlScript = `use File::Path qw(remove_tree); remove_tree("${path}", {verbose => 0, safe => 0});`;
      const command = `perl -e '${perlScript}'`;

      exec(command, (error, _stdout, stderr) => {
        if (error !== null) {
          reject(error);
          return;
        }
        if (stderr !== '') {
          reject(new Error(stderr));
          return;
        }
        resolve(true);
      });
    });
  }
}
