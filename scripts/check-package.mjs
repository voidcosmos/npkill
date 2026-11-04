import { execFileSync } from 'node:child_process';
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT_DIR = fileURLToPath(new URL('..', import.meta.url));
const TSC = join(ROOT_DIR, 'node_modules', 'typescript', 'bin', 'tsc');
const TYPE_ROOTS = join(ROOT_DIR, 'node_modules', '@types');
const IS_WINDOWS = process.platform === 'win32';

const MODULE_SETTINGS = [
  { module: 'nodenext', moduleResolution: 'nodenext' },
  { module: 'node16', moduleResolution: 'node16' },
  { module: 'esnext', moduleResolution: 'bundler' },
  { module: 'commonjs', moduleResolution: 'node10' },
];

const CONSUMER_SOURCE = `import { Npkill } from 'npkill';
import type { ScanFoundTarget, TargetRule } from 'npkill';

const rust: TargetRule = { target: 'target', nextTo: ['Cargo.toml'] };
const paths: string[] = [];
new Npkill()
  .startScan$('.', { targets: ['node_modules', rust] })
  .subscribe((target: ScanFoundTarget) => paths.push(target.path));
`;

const workDir = mkdtempSync(join(tmpdir(), 'npkill-package-'));

try {
  const tarball = packPackage();
  checkInstalledBin(tarball);
  checkTypeScriptConsumer(tarball);
  console.log('The packed npkill works as a bin and as a library.');
} finally {
  rmSync(workDir, { recursive: true, force: true });
}

function packPackage() {
  const output = run(
    'npm',
    ['pack', '--ignore-scripts', '--json', '--pack-destination', workDir],
    ROOT_DIR,
  );
  const [{ filename }] = JSON.parse(output);
  return join(workDir, filename);
}

function checkInstalledBin(tarball) {
  const prefix = join(workDir, 'global');
  run('npm', ['install', '--global', '--prefix', prefix, tarball], workDir);

  const bin = IS_WINDOWS
    ? join(prefix, 'npkill.cmd')
    : join(prefix, 'bin', 'npkill');
  const [printedVersion] = run(bin, ['--version'], workDir).split('\n');
  const expectedVersion = `v${readPackageVersion()}`;

  if (printedVersion !== expectedVersion) {
    throw new Error(
      `npkill --version printed "${printedVersion}" instead of "${expectedVersion}".`,
    );
  }
}

function checkTypeScriptConsumer(tarball) {
  const consumerDir = join(workDir, 'consumer');
  mkdirSync(consumerDir);
  writeFileSync(
    join(consumerDir, 'package.json'),
    JSON.stringify({ name: 'consumer', private: true, type: 'module' }),
  );
  writeFileSync(join(consumerDir, 'index.ts'), CONSUMER_SOURCE);
  run('npm', ['install', '--ignore-scripts', tarball], consumerDir);

  MODULE_SETTINGS.forEach(({ module, moduleResolution }) => {
    console.log(
      `Compiling a consumer with moduleResolution ${moduleResolution}`,
    );
    run(
      process.execPath,
      [
        TSC,
        '--noEmit',
        '--strict',
        '--skipLibCheck',
        'false',
        '--types',
        'node',
        '--typeRoots',
        TYPE_ROOTS,
        '--module',
        module,
        '--moduleResolution',
        moduleResolution,
        '--ignoreDeprecations',
        '6.0',
        'index.ts',
      ],
      consumerDir,
    );
  });
}

function readPackageVersion() {
  const packageJson = readFileSync(join(ROOT_DIR, 'package.json'), 'utf8');
  return JSON.parse(packageJson).version;
}

function run(command, args, cwd) {
  try {
    return execFileSync(command, args, {
      cwd,
      encoding: 'utf8',
      shell: IS_WINDOWS,
      stdio: ['ignore', 'pipe', 'inherit'],
    });
  } catch (error) {
    process.stdout.write(error.stdout ?? '');
    throw error;
  }
}
