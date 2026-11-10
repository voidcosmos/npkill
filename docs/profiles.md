# Profiles

A profile groups the folders npkill looks for in one ecosystem. Some folders are found by name alone. Others only count when the files that identify their project are around them. For example, `target` is only shown next to a `Cargo.toml`, `pom.xml` or `build.sbt`.

Review the results before deleting them, and close any tool that may still be writing to them.

```bash
npkill --profiles node,python
npkill --profiles
```

The second command lists every profile. `node` is the default. `all` combines every built-in profile, including your overrides of them.

## Built-in targets

A sibling is an entry next to the folder. Contents are entries inside it.

| Profile     | Targets                                          | Found when                                                                             |
| ----------- | ------------------------------------------------ | -------------------------------------------------------------------------------------- |
| `node`      | `node_modules`, `.angular`                       | Always                                                                                 |
| `node`      | `.next`, `.nuxt`, `.svelte-kit`, `.parcel-cache` | Next to `package.json`                                                                 |
| `node`      | `.nx`                                            | Next to `nx.json`                                                                      |
| `node`      | `.output`                                        | Contains `nitro.json`                                                                  |
| `node`      | `.vite`                                          | Contains `deps`                                                                        |
| `node`      | `.turbo`                                         | Next to `turbo.json` or `turbo.jsonc`                                                  |
| `node`      | `storybook-static`                               | Next to `package.json` and `.storybook`, contains `index.html` and `iframe.html`       |
| `node`      | `.docusaurus`                                    | Contains `DONT-EDIT-THIS-FOLDER`                                                       |
| `node`      | `coverage`                                       | Contains `coverage-final.json`, `lcov.info` or `clover.xml`                            |
| `python`    | `__pycache__`                                    | Always                                                                                 |
| `python`    | `.pytest_cache`, `.mypy_cache`, `.ruff_cache`    | Contains `CACHEDIR.TAG`                                                                |
| `python`    | `.tox`                                           | Next to `tox.ini`, `tox.toml`, `pyproject.toml` or `setup.cfg`                         |
| `python`    | `.nox`                                           | Next to `noxfile.py`                                                                   |
| `python`    | `.venv`, `venv`, `env`                           | Contains `pyvenv.cfg`                                                                  |
| `java`      | `target`                                         | Next to `pom.xml`                                                                      |
| `java`      | `build`                                          | Next to `build.gradle` or `build.gradle.kts`                                           |
| `java`      | `.gradle`                                        | Next to `settings.gradle`, `settings.gradle.kts`, `build.gradle` or `build.gradle.kts` |
| `android`   | `build`, `.cxx`                                  | Next to `build.gradle` or `build.gradle.kts`                                           |
| `dotnet`    | `obj`                                            | Contains `project.assets.json`                                                         |
| `rust`      | `target`                                         | Next to `Cargo.toml`                                                                   |
| `elixir`    | `_build`, `deps`                                 | Next to `mix.exs`                                                                      |
| `elixir`    | `.elixir_ls`                                     | Always                                                                                 |
| `haskell`   | `dist-newstyle`                                  | Contains `cache`                                                                       |
| `haskell`   | `.stack-work`                                    | Always                                                                                 |
| `scala`     | `target`                                         | Next to `build.sbt` or `build.properties`                                              |
| `scala`     | `.bloop`, `.metals`                              | Next to `build.sbt`                                                                    |
| `cpp`       | `CMakeFiles`                                     | Next to `CMakeCache.txt` or `cmake_install.cmake`                                      |
| `cpp`       | `cmake-build-debug`, `cmake-build-release`       | Contains `CMakeCache.txt`                                                              |
| `unity`     | `Library`                                        | Next to `Assets` and `ProjectSettings`. Unity reimports every asset afterwards         |
| `unreal`    | `Intermediate`, `DerivedDataCache`               | Next to `Config` and `Content`                                                         |
| `godot`     | `.import`, `.godot`                              | Next to `project.godot`. Includes local editor state and export credentials            |
| `clojure`   | `.cpcache`                                       | Next to `deps.edn`                                                                     |
| `elm`       | `elm-stuff`                                      | Next to `elm.json`                                                                     |
| `php`       | `vendor`                                         | Next to `composer.json`, contains `autoload.php`                                       |
| `dart`      | `.dart_tool`, `build`                            | Next to `pubspec.yaml`                                                                 |
| `swift`     | `.build`                                         | Next to `Package.swift`                                                                |
| `zig`       | `.zig-cache`, `zig-cache`, `zig-out`             | Next to `build.zig`                                                                    |
| `terraform` | `.terraform`                                     | Next to `.terraform.lock.hcl`. The selected workspace goes back to `default`           |

## Custom rules

Profiles in [`.npkillrc`](./npkillrc.md#profiles) take folder names and rules in the same list:

```json
"targets": [
  "_opam",
  { "target": "_build", "nextTo": ["dune-project"] },
  { "target": "_build", "nextTo": ["dune-workspace"] }
]
```

- A name finds every folder called that way. `--targets` works the same.
- A rule needs `nextTo`, `contains` or both. Every entry listed must exist.
- Rules with the same target are alternatives. Any of them is enough.
- Entries are plain names compared exactly, case included. Paths and the characters `* ? [ ] { } / \` are rejected.
- Unknown properties are rejected.
