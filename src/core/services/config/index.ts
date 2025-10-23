export { validateConfig } from './config-validator.js';
export {
  validateRootDir,
  validateExclude,
  validateSortBy,
  validateSizeUnit,
  validateBoolean,
  validateDefaultProfiles,
  validateUnknownProperties,
  type ValidationResult,
} from './property-validators.js';
export { validateProfile, validateProfiles } from './profile-validator.js';
export {
  mergeExcludeArrays,
  mergeProperty,
  isDefined,
  applyFileConfigProperties,
} from './config-merger.js';
