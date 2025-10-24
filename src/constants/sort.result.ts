import { CliScanFoundFolder } from '../cli/interfaces/index.js';

export const FOLDER_SORT = {
  path: (a: CliScanFoundFolder, b: CliScanFoundFolder) =>
    a.path > b.path ? 1 : -1,
  size: (a: CliScanFoundFolder, b: CliScanFoundFolder) => {
    if (a.size !== b.size) {
      return a.size < b.size ? 1 : -1;
    }
    return FOLDER_SORT.path(a, b);
  },
  'last-mod': (a: CliScanFoundFolder, b: CliScanFoundFolder) => {
    if (a.modificationTime === b.modificationTime) {
      return FOLDER_SORT.path(a, b);
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
