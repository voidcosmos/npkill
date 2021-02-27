import { INodeVersion } from '@interfaces/node-version.interface'

export const RECURSIVE_RMDIR_NODE_VERSION_SUPPORT: Pick<INodeVersion, 'major' | 'minor'> = {
  major: 12,
  minor: 10
};
