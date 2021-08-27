import { NoParamCallback, rm } from 'fs';

import { RM_NODE_VERSION_SUPPORT } from '@core/constants';
import { WindowsStrategy } from './windows-strategy.abstract';

export class WindowsNode12Strategy extends WindowsStrategy {
  remove(path: string, callback: NoParamCallback): boolean {
    if (this.isSupported()) {
      rm(path, { recursive: true }, callback);
      return true;
    }
    console.log('Node 12');
    return this.checkNext(path, callback);
  }

  isSupported(): boolean {
    return (
      this.major > RM_NODE_VERSION_SUPPORT.major ||
      (this.major === RM_NODE_VERSION_SUPPORT.major &&
        this.minor > RM_NODE_VERSION_SUPPORT.minor)
    );
  }
}
