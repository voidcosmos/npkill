import { CliScanFoundTarget } from '../cli/interfaces/index.js';

export const RESULT_SORT = {
  path: (a: CliScanFoundTarget, b: CliScanFoundTarget) =>
    a.path > b.path ? 1 : -1,
  size: (a: CliScanFoundTarget, b: CliScanFoundTarget) => {
    if (a.size !== b.size) {
      return a.size < b.size ? 1 : -1;
    }
    return RESULT_SORT.path(a, b);
  },
  age: (a: CliScanFoundTarget, b: CliScanFoundTarget) => {
    if (a.modificationTime === b.modificationTime) {
      return RESULT_SORT.path(a, b);
    }

    if (a.modificationTime === null && b.modificationTime !== null) {
      return 1;
    }

    if (b.modificationTime === null && a.modificationTime !== null) {
      return -1;
    }

    return a.modificationTime - b.modificationTime;
  },
};
