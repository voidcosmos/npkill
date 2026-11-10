// @ts-check

import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import nodePlugin from 'eslint-plugin-n';
import pluginPromise from 'eslint-plugin-promise';
import eslintConfigPrettier from 'eslint-config-prettier/flat';

export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      'lib/**',
      '.test-build/**',
      'dist/**',
      'build/**',
      '**/*.min.js',
      '.stryker-tmp/**',
      'src/cli.ts',
    ],
  },
  eslint.configs.recommended,
  tseslint.configs.recommended,
  nodePlugin.configs['flat/recommended'],
  pluginPromise.configs['flat/recommended'],
  eslintConfigPrettier,
  {
    rules: {
      quotes: ['error', 'single'],
    },
  },
);
