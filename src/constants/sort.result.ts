import { IFolder } from '../interfaces/folder.interface.js';

export const FOLDER_SORT = {
  path: (a: IFolder, b: IFolder) => (a.path > b.path ? 1 : -1),
  size: (a: IFolder, b: IFolder) => (a.size < b.size ? 1 : -1),
  date: (a: IFolder, b: IFolder) => {
    // const idOrder = a.id - b.id;
    // if (b.isDangerous || !b.modificationTime) {
    //   return idOrder;
    //   // return -1;
    // }

    // if (b.isDangerous || b.modificationTime <= 0) return 1;
    // if (a.isDangerous || a.modificationTime <= 0) return -1;
    if (b.modificationTime <= 0 && a.modificationTime > 0) return -1;
    if (a.modificationTime <= 0 && b.modificationTime > 0) return 1;
    return a.modificationTime - b.modificationTime;
  },
};
