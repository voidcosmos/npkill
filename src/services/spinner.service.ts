export class SpinnerService {
  private spinner;
  private count = -1;

  constructor() {}

  setSpinner(spinner: string[]) {
    this.spinner = spinner;
    this.reset();
  }

  nextFrame() {
    this.updateCount();
    return this.spinner[this.count];
  }

  reset() {
    this.count = -1;
  }

  private updateCount() {
    this.count = this.count === this.spinner.length - 1 ? 0 : ++this.count;
  }
}
