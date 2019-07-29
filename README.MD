<p align="center">
  <img src="./docs/npkill-text-clean.svg" width="320" alt="npkill logo" />
  <img src="./docs/npkill-scope-mono.svg" width="50" alt="npkill logo" />
</p>
<p align="center">
<img alt="npm" src="https://img.shields.io/npm/dy/npkill.svg">
<img alt="npm version" src="https://img.shields.io/npm/v/npkill.svg">
<img alt="npm bundle size" src="https://img.shields.io/bundlephobia/min/npkill.svg">
<img alt="NPM" src="https://img.shields.io/npm/l/npkill.svg">
</p>

### Easily find and **remove** old and heavy <font color="red">**node_modules**</font> folders :sparkles:

<p align="center">
  <img src="./docs/npkill-alpha-demo.gif" alt="npkill demo" />
</p>

This tool allows you to list any _node_modules_ directories in your system, as well as the space they take up. You can then select which ones you want to erase to free up space. Yay!

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
  - [Options](#options)
  - [Examples](#examples)
- [Roadmap](#roadmap)
- [Known-bugs](#known-bugs)
- [Contributing](#contributing)

# Installation

```bash
$ npm i -g npkill
```

_Unix users may need to run the command with sudo_

# Usage

```bash
npkill
```

By default, npkill will scan for node_modules starting at the path where `npkill` command is executed.

Move between the listed folders with <kbd>↓</kbd> <kbd>↑</kbd>, and use <kbd>Del</kbd> to delete the selected folder (<kbd>Supr</kbd> for spanish keyboards.)

To exit, <kbd>Ctrl</kbd> + <kbd>c</kbd>.

## Options

| ARGUMENT          | DESCRIPTION                                                                      |
| ----------------- | -------------------------------------------------------------------------------- |
| -h, --help, ?     | Show this help page and exit                                                     |
| -v, --version     | Show npkill version                                                              |
| -d, --directory   | Set the directory from which to begin searching. By default, starting-point is . |
| -f, --full        | Start searching from the home of the user (example: "/home/user" in linux)       |
| -D, --delete-all  | Automatically delete all node_modules folders that are found                     |
| -e, --show-errors | Show error messages if any                                                       |

**Warning:** _In future versions some commands may change_

## Examples

- Search **node_modules** directories in your _projects_ directory:

```bash
npkill -r ~/projects

# other alternative:
cd ~/projects
npkill
```

- Automatically delete all **node_modules** that have sneaked into your backups:

```bash
npkill -r ~/backups/ --delete-all
```

# Roadmap

- [x] Release 0.1.0 !
- [ ] Improve code
  - [ ] Improve performance
- [ ] Reduce dependencies to be a more minimalist module
- [ ] Allow the search for other types of directories (targets)
- [ ] Allow to filter by directories that have not been used in a period of time
- [ ] Periodic and automatic cleaning (?)

# Known-bugs

- Performance issues when searching from high level directories (like / in linux).
- Sometimes text collapses when updating the cli.
- (SOLVED) Analyzing the size of the directories takes longer than it should.
- (SOLVED) State "searching..." does not change even if search has been completed

# Contributing

Available soon

---
