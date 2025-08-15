import { exec } from 'child_process';
import { IDeletionStrategy } from '../deletion-strategy.interface.js';

export class RmRfDeletionStrategy implements IDeletionStrategy {
  readonly name = 'rm-rf';

  async isAvailable(): Promise<boolean> {
    return new Promise((resolve) => {
      exec('command -v rm', (error) => {
        resolve(error === null);
      });
    });
  }

  async delete(path: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const command = `rm -rf "${path}"`;

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
