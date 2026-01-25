<p align="center">
  <img src="./docs/npkill-text-clean.svg" width="380" alt="npkill logo" />
</p>
<p align="center">
<img alt="npm" src="https://img.shields.io/npm/dy/npkill.svg">
<a href="#donations"><img src="https://img.shields.io/badge/donate-<3-red" alt="Donations Badge"/></a>
<img alt="npm version" src="https://img.shields.io/npm/v/npkill.svg">
<img alt="NPM" src="https://img.shields.io/npm/l/npkill.svg">
</p>

### Easily find and **remove** old and heavy <font color="red">**node_modules**</font> folders :sparkles:

<p align="center">
  <img src="/docs/npkill-demo-0.10.0.gif" alt="npkill demo GIF" />
</p>

This tool allows you to list any _node_modules_ directories in your system, as well as the space they take up. You can then select which ones you want to erase to free up space. Yay!

## i18n

We're making an effort to internationalize the Npkill docs. Here's a list of the available translations:

- [Español](./README.es.md)
- [Indonesian](./README.id.md)
- [Português](./README.pt.md)
- [Turkish](./README.tr.md)

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
  - [Multi-Select Mode](#multi-select-mode)
  - [Options](#options)
  - [Examples](#examples)
  - [JSON Output](#json-output)
- [Set Up Locally](#setup-locally)
- [API](#API)
- [Roadmap](#roadmap)
- [Known bugs](#known-bugs)
- [Contributing](#contributing)
- [Buy us a coffee](#donations)
- [License](#license)

<a name="features"></a>

# :heavy_check_mark: Features

- **Clear space:** Get rid of old and dusty _node_modules_ cluttering up your machine.

- **Last Workspace Usage**: Check when was the last time you modified a file in the workspace (indicated in the **last_mod** column).

- **Very fast:** NPKILL is written in TypeScript, but searches are performed at a low level, improving performance greatly.

- **Easy to use:** Say goodbye to lengthy commands. Using npkill is as simple as reading a list of your node_modules, and pressing Del to get rid of them. Could it be any easier? ;)

- **Minified:** It barely has any dependencies.

<a name="installation"></a>

# :cloud: Installation

You don't really need to install it to use it!
Simply use the following command:

```bash
$ npx npkill
```

Or if for some reason you really want to install it:

```bash
$ npm i -g npkill
# Unix users may need to run the command with sudo. Go carefully
```

> NPKILL does not support node<v14. If this affects you you can use `npkill@0.8.3`

<a name="usage"></a>

# :clipboard: Usage

```bash
$ npx npkill
# or just npkill if installed globally
```

By default, npkill will scan for node_modules starting at the path where `npkill` command is executed.

Move between the listed folders with <kbd>↓</kbd> <kbd>↑</kbd>, and use <kbd>Space</kbd> or <kbd>Del</kbd> to delete the selected folder.
You can also use <kbd>j</kbd> and <kbd>k</kbd> to move between the results.

You can open the directory where the selected result is placed by pressing <kbd>o</kbd>.

To exit, <kbd>Q</kbd> or <kbd>Ctrl</kbd> + <kbd>c</kbd> if you're brave.

**Important!** Some applications installed on the system need their node_modules directory to work and deleting them may break them. NPKILL will highlight them by displaying a :warning: to be careful.

## Multi-Select Mode

This mode allows you to select and delete multiple folders at once, making it more efficient when cleaning up many directories.

### Entering Multi-Select Mode

Press <kbd>T</kbd> to toggle multi-select mode. When active, you'll see a selection counter and additional instructions at the top of the results.

### Controls

- **<kbd>Space</kbd>**: Toggle selection of the current folder.
- **<kbd>V</kbd>**: Start/end range selection mode.
- **<kbd>A</kbd>**: Toggle select/unselect all folders.
- **<kbd>Enter</kbd>**: Delete all selected folders.
- **<kbd>T</kbd>**: Unselect all and back to normal mode.

### Range Selection

After pressing <kbd>V</kbd> to enter range selection mode:

- Move the cursor with arrow keys, <kbd>j</kbd>/<kbd>k</kbd>, <kbd>Home</kbd>/<kbd>End</kbd>, or page up/down
- All folders between the starting position and current cursor position will be selected/deselected
- Press <kbd>V</kbd> again to exit range selection mode

<a name="options"></a>

## Options

| ARGUMENT                | DESCRIPTION                                                                                                                                                                   |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| -p, --profiles          | Allows you to select the [profile](./docs/profiles.md) (set of targets) to use. If no option is specified, the available ones will be listed _(**node** by default)_.         |
| --config                | Path to a custom .npkillrc configuration file. By default, npkill looks first for `./.npkillrc` and then for `~/.npkillrc`.                                                   |
| -d, --directory         | Set the directory from which to begin searching. By default, starting-point is .                                                                                              |
| -D, --delete-all        | Automatically delete all folders that are found. Suggested to be used together with `-x`.                                                                                     |
| -e, --hide-errors       | Hide errors if any                                                                                                                                                            |
| -E, --exclude           | Exclude directories from search (directory list must be inside double quotes "", each directory separated by ',' ) Example: "ignore1, ignore2"                                |
| -f, --full              | Start searching from the home of the user (example: "/home/user" in linux)                                                                                                    |
| --size-unit             | Set the unit for displaying folder sizes. _(Available: **auto**, mb, gb)_. With auto, sizes < 1024MB are shown in MB (rounded), larger sizes in GB (with decimals).           |
| -h, --help, ?           | Show help page                                                                                                                                                                |
| -nu, --no-check-update  | Don't check for updates on startup                                                                                                                                            |
| -s, --sort              | Sort results by: `size`, `path` or `age`                                                                                                                                      |
| -t, --targets           | Disable profiles feature and specify the name of the directories you want to search for. You can define multiple targets separating with comma. Ej. `-t node_modules,.cache`. |
| -x, --exclude-sensitive | Exclude sensitive directories.                                                                                                                                                |
| -y                      | Avoid displaying a warning when executing --delete-all.                                                                                                                       |
| --dry-run               | It does not delete anything (will simulate it with a random delay).                                                                                                           |
| --json                  | Output results in JSON format at the end of the scan. Useful for automation and scripting.                                                                                    |
| --json-stream           | Output results in streaming JSON format (one JSON object per line as results are found). Useful for real-time processing.                                                     |
| -v, --version           | Show npkill version                                                                                                                                                           |

<a name="examples"></a>

## Examples

- Search **node_modules** directories in your _projects_ directory:

```bash
npkill -d ~/projects

# other alternative:
cd ~/projects
npkill
```

- List directories named "dist" and show errors if any occur:

```bash
npkill --target dist -e
```

- List **node_modules** in your _projects_ directory, excluding the ones in _progress_ and _ignore-this_ directories:

```bash
npkill -d 'projects' --exclude "progress, ignore-this"
```

- Automatically delete all node_modules that have sneaked into your backups:

```bash
npkill -d ~/backups/ --delete-all
```

- Get results in JSON format for automation or further processing:

```bash
npkill --json > results.json
```

- Stream results in real-time as JSON (useful for monitoring or piping to other tools):

```bash
npkill --json-stream | jq '.'
```

- Save only successful results to a file, ignoring errors:

```bash
npkill --json-stream 2>/dev/null | jq -s '.' > clean-results.json
```

<a name="json-output"></a>

## JSON Output

Npkill supports JSON output formats for automation and integration with other tools:

- **`--json`**: Output all results as a single JSON object at the end of the scan
- **`--json-stream`**: Output each result as a separate JSON object in real-time

For detailed documentation, examples, and TypeScript interfaces, see [JSON Output Documentation](./docs/json-output.md).

**Quick Examples:**

```bash
# Get all results as JSON
npkill --json > results.json

# Process results in real-time
npkill --json-stream | jq '.result.path'

# Find directories larger than 100MB
npkill --json | jq '.results[] | select(.size > 104857600)'
```

<a name="setup-locally"></a>

# :pager: Set Up Locally

```bash
# -- First, clone the repository
git clone https://github.com/voidcosmos/npkill.git

# -- Navigate to the dir
cd npkill

# -- Install dependencies
npm install

# -- And run!
npm run start


# -- If you want to run it with some parameter, you will have to add "--" as in the following example:
npm run start -- -f -e
```

<a name="API"></a>

# :bookmark_tabs: API

The api allows you to interact with npkill from node to create your own implementations in your scripts (automations, for example).

You can check the basic API [here](./API.md) or on the web (comming soon).

<a name="roadmap"></a>

# :crystal_ball: Roadmap

- [x] Release 0.1.0 !
- [x] Improve code
  - [x] Improve performance
  - [ ] Improve performance even more!
- [x] Sort results by size and path
- [x] Allow the search for other types of directories (targets)
- [ ] Reduce dependencies to be a more minimalist module
- [ ] Allow to filter by directories that have not been used in a period of time
- [ ] Create option for displaying directories in tree format
- [x] Add some menus
- [x] Add log service
- [ ] Periodic and automatic cleaning (?)

<a name="known-bugs"></a>

# :bug: Known bugs :bug:

- Sometimes, CLI is blocked while folder is deleting.
- Sorting, especially by routes, can slow down the terminal when there are many results at the same time.
- Sometimes, size calculations are higher than they should be.
- (SOLVED) Performance issues when searching from high level directories (like / in linux).
- (SOLVED) Sometimes text collapses when updating the cli.
- (SOLVED) Analyzing the size of the directories takes longer than it should.

> If you find any bugs, don't hesitate and open an issue :)

<a name="contributing"></a>

# :revolving_hearts: Contributing

If you want to contribute check the [CONTRIBUTING.md](.github/CONTRIBUTING.md)

<a name="donations"></a>

# :coffee: Buy us a coffee

<img align="right" width="300" src="https://npkill.js.org/img/cat-donation-cup.png">
We have developed npkill in our free time, because we are passionate about the programming sector.
Tomorrow we would like to dedicate ourselves to this, but first, we have a long way to go.

We will continue to do things anyway, but donations are one of the many ways to support what we do.

<span class="badge-opencollective"><a href="https://opencollective.com/npkill/contribute" title="Donate to this project using Open Collective"><img src="https://img.shields.io/badge/open%20collective-donate-green.svg" alt="Open Collective donate button" /></a></span>

### Thanks!!

## A huge thank you to our backers :heart:

<a href="https://opencollective.com/npkill#backers" target="_blank"><img width="535" src="https://opencollective.com/npkill/tiers/backer.svg?width=535"></a>

---

### Crypto alternative

- btc: 1ML2DihUoFTqhoQnrWy4WLxKbVYkUXpMAX
- bch: 1HVpaicQL5jWKkbChgPf6cvkH8nyktVnVk
- eth: 0x7668e86c8bdb52034606db5aa0d2d4d73a0d4259

<a name="license"></a>

# :scroll: License

MIT © [Nya García Gallardo](https://github.com/NyaGarcia) and [Juan Torres Gómez](https://github.com/zaldih)

:cat::baby_chick:

---
