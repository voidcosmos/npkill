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

| Profile   | Targets                                          | Found when                                                                             |
| --------- | ------------------------------------------------ | -------------------------------------------------------------------------------------- |
| `node`    | `node_modules`                                   | Always                                                                                 |
| `node`    | `.next`, `.nuxt`, `.svelte-kit`, `.parcel-cache` | Next to `package.json`                                                                 |
| `node`    | `.vite`                                          | Contains `deps`                                                                        |
| `node`    | `.turbo`                                         | Next to `turbo.json` or `turbo.jsonc`                                                  |
| `node`    | `storybook-static`                               | Next to `package.json` and `.storybook`, contains `index.html` and `iframe.html`       |
| `node`    | `.docusaurus`                                    | Next to `package.json` and `docusaurus.config.js`, `.ts` or `.mjs`                     |
| `python`  | `__pycache__`                                    | Always                                                                                 |
| `python`  | `.pytest_cache`, `.mypy_cache`, `.ruff_cache`    | Contains `CACHEDIR.TAG`                                                                |
| `python`  | `.tox`                                           | Next to `tox.ini` or `pyproject.toml`                                                  |
| `python`  | `.nox`                                           | Next to `noxfile.py`                                                                   |
| `python`  | `.venv`, `venv`                                  | Contains `pyvenv.cfg`                                                                  |
| `java`    | `target`                                         | Next to `pom.xml`                                                                      |
| `java`    | `.gradle`                                        | Next to `settings.gradle`, `settings.gradle.kts`, `build.gradle` or `build.gradle.kts` |
| `android` | `.cxx`                                           | Next to `build.gradle` or `build.gradle.kts`                                           |
| `dotnet`  | `obj`                                            | Contains `project.assets.json`                                                         |
| `rust`    | `target`                                         | Next to `Cargo.toml`                                                                   |
| `elixir`  | `_build`, `deps`                                 | Next to `mix.exs`                                                                      |
| `haskell` | `dist-newstyle`                                  | Next to `cabal.project`                                                                |
| `haskell` | `.stack-work`                                    | Next to `stack.yaml`                                                                   |
| `scala`   | `target`                                         | Next to `build.sbt`                                                                    |
| `cpp`     | `CMakeFiles`                                     | Next to `CMakeCache.txt`                                                               |
| `unity`   | `Library`                                        | Next to `Assets` and `ProjectSettings`. Unity reimports every asset afterwards         |
| `godot`   | `.import`, `.godot`                              | Next to `project.godot`. May include local editor state                                |
| `clojure` | `.cpcache`                                       | Next to `deps.edn`                                                                     |
| `elm`     | `elm-stuff`                                      | Next to `elm.json`                                                                     |

## Custom rules

Profiles in [`.npkillrc`](./npkillrc.md#profiles) take folder names and rules in the same list:

```json
"targets": [
  "zig-cache",
  { "target": "zig-out", "nextTo": ["build.zig"] },
  { "target": "zig-out", "nextTo": ["build.zig.zon"] }
]
```

- A name finds every folder called that way. `--targets` works the same.
- A rule needs `nextTo`, `contains` or both. Every entry listed must exist.
- Rules with the same target are alternatives. Any of them is enough.
- Entries are plain names compared exactly, case included. Paths and the characters `* ? [ ] { } / \` are rejected.
- Unknown properties are rejected.
