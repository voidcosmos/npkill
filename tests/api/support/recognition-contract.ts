import type { DeleteOptions, ScanOptions } from '../../../src/index.js';

export interface ContractMarker {
  path: string;
  type: 'file' | 'directory';
}

export interface ContractCheck {
  kind: 'siblings' | 'contains';
  allOf?: ContractMarker[];
  anyOf?: ContractMarker[];
}

export interface ContractRule {
  id: string;
  name: string;
  type: 'directory';
  checks: ContractCheck[];
}

export interface ContractEvidence extends ContractMarker {
  kind: ContractCheck['kind'];
}

export interface ContractMatch {
  rule: ContractRule;
  evidence: ContractEvidence[];
}

export const file = (path: string): ContractMarker => ({ path, type: 'file' });
export const directory = (path: string): ContractMarker => ({
  path,
  type: 'directory',
});

export const cargoTarget: ContractRule = {
  id: 'rust.target',
  name: 'target',
  type: 'directory',
  checks: [{ kind: 'siblings', allOf: [file('Cargo.toml')] }],
};

export const mavenTarget: ContractRule = {
  id: 'java.maven-target',
  name: 'target',
  type: 'directory',
  checks: [{ kind: 'siblings', allOf: [file('pom.xml')] }],
};

export const pythonEnvironment: ContractRule = {
  id: 'python.venv',
  name: '.venv',
  type: 'directory',
  checks: [{ kind: 'contains', allOf: [file('pyvenv.cfg')] }],
};

export const unityLibrary: ContractRule = {
  id: 'unity.library',
  name: 'Library',
  type: 'directory',
  checks: [
    {
      kind: 'siblings',
      allOf: [directory('Assets'), file('ProjectSettings/ProjectVersion.txt')],
    },
  ],
};

// Runtime boundary casts keep the red tests executable before the public types exist.
export function scanOptions(
  targets: unknown[],
  options: Omit<ScanOptions, 'targets'> = {},
): ScanOptions {
  return { ...options, targets } as unknown as ScanOptions;
}

export function guardedDeleteOptions(
  verify: unknown,
  dryRun = false,
): DeleteOptions {
  return { verify, dryRun } as unknown as DeleteOptions;
}
