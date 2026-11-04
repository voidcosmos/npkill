import { ValidationResult } from './property-validators.js';
import { validateTargets } from '../targets/index.js';

export function validateProfile(
  profileName: string,
  profile: unknown,
): ValidationResult {
  if (typeof profile !== 'object' || profile === null) {
    return {
      isValid: false,
      error: `Profile "${profileName}" must be an object.`,
    };
  }

  if (profileName === 'all') {
    return { isValid: false, error: 'profiles.all is reserved.' };
  }

  const profileObj = profile as Record<string, unknown>;
  const unknownProperty = Object.keys(profileObj).find(
    (key) => !['description', 'targets'].includes(key),
  );
  if (unknownProperty !== undefined) {
    return {
      isValid: false,
      error: `profiles.${profileName}.${unknownProperty}: unknown property.`,
    };
  }

  // Validate description
  if (!profileObj.description || typeof profileObj.description !== 'string') {
    return {
      isValid: false,
      error: `Profile "${profileName}" must have a description property (string).`,
    };
  }

  // Validate targets property exists
  if (!profileObj.targets) {
    return {
      isValid: false,
      error: `Profile "${profileName}" must have a targets property.`,
    };
  }

  return validateTargets(profileObj.targets, `profiles.${profileName}.targets`);
}

/**
 * Validates the profiles property (all profiles)
 */
export function validateProfiles(value: unknown): ValidationResult {
  if (value === undefined) {
    return { isValid: true };
  }

  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return {
      isValid: false,
      error: 'profiles must be an object.',
    };
  }

  // Validate each profile
  for (const [profileName, profile] of Object.entries(value)) {
    const result = validateProfile(profileName, profile);
    if (!result.isValid) {
      return result;
    }
  }

  return { isValid: true };
}
