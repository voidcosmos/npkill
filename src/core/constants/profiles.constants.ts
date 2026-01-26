/* eslint-disable quotes */
import { PROFILE } from '../interfaces/profile.interface.js';

export const DEFAULT_PROFILE = 'node';

export const BASE_PROFILES: { [profileName: string]: PROFILE } = {
  node: {
    description:
      'All the usual suspects related with the node/web/javascript dev toolchain: node_modules, caches, build artifacts, and assorted JavaScript junk. Safe to clean and your disk will thank you.',
    targets: [
      'node_modules',
      '.npm',
      '.pnpm-store',
      '.next',
      '.nuxt',
      '.angular',
      '.svelte-kit',
      '.vite',
      '.nx',
      '.turbo',
      '.parcel-cache',
      '.rpt2_cache',
      '.eslintcache',
      '.esbuild',
      '.cache',
      '.rollup.cache',
      'storybook-static',
      'coverage',
      '.nyc_output',
      '.jest',
      'gatsby_cache',
      '.docusaurus',
      '.swc',
      '.stylelintcache',
      'deno_cache',
    ],
  },
  python: {
    description:
      "The usual Python leftovers — caches, virtual environments, and test artifacts. Safe to clear once you've closed your IDE and virtualenvs.",
    targets: [
      '__pycache__',
      '.pytest_cache',
      '.mypy_cache',
      '.ruff_cache',
      '.tox',
      '.nox',
      '.pytype',
      '.pyre',
      'htmlcov',
      '.venv',
      'venv',
    ],
  },
  'data-science': {
    description:
      'Jupyter checkpoints, virtualenvs, MLflow runs, and experiment outputs. Great for learning, terrible for disk space.',
    targets: [
      '.ipynb_checkpoints',
      '__pycache__',
      '.venv',
      'venv',
      'outputs',
      '.dvc',
      '.mlruns',
    ],
  },
  java: {
    description: 'Build outputs and Gradle junk.',
    targets: ['target', '.gradle', 'out'],
  },
  android: {
    description:
      "Native build caches and intermediate files from Android Studio. Deleting won't hurt, but expect a rebuild marathon next time.",
    targets: ['.cxx', 'externalNativeBuild'],
  },
  swift: {
    description:
      "Xcode's playground leftovers and Swift package builds. Heavy, harmless, and happy to go.",
    targets: ['DerivedData', '.swiftpm'],
  },
  dotnet: {
    description:
      "Compilation artifacts and Visual Studio cache folders. Disposable once you're done building or testing.",
    targets: ['obj', 'TestResults', '.vs'],
  },
  rust: {
    description:
      'Cargo build targets. Huge, regenerable, and surprisingly clingy, your disk will appreciate the reset.',
    targets: ['target'],
  },
  ruby: {
    description: 'Bundler caches and dependency leftovers.',
    targets: ['.bundle'],
  },
  elixir: {
    description:
      'Mix build folders, dependencies, and coverage reports. Easy to regenerate, safe to purge.',
    targets: ['_build', 'deps', 'cover'],
  },
  haskell: {
    description:
      "GHC and Stack build outputs. A collection of intermediate binaries you definitely don't need anymore.",
    targets: ['dist-newstyle', '.stack-work'],
  },
  scala: {
    description: 'Bloop, Metals, and build outputs from Scala projects.',
    targets: ['.bloop', '.metals', 'target'],
  },
  cpp: {
    description:
      'CMake build directories and temporary artifacts. Rebuilds take time, but space is priceless.',
    targets: ['CMakeFiles', 'cmake-build-debug', 'cmake-build-release'],
  },
  unity: {
    description:
      "Unity's cache and build artifacts. Expect longer load times next launch but it can save tons of space on unused projects.",
    targets: ['Library', 'Temp', 'Obj'],
  },
  unreal: {
    description:
      'Intermediate and binary build caches. Safe to clean. Unreal will (happily?) recompile.',
    targets: ['Intermediate', 'DerivedDataCache', 'Binaries'],
  },
  godot: {
    description:
      'Editor caches and import data. Godot can recreate these in a blink.',
    targets: ['.import', '.godot'],
  },
  infra: {
    description:
      'Leftovers from deployment tools like Serverless, Vercel, Netlify, and Terraform.',
    targets: [
      '.serverless',
      '.vercel',
      '.netlify',
      '.terraform',
      '.sass-cache',
      '.cpcache',
      'elm_stuff',
      'nimcache',
      'deno_cache',
    ],
  },
};

const ALL_TARGETS = [
  ...new Set(
    Object.values(BASE_PROFILES).flatMap((profile) => profile.targets),
  ),
];

export const DEFAULT_PROFILES: { [profileName: string]: PROFILE } = {
  ...BASE_PROFILES,
  all: {
    targets: ALL_TARGETS,
    description:
      'Includes all targets listed above. Not recommended, as it mixes unrelated ecosystems and may remove context-specific data (a good recipe for chaos if used recklessly).',
  },
};
