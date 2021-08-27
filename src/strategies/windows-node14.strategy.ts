import { NoParamCallback, rmdir } from 'fs';

import { RECURSIVE_RMDIR_NODE_VERSION_SUPPORT } from '@core/constants/recursive-rmdir-node-support.constants';
import { WindowsStrategy } from './windows-strategy.abstract';

export class WindowsNode14Strategy extends WindowsStrategy {
  remove(path: string, callback: NoParamCallback): boolean {
    if (this.isSupported()) {
      rmdir(path, { recursive: true }, callback);
      return true;
    }
    console.log('Node 14');
    return this.checkNext(path, callback);
  }

  isSupported(): boolean {
    return (
      this.major > RECURSIVE_RMDIR_NODE_VERSION_SUPPORT.major ||
      (this.major === RECURSIVE_RMDIR_NODE_VERSION_SUPPORT.major &&
        this.minor > RECURSIVE_RMDIR_NODE_VERSION_SUPPORT.minor)
    );
  }
}
