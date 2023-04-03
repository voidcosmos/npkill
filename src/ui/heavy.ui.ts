import { BaseUi } from './base.ui.js';

/**
 * A UI that buffers the output and prints it all at once when calling the
 * flush() function.
 */
export abstract class HeavyUi extends BaseUi {
  private buffer = '';
  private previousBuffer = '';

  /**
   * Stores the text in a buffer. No will print it to stdout until flush()
   * is called.
   */
  protected override print(text: string): void {
    this.buffer += text;
  }

  /** Prints the buffer (if have any change) to stdout and clears it. */
  protected flush(): void {
    if (this.freezed) {
      return;
    }

    if (this.buffer === this.previousBuffer) {
      this.clearBuffer();
      return;
    }

    process.stdout.write.bind(process.stdout)(this.buffer);
    this.clearBuffer();
  }

  private clearBuffer(): void {
    this.previousBuffer = this.buffer;
    this.buffer = '';
  }
}
