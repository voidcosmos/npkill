/**
 * @type {import('@stryker-mutator/api/core').StrykerOptions}
 */
const config = {
  packageManager: 'npm',
  reporters: ['html', 'clear-text', 'progress'],
  testRunner: 'command',
  coverageAnalysis: 'off',
  concurrency: 4,
  commandRunner: {
    command:
      'node --experimental-vm-modules --experimental-modules node_modules/jest/bin/jest.js --verbose',
  },
};
export default config;
