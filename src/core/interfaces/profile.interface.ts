/**
 * Represents a profile with target directories and description.
 */
export interface Profile {
  /** Array of directory names to search for */
  readonly targets: readonly string[];
  /** Description of what this profile is for */
  readonly description: string;
}
