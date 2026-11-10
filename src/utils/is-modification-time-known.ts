/**
 * Results use 1 (calculated but unknown) and -1 (not calculated) as
 * modification times that hold no real date.
 */
export function isModificationTimeKnown(modificationTime: number): boolean {
  return modificationTime > 1;
}
