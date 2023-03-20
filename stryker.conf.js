/**
 * @type {import('@stryker-mutator/api/core').StrykerOptions}
 */
const config = {
  packageManager: 'npm',
  reporters: ['html', 'clear-text', 'progress'],
  //  testRunner: 'jest', // Using npm test by default
  testRunnerNodeArgs: ['--experimental-vm-modules', '--experimental-modules'],
  coverageAnalysis: 'perTest',
  jest: {
    projectType: 'custom',
    configFile: './jest.config.ts',
    enableFindRelatedTests: true,
  },
};

export default config;
