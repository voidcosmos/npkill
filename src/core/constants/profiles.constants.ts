import { Profile } from '../interfaces/profile.interface.js';

export const DEFAULT_PROFILE = 'node';

export const BASE_PROFILES: { [profileName: string]: Profile } = {
  node: {
    description: 'Node.js dependencies and generated artifacts.',
    targets: [
      'node_modules',
      { target: '.next', nextTo: ['package.json'] },
      { target: '.nuxt', nextTo: ['package.json'] },
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
      {
        target: '.docusaurus',
        nextTo: ['package.json', 'docusaurus.config.js'],
      },
      {
        target: '.docusaurus',
        nextTo: ['package.json', 'docusaurus.config.ts'],
      },
      {
        target: '.docusaurus',
        nextTo: ['package.json', 'docusaurus.config.mjs'],
      },
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
      { target: '.tox', nextTo: ['pyproject.toml'] },
      { target: '.nox', nextTo: ['noxfile.py'] },
      { target: '.venv', contains: ['pyvenv.cfg'] },
      { target: 'venv', contains: ['pyvenv.cfg'] },
    ],
  },
  java: {
    description: 'Maven build outputs and project-local Gradle caches.',
    targets: [
      { target: 'target', nextTo: ['pom.xml'] },
      { target: '.gradle', nextTo: ['settings.gradle'] },
      { target: '.gradle', nextTo: ['settings.gradle.kts'] },
      { target: '.gradle', nextTo: ['build.gradle'] },
      { target: '.gradle', nextTo: ['build.gradle.kts'] },
    ],
  },
  android: {
    description: 'Android native build intermediates.',
    targets: [
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
    description: 'Mix build outputs and dependencies.',
    targets: [
      { target: '_build', nextTo: ['mix.exs'] },
      { target: 'deps', nextTo: ['mix.exs'] },
    ],
  },
  haskell: {
    description: 'Cabal and Stack build artifacts.',
    targets: [
      { target: 'dist-newstyle', nextTo: ['cabal.project'] },
      { target: '.stack-work', nextTo: ['stack.yaml'] },
    ],
  },
  scala: {
    description: 'sbt build outputs.',
    targets: [{ target: 'target', nextTo: ['build.sbt'] }],
  },
  cpp: {
    description: 'CMake intermediates, keeping CMakeCache.txt intact.',
    targets: [{ target: 'CMakeFiles', nextTo: ['CMakeCache.txt'] }],
  },
  unity: {
    description:
      'Unity asset cache. Close the editor first and expect a full reimport.',
    targets: [{ target: 'Library', nextTo: ['Assets', 'ProjectSettings'] }],
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
