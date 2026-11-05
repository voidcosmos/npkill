import type { TargetRule } from '../../../src/index.js';

export const cargoTarget: TargetRule = {
  target: 'target',
  nextTo: ['Cargo.toml'],
};

export const mavenTarget: TargetRule = {
  target: 'target',
  nextTo: ['pom.xml'],
};

export const pythonEnvironment: TargetRule = {
  target: '.venv',
  contains: ['pyvenv.cfg'],
};
