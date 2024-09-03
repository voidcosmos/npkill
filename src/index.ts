#!/usr/bin/env node

import { fileURLToPath } from 'url';
import main from './main.js';

// Check if npkill is called directly from the command line. If so, start the
// cli. If not, the module is being imported by another module, so don't start.
const shouldStartCli = process.argv[1] === fileURLToPath(import.meta.url);
if (shouldStartCli) {
  main();
}

export { Npkill } from './core/index.js';
