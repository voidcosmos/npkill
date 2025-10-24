import { ValidationResult } from './property-validators.js';

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

  const profileObj = profile as Record<string, unknown>;

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

  // Validate targets is an array
  if (!Array.isArray(profileObj.targets)) {
    return {
      isValid: false,
      error: `Profile "${profileName}" targets must be an array of strings.`,
    };
  }

  // Validate all targets are strings
  if (!profileObj.targets.every((t) => typeof t === 'string')) {
    return {
      isValid: false,
      error: `All targets in profile "${profileName}" must be strings.`,
    };
  }

  // Validate targets array is not empty
  if (profileObj.targets.length === 0) {
    return {
      isValid: false,
      error: `Profile "${profileName}" targets array cannot be empty.`,
    };
  }

  return { isValid: true };
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
