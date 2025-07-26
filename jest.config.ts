import type { JestConfigWithTsJest } from 'ts-jest';

const config: JestConfigWithTsJest = {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  testRegex: '(/tests/.*|(\\.|/)(test|spec))\\.(jsx?|tsx?)$',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  // moduleNameMapper: {
  //   '^@core/(.*)$': '<rootDir>/src/$1',
  //   '^@services/(.*)$': '<rootDir>/src/services/$1',
  //   '^@interfaces/(.*)$': '<rootDir>/src/interfaces/$1',
  //   '^@constants/(.*)$': '<rootDir>/src/constants/$1',
  // },
  // transform: {
  //   '^.+\\.(t|j)sx?$': ['ts-jest', { useESM: true }],
  // },
  transform: {
    '^.+\\.(t|j)sx?$': ['ts-jest', { useESM: true }],
  },
};

export default config;
