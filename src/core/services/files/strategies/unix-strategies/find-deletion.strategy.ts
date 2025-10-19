import { exec } from 'child_process';
import { IDeletionStrategy } from '../deletion-strategy.interface.js';

export class FindDeletionStrategy implements IDeletionStrategy {
  readonly name = 'find';

  async isAvailable(): Promise<boolean> {
    return new Promise((resolve) => {
      exec('command -v find', (error) => {
        resolve(error === null);
      });
    });
  }

  async delete(path: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const command = `find "${path}" -depth -type f -delete && find "${path}" -depth -type d -delete`;

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
