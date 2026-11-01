const SECONDS_PER_DAY = 86400;

/**
 * Checks if a result was last modified more than `days` days ago.
 *
 * @param modificationTime Unix timestamp in seconds. Values <= 1 mean the
 * age is unknown (not calculated or failed), and are never considered old.
 * @param days Minimum age in days.
 * @param now Current time in milliseconds.
 */
export function isOlderThan(
  modificationTime: number,
  days: number,
  now: number = Date.now(),
): boolean {
  if (modificationTime <= 1) {
    return false;
  }

  const ageInDays = (now / 1000 - modificationTime) / SECONDS_PER_DAY;
  return ageInDays > days;
}
