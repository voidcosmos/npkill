<p align="center">
  <img src="./docs/npkill-text-clean.svg" width="380" alt="npkill logo" />
</p>
<p align="center">
<img alt="npm" src="https://img.shields.io/npm/dy/npkill.svg">
<a href="#donations"><img src="https://img.shields.io/badge/donate-<3-red" alt="Donations Badge"/></a>
<img alt="npm version" src="https://img.shields.io/npm/v/npkill.svg">
<img alt="NPM" src="https://img.shields.io/npm/l/npkill.svg">
</p>

### Easily find and **remove** old and heavy **node_modules**. And everything else you don’t need.

<p align="center">
  <img src="/docs/npkill-demo-0.10.0.gif" alt="npkill demo GIF" />
</p>

**Your system remembers everything. npkill helps you forget.**
This tool scans your system for heavy and unnecessary development directories.
It shows you what is taking up space, when you stopped using it, why it’s there, and lets you remove it in seconds.

## Table of Contents

- [Features](#features)
- [Usage](#usage)
  - [Multi-Select Mode](#multi-select-mode)
  - [Search](#search)
  - [Profiles](#profiles)
  - [.npkillrc](#npkillrc)
  - [Options](#options)
  - [Examples](#examples)
  - [JSON Output](#json-output)
- [Set Up Locally](#setup-locally)
- [API](#api)
- [Contributing](#contributing)
- [Buy us a coffee](#donations)
- [License](#license)

<a name="features"></a>

# ✨ Features

- **Beyond node_modules**  
  Started with `node_modules`, extended to entire development environments.
  Remove build artifacts, caches, temp files, and other heavy leftovers using built-in or custom profiles.

- **Profiles-first scanning**  
  Scan your system using predefined profiles for Node.js, Python, Rust, game engines, and more. Or create your own to match your workflow.

- **Effortless by default**  
  A clean and responsive TUI designed to stay out of your way.
  See everything clearly, make decisions fast, and clean with confidence.

- **Workspace awareness**  
  See at a glance when you last worked in that workspace and find out if it's an active project or a long-forgotten one.

- **Built for speed**  
  npkill is written in TypeScript, but searches are performed at a low level, delivering blazing-fast performance and near-instant responsiveness.

<a name="usage"></a>

# :clipboard: Usage

Simply use the following command:

```bash
$ npx npkill
```

By default, npkill will start searching for node-related development directories from the directory where you ran it, using the built-in **node** profile.

As the target directories are found, they will be listed for you.

> [!NOTE]
> **TL;DR:** You can learn everything as you go because the TUI explains itself.

You can navigate between them with <kbd>↓</kbd> <kbd>↑</kbd>, and use <kbd>Space</kbd> or <kbd>Del</kbd> to delete the selected folder.

You can view more information about the result by pressing <kbd>→</kbd> and go back by pressing <kbd>←</kbd>.

If necessary, you can open the parent directory with <kbd>o</kbd>.

You can see more navigation keys in the built-in **quick reference panel**.

> [!WARNING]
> Some applications installed on the system need their node_modules directory to work and deleting them may break them. npkill will try to identify them and highlight them by displaying a :warning: to be careful.

> [!IMPORTANT]
> npkill **find** candidates for deletion but does not decide what is safe for you.
>
> - Results are based on common conventions.
> - Whether a folder is safe to delete always depends on the scope.
>
> Always review results before deleting anything.

<a name="multi-select-mode"></a>

## :ballot_box_with_check: Multi-Select mode

This mode allows you to select and delete multiple folders at once, making it more efficient when cleaning up many directories.

### Entering Multi-Select mode

Press **<kbd>t</kbd>** to toggle multi-select mode. When active, you'll see a selection counter and additional instructions at the top of the results.

### Controls

- **<kbd>Space</kbd>**: Toggle selection of the current folder.
- **<kbd>v</kbd>**: Start/end range selection mode.
- **<kbd>a</kbd>**: Toggle select/unselect all folders.
- **<kbd>Enter</kbd>**: Delete all selected folders at once.
- **<kbd>t</kbd>**: Unselect all and back to normal mode.

### Range Selection

After pressing **<kbd>v</kbd>** to enter range selection mode:

- Move the cursor with arrow keys, **<kbd>j</kbd>**/**<kbd>k</kbd>**, **<kbd>Home</kbd>**/**<kbd>End</kbd>**, or **<kbd>PgUp</kbd>**/**<kbd>PgDn</kbd>**.
- All folders between the starting position and current cursor position will be selected/deselected
- Press **<kbd>Enter</kbd>** to delete all selected folders together.
- Press **<kbd>v</kbd>** again to exit range selection mode.

<a name="search"></a>

## :mag: Search

> _Divide and conquer._

You can filter the results displayed by pressing **<kbd>/</kbd>**. What you type will then appear in the yellow bar at the top.

Press **<kbd>Enter</kbd>** to browse through the filtered results.

To clear the filter, press **<kbd>/</kbd>** again and delete the term.

This feature can be especially useful for narrowing down results by path without restarting `npkill`.

> [!NOTE]
> The search supports regular expressions.

<a name="profiles"></a>

## :card_index: Profiles

**Profiles** are a set of _targets_ that represent a **development ecosystem**.

You can list the available profiles with `npkill --profiles` and use them as follows: `npkill --profiles node,python`.

Profiles and their targets may change between versions of npkill. So if this is important to you, I recommend creating your own with `.npkillrc`.

<a name="npkillrc"></a>

## :gear: .npkillrc

The `.npkillrc` file allows you to define the default behavior of npkill without having to pass parameters every time. It is also where you can define your own custom profiles.

You can read all the details in the [`.npkillrc documentation`](./docs/npkillrc.md).

<a name="options"></a>

## :wrench: Options

| ARGUMENT                | DESCRIPTION                                                                                                                                                                                                  |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| -p, --profiles          | Allows you to select the [profile](./docs/profiles.md) (set of targets) to use. If no option is specified, the available ones will be listed _(**node** by default)_.                                        |
| --config                | Path to a custom .npkillrc configuration file. By default, npkill looks first for `./.npkillrc` and then for `~/.npkillrc`.                                                                                  |
| -d, --directory         | Set the directory from which to begin searching. By default, starting-point is .                                                                                                                             |
| -D, --delete-all        | Automatically delete all folders that are found. Suggested to be used together with `-x`.                                                                                                                    |
| -e, --hide-errors       | Hide errors if any                                                                                                                                                                                           |
| -E, --exclude           | Exclude directories from search. Each directory separated by ','. By default, [some directories](https://github.com/voidcosmos/npkill/blob/main/src/core/constants/global-ignored.constants.ts) are ignored. |
| -f, --full              | Start searching from the home of the user (example: "/home/user" in linux)                                                                                                                                   |
| --size-unit             | Set the unit for displaying folder sizes. _(Available: **auto**, mb, gb)_. With auto, sizes < 1024MB are shown in MB (rounded), larger sizes in GB (with decimals).                                          |
| -h, --help, ?           | Show help page                                                                                                                                                                                               |
| -nu, --no-check-update  | Don't check for updates on startup                                                                                                                                                                           |
| -s, --sort              | Sort results by: `size`, `path` or `age`                                                                                                                                                                     |
| -t, --targets           | Disable profiles feature and specify the name of the directories you want to search for. You can define multiple targets separating with comma. Ej. `-t node_modules,.cache`.                                |
| -x, --exclude-sensitive | Exclude sensitive directories.                                                                                                                                                                               |
| -y                      | Avoid displaying a warning when executing --delete-all.                                                                                                                                                      |
| --dry-run               | It does not delete anything (will simulate it with a random delay).                                                                                                                                          |
| --json                  | Output results in JSON format at the end of the scan. Useful for automation and scripting.                                                                                                                   |
| --json-stream           | Output results in streaming JSON format (one JSON object per line as results are found). Useful for real-time processing.                                                                                    |
| -v, --version           | Show npkill version                                                                                                                                                                                          |

<a name="examples"></a>

## :bulb: Examples

- Search in your _projects_ directory:

```bash
npkill -d ~/projects

# other alternative:
cd ~/projects
npkill
```

- Clean Node.js and Python development leftovers (`node_modules`, `__pycache__`, `.cache`, `.venv`, etc.):

```bash
npkill --profiles node,python
```

- I only want clean `node_modules` like in the old times:

```bash
npkill -t node_modules
```

- List **node_modules** in your _projects_ directory, excluding the ones in _progress_ and _ignore-this_ directories:

```bash
npkill -d 'projects' --exclude "progress, ignore-this"
```

- Automatically delete all node-related leftovers that have sneaked into your backups:

```bash
npkill -d ~/backups/ --delete-all
```

<a name="json-output"></a>

## :floppy_disk: JSON Output

npkill supports JSON output formats for automation and integration with other tools:

- **`--json`**: Output all results as a single JSON object at the end of the scan
- **`--json-stream`**: Output each result as a separate JSON object in real-time

For detailed documentation, examples, and TypeScript interfaces, see [JSON Output Documentation](./docs/json-output.md).

### Quick Examples

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
npm ci

# -- And run!
npm run start


# -- If you want to run it with some parameter, you will have to add "--" as in the following example:
npm run start -- -f -e
```

<a name="api"></a>

# :bookmark_tabs: API

The api allows you to interact with npkill from node to create your own implementations in your scripts (automations, for example).

You can check the basic API [here](./API.md) or on the web.

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

---

## Crypto alternative

- btc: 1ML2DihUoFTqhoQnrWy4WLxKbVYkUXpMAX
- bch: 1HVpaicQL5jWKkbChgPf6cvkH8nyktVnVk
- eth: 0x7668e86c8bdb52034606db5aa0d2d4d73a0d4259

<a name="license"></a>

# :scroll: License

MIT © [Nya García Gallardo](https://github.com/NyaGarcia) and [Juan Torres Gómez](https://github.com/zaldih)

:cat::baby_chick:

---
