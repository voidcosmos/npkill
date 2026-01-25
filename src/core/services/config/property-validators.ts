import { INpkillrcConfig } from '../../interfaces/npkillrc-config.interface.js';

const VALID_SORT_OPTIONS = ['none', 'size', 'path', 'age'] as const;
const VALID_SIZE_UNITS = ['auto', 'mb', 'gb'] as const;

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validates the rootDir property
 */
export function validateRootDir(value: unknown): ValidationResult {
  if (value === undefined) {
    return { isValid: true };
  }

  if (typeof value !== 'string') {
    return {
      isValid: false,
      error: 'rootDir must be a string.',
    };
  }

  if (value.trim() === '') {
    return {
      isValid: false,
      error: 'rootDir cannot be an empty string.',
    };
  }

  return { isValid: true };
}

/**
 * Validates the exclude property
 */
export function validateExclude(value: unknown): ValidationResult {
  if (value === undefined) {
    return { isValid: true };
  }

  if (!Array.isArray(value)) {
    return {
      isValid: false,
      error: 'exclude must be an array of strings.',
    };
  }

  if (!value.every((item) => typeof item === 'string')) {
    return {
      isValid: false,
      error: 'All exclude items must be strings.',
    };
  }

  return { isValid: true };
}

/**
 * Validates the sortBy property
 */
export function validateSortBy(value: unknown): ValidationResult {
  if (value === undefined) {
    return { isValid: true };
  }

  if (!(VALID_SORT_OPTIONS as readonly string[]).includes(value as string)) {
    return {
      isValid: false,
      error: `sortBy must be one of: ${VALID_SORT_OPTIONS.join(', ')}.`,
    };
  }

  return { isValid: true };
}

/**
 * Validates the sizeUnit property
 */
export function validateSizeUnit(value: unknown): ValidationResult {
  if (value === undefined) {
    return { isValid: true };
  }

  if (!(VALID_SIZE_UNITS as readonly string[]).includes(value as string)) {
    return {
      isValid: false,
      error: `sizeUnit must be one of: ${VALID_SIZE_UNITS.join(', ')}.`,
    };
  }

  return { isValid: true };
}

/**
 * Validates a boolean property
 */
export function validateBoolean(
  value: unknown,
  propertyName: string,
): ValidationResult {
  if (value === undefined) {
    return { isValid: true };
  }

  if (typeof value !== 'boolean') {
    return {
      isValid: false,
      error: `${propertyName} must be a boolean.`,
    };
  }

  return { isValid: true };
}

/**
 * Validates the defaultProfiles property
 */
export function validateDefaultProfiles(value: unknown): ValidationResult {
  if (value === undefined) {
    return { isValid: true };
  }

  if (!Array.isArray(value)) {
    return {
      isValid: false,
      error: 'defaultProfiles must be an array of strings.',
    };
  }

  if (!value.every((item) => typeof item === 'string')) {
    return {
      isValid: false,
      error: 'All defaultProfiles items must be strings.',
    };
  }

  return { isValid: true };
}

/**
 * Validates unknown properties
 */
export function validateUnknownProperties(
  config: INpkillrcConfig,
  validProperties: readonly string[],
): ValidationResult {
  const unknownProps = Object.keys(config).filter(
    (key) => !validProperties.includes(key),
  );

  if (unknownProps.length > 0) {
    return {
      isValid: false,
      error:
        `Unknown configuration ${unknownProps.length === 1 ? 'property' : 'properties'}:` +
        ` ${unknownProps.join(', ')}. Valid properties are: ${validProperties.join(', ')}.`,
    };
  }

  return { isValid: true };
}
