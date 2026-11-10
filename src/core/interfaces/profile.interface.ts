import { TargetDefinition } from './target.interface.js';

/**
 * Represents a profile with target directories and description.
 */
export interface Profile {
  /** Directory names or rules to search for. */
  readonly targets: readonly TargetDefinition[];
  /** Description of what this profile is for */
  readonly description: string;
}
