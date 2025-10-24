import {
  INpkillrcConfig,
  VALID_NPKILLRC_PROPERTIES,
} from '../../interfaces/npkillrc-config.interface.js';
import {
  validateRootDir,
  validateExclude,
  validateSortBy,
  validateSizeUnit,
  validateBoolean,
  validateDefaultProfiles,
  validateUnknownProperties,
  ValidationResult,
} from './property-validators.js';
import { validateProfiles } from './profile-validator.js';

export function validateConfig(config: INpkillrcConfig): ValidationResult {
  // Validate that config is an object
  if (typeof config !== 'object' || config === null) {
    return { isValid: false, error: 'Configuration must be an object.' };
  }

  // Validate unknown properties first
  const unknownPropsResult = validateUnknownProperties(
    config,
    VALID_NPKILLRC_PROPERTIES,
  );
  if (!unknownPropsResult.isValid) {
    return unknownPropsResult;
  }

  // Validate each property
  const validators: Array<{ name: string; result: ValidationResult }> = [
    { name: 'rootDir', result: validateRootDir(config.rootDir) },
    { name: 'exclude', result: validateExclude(config.exclude) },
    { name: 'sortBy', result: validateSortBy(config.sortBy) },
    { name: 'sizeUnit', result: validateSizeUnit(config.sizeUnit) },
    {
      name: 'hideSensitiveResults',
      result: validateBoolean(
        config.hideSensitiveResults,
        'hideSensitiveResults',
      ),
    },
    { name: 'dryRun', result: validateBoolean(config.dryRun, 'dryRun') },
    {
      name: 'checkUpdates',
      result: validateBoolean(config.checkUpdates, 'checkUpdates'),
    },
    {
      name: 'defaultProfiles',
      result: validateDefaultProfiles(config.defaultProfiles),
    },
    { name: 'profiles', result: validateProfiles(config.profiles) },
  ];

  // Return first validation error found
  for (const validator of validators) {
    if (!validator.result.isValid) {
      return validator.result;
    }
  }

  return { isValid: true };
}
