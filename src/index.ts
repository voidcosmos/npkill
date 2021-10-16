#!/usr/bin/env node

const tsConfig = require('./tsconfig.build.json');
const tsConfigPaths = require('tsconfig-paths');
import __dirname from './dirname.js';

const baseUrl = __dirname;
const cleanup = tsConfigPaths.register({
  baseUrl,
  paths: tsConfig.compilerOptions.paths,
});

require('./main');
