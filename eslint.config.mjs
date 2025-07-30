// @ts-check

import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import nodePlugin from 'eslint-plugin-n';
import pluginPromise from 'eslint-plugin-promise';
import eslintConfigPrettier from 'eslint-config-prettier/flat';

export default tseslint.config(
  eslint.configs.recommended,
  tseslint.configs.recommended,
  nodePlugin.configs['flat/recommended'],
  pluginPromise.configs['flat/recommended'],
  eslintConfigPrettier,
);
