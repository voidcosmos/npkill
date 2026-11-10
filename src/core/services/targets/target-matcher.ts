import { readdirSync } from 'node:fs';
import { basename } from 'node:path';
import {
  TargetDefinition,
  TargetRule,
} from '../../interfaces/target.interface.js';

export function targetName(definition: TargetDefinition): string {
  return typeof definition === 'string' ? definition : definition.target;
}

export function targetNames(
  definitions: readonly TargetDefinition[],
): string[] {
  return [...new Set(definitions.map(targetName))];
}

export class TargetMatcher {
  private readonly names = new Set<string>();
  private readonly rules = new Map<string, TargetRule[]>();

  constructor(targets: readonly TargetDefinition[]) {
    for (const target of targets) {
      if (typeof target === 'string') {
        this.names.add(target);
      } else {
        this.rules.set(target.target, [
          ...(this.rules.get(target.target) ?? []),
          target,
        ]);
      }
    }
  }

  isCandidate(name: string): boolean {
    return this.names.has(name) || this.rules.has(name);
  }

  matches(path: string, siblings: ReadonlySet<string>): boolean {
    const name = basename(path);
    if (this.names.has(name)) {
      return true;
    }
    const rules = (this.rules.get(name) ?? []).filter((rule) =>
      hasAll(siblings, rule.nextTo),
    );
    if (rules.some((rule) => rule.contains === undefined)) {
      return true;
    }
    if (rules.length === 0) {
      return false;
    }
    const children = readNames(path);
    return rules.some((rule) => hasAll(children, rule.contains));
  }
}

function hasAll(
  names: ReadonlySet<string>,
  required: readonly string[] = [],
): boolean {
  return required.every((name) => names.has(name));
}

function readNames(path: string): Set<string> {
  try {
    return new Set(readdirSync(path));
  } catch {
    return new Set();
  }
}
