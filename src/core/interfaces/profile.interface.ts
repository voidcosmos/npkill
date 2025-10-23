/**
 * Represents a profile with target directories and description.
 */
export interface PROFILE {
  /** Array of directory names to search for */
  targets: string[];
  /** Description of what this profile is for */
  description: string;
}
