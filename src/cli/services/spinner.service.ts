export class SpinnerService {
  private spinner: string[] = [];
  private count = -1;

  setSpinner(spinner: string[]): void {
    this.spinner = spinner;
    this.reset();
  }

  nextFrame(): string {
    this.updateCount();
    return this.spinner[this.count];
  }

  reset(): void {
    this.count = -1;
  }

  private updateCount(): void {
    if (this.isLastFrame()) {
      this.count = 0;
    } else {
      ++this.count;
    }
  }

  private isLastFrame(): boolean {
    return this.count === this.spinner.length - 1;
  }
}
