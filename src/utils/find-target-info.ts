import { RESULT_TYPE_INFO } from '../constants/result-descriptions.constants.js';

export function findTargetInfo(targetName: string): string | undefined {
  const key = targetName.toLowerCase();
  return Object.hasOwn(RESULT_TYPE_INFO, key)
    ? RESULT_TYPE_INFO[key]
    : undefined;
}
