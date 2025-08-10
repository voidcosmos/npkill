import { exec } from 'child_process';
import { IDeletionStrategy } from '../deletion-strategy.interface.js';

export class RsyncDeletionStrategy implements IDeletionStrategy {
  readonly name = 'rsync';

  async isAvailable(): Promise<boolean> {
    return new Promise((resolve) => {
      exec('command -v rsync', (error) => {
        resolve(error === null);
      });
    });
  }

  async delete(path: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const tempDir = '/tmp/npkill_empty_' + Date.now();
      const commands = [
        `mkdir -p "${tempDir}"`,
        `rsync -a --delete "${tempDir}/" "${path}/"`,
        `rmdir "${path}"`,
        `rm -rf "${tempDir}"`,
      ];

      const command = commands.join(' && ');
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
