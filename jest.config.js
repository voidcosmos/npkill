module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  globals: {
    'ts-jest': {
      diagnostics: false,
    },
  },
  testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.(jsx?|tsx?)$',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  moduleNameMapper: {
    '^@core/(.*)$': '<rootDir>/src/$1',
    '^@services/(.*)$': '<rootDir>/src/services/$1',
    '^@interfaces/(.*)$': '<rootDir>/src/interfaces/$1',
    '^@constants/(.*)$': '<rootDir>/src/constants/$1',
  },
};
