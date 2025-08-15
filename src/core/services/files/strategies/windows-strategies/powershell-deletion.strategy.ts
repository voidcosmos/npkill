import { exec } from 'child_process';
import { IDeletionStrategy } from '../deletion-strategy.interface.js';

export class PowerShellDeletionStrategy implements IDeletionStrategy {
  readonly name = 'powershell';

  async isAvailable(): Promise<boolean> {
    return new Promise((resolve) => {
      exec('powershell -Command "Get-Command Remove-Item" 2>nul', (error) => {
        resolve(error === null);
      });
    });
  }

  async delete(path: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      // Use PowerShell with optimized flags for fast deletion
      // -Force: Override read-only and hidden attributes
      // -Recurse: Delete all child items
      // -ErrorAction Stop: Stop on first error
      // Get-ChildItem | Remove-Item pattern is often faster than Remove-Item alone for large dirs
      const psCommand = `
        if (Test-Path '${path}') {
          try {
            Get-ChildItem -Path '${path}' -Force -Recurse | Remove-Item -Force -Recurse -ErrorAction Stop
            Remove-Item -Path '${path}' -Force -ErrorAction Stop
            Write-Output 'Success'
          } catch {
            Write-Error $_.Exception.Message
            exit 1
          }
        } else {
          Write-Output 'Success'
        }
      `
        .replace(/\s+/g, ' ')
        .trim();

      const command = `powershell -Command "${psCommand}"`;

      exec(command, (error, stdout, stderr) => {
        if (error !== null) {
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
