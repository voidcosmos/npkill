import { ValidationResult } from '../config/property-validators.js';

const RULE_PROPERTIES = ['target', 'nextTo', 'contains'];
const PATTERN_CHARACTERS = /[*?[\]{}/\\]/;

export function validateTargets(
  value: unknown,
  path: string,
): ValidationResult {
  return validateList(value, path, validateTarget);
}

function validateTarget(target: unknown, path: string): ValidationResult {
  if (typeof target === 'string') {
    return validateName(target, path);
  }
  if (typeof target !== 'object' || target === null || Array.isArray(target)) {
    return invalid(path, 'must be a directory name or a rule');
  }
  const rule = target as Record<string, unknown>;
  const unknownProperty = Object.keys(rule).find(
    (key) => !RULE_PROPERTIES.includes(key),
  );
  if (unknownProperty !== undefined) {
    return invalid(`${path}.${unknownProperty}`, 'unknown property');
  }
  return firstInvalid([
    validateName(rule.target, `${path}.target`),
    rule.nextTo === undefined
      ? { isValid: true }
      : validateList(rule.nextTo, `${path}.nextTo`, validateName),
    rule.contains === undefined
      ? { isValid: true }
      : validateList(rule.contains, `${path}.contains`, validateName),
  ]);
}

function validateList(
  value: unknown,
  path: string,
  validateItem: (item: unknown, path: string) => ValidationResult,
): ValidationResult {
  if (!Array.isArray(value) || value.length === 0) {
    return invalid(path, 'must be a non-empty array');
  }
  return firstInvalid(
    value.map((item, index) => validateItem(item, `${path}[${index}]`)),
  );
}

function validateName(value: unknown, path: string): ValidationResult {
  if (typeof value !== 'string' || value === '') {
    return invalid(path, 'must be a non-empty name');
  }
  if (PATTERN_CHARACTERS.test(value)) {
    return invalid(
      path,
      'uses characters reserved for patterns: * ? [ ] { } / \\',
    );
  }
  return { isValid: true };
}

function firstInvalid(results: ValidationResult[]): ValidationResult {
  return results.find((result) => !result.isValid) ?? { isValid: true };
}

function invalid(path: string, reason: string): ValidationResult {
  return { isValid: false, error: `${path}: ${reason}.` };
}
