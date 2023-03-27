import { fileURLToPath } from 'url';
import { dirname } from 'path';

const _filename = fileURLToPath(import.meta.url);
const _dirname = dirname(_filename);

export default _dirname;
