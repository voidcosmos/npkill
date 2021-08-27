import { NoParamCallback, rm } from 'fs';

import { RECURSIVE_RMDIR_NODE_VERSION_SUPPORT } from '@core/constants';
import { WindowsStrategy } from './windows-strategy.abstract';

export class WindowsNode12Strategy extends WindowsStrategy {
  remove(path: string, callback: NoParamCallback): boolean {
    if (this.isSupported()) {
      console.log('Node 12');
      rm(path, { recursive: true }, callback);
      return true;
    }
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
