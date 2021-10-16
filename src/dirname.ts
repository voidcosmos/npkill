/**
 * @fileoverview A helper module to get `__dirname` in an ESModule env
 * @see https://stackoverflow.com/questions/64383909/dirname-is-not-defined-in-node-14-version
 */
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default __dirname
