import * as path from 'path';
import { TargetDefinition } from '../core/interfaces/target.interface.js';
import { TargetMatcher } from '../core/services/targets/index.js';

export function isSafeToDelete(
  filePath: string,
  targets: readonly TargetDefinition[],
): boolean {
  const lastPath = path.basename(filePath);
  if (!lastPath) {
    return false;
  }

  return new TargetMatcher(targets).isCandidate(lastPath);
}
