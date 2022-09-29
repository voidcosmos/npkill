#!/usr/bin/env node
import { readFileSync } from 'fs';
import tsConfigPaths from 'tsconfig-paths';
const tsConfig = JSON.parse(readFileSync(new URL('./tsconfig.build.json'), 'utf8'));
tsConfigPaths.register({
    baseUrl: __dirname,
    paths: tsConfig.compilerOptions.paths,
});
require('./main');
