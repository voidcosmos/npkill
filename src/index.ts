#!/usr/bin/env node

import { fileURLToPath } from 'url';
import main from './main.js';

// Check if npkill is called directly from the command line. If so, start the
// cli. If not, the module is being imported by another module, so don't start.
const shouldStartCli = process.argv[1] === fileURLToPath(import.meta.url);
if (shouldStartCli) {
  main();
}

export { Npkill } from './core/npkill.js';
export { DEFAULT_PROFILES } from './core/constants/profiles.constants.js';
export type {
  NpkillInterface,
  IsValidRootFolderResult,
} from './core/interfaces/npkill.interface.js';
export type { Profile } from './core/interfaces/profile.interface.js';
export type { LogEntry } from './core/interfaces/logger-service.interface.js';
export type {
  DeleteOptions,
  DeleteResult,
  GetNewestFileResult,
  GetSizeResult,
  RiskAnalysis,
  ScanFoundFolder,
  ScanOptions,
} from './core/interfaces/folder.interface.js';
