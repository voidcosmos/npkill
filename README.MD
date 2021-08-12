<p align="center">
  <img src="https://npkill.js.org/img/npkill-text-clean.svg" width="320" alt="npkill logo" />
  <img src="https://npkill.js.org/img/npkill-scope-mono.svg" width="50" alt="npkill logo scope" />
</p>
<p align="center">
<img alt="npm" src="https://img.shields.io/npm/dy/npkill.svg">
<a href="https://www.codacy.com/gh/voidcosmos/npkill/dashboard?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=voidcosmos/npkill&amp;utm_campaign=Badge_Grade"><img src="https://app.codacy.com/project/badge/Grade/cbd0bc6159674e44a3742ac9c28e15dd"/></a>
<a href="#donations"><img src="https://img.shields.io/badge/donate-<3-red" alt="Donations Badge"/></a>
<img alt="npm version" src="https://img.shields.io/npm/v/npkill.svg">
<img alt="NPM" src="https://img.shields.io/npm/l/npkill.svg">
</p>

### Easily find and **remove** old and heavy <font color="red">**node_modules**</font> folders :sparkles:

<p align="center">
  <img src="https://npkill.js.org/img/npkill-demo-0.3.0.gif" alt="npkill demo gif" />
</p>

This tool allows you to list any _node_modules_ directories in your system, as well as the space they take up. You can then select which ones you want to erase to free up space. Yay!

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
  - [Options](#options)
  - [Examples](#examples)
- [Set Up Locally](#setup-locally)
- [Roadmap](#roadmap)
- [Known bugs](#known-bugs)
- [Contributing](#contributing)
- [Buy us a coffee](#donations)
- [License](#license)

<a name="features"></a>

# :heavy_check_mark: Features

- **Clear space:** Get rid of old and dusty node_modules cluttering up your machine.

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

<a name="usage"></a>

# :clipboard: Usage

```bash
$ npx npkill
# or just npkill if installed globally
```

By default, npkill will scan for node_modules starting at the path where `npkill` command is executed.

Move between the listed folders with <kbd>↓</kbd> <kbd>↑</kbd>, and use <kbd>Space</kbd> to delete the selected folder.
You can also use <kbd>j</kbd> and <kbd>k</kbd> to move between the results

To exit, <kbd>Q</kbd> or <kbd>Ctrl</kbd> + <kbd>c</kbd> if you're brave.

**Important!** Some applications installed on the system need their node_modules directory to work and deleting them may break them. NPKILL will highlight them by displaying a :warning: to be careful.

<a name="options"></a>

## Options

| ARGUMENT               | DESCRIPTION                                                                                                                                    |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| -c, --bg-color         | Change row highlight color. _(Available: **blue**, cyan, magenta, white, red and yellow)_                                                      |
| -d, --directory        | Set the directory from which to begin searching. By default, starting-point is .                                                               |
| -D, --delete-all       | CURRENTLY DISABLED. Automatically delete all node_modules folders that are found                                                               |
| -e, --show-errors      | Show error messages related to the search if any                                                                                               |
| -E, --exclude          | Exclude directories from search (directory list must be inside double quotes "", each directory separated by ',' ) Example: "ignore1, ignore2" |
| -f, --full             | Start searching from the home of the user (example: "/home/user" in linux)                                                                     |
| -gb                    | Show folders in Gigabytes instead of Megabytes.                                                                                                |
| -h, --help, ?          | Show this help page and exit                                                                                                                   |
| -nu, --no-check-update | Don't check for updates on startup                                                                                                             |
| -s, --sort             | Sort results by: size or path _[ beta ]_                                                                                                       |
| -t, --target           | Specify the name of the directories you want to search (by default, is node_modules)                                                           |
| -v, --version          | Show npkill version                                                                                                                            |

**Warning:** _In future versions some commands may change_

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

- Displays the magenta color cursor... because I like magenta!

```bash
npkill --color magenta
```

- List **vendor** directories in your _projects_ directory, sort by size, and show size in gb:

```bash
npkill -d '~/more projects' -gb --sort size --target vendor
```

- List **node_modules** in your _projects_ directory, excluding the ones in _progress_ and _ignore-this_ directories:

```bash
npkill -d 'projects' --exclude "progress, ignore-this"
```

- Automatically delete all node_modules that have sneaked into your backups:

```bash
# Disabled for security reasons (you can use it in version 0.2.4 at your risk)
npkill -d ~/backups/ --delete-all
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
- [ ] Add some menus
- [ ] Add log service
- [ ] Periodic and automatic cleaning (?)

<a name="known-bugs"></a>

# :bug: Known bugs :bug:

- Sometimes, CLI is blocked while folder is deleting.
- Some terminals that do not use TTY (like git bash in windows) do not work.
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
