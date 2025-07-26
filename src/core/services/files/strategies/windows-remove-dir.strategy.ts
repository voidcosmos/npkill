import {
  WindowsNode12Strategy,
  WindowsNode14Strategy,
  WindowsDefaultStrategy,
} from './index.js';
import { WindowsStrategy } from './windows-strategy.abstract.js';

export class WindowsStrategyManager {
  async deleteDir(path: string): Promise<boolean> {
    const windowsStrategy: WindowsStrategy = new WindowsNode14Strategy();
    windowsStrategy
      .setNextStrategy(new WindowsNode12Strategy())
      .setNextStrategy(new WindowsDefaultStrategy());

    return new Promise((resolve, reject) => {
      windowsStrategy.remove(path, (err) => {
        if (err !== null) {
          reject(err);
          return;
        }
        resolve(true);
      });
    });
  }
}
