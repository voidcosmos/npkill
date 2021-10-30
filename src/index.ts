#!/usr/bin/env node

const tsConfig = require('./tsconfig.build.json');
const tsConfigPaths = require('tsconfig-paths');

tsConfigPaths.register({
  baseUrl: __dirname,
  paths: tsConfig.compilerOptions.paths,
});

require('./main');
