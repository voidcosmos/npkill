import * as path from 'path';

export function isSafeToDelete(filePath: string, targets: string[]): boolean {
  const lastPath = path.basename(filePath);
  if (!lastPath) {
    return false;
  }

  return targets.some((target) => target === lastPath);
}
