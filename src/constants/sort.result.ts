import { Folder } from '../core/interfaces/folder.interface.js';

export const FOLDER_SORT = {
  path: (a: Folder, b: Folder) => (a.path > b.path ? 1 : -1),
  size: (a: Folder, b: Folder) => (a.size < b.size ? 1 : -1),
  'last-mod': (a: Folder, b: Folder) => {
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
