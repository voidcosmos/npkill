export class StartParameters {
  private values: Record<string, string | boolean> = {};

  add(key: string, value: string | boolean): void {
    this.values[key] = value;
  }

  isTrue(key: string): boolean {
    const value = this.values[key];
    return value !== undefined && (value === true || value !== 'false');
  }

  getString(key: string): string {
    const value = this.values[key];
    if (typeof value === 'boolean') {
      return value.toString();
    }

    return value;
  }

  getStrings(key: string): string[] {
    const value = this.values[key];
    if (!value || typeof value === 'boolean') {
      return [];
    }

    return value.split(',').map((item) => item.trim());
  }
}
