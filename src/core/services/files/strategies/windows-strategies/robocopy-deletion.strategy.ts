import { exec } from 'child_process';
import { IDeletionStrategy } from '../deletion-strategy.interface.js';

export class RobocopyDeletionStrategy implements IDeletionStrategy {
  readonly name = 'robocopy';

  async isAvailable(): Promise<boolean> {
    return new Promise((resolve) => {
      exec('robocopy /? >nul 2>&1', (error) => {
        resolve(error === null || error.code === 16); // robocopy returns 16 for help
      });
    });
  }

  async delete(path: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      // Create a temporary empty directory
      const tempDir = `${process.env.TEMP || process.env.TMP || 'C:\\temp'}\\npkill_empty_${Date.now()}`;

      // Use robocopy to mirror empty directory to target (purge), then remove both
      // /MIR = Mirror directory tree (equivalent to /E plus /PURGE)
      // /NFL = No File List (don't log file names)
      // /NDL = No Directory List (don't log directory names)
      // /NJH = No Job Header
      // /NJS = No Job Summary
      // /NP = No Progress
      const command = `mkdir "${tempDir}" && robocopy "${tempDir}" "${path}" /MIR /NFL /NDL /NJH /NJS /NP && rmdir "${path}" && rmdir "${tempDir}"`;

      exec(command, (error, stdout, stderr) => {
        // Robocopy returns different exit codes that aren't necessarily errors
        // 0 = No files copied, no failures
        // 1 = Files copied successfully
        // 2 = Extra files or directories detected
        // Exit codes 0-7 are generally successful
        if (error && error.code && error.code > 7) {
          reject(error);
          return;
        }
        if (stderr && stderr.trim() !== '') {
          reject(new Error(stderr));
          return;
        }
        resolve(true);
      });
    });
  }
}
