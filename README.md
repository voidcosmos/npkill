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

## Search Mode

Search mode allows you to filter results. This can be particularly useful for limiting the view to a specific route or ensuring that only those results that meet the specified condition are “selected all.”

For example, you can use this expression to limit the results to those that are in the `work` directory and that include `data` somewhere in the path: `/work/.*/data`.

Press <kbd>/</kbd> to enter search mode. You can type a regex pattern to filter results.

Press <kbd>Enter</kbd> to confirm the search and navigate the filtered results, or <kbd>Esc</kbd> to clear and exit.

To exit from this mode, leave empty.

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


## 🌐 Web Resources & Verified Articles Directory
- [MAHJONG CONNECT MAJONG CLASS](https://mundodosjogos-br.web.app/mahjong-connect-majong-class.html)
- [FUTURE WAR BOT BATTLE IN SPACE 3D](https://jogosweb-brasil.github.io/future-war-bot-battle-in-space-3d.html)
- [CANDY CHAIN MASTER](https://maniadejogos-brasil.pages.dev/candy-chain-master.html)
- [OFFLINE FPS ROYALE](https://gameflash-viet.github.io/offline-fps-royale.html)
- [OBBY GYM SIMULATOR ESCAPE](https://PixelArcadezGame.github.io/obby-gym-simulator-escape.html)
- [CITYMIX SOLITAIRE](https://koreagame-zone.vercel.app/citymix-solitaire.html)
- [SHOOT THE BOTTLE](https://mir-igr-onlayn.pages.dev/shoot-the-bottle.html)
- [KIKI WORLD KAWAII DOLL DECOR](https://turbodrift-zone.web.app/kiki-world-kawaii-doll-decor.html)
- [HAMSTERCYCLE](https://neon-cyber-arcade.pages.dev/hamstercycle.html)
- [CONDUCT THIS](https://webarcade-gamehub.github.io/conduct-this.html)
- [2048SKILL EDITION](https://hindigames-hub.netlify.app/2048skill-edition.html)
- [BURGER EMPIRE](https://kuaile-youxi-hub.web.app/burger-empire.html)
- [DRAW TO HOME 3D](https://jogosweb-brasil.github.io/draw-to-home-3d.html)
- [BUBBLE SHOOTER TEMPLE JEWELS](https://nihon-webgames.netlify.app/bubble-shooter-temple-jewels.html)
- [3D CHESS MASTER](https://speed-racing-hub.netlify.app/3d-chess-master.html)
- [SUSTAINABLE](https://nihongames-portal.netlify.app/sustainable.html)
- [HOUSE ROBBER](https://youxiweb-hub.netlify.app/house-robber.html)
- [SUNNY LINK](https://arcadegames-france24.web.app/sunny-link.html)
- [FIRE SNAKE](https://youxi-h5-tiandi.pages.dev/fire-snake.html)
- [MASTER ADDICTION SOLITAIRE](https://zona-juegos-flash.web.app/master-addiction-solitaire.html)
- [TRI PEAKS EMERLAND SOLITAIRE](https://jogosonline-brasil.vercel.app/tri-peaks-emerland-solitaire.html)
- [TOILET PIN](https://koreagame-hub24.netlify.app/toilet-pin.html)
- [MY FIRE STATION WORLD](https://peullaesi-geim-madang.web.app/my-fire-station-world.html)
- [CUTE CATS ADVENTURES](https://koreagame-zone.vercel.app/cute-cats-adventures.html)
- [AIRPORT SECURITY](https://planetejeux-france.pages.dev/airport-security.html)
- [HEROBALL ADVENTURES 2](https://veb-igry-moskva.web.app/heroball-adventures-2.html)
- [PRINCESS ROYAL WEDDING](https://koreagame-webhub.github.io/princess-royal-wedding.html)
- [STRAWBERRY SHORTCAKE BOARDGAMES](https://jeuxflash-france.netlify.app/strawberry-shortcake-boardgames.html)
- [AUTHENTIC FOOTBALL](https://seoul-game-hub.pages.dev/authentic-football.html)
- [FALLING BLOCKS HALLOWEEN CHALLENGE](https://gameflash-viet.github.io/falling-blocks-halloween-challenge.html)
- [GRANNYS CLASSROOM NIGHTMARE](https://onlinerus-portal.netlify.app/grannys-classroom-nightmare.html)
- [BALL DROP](https://choigame24h-vietnam.netlify.app/ball-drop.html)
- [GROSS OUT RUN](https://gamehay-online.netlify.app/gross-out-run.html)
- [NESTING DOLLS](https://veb-igry-moskva.web.app/nesting-dolls.html)
- [DICE MERGE](https://jeuxweb-france.netlify.app/dice-merge.html)
- [V AND N PIZZA COOKING GAME](https://gemu-hiroba-japan.web.app/v-and-n-pizza-cooking-game.html)
- [LEVEL UP MUTANTS](https://hindigames-hub.netlify.app/level-up-mutants.html)
- [BACKWOODS](https://logic-puzzle-world.pages.dev/backwoods.html)
- [EASTER SHADOW MATCH](https://jogosonline-brasil.vercel.app/easter-shadow-match.html)
- [EASY OBBY JUMP AND RUN CHALLENGE ONLINE](https://retro-arcade-zone.netlify.app/easy-obby-jump-and-run-challenge-online.html)
- [GLOSSY BUBBLES CHALLENGE](https://hindigames-hub.netlify.app/glossy-bubbles-challenge.html)
- [DIAMOND SOLITAIRE MAHJONG](https://luchshie-igry-rus.pages.dev/diamond-solitaire-mahjong.html)
- [MY ARCADE CENTER](https://maniadejogos-brasil.pages.dev/my-arcade-center.html)
- [SNIPER FREEZE](https://youxi-china24.netlify.app/sniper-freeze.html)
- [HERO TRANSFORM RACE](https://speed-racing-arcade.pages.dev/hero-transform-race.html)
- [FOXY ECO SORT](https://brainiac-puzzles.web.app/foxy-eco-sort.html)
- [IDLE ARCHER TOWER DEFENSE RPG](https://juegosmundial-hoy.pages.dev/idle-archer-tower-defense-rpg.html)
- [SOLVE THE CUBE WOODEN BLOCKS 2D](https://kuaile-youxi-hub.web.app/solve-the-cube-wooden-blocks-2d.html)
- [TSUNAMI BRAINROTS ONLINE](https://pixelarcadezgame.web.app/tsunami-brainrots-online.html)
- [CARS DERBY ARENA](https://PixelArcadezGame.github.io/cars-derby-arena.html)
- [GRAND CLASH ARENA](https://sieuthigame-viet.pages.dev/grand-clash-arena.html)
- [RANCH ADVENTURES](https://bharat-game-zone.web.app/ranch-adventures.html)
- [MUSTANG CITY DRIVER](https://gameflash-viet.github.io/mustang-city-driver.html)
- [NUBIK CREATE YOUR PLACE](https://espacejeux-paris.pages.dev/nubik-create-your-place.html)
- [HEAT INCREMENTAL](https://gamehay-online.netlify.app/heat-incremental.html)
- [BLOCK EATING SIMULATOR](https://koreagame-arcade.netlify.app/block-eating-simulator.html)
- [MOSQUITO BITE 3D](https://francejeux-online.web.app/mosquito-bite-3d.html)
- [SNAKELANDSIO](https://arcadevault-games.github.io/snakelandsio.html)
- [GRANNY HALLOWEEN HOUSE](https://arcadevault-gamehub.github.io/granny-halloween-house.html)
- [CHRISTMAS CANDY ESCAPE 3D](https://hindigame-arena.vercel.app/christmas-candy-escape-3d.html)
- [HARD PUZZLE](https://trochoimienphi24h.github.io/hard-puzzle.html)
- [RED LIGHT GREEN LIGHT](https://neon-cyber-arcade.pages.dev/red-light-green-light.html)
- [TSUNAMI RACE](https://gamehay-online.netlify.app/tsunami-race.html)
- [MAHJONG CONNECT GOLD](https://peullaesi-geim-madang.web.app/mahjong-connect-gold.html)
- [TINY BAKER OCEAN JELLY CAKE](https://bharat-game-zone.web.app/tiny-baker-ocean-jelly-cake.html)
- [IDLE GAME PRISON LIFE](https://unblocked-action-arena.netlify.app/idle-game-prison-life.html)
- [WOOD COLOR BLOCK](https://arcadevault-gamehub.github.io/wood-color-block.html)
- [ZINDEX](https://unblocked-action-arena.netlify.app/zindex.html)
- [WINDOWS XP ERROR](https://sounds-galaxy.vercel.app/sound/windows-xp-error.html)
- [PIRATE PARADISE](https://koreagame-arcade.netlify.app/pirate-paradise.html)
- [WIRED CHICKEN INC](https://neon-cyber-arcade.pages.dev/wired-chicken-inc.html)
- [MARBLE PUZZLE QUEST](https://youxi-h5-tiandi.pages.dev/marble-puzzle-quest.html)
- [CUTE FOLDING PAPER](https://kuaile-youxi-hub.web.app/cute-folding-paper.html)
- [MERGE IN SPACE](https://gemu-hiroba-japan.web.app/merge-in-space.html)
- [WOODOKU BLOCK PUZZLE](https://pixelarcadezgame.web.app/woodoku-block-puzzle.html)
- [DIY MAKEUP SALON SPA MAKEOVER STUDIO](https://webarcade-gamehub.github.io/diy-makeup-salon-spa-makeover-studio.html)
- [MOUNTAIN BUS DRIVER](https://jeuxflash-france.netlify.app/mountain-bus-driver.html)
- [ULTIMATE PLANTS TD](https://webarcade-gamehub.github.io/ultimate-plants-td.html)
- [DOODLE DINO RUN](https://geim-cheon-guk24.pages.dev/doodle-dino-run.html)
- [RESCUE SHARP TURN](https://brainiac-puzzles.web.app/rescue-sharp-turn.html)
- [MOJICON GARDEN JIGSOLITAIRE](https://youxiweb-hub.netlify.app/mojicon-garden-jigsolitaire.html)
- [NUWPYS ADVENTURE](https://arcadevault-gamehub.github.io/nuwpys-adventure.html)
- [MARSHMALLOW RUSH](https://maniadejogos-brasil.pages.dev/marshmallow-rush.html)
- [SNAKE HUNTER](https://hyper-gamers-den.web.app/snake-hunter.html)
- [FLY FLY FLY](https://unblocked-galaxy.github.io/fly-fly-fly.html)
- [BRAINROT WORLD HOLEIO](https://PixelArcadezGame.github.io/brainrot-world-holeio.html)
- [LITTLE BUGS](https://youxiweb-china.github.io/little-bugs.html)
- [MERRY CHRISTMAS STICKMAN](https://seoul-game-hub.pages.dev/merry-christmas-stickman.html)
- [CRIME THEFT GANGSTER PARADISE](https://jeuxflash-france.netlify.app/crime-theft-gangster-paradise.html)
- [COSMO VOID](https://nihongames-portal.netlify.app/cosmo-void.html)
- [LIGHT LINE](https://jogosonline-brasil.vercel.app/light-line.html)
- [FOOD MERGE](https://shadow-ninja-arena.web.app/food-merge.html)
- [HEDGIES](https://koreagame-zone.vercel.app/hedgies.html)
- [FIND HIDDEN SECRETS](https://jogosweb-brasil24.netlify.app/find-hidden-secrets.html)
- [CROWN CANNON](https://youxi-h5-tiandi.pages.dev/crown-cannon.html)
- [TOY ASSEMBLY 3D](https://choigamehay24h.github.io/toy-assembly-3d.html)
- [MONSTER DASH](https://PixelArcadez.github.io/monster-dash.html)
- [GLAM GURU PUZZLE COLLECTION](https://webarcade-hub.github.io/glam-guru-puzzle-collection.html)
- [POPTROPICA](https://mundodosjogos-br.web.app/poptropica.html)
- [ROYAL FAMILY TREE](https://vuagamemienphi24h.pages.dev/royal-family-tree.html)
- [ENERGY SUPERMAN 3D](https://congdonggame-vietnam.web.app/energy-superman-3d.html)
- [SHEEP SHEEP DUCK](https://youxi-h5-tiandi.pages.dev/sheep-sheep-duck.html)
- [GTA CAR RUSH](https://mundodosjogos-br.web.app/gta-car-rush.html)
- [STUNT FURY](https://youxi-h5-tiandi.pages.dev/stunt-fury.html)
- [BODY CARE SIMULATOR](https://arcadevault-games.github.io/body-care-simulator.html)
- [BRAINROT MERGE](https://unblocked-action-arena.netlify.app/brainrot-merge.html)
- [FLIP IT 3D](https://espacejeux-paris.pages.dev/flip-it-3d.html)
- [POPSORTICA](https://youxiweb-china.github.io/popsortica.html)
- [VIBRANT HEARTS GLAMOUR VS PUNK](https://unblocked-galaxy.web.app/vibrant-hearts-glamour-vs-punk.html)
- [MAHJONG ZEN GARDEN](https://koreagame-zone.vercel.app/mahjong-zen-garden.html)
- [K POP HUNTERS VALENTINE STYLE](https://jogosweb-brasil24.netlify.app/k-pop-hunters-valentine-style.html)
- [BRAINROT EVOLUTION GAME](https://muryo-geim-nara.web.app/brainrot-evolution-game.html)
- [HAPPY TOWN](https://kuaile-youxi-hub.web.app/happy-town.html)
- [SCARY TEACHER 3D RETURNS](https://onlinerus-games.netlify.app/scary-teacher-3d-returns.html)
- [MATRIX TYPER](https://bharat-game-zone.web.app/matrix-typer.html)
- [TRANSFORM CAR BATTLE](https://jeuxflash-france.netlify.app/transform-car-battle.html)
- [LEOPARD](https://bf-demand-check.pages.dev/values/leopard)
- [INDIAN SUV OFFROAD SIMULATOR](https://unblocked-galaxy.github.io/indian-suv-offroad-simulator.html)
- [RACING IN CITY](https://shanghai-youxi-web.web.app/racing-in-city.html)
- [PIM PATH](https://jingpin-youxiwang.pages.dev/pim-path.html)
- [FILL THE BOTTLE](https://action-battle-hub.pages.dev/fill-the-bottle.html)
- [SAVE THE SHEEP](https://portaldejogos-br.github.io/save-the-sheep.html)
- [UNPUZZLE MASTER](https://action-strike-zone.pages.dev/unpuzzle-master.html)
- [FAMILY SQUID CHALLENGE](https://portaldejogos-br.github.io/family-squid-challenge.html)
- [FREE HOOPS](https://nihon-webgames.netlify.app/free-hoops.html)
- [BACK 2 SCHOOL MAKEOVER](https://turbodrift-zone.web.app/back-2-school-makeover.html)
- [SCROLL AND SPOT](https://bharat-game-zone.web.app/scroll-and-spot.html)
- [CANDY JEWELS](https://arcadegames-france24.web.app/candy-jewels.html)
- [KNIFE MASTER BALL RACING](https://webarcade-hub.github.io/knife-master-ball-racing.html)
- [ARCHER GO](https://gemu-hiroba-japan.web.app/archer-go.html)
- [YUMMY TALES 3](https://neon-cyber-arcade.pages.dev/yummy-tales-3.html)
- [IDLE ANIMAL ANATOMY](https://action-strike-zone.pages.dev/idle-animal-anatomy.html)
- [CLIMB UP](https://pixelarcade-speed.web.app/climb-up.html)
- [CLASSIC MAHJONG](https://koreagame-arcade.netlify.app/classic-mahjong.html)
- [SLOPE EMOJI 2](https://PixelArcadezGame.github.io/slope-emoji-2.html)
- [STICKMAN SANTA](https://action-battle-hub.pages.dev/stickman-santa.html)
- [SPINNING UIA UIA CAT BRICKER](https://choigame24h-vietnam.netlify.app/spinning-uia-uia-cat-bricker.html)
- [YOGA MASTER](https://logic-puzzle-world.pages.dev/yoga-master.html)
- [TRAFFIC ESCAPE PUZZLE](https://unblocked-galaxy.web.app/traffic-escape-puzzle.html)
- [BREAK A LUCKY BLOCK](https://shanghai-youxi-web.web.app/break-a-lucky-block.html)
- [CITYIDLE](https://maniadejogos-brasil.pages.dev/cityidle.html)
- [STICK TACTICS DESTRUCTION](https://brainiac-puzzles.web.app/stick-tactics-destruction.html)
- [JUST MAHJONG](https://youxiweb-china.github.io/just-mahjong.html)
- [AIRPORT SIMULATOR PLANE TYCOON](https://seoul-game-hub.pages.dev/airport-simulator-plane-tycoon.html)
- [SORTING SORCERY](https://koreagame-arcade.netlify.app/sorting-sorcery.html)
- [TINY GOLF KING](https://action-battle-hub.pages.dev/tiny-golf-king.html)
- [MY FARM](https://espacejeux-paris.pages.dev/my-farm.html)
- [OFF ROAD OVERDRIVE](https://PixelArcadezGame.github.io/off-road-overdrive.html)
- [BOMBAMAN 3D](https://kuaile-youxi-hub.web.app/bombaman-3d.html)
- [MERGE 2048 CAKE](https://logic-puzzle-world.pages.dev/merge-2048-cake.html)
- [CYBER HIGHWAY ESCAPE](https://planetejeux-france.pages.dev/cyber-highway-escape.html)
- [BUBBLE BALL](https://koreagame-hub24.netlify.app/bubble-ball.html)
- [HITMAN SNIPER](https://logic-puzzle-world.pages.dev/hitman-sniper.html)
- [NSR STREET CAR RACING](https://koreagame-arcade.netlify.app/nsr-street-car-racing.html)
- [TITANIC DOMINUS](https://hugervalues-pro.pages.dev/calculator/titanic-dominus)
- [CANDY CRUNCH SUGAR ESCAPE](https://jingpin-youxiwang.pages.dev/candy-crunch-sugar-escape.html)
- [PICK BRAINROT 3D BATTLE](https://unblocked-galaxy.github.io/pick-brainrot-3d-battle.html)
- [ARCHERY LEGENDS](https://shanghai-youxi-web.web.app/archery-legends.html)
- [CLUB TYCOON IDLE CLICKER](https://congdonggame-vietnam.web.app/club-tycoon-idle-clicker.html)
- [GRAVITY MATCHER](https://jogosweb-brasil.github.io/gravity-matcher.html)
- [CARDS 2048](https://neon-cyber-arcade.pages.dev/cards-2048.html)
- [PARKOUR BLOCK 7](https://hindigames-portal.netlify.app/parkour-block-7.html)
- [OFFROAD ISLAND](https://arcadevault-games.github.io/offroad-island.html)
- [ANGRY PLANTS FLOWER](https://shadow-ninja-arena.web.app/angry-plants-flower.html)
- [PIXEL BLAST](https://jogosweb-brasil.github.io/pixel-blast.html)
- [DRAGON](https://bfvalues-tracker.pages.dev/calculator/dragon)
- [BUBBLE SHOOTER WITCH TOWER 2](https://juegosweb-gratis.github.io/bubble-shooter-witch-tower-2.html)
- [CHOO CHOO SPIDER MONSTER TRAIN](https://youxiweb-hub.netlify.app/choo-choo-spider-monster-train.html)
- [MAGNET TRUCK](https://portaldejogos-br.github.io/magnet-truck.html)
- [LURKERS IO](https://koreagame-webhub.github.io/lurkers-io.html)
- [MONSTER HIGH SPOOKY FASHION](https://gamehay-online.netlify.app/monster-high-spooky-fashion.html)
- [OBBY GYM SIMULATOR ESCAPE](https://gamehay-online.netlify.app/obby-gym-simulator-escape.html)
- [SHOOT BLOCK RUSH 3D](https://jeuxflash-france.netlify.app/shoot-block-rush-3d.html)
- [HOLIDAY HEX SORT](https://veb-igry-moskva.web.app/holiday-hex-sort.html)
- [FIND 6 DIFFERENCES SPOT THE HIDDEN CHANGES](https://brainiac-puzzles.web.app/find-6-differences-spot-the-hidden-changes.html)
- [BOLTS AND NUTS](https://mir-igr-onlayn.pages.dev/bolts-and-nuts.html)
- [WARCALL IO](https://webarcade-gamehub.github.io/warcall-io.html)
- [CELEBRITY WEDNESDAY ADDAMS STYLE](https://arcadegames-france24.web.app/celebrity-wednesday-addams-style.html)
- [BIKING EXTREME 3D](https://onlinerus-games.netlify.app/biking-extreme-3d.html)
- [CURSED TREASURE 11 2](https://mundodosjogos-br.web.app/cursed-treasure-11-2.html)
- [TILE HEXA SORT](https://unblocked-action-arena.netlify.app/tile-hexa-sort.html)
- [STEAL BRAINROT EGGS](https://quantum-puzzle-hub.pages.dev/steal-brainrot-eggs.html)
- [NUMBER BUBBLE SHOOTER WILD WEST](https://mir-igr-onlayn.pages.dev/number-bubble-shooter-wild-west.html)
- [MOTO TRAFFIC RIDER](https://nihongames-web.github.io/moto-traffic-rider.html)
- [DINOSAUR SHIFTING RUN](https://youxi-china24.netlify.app/dinosaur-shifting-run.html)
- [DRIVER MASTER SIMULATOR](https://hindigames-portal.netlify.app/driver-master-simulator.html)
- [THOR MERGE](https://retro-arcade-zone.netlify.app/thor-merge.html)
- [FIRE AND WATER BIRDS](https://portaldejogos-br.github.io/fire-and-water-birds.html)
- [RAGDOLL SHOW THROW BREAK AND DESTROY](https://zona-igr-besplatno.web.app/ragdoll-show-throw-break-and-destroy.html)
- [BUBBLE POP FAIRYLAND](https://nihongames-web.github.io/bubble-pop-fairyland.html)
- [SUMMER MAZE](https://nihongames-portal.netlify.app/summer-maze.html)
- [BEAUTY PUZZLE](https://PixelArcadezGame.github.io/beauty-puzzle.html)
- [JUMPER](https://peullaesi-geim-madang.web.app/jumper.html)
- [BRAINROT CLEANING](https://logic-puzzle-world.pages.dev/brainrot-cleaning.html)
- [MY DREAMY FLORA FASHION LOOK](https://youxiweb-china.github.io/my-dreamy-flora-fashion-look.html)
- [TRAFFIC JAM HOP ON](https://hindigames-hub.netlify.app/traffic-jam-hop-on.html)
- [BLOCOPS](https://unblocked-action-arena.netlify.app/blocops.html)
- [CASHIER GAME](https://shadow-ninja-arena.web.app/cashier-game.html)
- [PRINCESS RUN 3D](https://arcadegames-france24.web.app/princess-run-3d.html)
- [CRAFT OF WARS](https://jeuxweb-france.netlify.app/craft-of-wars.html)
