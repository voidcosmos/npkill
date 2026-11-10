import { spawnSync } from 'node:child_process';
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';

export default function buildPackage(_globalConfig, projectConfig) {
  const { rootDir } = projectConfig;
  const packageDir = join(rootDir, '.test-build', 'npkill-api');
  const stampFile = join(packageDir, 'source-stamp');
  const sourceStamp = String(newestSourceChange(rootDir));

  if (
    existsSync(stampFile) &&
    readFileSync(stampFile, 'utf8') === sourceStamp
  ) {
    return;
  }

  rmSync(packageDir, { recursive: true, force: true });
  mkdirSync(packageDir, { recursive: true });
  compile(rootDir, join(packageDir, 'lib'));
  copyFileSync(join(rootDir, 'package.json'), join(packageDir, 'package.json'));
  writeFileSync(stampFile, sourceStamp);
}

function newestSourceChange(rootDir) {
  const sourcePaths = readdirSync(join(rootDir, 'src'), {
    recursive: true,
  }).map((path) => join('src', path));
  const inputs = ['src', 'tsconfig.json', 'package.json', ...sourcePaths];

  return Math.max(
    ...inputs.map((input) => statSync(join(rootDir, input)).mtimeMs),
  );
}

function compile(rootDir, outDir) {
  const tsc = join(rootDir, 'node_modules', 'typescript', 'bin', 'tsc');
  spawnSync(
    process.execPath,
    [tsc, '-p', 'tsconfig.json', '--outDir', outDir],
    { cwd: rootDir, stdio: 'inherit' },
  );

  if (!existsSync(join(outDir, 'index.js'))) {
    throw new Error(`Could not build npkill into ${outDir}`);
  }
}
