import { IFolder } from '../interfaces/folder.interface.js';

export const FOLDER_SORT = {
  path: (a: IFolder, b: IFolder) => (a.path > b.path ? 1 : -1),
  size: (a: IFolder, b: IFolder) => (a.size < b.size ? 1 : -1),
  date: (a: IFolder, b: IFolder) => {
    if (b.isDangerous || !b.modificationTime) return -1;
    if (!a.isDangerous || a.modificationTime) return 1;
    return a.modificationTime - b.modificationTime;
  },
};
