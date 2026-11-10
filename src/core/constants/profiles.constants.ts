import { Profile } from '../interfaces/profile.interface.js';
import { TargetRule } from '../interfaces/target.interface.js';

export const DEFAULT_PROFILE = 'node';

const GRADLE_BUILD_OUTPUTS: TargetRule[] = [
  { target: 'build', nextTo: ['build.gradle'] },
  { target: 'build', nextTo: ['build.gradle.kts'] },
];

export const BASE_PROFILES: { [profileName: string]: Profile } = {
  node: {
    description: 'Node.js dependencies and generated artifacts.',
    targets: [
      'node_modules',
      '.angular',
      { target: '.nx', nextTo: ['nx.json'] },
      { target: '.next', nextTo: ['package.json'] },
      { target: '.nuxt', nextTo: ['package.json'] },
      { target: '.output', contains: ['nitro.json'] },
      { target: '.svelte-kit', nextTo: ['package.json'] },
      { target: '.vite', contains: ['deps'] },
      { target: '.turbo', nextTo: ['turbo.json'] },
      { target: '.turbo', nextTo: ['turbo.jsonc'] },
      { target: '.parcel-cache', nextTo: ['package.json'] },
      {
        target: 'storybook-static',
        nextTo: ['package.json', '.storybook'],
        contains: ['index.html', 'iframe.html'],
      },
      { target: '.docusaurus', contains: ['DONT-EDIT-THIS-FOLDER'] },
      { target: 'coverage', contains: ['coverage-final.json'] },
      { target: 'coverage', contains: ['lcov.info'] },
      { target: 'coverage', contains: ['clover.xml'] },
    ],
  },
  python: {
    description: 'Python caches and virtual environments.',
    targets: [
      '__pycache__',
      { target: '.pytest_cache', contains: ['CACHEDIR.TAG'] },
      { target: '.mypy_cache', contains: ['CACHEDIR.TAG'] },
      { target: '.ruff_cache', contains: ['CACHEDIR.TAG'] },
      { target: '.tox', nextTo: ['tox.ini'] },
      { target: '.tox', nextTo: ['tox.toml'] },
      { target: '.tox', nextTo: ['pyproject.toml'] },
      { target: '.tox', nextTo: ['setup.cfg'] },
      { target: '.nox', nextTo: ['noxfile.py'] },
      { target: '.venv', contains: ['pyvenv.cfg'] },
      { target: 'venv', contains: ['pyvenv.cfg'] },
      { target: 'env', contains: ['pyvenv.cfg'] },
    ],
  },
  java: {
    description:
      'Maven and Gradle build outputs and project-local Gradle caches.',
    targets: [
      { target: 'target', nextTo: ['pom.xml'] },
      ...GRADLE_BUILD_OUTPUTS,
      { target: '.gradle', nextTo: ['settings.gradle'] },
      { target: '.gradle', nextTo: ['settings.gradle.kts'] },
      { target: '.gradle', nextTo: ['build.gradle'] },
      { target: '.gradle', nextTo: ['build.gradle.kts'] },
    ],
  },
  android: {
    description: 'Android build outputs and native build intermediates.',
    targets: [
      ...GRADLE_BUILD_OUTPUTS,
      { target: '.cxx', nextTo: ['build.gradle'] },
      { target: '.cxx', nextTo: ['build.gradle.kts'] },
    ],
  },
  dotnet: {
    description: 'NuGet-backed .NET build intermediates.',
    targets: [{ target: 'obj', contains: ['project.assets.json'] }],
  },
  rust: {
    description: 'Cargo build outputs in the workspace root.',
    targets: [{ target: 'target', nextTo: ['Cargo.toml'] }],
  },
  elixir: {
    description: 'Mix build outputs, dependencies and ElixirLS caches.',
    targets: [
      { target: '_build', nextTo: ['mix.exs'] },
      { target: 'deps', nextTo: ['mix.exs'] },
      '.elixir_ls',
    ],
  },
  haskell: {
    description: 'Cabal and Stack build artifacts.',
    targets: [{ target: 'dist-newstyle', contains: ['cache'] }, '.stack-work'],
  },
  scala: {
    description: 'sbt build outputs and Bloop and Metals caches.',
    targets: [
      { target: 'target', nextTo: ['build.sbt'] },
      { target: 'target', nextTo: ['build.properties'] },
      { target: '.bloop', nextTo: ['build.sbt'] },
      { target: '.metals', nextTo: ['build.sbt'] },
    ],
  },
  cpp: {
    description: 'CMake intermediates and CLion build directories.',
    targets: [
      { target: 'CMakeFiles', nextTo: ['CMakeCache.txt'] },
      { target: 'CMakeFiles', nextTo: ['cmake_install.cmake'] },
      { target: 'cmake-build-debug', contains: ['CMakeCache.txt'] },
      { target: 'cmake-build-release', contains: ['CMakeCache.txt'] },
    ],
  },
  unity: {
    description:
      'Unity asset cache. Close the editor first and expect a full reimport.',
    targets: [{ target: 'Library', nextTo: ['Assets', 'ProjectSettings'] }],
  },
  unreal: {
    description:
      'Unreal Engine intermediates and derived data cache. Close the editor first.',
    targets: [
      { target: 'Intermediate', nextTo: ['Config', 'Content'] },
      { target: 'DerivedDataCache', nextTo: ['Config', 'Content'] },
    ],
  },
  godot: {
    description:
      'Godot import caches and local editor state. Close the editor first.',
    targets: [
      { target: '.import', nextTo: ['project.godot'] },
      { target: '.godot', nextTo: ['project.godot'] },
    ],
  },
  clojure: {
    description: 'Clojure CLI classpath caches.',
    targets: [{ target: '.cpcache', nextTo: ['deps.edn'] }],
  },
  elm: {
    description: 'Elm build artifacts.',
    targets: [{ target: 'elm-stuff', nextTo: ['elm.json'] }],
  },
  php: {
    description: 'Composer dependencies.',
    targets: [
      {
        target: 'vendor',
        nextTo: ['composer.json'],
        contains: ['autoload.php'],
      },
    ],
  },
  dart: {
    description: 'Dart and Flutter tool caches and build outputs.',
    targets: [
      { target: '.dart_tool', nextTo: ['pubspec.yaml'] },
      { target: 'build', nextTo: ['pubspec.yaml'] },
    ],
  },
  swift: {
    description: 'Swift Package Manager build outputs.',
    targets: [{ target: '.build', nextTo: ['Package.swift'] }],
  },
  zig: {
    description: 'Zig caches and build outputs.',
    targets: [
      { target: '.zig-cache', nextTo: ['build.zig'] },
      { target: 'zig-cache', nextTo: ['build.zig'] },
      { target: 'zig-out', nextTo: ['build.zig'] },
    ],
  },
  terraform: {
    description:
      'Terraform providers and modules. Needs terraform init again and resets the selected workspace.',
    targets: [{ target: '.terraform', nextTo: ['.terraform.lock.hcl'] }],
  },
};

const ALL_TARGETS = [
  ...new Set(
    Object.values(BASE_PROFILES).flatMap((profile) => profile.targets),
  ),
];

export const DEFAULT_PROFILES: Readonly<Record<string, Profile>> =
  freezeProfiles({
    ...BASE_PROFILES,
    all: {
      targets: ALL_TARGETS,
      description:
        'All the profiles above together. Review results before deleting.',
    },
  });

function freezeProfiles(
  profiles: Record<string, Profile>,
): Readonly<Record<string, Profile>> {
  Object.values(profiles).forEach((profile) => {
    Object.freeze(profile.targets);
    Object.freeze(profile);
  });
  return Object.freeze(profiles);
}
