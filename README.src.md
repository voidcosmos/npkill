<!--@nrg.languages=en,es,id,pt,tr-->
<!--@nrg.defaultLanguage=en-->
<p align="center"><!--en-->
  <img src="./docs/npkill-text-clean.svg" width="380" alt="npkill logo" /><!--en-->
</p><!--en-->
<p align="center"><!--en-->
<img alt="npm" src="https://img.shields.io/npm/dy/npkill.svg"><!--en-->
<a href="#donations"><img src="https://img.shields.io/badge/donate-<3-red" alt="Donations Badge"/></a><!--en-->
<img alt="npm version" src="https://img.shields.io/npm/v/npkill.svg"><!--en-->
<img alt="NPM" src="https://img.shields.io/npm/l/npkill.svg"><!--en-->
</p><!--en-->
<!--en-->
### Easily find and **remove** old and heavy <font color="red">**node_modules**</font> folders :sparkles:<!--en-->
<!--en-->
<p align="center"><!--en-->
  <img src="/docs/npkill-demo-0.10.0.gif" alt="npkill demo GIF" /><!--en-->
</p><!--en-->
<!--en-->
This tool allows you to list any _node_modules_ directories in your system, as well as the space they take up. You can then select which ones you want to erase to free up space. Yay!<!--en-->
<!--en-->
## i18n<!--en-->
<!--en-->
We're making an effort to internationalize the Npkill docs. Here's a list of the available translations:<!--en-->
<!--en-->
- [Español](./README.es.md)<!--en-->
- [Indonesian](./README.id.md)<!--en-->
- [Português](./README.pt.md)<!--en-->
- [Turkish](./README.tr.md)<!--en-->
<!--en-->
## Table of Contents<!--en-->
<!--en-->
- [Features](#features)<!--en-->
- [Installation](#installation)<!--en-->
- [Usage](#usage)<!--en-->
  - [Multi-Select Mode](#multi-select-mode)<!--en-->
  - [Options](#options)<!--en-->
  - [Examples](#examples)<!--en-->
  - [JSON Output](#json-output)<!--en-->
- [Set Up Locally](#setup-locally)<!--en-->
- [API](#API)<!--en-->
- [Roadmap](#roadmap)<!--en-->
- [Known bugs](#known-bugs)<!--en-->
- [Contributing](#contributing)<!--en-->
- [Buy us a coffee](#donations)<!--en-->
- [License](#license)<!--en-->
<!--en-->
<a name="features"></a><!--en-->
<!--en-->
# :heavy_check_mark: Features<!--en-->
<!--en-->
- **Clear space:** Get rid of old and dusty _node_modules_ cluttering up your machine.<!--en-->
<!--en-->
- **Last Workspace Usage**: Check when was the last time you modified a file in the workspace (indicated in the **last_mod** column).<!--en-->
<!--en-->
- **Very fast:** NPKILL is written in TypeScript, but searches are performed at a low level, improving performance greatly.<!--en-->
<!--en-->
- **Easy to use:** Say goodbye to lengthy commands. Using npkill is as simple as reading a list of your node_modules, and pressing Del to get rid of them. Could it be any easier? ;)<!--en-->
<!--en-->
- **Minified:** It barely has any dependencies.<!--en-->
<!--en-->
<a name="installation"></a><!--en-->
<!--en-->
# :cloud: Installation<!--en-->
<!--en-->
You don't really need to install it to use it!<!--en-->
Simply use the following command:<!--en-->
<!--en-->
```bash<!--en-->
$ npx npkill<!--en-->
```<!--en-->
<!--en-->
Or if for some reason you really want to install it:<!--en-->
<!--en-->
```bash<!--en-->
$ npm i -g npkill<!--en-->
# Unix users may need to run the command with sudo. Go carefully<!--en-->
```<!--en-->
<!--en-->
> NPKILL does not support node<v14. If this affects you you can use `npkill@0.8.3`<!--en-->
<!--en-->
<a name="usage"></a><!--en-->
<!--en-->
# :clipboard: Usage<!--en-->
<!--en-->
```bash<!--en-->
$ npx npkill<!--en-->
# or just npkill if installed globally<!--en-->
```<!--en-->
<!--en-->
By default, npkill will scan for node_modules starting at the path where `npkill` command is executed.<!--en-->
<!--en-->
Move between the listed folders with <kbd>↓</kbd> <kbd>↑</kbd>, and use <kbd>Space</kbd> or <kbd>Del</kbd> to delete the selected folder.<!--en-->
You can also use <kbd>j</kbd> and <kbd>k</kbd> to move between the results.<!--en-->
<!--en-->
You can open the directory where the selected result is placed by pressing <kbd>o</kbd>.<!--en-->
<!--en-->
To exit, <kbd>Q</kbd> or <kbd>Ctrl</kbd> + <kbd>c</kbd> if you're brave.<!--en-->
<!--en-->
**Important!** Some applications installed on the system need their node_modules directory to work and deleting them may break them. NPKILL will highlight them by displaying a :warning: to be careful.<!--en-->
<!--en-->
## Search Mode<!--en-->
<!--en-->
Search mode allows you to filter results. This can be particularly useful for limiting the view to a specific route or ensuring that only those results that meet the specified condition are “selected all.”<!--en-->
<!--en-->
For example, you can use this expression to limit the results to those that are in the `work` directory and that include `data` somewhere in the path: `/work/.*/data`.<!--en-->
<!--en-->
Press <kbd>/</kbd> to enter search mode. You can type a regex pattern to filter results.<!--en-->
<!--en-->
Press <kbd>Enter</kbd> to confirm the search and navigate the filtered results, or <kbd>Esc</kbd> to clear and exit.<!--en-->
<!--en-->
To exit from this mode, leave empty.<!--en-->
<!--en-->
## Multi-Select Mode<!--en-->
<!--en-->
This mode allows you to select and delete multiple folders at once, making it more efficient when cleaning up many directories.<!--en-->
<!--en-->
### Entering Multi-Select Mode<!--en-->
<!--en-->
Press <kbd>T</kbd> to toggle multi-select mode. When active, you'll see a selection counter and additional instructions at the top of the results.<!--en-->
<!--en-->
### Controls<!--en-->
<!--en-->
- **<kbd>Space</kbd>**: Toggle selection of the current folder.<!--en-->
- **<kbd>V</kbd>**: Start/end range selection mode.<!--en-->
- **<kbd>A</kbd>**: Toggle select/unselect all folders.<!--en-->
- **<kbd>Enter</kbd>**: Delete all selected folders.<!--en-->
- **<kbd>T</kbd>**: Unselect all and back to normal mode.<!--en-->
<!--en-->
### Range Selection<!--en-->
<!--en-->
After pressing <kbd>V</kbd> to enter range selection mode:<!--en-->
<!--en-->
- Move the cursor with arrow keys, <kbd>j</kbd>/<kbd>k</kbd>, <kbd>Home</kbd>/<kbd>End</kbd>, or page up/down<!--en-->
- All folders between the starting position and current cursor position will be selected/deselected<!--en-->
- Press <kbd>V</kbd> again to exit range selection mode<!--en-->
<!--en-->
<a name="options"></a><!--en-->
<!--en-->
## Options<!--en-->
<!--en-->
| ARGUMENT                | DESCRIPTION                                                                                                                                                                   |<!--en-->
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |<!--en-->
| -p, --profiles          | Allows you to select the [profile](./docs/profiles.md) (set of targets) to use. If no option is specified, the available ones will be listed _(**node** by default)_.         |<!--en-->
| --config                | Path to a custom .npkillrc configuration file. By default, npkill looks first for `./.npkillrc` and then for `~/.npkillrc`.                                                   |<!--en-->
| -d, --directory         | Set the directory from which to begin searching. By default, starting-point is .                                                                                              |<!--en-->
| -D, --delete-all        | Automatically delete all folders that are found. Suggested to be used together with `-x`.                                                                                     |<!--en-->
| -e, --hide-errors       | Hide errors if any                                                                                                                                                            |<!--en-->
| -E, --exclude           | Exclude directories from search (directory list must be inside double quotes "", each directory separated by ',' ) Example: "ignore1, ignore2"                                |<!--en-->
| -f, --full              | Start searching from the home of the user (example: "/home/user" in linux)                                                                                                    |<!--en-->
| --size-unit             | Set the unit for displaying folder sizes. _(Available: **auto**, mb, gb)_. With auto, sizes < 1024MB are shown in MB (rounded), larger sizes in GB (with decimals).           |<!--en-->
| -h, --help, ?           | Show help page                                                                                                                                                                |<!--en-->
| -nu, --no-check-update  | Don't check for updates on startup                                                                                                                                            |<!--en-->
| -s, --sort              | Sort results by: `size`, `path` or `age`                                                                                                                                      |<!--en-->
| -t, --targets           | Disable profiles feature and specify the name of the directories you want to search for. You can define multiple targets separating with comma. Ej. `-t node_modules,.cache`. |<!--en-->
| -x, --exclude-sensitive | Exclude sensitive directories.                                                                                                                                                |<!--en-->
| -y                      | Avoid displaying a warning when executing --delete-all.                                                                                                                       |<!--en-->
| --dry-run               | It does not delete anything (will simulate it with a random delay).                                                                                                           |<!--en-->
| --json                  | Output results in JSON format at the end of the scan. Useful for automation and scripting.                                                                                    |<!--en-->
| --json-stream           | Output results in streaming JSON format (one JSON object per line as results are found). Useful for real-time processing.                                                     |<!--en-->
| -v, --version           | Show npkill version                                                                                                                                                           |<!--en-->
<!--en-->
<a name="examples"></a><!--en-->
<!--en-->
## Examples<!--en-->
<!--en-->
- Search **node_modules** directories in your _projects_ directory:<!--en-->
<!--en-->
```bash<!--en-->
npkill -d ~/projects<!--en-->
<!--en-->
# other alternative:<!--en-->
cd ~/projects<!--en-->
npkill<!--en-->
```<!--en-->
<!--en-->
- List **node_modules** in your _projects_ directory, excluding the ones in _progress_ and _ignore-this_ directories:<!--en-->
<!--en-->
```bash<!--en-->
npkill -d 'projects' --exclude "progress, ignore-this"<!--en-->
```<!--en-->
<!--en-->
- Automatically delete all node_modules that have sneaked into your backups:<!--en-->
<!--en-->
```bash<!--en-->
npkill -d ~/backups/ --delete-all<!--en-->
```<!--en-->
<!--en-->
- Get results in JSON format for automation or further processing:<!--en-->
<!--en-->
```bash<!--en-->
npkill --json > results.json<!--en-->
```<!--en-->
<!--en-->
- Stream results in real-time as JSON (useful for monitoring or piping to other tools):<!--en-->
<!--en-->
```bash<!--en-->
npkill --json-stream | jq '.'<!--en-->
```<!--en-->
<!--en-->
- Save only successful results to a file, ignoring errors:<!--en-->
<!--en-->
```bash<!--en-->
npkill --json-stream 2>/dev/null | jq -s '.' > clean-results.json<!--en-->
```<!--en-->
<!--en-->
<a name="json-output"></a><!--en-->
<!--en-->
## JSON Output<!--en-->
<!--en-->
Npkill supports JSON output formats for automation and integration with other tools:<!--en-->
<!--en-->
- **`--json`**: Output all results as a single JSON object at the end of the scan<!--en-->
- **`--json-stream`**: Output each result as a separate JSON object in real-time<!--en-->
<!--en-->
For detailed documentation, examples, and TypeScript interfaces, see [JSON Output Documentation](./docs/json-output.md).<!--en-->
<!--en-->
**Quick Examples:**<!--en-->
<!--en-->
```bash<!--en-->
# Get all results as JSON<!--en-->
npkill --json > results.json<!--en-->
<!--en-->
# Process results in real-time<!--en-->
npkill --json-stream | jq '.result.path'<!--en-->
<!--en-->
# Find directories larger than 100MB<!--en-->
npkill --json | jq '.results[] | select(.size > 104857600)'<!--en-->
```<!--en-->
<!--en-->
<a name="setup-locally"></a><!--en-->
<!--en-->
# :pager: Set Up Locally<!--en-->
<!--en-->
```bash<!--en-->
# -- First, clone the repository<!--en-->
git clone https://github.com/voidcosmos/npkill.git<!--en-->
<!--en-->
# -- Navigate to the dir<!--en-->
cd npkill<!--en-->
<!--en-->
# -- Install dependencies<!--en-->
npm install<!--en-->
<!--en-->
# -- And run!<!--en-->
npm run start<!--en-->
<!--en-->
<!--en-->
# -- If you want to run it with some parameter, you will have to add "--" as in the following example:<!--en-->
npm run start -- -f -e<!--en-->
```<!--en-->
<!--en-->
<a name="API"></a><!--en-->
<!--en-->
# :bookmark_tabs: API<!--en-->
<!--en-->
The api allows you to interact with npkill from node to create your own implementations in your scripts (automations, for example).<!--en-->
<!--en-->
You can check the basic API [here](./API.md) or on the web (comming soon).<!--en-->
<!--en-->
<a name="roadmap"></a><!--en-->
<!--en-->
# :crystal_ball: Roadmap<!--en-->
<!--en-->
- [x] Release 0.1.0 !<!--en-->
- [x] Improve code<!--en-->
  - [x] Improve performance<!--en-->
  - [ ] Improve performance even more!<!--en-->
- [x] Sort results by size and path<!--en-->
- [x] Allow the search for other types of directories (targets)<!--en-->
- [ ] Reduce dependencies to be a more minimalist module<!--en-->
- [ ] Allow to filter by directories that have not been used in a period of time<!--en-->
- [ ] Create option for displaying directories in tree format<!--en-->
- [x] Add some menus<!--en-->
- [x] Add log service<!--en-->
- [ ] Periodic and automatic cleaning (?)<!--en-->
<!--en-->
<a name="known-bugs"></a><!--en-->
<!--en-->
# :bug: Known bugs :bug:<!--en-->
<!--en-->
- Sometimes, CLI is blocked while folder is deleting.<!--en-->
- Sorting, especially by routes, can slow down the terminal when there are many results at the same time.<!--en-->
- Sometimes, size calculations are higher than they should be.<!--en-->
- (SOLVED) Performance issues when searching from high level directories (like / in linux).<!--en-->
- (SOLVED) Sometimes text collapses when updating the cli.<!--en-->
- (SOLVED) Analyzing the size of the directories takes longer than it should.<!--en-->
<!--en-->
> If you find any bugs, don't hesitate and open an issue :)<!--en-->
<!--en-->
<a name="contributing"></a><!--en-->
<!--en-->
# :revolving_hearts: Contributing<!--en-->
<!--en-->
If you want to contribute check the [CONTRIBUTING.md](.github/CONTRIBUTING.md)<!--en-->
<!--en-->
<a name="donations"></a><!--en-->
<!--en-->
# :coffee: Buy us a coffee<!--en-->
<!--en-->
<img align="right" width="300" src="https://npkill.js.org/img/cat-donation-cup.png"><!--en-->
We have developed npkill in our free time, because we are passionate about the programming sector.<!--en-->
Tomorrow we would like to dedicate ourselves to this, but first, we have a long way to go.<!--en-->
<!--en-->
We will continue to do things anyway, but donations are one of the many ways to support what we do.<!--en-->
<!--en-->
<span class="badge-opencollective"><a href="https://opencollective.com/npkill/contribute" title="Donate to this project using Open Collective"><img src="https://img.shields.io/badge/open%20collective-donate-green.svg" alt="Open Collective donate button" /></a></span><!--en-->
<!--en-->
### Thanks!!<!--en-->
<!--en-->
## A huge thank you to our backers :heart:<!--en-->
<!--en-->
<a href="https://opencollective.com/npkill#backers" target="_blank"><img width="535" src="https://opencollective.com/npkill/tiers/backer.svg?width=535"></a><!--en-->
<!--en-->
---<!--en-->
<!--en-->
### Crypto alternative<!--en-->
<!--en-->
- btc: 1ML2DihUoFTqhoQnrWy4WLxKbVYkUXpMAX<!--en-->
- bch: 1HVpaicQL5jWKkbChgPf6cvkH8nyktVnVk<!--en-->
- eth: 0x7668e86c8bdb52034606db5aa0d2d4d73a0d4259<!--en-->
<!--en-->
<a name="license"></a><!--en-->
<!--en-->
# :scroll: License<!--en-->
<!--en-->
MIT © [Nya García Gallardo](https://github.com/NyaGarcia) and [Juan Torres Gómez](https://github.com/zaldih)<!--en-->
<!--en-->
:cat::baby_chick:<!--en-->
<!--en-->
---<!--en-->
<p align="center"><!--es-->
  <img src="https://npkill.js.org/img/npkill-text-outlined.svg" width="320" alt="npkill logo" /><!--es-->
  <img src="https://npkill.js.org/img/npkill-scope-mono.svg" width="50" alt="npkill logo scope" /><!--es-->
</p><!--es-->
<p align="center"><!--es-->
<img alt="npm" src="https://img.shields.io/npm/dy/npkill.svg"><!--es-->
<a href="#donations"><img src="https://img.shields.io/badge/donate-<3-red" alt="Donations Badge"/></a><!--es-->
<img alt="npm version" src="https://img.shields.io/npm/v/npkill.svg"><!--es-->
<img alt="NPM" src="https://img.shields.io/npm/l/npkill.svg"><!--es-->
</p><!--es-->
<!--es-->
### Encuentra y **destruye** directorios <font color="red">**node_modules**</font> viejos y pesados :sparkles:<!--es-->
<!--es-->
<p align="center"><!--es-->
  <img src="/docs/npkill-demo-0.10.0.gif" alt="npkill demo GIF" /><!--es-->
</p><!--es-->
<!--es-->
Esta herramienta te permite listar cualquier directorio _node_modules_ que haya en tu sistema, además del espacio que ocupa. Entonces puedes seleccionar los que quieras borrar para liberar espacio. ¡Yay!<!--es-->
<!--es-->
## i18n<!--es-->
<!--es-->
Nos estamos esforzando por internacionalizar la documentación de Npkill. Aquí tienes una lista de las traducciones disponibles:<!--es-->
<!--es-->
- [Español](./README.es.md)<!--es-->
- [Português](./README.pt.md)<!--es-->
<!--es-->
## Table of Contents<!--es-->
<!--es-->
- [Características](#features)<!--es-->
- [Instalación](#installation)<!--es-->
- [Uso](#usage)<!--es-->
  - [Opciones](#options)<!--es-->
  - [Ejemplos](#examples)<!--es-->
- [Configuración local](#setup-locally)<!--es-->
- [Roadmap](#roadmap)<!--es-->
- [Bugs conocidos](#known-bugs)<!--es-->
- [Cómo contribuir](#contributing)<!--es-->
- [Invítanos a un café](#donations)<!--es-->
- [Licencia](#license)<!--es-->
<!--es-->
<a name="features"></a><!--es-->
<!--es-->
# :heavy_check_mark: Características<!--es-->
<!--es-->
- **Libera espacio:** Elimina tus directorios _node_modules_ viejos y polvorientos que le roban espacio a tu máquina.<!--es-->
<!--es-->
- **Último uso del Workspace**: Comprueba cuándo ha sido la última vez que has modificado un fichero en el workspace (indicado en la columna **last_mod**).<!--es-->
<!--es-->
- **Rapidez:** NPKILL está escrito en TypeScript, pero las búsquedas se llevan a cabo a bajo nivel, lo que supone una mejora considerable del rendimiento.<!--es-->
<!--es-->
- **Fácil de utilizar:** Despídete de comandos largos y difíciles. Utilizar Npkill es tan sencillo como leer la lista de tus node_modules, y pulsar la tecla Del para eliminarlos. ¿Podría ser más fácil? ;)<!--es-->
<!--es-->
- **Minificado:** Apenas tiene dependencias.<!--es-->
<!--es-->
<a name="installation"></a><!--es-->
<!--es-->
# :cloud: Instalación<!--es-->
<!--es-->
¡Lo mejor es que no tienes que instalar Npkill para utilizarlo!<!--es-->
Simplemente utiliza el siguiente comando:<!--es-->
<!--es-->
```bash<!--es-->
$ npx npkill<!--es-->
```<!--es-->
<!--es-->
O, si por alguna razón te apetece instalarlo:<!--es-->
<!--es-->
```bash<!--es-->
$ npm i -g npkill<!--es-->
# Los usuarios de Unix quizá tengan que ejecutar el comando con sudo. Ve con cuidado<!--es-->
```<!--es-->
<!--es-->
> NPKILL no tiene soporte para node<v14. Si esto te afecta puedes utilizar `npkill@0.8.3`<!--es-->
<!--es-->
<a name="usage"></a><!--es-->
<!--es-->
# :clipboard: Uso<!--es-->
<!--es-->
```bash<!--es-->
$ npx npkill<!--es-->
# o solo npkill si está instalado de forma global<!--es-->
```<!--es-->
<!--es-->
Por defecto, Npkill comenzará la búsqueda de node_modules comenzando en la ruta donde se ejecute el comando `npkill`.<!--es-->
<!--es-->
Muévete por los distintos directorios listados con <kbd>↓</kbd> <kbd>↑</kbd>, y utiliza <kbd>Space</kbd> para borrar el directorio seleccionado.<!--es-->
<!--es-->
También puedes usar <kbd>j</kbd> y <kbd>k</kbd> para moverte por los resultados.<!--es-->
<!--es-->
Puedes abrir el directorio donde se aloja el resultado seleccionado pulsando <kbd>o</kbd>.<!--es-->
<!--es-->
Para salir de Npkill, utiliza <kbd>Q</kbd>, o si te sientes valiente, <kbd>Ctrl</kbd> + <kbd>c</kbd>.<!--es-->
<!--es-->
**¡Importante!** Algunas aplicaciones que están instaladas en el sistema necesitan su directorio node_modules para funcionar, y borrarlo puede romperlas. NPKILL te mostrará un :warning: para que sepas que tienes que tener cuidado.<!--es-->
<!--es-->
<a name="options"></a><!--es-->
<!--es-->
## Opciones<!--es-->
<!--es-->
| ARGUMENTO                        | DESCRIPCIÓN                                                                                                                                                    |<!--es-->
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |<!--es-->
| -c, --bg-color                   | Cambia el color de selección de la fila. _(Colores disponibles: **azul**, cyan, magenta, blanco, rojo y amarillo)_                                             |<!--es-->
| -d, --directory                  | Permite seleccionar el directorio desde el que comienza la búsqueda. Por defecto, se empieza en .                                                              |<!--es-->
| -D, --delete-all                 | Borra automáticamente todos los node_modules que se encuentren. Recomendable utilizar junto a `-x`                                                             |<!--es-->
| -e, --hide-errors                | Esconde los errores en el caso de que ocurra alguno                                                                                                            |<!--es-->
| -E, --exclude                    | Excluye directorios de la búsqueda (la lista de directorios debe estar entre comillas dobles "", cada directorio separado por ',' Ejemplo: "ignore1, ignore2") |<!--es-->
| -f, --full                       | Comienza la búsqueda en el home del usuario (ejemplo: "/home/user" en Linux)                                                                                   |<!--es-->
| -gb                              | Muestra el tamaño en Gigabytes en lugar de en Megabytes.                                                                                                       |<!--es-->
| -h, --help, ?                    | Muestra esta página de ayuda y finaliza                                                                                                                        |<!--es-->
| -nu, --no-check-update           | No comprobar si hay actualizaciones al iniciar la aplicación                                                                                                   |<!--es-->
| -s, --sort                       | Ordena los resultados por: `size`, `path` or `last-mod`                                                                                                        |<!--es-->
| -t, --target                     | Especifica el nombre del directorio que se buscará (por defecto es node_modules)                                                                               |<!--es-->
| -x, --exclude-hidden-directories | Excluye directorios ocultos (directorios "dot") de la búsqueda                                                                                                 |<!--es-->
| --dry-run                        | No borra nada (simula un tiempo de borrado aleatorio)                                                                                                          |<!--es-->
| -v, --version                    | Muestra la versión de Npkill                                                                                                                                   |<!--es-->
<!--es-->
**Precaución:** _Algunos comandos pueden cambiar en versiones futuras_<!--es-->
<!--es-->
<a name="examples"></a><!--es-->
<!--es-->
## Ejemplo<!--es-->
<!--es-->
- Busca y encuentra los directorios **node_modules** en un directorio _projects_ :<!--es-->
<!--es-->
```bash<!--es-->
npkill -d ~/projects<!--es-->
<!--es-->
# otra alternativa:<!--es-->
cd ~/projects<!--es-->
npkill<!--es-->
```<!--es-->
<!--es-->
- Lista los directorios llamados "dist" y muestra los errores que ocurran:<!--es-->
<!--es-->
```bash<!--es-->
npkill --target dist -e<!--es-->
```<!--es-->
<!--es-->
- Muestra el cursor de color magenta... ¡Porque me gusta el magenta!<!--es-->
<!--es-->
```bash<!--es-->
npkill --bg-color magenta<!--es-->
```<!--es-->
<!--es-->
- Lista los directorios **vendor** en un directorio _projects_, ordenados por tamaño y mostrando el tamaño en gb:<!--es-->
<!--es-->
```bash<!--es-->
npkill -d '~/more projects' -gb --sort size --target vendor<!--es-->
```<!--es-->
<!--es-->
- Lista los **node_modules** en el directorio _projects_, excluyendo los que están en los directorios _progress_ e _ignore-this_:<!--es-->
<!--es-->
```bash<!--es-->
npkill -d 'projects' --exclude "progress, ignore-this"<!--es-->
```<!--es-->
<!--es-->
- Borra automáticamente todos los **node_modules** que se encuentren en el directorio _backups_:<!--es-->
<!--es-->
```bash<!--es-->
npkill -d ~/backups/ --delete-all<!--es-->
```<!--es-->
<!--es-->
<a name="setup-locally"></a><!--es-->
<!--es-->
# :pager: Configuración local<!--es-->
<!--es-->
```bash<!--es-->
# -- Primero, clona el repositorio<!--es-->
git clone https://github.com/voidcosmos/npkill.git<!--es-->
<!--es-->
# -- Navega al dir<!--es-->
cd npkill<!--es-->
<!--es-->
# -- Instala las dependencias<!--es-->
npm install<!--es-->
<!--es-->
# -- ¡Y ejecuta!<!--es-->
npm run start<!--es-->
<!--es-->
<!--es-->
# -- Si quieres ejecutar con algún parámetro, hay que añadir "--", tal y como se muestra a continuación:<!--es-->
npm run start -- -f -e<!--es-->
```<!--es-->
<!--es-->
<a name="roadmap"></a><!--es-->
<!--es-->
# :crystal_ball: Roadmap<!--es-->
<!--es-->
- [x] Lanzar la versión 0.1.0 !<!--es-->
- [x] Mejorar el código<!--es-->
  - [x] Mejorar el rendimiento<!--es-->
  - [ ] ¡Mejorar el rendimiento aún más!<!--es-->
- [x] Ordenar los resultados por tamaño y ruta<!--es-->
- [x] Permitir la búsqueda de otro tipo de directorios (targets)<!--es-->
- [ ] Reducir las dependencies para ser un módulo más minimalista<!--es-->
- [ ] Permitir el filtrado por directorios que no se hayan utilizado en un periodo de tiempo determinado<!--es-->
- [ ] Crear una opción para mostrar los directorios en formato árbol<!--es-->
- [x] Añadir menús<!--es-->
- [x] Añadir un servicio de logs<!--es-->
- [ ] Limpieza periódica y automática (?)<!--es-->
<!--es-->
<a name="known-bugs"></a><!--es-->
<!--es-->
# :bug: Bugs conocidos :bug:<!--es-->
<!--es-->
- A veces, el CLI se bloquea mientras un directorio se está borrando.<!--es-->
- La ordenación, especialmente por rutas, puede ralentizar la terminal cuando haya muchos resultados al mismo tiempo.<!--es-->
- A veces, los cálculos de tamaño son mayores de lo que deberían ser.<!--es-->
- (RESUELTO) Problemas de rendimiento al hacer la búsqueda desde directorios de alto nivel (como / en Linux).<!--es-->
- (RESUELTO) A veces el texto se colapsa al actualizar el CLI.<!--es-->
- (RESUELTO) Analizar el tamaño de los directorios tarda más de lo que debería.<!--es-->
<!--es-->
> Si encuentras algún bug, no dudes en abrir un issue :)<!--es-->
<!--es-->
<a name="contributing"></a><!--es-->
<!--es-->
# :revolving_hearts: Cómo contribuir<!--es-->
<!--es-->
Si quieres contribuir, échale un vistazo al [CONTRIBUTING.md](.github/CONTRIBUTING.es.md)<!--es-->
<!--es-->
<a name="donations"></a><!--es-->
<!--es-->
# :coffee: Invítanos a un café<!--es-->
<!--es-->
<img align="right" width="300" src="https://npkill.js.org/img/cat-donation-cup.png"><!--es-->
Hemos desarrollado Npkill en nuestro tiempo libre, porque nos apasiona la programación.<!--es-->
<!--es-->
El día de mañana nos gustaría dedicarnos al open source completamente, pero antes, nos queda un largo camino por recorrer.<!--es-->
<!--es-->
Seguiremos contribuyendo al open source por y para siempre, pero las donaciones son una de las muchas formas de apoyarnos.<!--es-->
<!--es-->
¡Invítanos a un café! (O a un té para Nya, la única programadora a la que no le gusta el café).<!--es-->
<!--es-->
<span class="badge-opencollective"><a href="https://opencollective.com/npkill/contribute" title="Dona a este proyecto utilizando Open Collective"><img src="https://img.shields.io/badge/open%20collective-donate-green.svg" alt="Botón de donar con Open Collective" /></a></span><!--es-->
<!--es-->
### ¡¡Mil gracias!!<!--es-->
<!--es-->
## Muchísimas gracias a todos los que nos han apoyado :heart:<!--es-->
<!--es-->
<a href="https://opencollective.com/npkill#backers" target="_blank"><img width="535" src="https://opencollective.com/npkill/tiers/backer.svg?width=535"></a><!--es-->
<!--es-->
---<!--es-->
<!--es-->
### Alternativa cripto<!--es-->
<!--es-->
- btc: 1ML2DihUoFTqhoQnrWy4WLxKbVYkUXpMAX<!--es-->
- bch: 1HVpaicQL5jWKkbChgPf6cvkH8nyktVnVk<!--es-->
- eth: 0x7668e86c8bdb52034606db5aa0d2d4d73a0d4259<!--es-->
<!--es-->
<a name="license"></a><!--es-->
<!--es-->
# :scroll: Licencia<!--es-->
<!--es-->
MIT © [Nya García Gallardo](https://github.com/NyaGarcia) y [Juan Torres Gómez](https://github.com/zaldih)<!--es-->
<!--es-->
:cat::baby_chick:<!--es-->
<!--es-->
---<!--es-->
<p align="center"><!--id-->
  <img src="https://npkill.js.org/img/npkill-text-outlined.svg" width="320" alt="npkill logo" /><!--id-->
  <img src="https://npkill.js.org/img/npkill-scope-mono.svg" width="50" alt="npkill logo scope" /><!--id-->
</p><!--id-->
<p align="center"><!--id-->
<img alt="npm" src="https://img.shields.io/npm/dy/npkill.svg"><!--id-->
<a href="#donations"><img src="https://img.shields.io/badge/donate-<3-red" alt="Donations Badge"/></a><!--id-->
<img alt="npm version" src="https://img.shields.io/npm/v/npkill.svg"><!--id-->
<img alt="NPM" src="https://img.shields.io/npm/l/npkill.svg"><!--id-->
</p><!--id-->
<!--id-->
### Mudah menemukan dan **menghapus** folder <font color="red">**node_modules**</font> yang lama dan berat :sparkles:<!--id-->
<!--id-->
<p align="center"><!--id-->
  <img src="/docs/npkill-demo-0.10.0.gif" alt="npkill demo GIF" /><!--id-->
</p><!--id-->
<!--id-->
Alat ini memungkinkan Anda untuk mencantumkan semua direktori _node_modules_ di sistem Anda, serta ruang yang mereka gunakan. Anda kemudian dapat memilih mana yang ingin Anda hapus untuk mengosongkan ruang penyimpanan. Yay!<!--id-->
<!--id-->
## i18n<!--id-->
<!--id-->
Kami berusaha untuk menerjemahkan dokumen Npkill ke berbagai bahasa. Berikut daftar terjemahan yang tersedia:<!--id-->
<!--id-->
- [Español](./README.es.md)<!--id-->
- [Indonesian](./README.id.md)<!--id-->
- [Portugis](./README.pt.md)<!--id-->
- [Turki](./README.tr.md)<!--id-->
<!--id-->
## Daftar Isi<!--id-->
<!--id-->
- [Fitur](#features)<!--id-->
- [Instalasi](#installation)<!--id-->
- [Penggunaan](#usage)<!--id-->
  - [Opsi](#options)<!--id-->
  - [Contoh](#examples)<!--id-->
- [Pengaturan Lokal](#setup-locally)<!--id-->
- [Peta Jalan](#roadmap)<!--id-->
- [Bug yang Diketahui](#known-bugs)<!--id-->
- [Kontribusi](#contributing)<!--id-->
- [Buy us a coffee](#donations)<!--id-->
- [Lisensi](#license)<!--id-->
<!--id-->
<a name="features"></a><!--id-->
<!--id-->
# :heavy_check_mark: Fitur<!--id-->
<!--id-->
- **Bersihkan Ruang:** Hapus _node_modules_ lama yang tidak digunakan yang memenuhi mesin Anda.<!--id-->
<!--id-->
- **Penggunaan Terakhir Workspace:** Cek kapan terakhir kali Anda mengubah file di workspace (ditunjukkan di kolom **last_mod**).<!--id-->
<!--id-->
- **Sangat Cepat:** NPKILL ditulis dalam TypeScript, tetapi pencarian dilakukan di tingkat rendah, sehingga performanya sangat baik.<!--id-->
<!--id-->
- **Mudah Digunakan:** Tidak perlu perintah panjang. Menggunakan npkill semudah membaca daftar _node_modules_ Anda, dan menekan tombol Del untuk menghapusnya. Bisa lebih mudah dari itu?<!--id-->
<!--id-->
- **Ringkas:** Hampir tidak memiliki dependensi.<!--id-->
<!--id-->
<a name="installation"></a><!--id-->
<!--id-->
# :cloud: Instalasi<!--id-->
<!--id-->
Anda tidak perlu menginstal untuk menggunakannya! Cukup gunakan perintah berikut:<!--id-->
<!--id-->
```bash<!--id-->
$ npx npkill<!--id-->
```<!--id-->
<!--id-->
Atau jika Anda benar-benar ingin menginstalnya:<!--id-->
<!--id-->
```bash<!--id-->
$ npm i -g npkill<!--id-->
# Pengguna Unix mungkin perlu menjalankan perintah dengan sudo. Gunakan dengan hati-hati<!--id-->
```<!--id-->
<!--id-->
> NPKILL tidak mendukung node<v14. Jika ini memengaruhi Anda, gunakan `npkill@0.8.3`<!--id-->
<!--id-->
<a name="usage"></a><!--id-->
<!--id-->
# :clipboard: Penggunaan<!--id-->
<!--id-->
```bash<!--id-->
$ npx npkill<!--id-->
# atau cukup npkill jika telah diinstal secara global<!--id-->
```<!--id-->
<!--id-->
Secara default, npkill akan memindai _node_modules_ mulai dari jalur tempat perintah `npkill` dijalankan.<!--id-->
<!--id-->
Pindah di antara folder yang terdaftar menggunakan <kbd>↓</kbd> <kbd>↑</kbd>, dan gunakan <kbd>Space</kbd> atau <kbd>Del</kbd> untuk menghapus folder yang dipilih. Anda juga dapat menggunakan <kbd>j</kbd> dan <kbd>k</kbd> untuk bergerak di antara hasil.<!--id-->
<!--id-->
Anda dapat membuka direktori tempat hasil yang dipilih berada dengan menekan <kbd>o</kbd>.<!--id-->
<!--id-->
Untuk keluar, tekan <kbd>Q</kbd> atau <kbd>Ctrl</kbd> + <kbd>c</kbd> jika Anda pemberani.<!--id-->
<!--id-->
**Penting!** Beberapa aplikasi yang diinstal di sistem membutuhkan direktori _node_modules_ untuk berfungsi, dan menghapusnya dapat menyebabkan kerusakan. NPKILL akan menandainya dengan :warning: agar berhati-hati.<!--id-->
<!--id-->
<a name="options"></a><!--id-->
<!--id-->
## Opsi<!--id-->
<!--id-->
| ARGUMEN                          | DESKRIPSI                                                                                                     |<!--id-->
| -------------------------------- | ------------------------------------------------------------------------------------------------------------- |<!--id-->
| -c, --bg-color                   | Ubah warna sorotan baris. _(Tersedia: **blue**, cyan, magenta, white, red, dan yellow)_                       |<!--id-->
| -d, --directory                  | Tetapkan direktori awal pencarian. Secara default, mulai dari .                                               |<!--id-->
| -D, --delete-all                 | Secara otomatis hapus semua folder _node_modules_ yang ditemukan. Disarankan digunakan bersama `-x`.          |<!--id-->
| -e, --hide-errors                | Sembunyikan kesalahan (jika ada)                                                                              |<!--id-->
| -E, --exclude                    | Kecualikan direktori dari pencarian. Daftar direktori harus dalam tanda kutip ganda "", dipisahkan dengan ',' |<!--id-->
| -f, --full                       | Mulai pencarian dari direktori home pengguna (contoh: "/home/user" di Linux)                                  |<!--id-->
| -gb                              | Tampilkan folder dalam Gigabyte daripada Megabyte.                                                            |<!--id-->
| -h, --help, ?                    | Tampilkan halaman bantuan ini dan keluar                                                                      |<!--id-->
| -nu, --no-check-update           | Jangan memeriksa pembaruan saat startup                                                                       |<!--id-->
| -s, --sort                       | Urutkan hasil berdasarkan: `size`, `path`, atau `last-mod`                                                    |<!--id-->
| -t, --target                     | Tentukan nama direktori yang ingin Anda cari (default: node_modules)                                          |<!--id-->
| -x, --exclude-hidden-directories | Kecualikan direktori tersembunyi dari pencarian.                                                              |<!--id-->
| --dry-run                        | Tidak menghapus apa pun (hanya simulasi dengan delay acak).                                                   |<!--id-->
| -v, --version                    | Tampilkan versi npkill                                                                                        |<!--id-->
<!--id-->
**Peringatan:** _Di versi mendatang, beberapa perintah mungkin berubah._<!--id-->
<!--id-->
<a name="examples"></a><!--id-->
<!--id-->
## Contoh<!--id-->
<!--id-->
- Cari direktori **node_modules** di direktori _projects_ Anda:<!--id-->
<!--id-->
```bash<!--id-->
npkill -d ~/projects<!--id-->
<!--id-->
# alternatif lain:<!--id-->
cd ~/projects<!--id-->
npkill<!--id-->
```<!--id-->
<!--id-->
- Daftar direktori bernama "dist" dan tampilkan kesalahan jika ada:<!--id-->
<!--id-->
```bash<!--id-->
npkill --target dist -e<!--id-->
```<!--id-->
<!--id-->
- Tampilkan kursor warna magenta... karena saya suka magenta!<!--id-->
<!--id-->
```bash<!--id-->
npkill --color magenta<!--id-->
```<!--id-->
<!--id-->
- Daftar direktori **vendor** di _projects_, urutkan berdasarkan ukuran, dan tampilkan ukuran dalam GB:<!--id-->
<!--id-->
```bash<!--id-->
npkill -d '~/more projects' -gb --sort size --target vendor<!--id-->
```<!--id-->
<!--id-->
- Secara otomatis hapus semua _node_modules_ di folder cadangan Anda:<!--id-->
<!--id-->
```bash<!--id-->
npkill -d ~/backups/ --delete-all<!--id-->
```<!--id-->
<!--id-->
<a name="setup-locally"></a><!--id-->
<!--id-->
# :pager: Pengaturan Lokal<!--id-->
<!--id-->
```bash<!--id-->
# -- Pertama, kloning repositori<!--id-->
git clone https://github.com/voidcosmos/npkill.git<!--id-->
<!--id-->
# -- Masuk ke direktori<!--id-->
cd npkill<!--id-->
<!--id-->
# -- Instal dependensi<!--id-->
npm install<!--id-->
<!--id-->
# -- Dan jalankan!<!--id-->
npm run start<!--id-->
<!--id-->
# -- Jika ingin menjalankannya dengan parameter, tambahkan "--" seperti contoh berikut:<!--id-->
npm run start -- -f -e<!--id-->
```<!--id-->
<!--id-->
<a name="roadmap"></a><!--id-->
<!--id-->
# :crystal_ball: Peta Jalan<!--id-->
<!--id-->
- [x] Rilis versi 0.1.0!<!--id-->
- [x] Tingkatkan kode<!--id-->
  - [x] Tingkatkan performa<!--id-->
  - [ ] Tingkatkan performa lebih lanjut!<!--id-->
- [x] Urutkan hasil berdasarkan ukuran dan jalur<!--id-->
- [x] Izinkan pencarian untuk jenis direktori (target) lainnya<!--id-->
- [ ] Kurangi dependensi agar minimalis<!--id-->
- [ ] Filter berdasarkan waktu terakhir penggunaan<!--id-->
- [ ] Tampilkan direktori dalam format tree<!--id-->
- [x] Tambahkan beberapa menu<!--id-->
- [x] Tambahkan log<!--id-->
- [ ] Pembersihan otomatis berkala (?)<!--id-->
<!--id-->
<a name="known-bugs"></a><!--id-->
<!--id-->
# :bug: Bug yang Diketahui :bug:<!--id-->
<!--id-->
- CLI terkadang berhenti saat menghapus folder.<!--id-->
- Beberapa terminal tanpa TTY (seperti Git Bash di Windows) tidak bekerja.<!--id-->
- Mengurutkan berdasarkan jalur dapat memperlambat terminal dengan banyak hasil.<!--id-->
- Perhitungan ukuran kadang lebih besar dari seharusnya.<!--id-->
- (TERPECAHKAN) Masalah performa pada direktori tingkat tinggi (seperti / di Linux).<!--id-->
- (TERPECAHKAN) Teks terkadang kacau saat CLI diperbarui.<!--id-->
- (TERPECAHKAN) Analisis ukuran direktori memakan waktu lebih lama dari seharusnya.<!--id-->
<!--id-->
> Jika menemukan bug, jangan ragu untuk membuka issue. :)<!--id-->
<!--id-->
<a name="contributing"></a><!--id-->
<!--id-->
# :revolving_hearts: Kontribusi<!--id-->
<!--id-->
Jika ingin berkontribusi, cek [CONTRIBUTING.md](.github/CONTRIBUTING.md).<!--id-->
<!--id-->
<a name="donations"></a><!--id-->
<!--id-->
# :coffee: Buy us a coffee<!--id-->
<!--id-->
<img align="right" width="300" src="https://npkill.js.org/img/cat-donation-cup.png"><!--id-->
Kami mengembangkan npkill di waktu luang karena kami mencintai pemrograman.<!--id-->
<!--id-->
Kami akan terus mengerjakan ini, tetapi donasi adalah salah satu cara mendukung apa yang kami lakukan.<!--id-->
<!--id-->
<span class="badge-opencollective"><a href="https://opencollective.com/npkill/contribute" title="Donate to this project using Open Collective"><img src="https://img.shields.io/badge/open%20collective-donate-green.svg" alt="Open Collective donate button" /></a></span><!--id-->
<!--id-->
### Terima Kasih!!<!--id-->
<!--id-->
## Terima kasih banyak kepada pendukung kami :heart:<!--id-->
<!--id-->
<a href="https://opencollective.com/npkill#backers" target="_blank"><img width="535" src="https://opencollective.com/npkill/tiers/backer.svg?width=535"></a><!--id-->
<!--id-->
---<!--id-->
<!--id-->
### Alternatif Crypto<!--id-->
<!--id-->
- btc: 1ML2DihUoFTqhoQnrWy4WLxKbVYkUXpMAX<!--id-->
- bch: 1HVpaicQL5jWKkbChgPf6cvkH8nyktVnVk<!--id-->
- eth: 0x7668e86c8bdb52034606db5aa0d2d4d73a0d4259<!--id-->
<!--id-->
<a name="license"></a><!--id-->
<!--id-->
# :scroll: Lisensi<!--id-->
<!--id-->
MIT © [Nya García Gallardo](https://github.com/NyaGarcia) dan [Juan Torres Gómez](https://github.com/zaldih)<!--id-->
<!--id-->
:cat::baby_chick:<!--id-->
<!--id-->
---<!--id-->
<p align="center"><!--pt-->
  <img src="https://npkill.js.org/img/npkill-text-outlined.svg" width="320" alt="npkill logo" /><!--pt-->
  <img src="https://npkill.js.org/img/npkill-scope-mono.svg" width="50" alt="npkill logo scope" /><!--pt-->
</p><!--pt-->
<p align="center"><!--pt-->
<img alt="npm" src="https://img.shields.io/npm/dy/npkill.svg"><!--pt-->
<a href="#donations"><img src="https://img.shields.io/badge/donate-<3-red" alt="Donations Badge"/></a><!--pt-->
<img alt="npm version" src="https://img.shields.io/npm/v/npkill.svg"><!--pt-->
<img alt="NPM" src="https://img.shields.io/npm/l/npkill.svg"><!--pt-->
</p><!--pt-->
<!--pt-->
### Encontre e **remova** facilemente pastas <font color="red">**node_modules**</font> antigas e pesadas :sparkles:<!--pt-->
<!--pt-->
<p align="center"><!--pt-->
  <img src="/docs/npkill-demo-0.10.0.gif" alt="npkill demo GIF" /><!--pt-->
</p><!--pt-->
<!--pt-->
Esta ferramenta permite que você liste as pastas _node_modules_ em seu sistema, bem como o espaço que ocupam. Então você pode selecionar quais deles deseja apagar para liberar espaço. ¡Yay!<!--pt-->
<!--pt-->
## i18n<!--pt-->
<!--pt-->
Estamos fazendo esforço para internacionalizar a documentação do Npkill. Aqui está uma lista das traduções disponíveis:<!--pt-->
<!--pt-->
- [Español](./README.es.md)<!--pt-->
- [Português](./README.pt.md)<!--pt-->
<!--pt-->
## Table of Contents<!--pt-->
<!--pt-->
- [Funcionalidades](#features)<!--pt-->
- [Instalação](#installation)<!--pt-->
- [Utilização](#usage)<!--pt-->
  - [Opções](#options)<!--pt-->
  - [Exemplos](#examples)<!--pt-->
- [Configurar localmente](#setup-locally)<!--pt-->
- [Roteiro](#roadmap)<!--pt-->
- [Problemas conhecidos](#known-bugs)<!--pt-->
- [Contribuindo](#contributing)<!--pt-->
- [Compre-nos um café](#donations)<!--pt-->
- [Licença](#license)<!--pt-->
<!--pt-->
<a name="features"></a><!--pt-->
<!--pt-->
# :heavy_check_mark: Funcionalidades<!--pt-->
<!--pt-->
- **Liberar espaço:** Livre-se dos antigos e empoeirados node_modules que ocupam espaço em sua máquina.<!--pt-->
<!--pt-->
- **Último Uso do Espaço de Trabalho**: Verifique quando foi a última vez que você modificou um arquivo no espaço de trabalho (indicado na coluna **última_modificação**).<!--pt-->
<!--pt-->
- **Muito rápido:** O NPKILL é escrito em TypeScript, mas as pesquisas são realizadas em um nível baixo, melhorando muito o desempenho.<!--pt-->
<!--pt-->
- **Fácil de usar:** Diga adeus aos comandos longos. Usar o npkill é tão simples quanto ler uma lista de seus node_modules e pressionar Delete para se livrar deles. Pode ser mais fácil do que isso? ;)<!--pt-->
<!--pt-->
- **Minificado:** Ele mal possui dependências.<!--pt-->
<!--pt-->
<a name="installation"></a><!--pt-->
<!--pt-->
# :cloud: Instalação<!--pt-->
<!--pt-->
Você nem precisa instalá-lo para usar!<!--pt-->
Basta usar o seguinte comando:<!--pt-->
<!--pt-->
```bash<!--pt-->
$ npx npkill<!--pt-->
```<!--pt-->
<!--pt-->
Ou, se por algum motivo você realmente deseja instalá-lo:<!--pt-->
<!--pt-->
```bash<!--pt-->
$ npm i -g npkill<!--pt-->
# Usuários do Unix podem precisar executar o comando com sudo. Tome cuidado.<!--pt-->
```<!--pt-->
<!--pt-->
> O NPKILL não suporta versões node<v14. Se isso afeta você, use npkill@0.8.3.<!--pt-->
<!--pt-->
<a name="usage"></a><!--pt-->
<!--pt-->
# :clipboard: Utilização<!--pt-->
<!--pt-->
```bash<!--pt-->
$ npx npkill<!--pt-->
# ou apenas npkill se você instalou globalmente<!--pt-->
```<!--pt-->
<!--pt-->
Por padrão, o npkill fará a varredura em busca de node_modules a partir do local onde o comando npkill é executado.<!--pt-->
<!--pt-->
Para mover entre as pastas listadas, utilize as teclas <kbd>↓</kbd> e <kbd>↑</kbd>, e use <kbd>Space</kbd> ou <kbd>Del</kbd> para excluir a pasta selecionada.<!--pt-->
Você também pode usar <kbd>j</kbd> e <kbd>k</kbd> para se mover entre os resultados.<!--pt-->
<!--pt-->
Para abrir o diretório onde o resultado selecionado está localizado, pressione <kbd>o</kbd>.<!--pt-->
<!--pt-->
Para sair, use <kbd>Q</kbd> ou <kbd>Ctrl</kbd> + <kbd>c</kbd> se você estiver se sentindo corajoso.<!--pt-->
<!--pt-->
**Importante!** Algumas aplicações instaladas no sistema precisam do diretório node_modules delas para funcionar, e excluí-los pode quebrá-las. O NPKILL irá destacá-los exibindo um :warning: para que você tenha cuidado.<!--pt-->
<!--pt-->
<a name="options"></a><!--pt-->
<!--pt-->
## Opções<!--pt-->
<!--pt-->
| Comando                          | Descrição                                                                                                                                                           |<!--pt-->
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |<!--pt-->
| -c, --bg-color                   | Troca a cor de destaque da linha. _(Disponível: **blue**, cyan, magenta, white, red e yellow)_                                                                      |<!--pt-->
| -d, --directory                  | Defina o diretório a partir do qual iniciar a pesquisa. Por padrão, o ponto de partida é a raiz is .                                                                |<!--pt-->
| -D, --delete-all                 | Exclui automaticamente todos os node_modules encontrados. Recomendado para usar junto com `-x`                                                                      |<!--pt-->
| -e, --hide-errors                | Oculta erros                                                                                                                                                        |<!--pt-->
| -E, --exclude                    | Excluir diretórios da pesquisa (a lista de diretórios deve estar entre aspas duplas "", com cada diretório separado por vírgula ','). Exemplo: "ignorar1, ignorar2" |<!--pt-->
| -f, --full                       | Iniciar a pesquisa a partir do diretório pessoal do usuário (exemplo: "/home/user" no Linux)                                                                        |<!--pt-->
| -gb                              | Mostra as pastas em Gigabytes ao invés de Megabytes.                                                                                                                |<!--pt-->
| -h, --help, ?                    | Mostrar a página de ajuda e sair                                                                                                                                    |<!--pt-->
| -nu, --no-check-update           | Não verificar atualizações na inicialização                                                                                                                         |<!--pt-->
| -s, --sort                       | Ordenar resultados por: `size` (tamanho), `path`(localização) ou `last-mod`(última modificação)                                                                     |<!--pt-->
| -t, --target                     | Especifique o nome dos diretórios que deseja pesquisar (por padrão, é node_modules)                                                                                 |<!--pt-->
| -x, --exclude-hidden-directories | Excluir diretórios ocultos ("diretórios com ponto") da pesquisa.                                                                                                    |<!--pt-->
| --dry-run                        | Não exclui nada (irá simular com um atraso aleatório).                                                                                                              |<!--pt-->
| -v, --version                    | Mostrar versão do npkill                                                                                                                                            |<!--pt-->
<!--pt-->
**Aviso:** _No futuro alguns comandos podem mudar_<!--pt-->
<!--pt-->
<a name="examples"></a><!--pt-->
<!--pt-->
## Examples<!--pt-->
<!--pt-->
- Busque pastas **node_modules** no seu diretório de projetos:<!--pt-->
<!--pt-->
```bash<!--pt-->
npkill -d ~/projetos<!--pt-->
<!--pt-->
# alternativa:<!--pt-->
cd ~/projetos<!--pt-->
npkill<!--pt-->
```<!--pt-->
<!--pt-->
- Listar diretórios com o nome "dist" e mostrar erros, se houver algum:<!--pt-->
<!--pt-->
```bash<!--pt-->
npkill --target dist -e<!--pt-->
```<!--pt-->
<!--pt-->
- Exibe o cursor na cor magenta... porque eu gosto de magenta!<!--pt-->
<!--pt-->
```bash<!--pt-->
npkill --bg-color magenta<!--pt-->
```<!--pt-->
<!--pt-->
- Listar pastas **vendor** no seu diretório de _projetos_, ordenar por tamanho e mostrar o tamanho em GB:<!--pt-->
<!--pt-->
```bash<!--pt-->
npkill -d '~/more projetos' -gb --sort size --target vendor<!--pt-->
```<!--pt-->
<!--pt-->
- Listar **node_modules** no seu diretório de _projetos_, exceto nas pastas _progresso_ e _ignorar_:<!--pt-->
<!--pt-->
```bash<!--pt-->
npkill -d 'projetos' --exclude "progresso, ignorar"<!--pt-->
```<!--pt-->
<!--pt-->
- Exclua automaticamente todos os node_modules que tenham entrado em seus backups:<!--pt-->
<!--pt-->
```bash<!--pt-->
npkill -d ~/backups/ --delete-all<!--pt-->
```<!--pt-->
<!--pt-->
<a name="setup-locally"></a><!--pt-->
<!--pt-->
# :pager: Configurar localmente<!--pt-->
<!--pt-->
```bash<!--pt-->
# -- Primeiramente, clone o repositório<!--pt-->
git clone https://github.com/voidcosmos/npkill.git<!--pt-->
<!--pt-->
# -- Acesse a pasta<!--pt-->
cd npkill<!--pt-->
<!--pt-->
# -- Instale as dependências<!--pt-->
npm install<!--pt-->
<!--pt-->
# -- E rode!<!--pt-->
npm run start<!--pt-->
<!--pt-->
<!--pt-->
# -- Se você deseja executá-lo com algum parâmetro, você terá que adicionar "--" como no seguinte exemplo:<!--pt-->
npm run start -- -f -e<!--pt-->
```<!--pt-->
<!--pt-->
<a name="roadmap"></a><!--pt-->
<!--pt-->
# :crystal_ball: Roteiro<!--pt-->
<!--pt-->
- [x] Lançamento 0.1.0 !<!--pt-->
- [x] Melhorias de código<!--pt-->
  - [x] Melhorias de performance<!--pt-->
  - [ ] Ainda mais melhorias de performance!<!--pt-->
- [x] Ordenação de resultados por tamanho e localização<!--pt-->
- [x] Permitir a pesquisa por outros tipos de diretórios (alvo)<!--pt-->
- [ ] Reduzir as dependências para tornar o módulo mais minimalista<!--pt-->
- [ ] Permitir filtrar por diretórios que não foram usados em um período de tempo<!--pt-->
- [ ] Criar opção para mostrar as pastas em formato de árvore<!--pt-->
- [x] Adicionar menus<!--pt-->
- [x] Adicionar logs<!--pt-->
- [ ] Limpeza automatizada periódica (?)<!--pt-->
<!--pt-->
<a name="known-bugs"></a><!--pt-->
<!--pt-->
# :bug: Problemas conhecidos :bug:<!--pt-->
<!--pt-->
- Às vezes, a CLI fica bloqueada enquanto a pasta está sendo excluída.<!--pt-->
- Alguns terminais que não utilizam TTY (como o git bash no Windows) não funcionam.<!--pt-->
- A ordenação, especialmente por rotas, pode deixar o terminal mais lento quando há muitos resultados ao mesmo tempo.<!--pt-->
- Às vezes, os cálculos de tamanho são maiores do que deveriam ser.<!--pt-->
- (RESOLVIDO) Problemas de desempenho ao pesquisar em diretórios de alto nível (como / no Linux).<!--pt-->
- (RESOLVIDO) Às vezes, o texto se desfaz ao atualizar a interface de linha de comando (CLI).<!--pt-->
- (RESOLVIDO) A análise do tamanho dos diretórios leva mais tempo do que deveria.<!--pt-->
<!--pt-->
> Se você encontrar algum erro, não hesite em abrir uma solicitação (via issue) :)<!--pt-->
<!--pt-->
<a name="contributing"></a><!--pt-->
<!--pt-->
# :revolving_hearts: Contribuindo<!--pt-->
<!--pt-->
Se você quer contribuir confira o [CONTRIBUTING.md](.github/CONTRIBUTING.md)<!--pt-->
<!--pt-->
<a name="donations"></a><!--pt-->
<!--pt-->
# :coffee: Compre-nos um café<!--pt-->
<!--pt-->
<img align="right" width="300" src="https://npkill.js.org/img/cat-donation-cup.png"><!--pt-->
Desenvolvemos o npkill em nosso tempo livre, porque somos apaixonados pelo setor de programação. Amanhã, gostaríamos de nos dedicar mais a isso, mas antes, temos um longo caminho a percorrer.<!--pt-->
<!--pt-->
Continuaremos a fazer as coisas de qualquer maneira, mas as doações são uma das muitas formas de apoiar o que fazemos.<!--pt-->
<!--pt-->
<span class="badge-opencollective"><a href="https://opencollective.com/npkill/contribute" title="Faça uma doação para este projeto usando o Open Collective"><img src="https://img.shields.io/badge/open%20collective-donate-green.svg" alt="Open Collective donate button" /></a></span><!--pt-->
<!--pt-->
### Obrigado!!<!--pt-->
<!--pt-->
## Um enorme agradecimento aos nossos apoiadores :heart:<!--pt-->
<!--pt-->
<a href="https://opencollective.com/npkill#backers" target="_blank"><img width="535" src="https://opencollective.com/npkill/tiers/backer.svg?width=535"></a><!--pt-->
<!--pt-->
---<!--pt-->
<!--pt-->
### via Crypto<!--pt-->
<!--pt-->
- btc: 1ML2DihUoFTqhoQnrWy4WLxKbVYkUXpMAX<!--pt-->
- bch: 1HVpaicQL5jWKkbChgPf6cvkH8nyktVnVk<!--pt-->
- eth: 0x7668e86c8bdb52034606db5aa0d2d4d73a0d4259<!--pt-->
<!--pt-->
<a name="license"></a><!--pt-->
<!--pt-->
# :scroll: Licença<!--pt-->
<!--pt-->
MIT © [Nya García Gallardo](https://github.com/NyaGarcia) e [Juan Torres Gómez](https://github.com/zaldih)<!--pt-->
<!--pt-->
:cat::baby_chick:<!--pt-->
<!--pt-->
---<!--pt-->
<p align="center"><!--tr-->
  <img src="https://npkill.js.org/img/npkill-text-outlined.svg" width="320" alt="npkill logo" /><!--tr-->
  <img src="https://npkill.js.org/img/npkill-scope-mono.svg" width="50" alt="npkill logo scope" /><!--tr-->
</p><!--tr-->
<p align="center"><!--tr-->
<img alt="npm" src="https://img.shields.io/npm/dy/npkill.svg"><!--tr-->
<a href="#donations"><img src="https://img.shields.io/badge/donate-<3-red" alt="Donations Badge"/></a><!--tr-->
<img alt="npm version" src="https://img.shields.io/npm/v/npkill.svg"><!--tr-->
<img alt="NPM" src="https://img.shields.io/npm/l/npkill.svg"><!--tr-->
</p><!--tr-->
<!--tr-->
### Eski ve büyük <font color="red">**node_modules**</font> klasörlerini kolayca bulun ve **silin** :sparkles:<!--tr-->
<!--tr-->
<p align="center"><!--tr-->
  <img src="/docs/npkill-demo-0.10.0.gif" alt="npkill demo GIF" /><!--tr-->
</p><!--tr-->
<!--tr-->
Bu araç, sisteminizdeki tüm _node_modules_ dizinlerini ve kapladıkları alanı listelemenizi sağlar. Daha sonra, hangilerini silmek istediğinizi seçerek yer açabilirsiniz. Yaşasın!<!--tr-->
<!--tr-->
## i18n<!--tr-->
<!--tr-->
Npkill dokümantasyonunu uluslararası hale getirmek için çaba gösteriyoruz. İşte mevcut çevirilerin listesi:<!--tr-->
<!--tr-->
- [Endonezce](./README.id.md)<!--tr-->
- [İspanyolca](./README.es.md)<!--tr-->
- [Portekizce](./README.pt.md)<!--tr-->
- [Türkçe](./README.tr.md)<!--tr-->
<!--tr-->
## İçindekiler<!--tr-->
<!--tr-->
- [Özellikler](#features)<!--tr-->
- [Kurulum](#installation)<!--tr-->
- [Kullanım](#usage)<!--tr-->
  - [Seçenekler](#options)<!--tr-->
  - [Örnekler](#examples)<!--tr-->
- [Yerel Kurulum](#setup-locally)<!--tr-->
- [Yol Haritası](#roadmap)<!--tr-->
- [Bilinen Hatalar](#known-bugs)<!--tr-->
- [Katkıda Bulunma](#contributing)<!--tr-->
- [Kahve Ismarlayın](#donations)<!--tr-->
- [Lisans](#license)<!--tr-->
<!--tr-->
<a name="features"></a><!--tr-->
<!--tr-->
# :heavy_check_mark: Özellikler<!--tr-->
<!--tr-->
- **Alan Açın:** Makinenizde birikmiş, eski ve tozlu _node_modules_ klasörlerinden kurtulun.<!--tr-->
<!--tr-->
- **Son Çalışma Alanı Kullanımı**: Çalışma alanındaki bir dosyayı en son ne zaman değiştirdiğinizi kontrol edin (bu, **last_mod** sütununda gösterilir).<!--tr-->
<!--tr-->
- **Çok Hızlı:** NPKILL TypeScript ile yazılmıştır, ancak aramalar düşük seviyede gerçekleştirilerek performans büyük ölçüde artırılır.<!--tr-->
<!--tr-->
- **Kullanımı Kolay:** Uzun komutlara elveda deyin. NPKILL kullanmak, node_modules listenizi okumak ve silmek için Del tuşuna basmak kadar basittir. Daha kolay olabilir mi? ;)<!--tr-->
<!--tr-->
- **Düşük Bağımlılık:** Hiçbir bağımlılığı yok denecek kadar az.<!--tr-->
<!--tr-->
<a name="installation"></a><!--tr-->
<!--tr-->
# :cloud: Kurulum<!--tr-->
<!--tr-->
Kullanmak için gerçekten yüklemenize gerek yok!<!--tr-->
Basitçe aşağıdaki komutu kullanabilirsiniz:<!--tr-->
<!--tr-->
```bash<!--tr-->
$ npx npkill<!--tr-->
```<!--tr-->
<!--tr-->
Ya da herhangi bir nedenle gerçekten yüklemek isterseniz:<!--tr-->
<!--tr-->
```bash<!--tr-->
$ npm i -g npkill<!--tr-->
# Unix kullanıcılarının komutu sudo ile çalıştırması gerekebilir. Dikkatli olun.<!--tr-->
```<!--tr-->
<!--tr-->
> NPKILL, Node 14’ten düşük sürümleri desteklemiyor. Eğer bu durum sizi etkiliyorsa, `npkill@0.8.3` sürümünü kullanabilirsiniz.<!--tr-->
<!--tr-->
<a name="usage"></a><!--tr-->
<!--tr-->
# :clipboard: Kullanım<!--tr-->
<!--tr-->
```bash<!--tr-->
$ npx npkill<!--tr-->
# Ya da global olarak yüklüyse sadece npkill kullanabilirsiniz.<!--tr-->
```<!--tr-->
<!--tr-->
Varsayılan olarak, npkill `npkill` komutunun çalıştırıldığı dizinden başlayarak node_modules klasörlerini tarar.<!--tr-->
<!--tr-->
Listelenen klasörler arasında <kbd>↓</kbd> ve <kbd>↑</kbd> tuşlarıyla gezinebilir, seçili klasörü silmek için <kbd>Space</kbd> veya <kbd>Del</kbd> tuşlarını kullanabilirsiniz.<!--tr-->
Ayrıca sonuçlar arasında gezinmek için <kbd>j</kbd> ve <kbd>k</kbd> tuşlarını da kullanabilirsiniz.<!--tr-->
<!--tr-->
Seçili sonucun bulunduğu klasörü açmak için <kbd>o</kbd> tuşuna basabilirsiniz.<!--tr-->
<!--tr-->
Çıkmak için, <kbd>Q</kbd> ya da <kbd>Ctrl</kbd> + <kbd>C</kbd>.<!--tr-->
<!--tr-->
**Önemli!** Sisteme kurulu bazı uygulamaların çalışması için node_modules klasörüne ihtiyacı vardır ve bu klasörlerin silinmesi uygulamaların bozulmasına yol açabilir. NPKILL, dikkatli olmanız için bu klasörleri :warning: simgesiyle vurgulayacaktır.<!--tr-->
<!--tr-->
<a name="options"></a><!--tr-->
<!--tr-->
## Seçenekler<!--tr-->
<!--tr-->
| ARGÜMAN                          | AÇIKLAMA                                                                                                                                         |<!--tr-->
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |<!--tr-->
| -c, --bg-color                   | Satır vurgulama rengini değiştirin. _(Mevcut seçenekler: **mavi**, cam göbeği, eflatun, beyaz, kırmızı ve sarı)_                                 |<!--tr-->
| -d, --directory                  | Aramaya başlanacak dizini ayarlayın. Varsayılan başlangıç noktası . olarak belirlenmiştir.                                                       |<!--tr-->
| -D, --delete-all                 | Bulunan tüm node_modules klasörlerini otomatik olarak siler. `-x` ile birlikte kullanılması önerilir.                                            |<!--tr-->
| -e, --hide-errors                | Varsa hataları gizler                                                                                                                            |<!--tr-->
| -E, --exclude                    | Aramadan hariç tutulacak dizinleri belirtin (dizin listesi çift tırnak içinde "", dizinler virgülle ',' ayrılmalıdır). Örnek: "ignore1, ignore2" |<!--tr-->
| -f, --full                       | Aramaya kullanıcının ev dizininden başlayın (örneğin Linux'ta "/home/user").                                                                     |<!--tr-->
| -gb                              | Klasörleri Megabytes yerine Gigabytes olarak göster.                                                                                             |<!--tr-->
| -h, --help, ?                    | Bu yardım sayfasını göster ve çık.                                                                                                               |<!--tr-->
| -nu, --no-check-update           | Başlangıçta güncellemeleri kontrol etme.                                                                                                         |<!--tr-->
| -s, --sort                       | Sonuçları şu kriterlere göre sırala: `size`, `path` veya `last-mod`                                                                              |<!--tr-->
| -t, --target                     | Aramak istediğiniz dizinlerin adını belirtin (varsayılan olarak node_modules).                                                                   |<!--tr-->
| -x, --exclude-hidden-directories | Gizli dizinleri ("nokta" dizinleri) arama kapsamı dışında bırak.                                                                                 |<!--tr-->
| --dry-run                        | Hiçbir şeyi silmez (rastgele bir gecikme ile simüle eder).                                                                                       |<!--tr-->
| -v, --version                    | npkill sürümünü gösterir.                                                                                                                        |<!--tr-->
<!--tr-->
**Uyarı:** _Gelecek sürümlerde bazı komutlar değişebilir_<!--tr-->
<!--tr-->
<a name="examples"></a><!--tr-->
<!--tr-->
## Örnekler<!--tr-->
<!--tr-->
- _projects_ dizininizdeki **node_modules** klasörlerini arayın:<!--tr-->
<!--tr-->
```bash<!--tr-->
npkill -d ~/projects<!--tr-->
<!--tr-->
# diğer alternatif:<!--tr-->
cd ~/projects<!--tr-->
npkill<!--tr-->
```<!--tr-->
<!--tr-->
- "dist" adlı dizinleri listeleyin ve hata oluşursa gösterin.<!--tr-->
<!--tr-->
```bash<!--tr-->
npkill --target dist -e<!--tr-->
```<!--tr-->
<!--tr-->
- Mor renkli imleç gösterilir... çünkü moru seviyorum!<!--tr-->
<!--tr-->
```bash<!--tr-->
npkill --color magenta<!--tr-->
```<!--tr-->
<!--tr-->
- _projects_ dizininizdeki **vendor** klasörlerini listeleyin, boyuta göre sırala ve boyutları GB cinsinden göster:<!--tr-->
<!--tr-->
```bash<!--tr-->
npkill -d '~/more projects' -gb --sort size --target vendor<!--tr-->
```<!--tr-->
<!--tr-->
- _projects_ dizininizdeki **node_modules** klasörlerini listeleyin, ancak _progress_ ve _ignore-this_ dizinlerindeki klasörleri hariç tutun:<!--tr-->
<!--tr-->
```bash<!--tr-->
npkill -d 'projects' --exclude "progress, ignore-this"<!--tr-->
```<!--tr-->
<!--tr-->
- Yedeklerinize gizlice karışmış tüm node_modules klasörlerini otomatik olarak silin:<!--tr-->
<!--tr-->
```bash<!--tr-->
npkill -d ~/backups/ --delete-all<!--tr-->
```<!--tr-->
<!--tr-->
<a name="setup-locally"></a><!--tr-->
<!--tr-->
# :pager: Yerel Kurulum<!--tr-->
<!--tr-->
```bash<!--tr-->
# -- Öncelikle, repoyu klonlayın.<!--tr-->
git clone https://github.com/voidcosmos/npkill.git<!--tr-->
<!--tr-->
# -- Dizin içine gidin<!--tr-->
cd npkill<!--tr-->
<!--tr-->
# -- Bağımlılıkları yükleyin<!--tr-->
npm install<!--tr-->
<!--tr-->
# -- Ve çalıştırın!<!--tr-->
npm run start<!--tr-->
<!--tr-->
<!--tr-->
# -- Eğer bazı parametrelerle çalıştırmak istiyorsanız, aşağıdaki örnekte olduğu gibi "--" eklemeniz gerekir:<!--tr-->
npm run start -- -f -e<!--tr-->
```<!--tr-->
<!--tr-->
<a name="roadmap"></a><!--tr-->
<!--tr-->
# :crystal_ball: Yol Haritası<!--tr-->
<!--tr-->
- [x] 0.1.0 yayınla!<!--tr-->
- [x] Kodu geliştir<!--tr-->
  - [x] Performansı iyileştir<!--tr-->
  - [ ] Performansı daha da iyileştir!<!--tr-->
- [x] Sonuçları boyuta ve yola göre sırala<!--tr-->
- [x] Diğer türde dizinlerin (hedeflerin) aranmasına izin ver<!--tr-->
- [ ] Daha minimalist bir modül olması için bağımlılıkları azalt<!--tr-->
- [ ] Belirli bir süredir kullanılmayan dizinlere göre filtreleme yapmaya izin ver<!--tr-->
- [ ] Dizinleri ağaç biçiminde göstermek için bir seçenek oluştur<!--tr-->
- [x] Bazı menüler ekle<!--tr-->
- [x] Log servisi ekle<!--tr-->
- [ ] Periyodik ve otomatik temizlik (?)<!--tr-->
<!--tr-->
<a name="known-bugs"></a><!--tr-->
<!--tr-->
# :bug: Bilinen Hatalar :bug:<!--tr-->
<!--tr-->
- Bazen klasör silinirken CLI kilitlenebilir.<!--tr-->
- TTY kullanmayan bazı terminaller (örneğin Windows’taki Git Bash) çalışmaz.<!--tr-->
- Özellikle yol (path) bazında sıralama, çok sayıda olduğunda terminali yavaşlatabilir.<!--tr-->
- Bazen, boyut hesaplamaları olması gerekenden daha yüksek çıkabilir.<!--tr-->
- (ÇÖZÜLDÜ) Yüksek seviyeli dizinlerden (örneğin Linux'taki / dizini) arama yaparken performans sorunları yaşanabilir.<!--tr-->
- (ÇÖZÜLDÜ) Bazen CLI güncellenirken metinler bozuluyor.<!--tr-->
- (ÇÖZÜLDÜ) Dizinlerin boyutunu analiz etmek olması gerekenden daha uzun sürüyor.<!--tr-->
<!--tr-->
> Eğer herhangi bir hata bulursanız, çekinmeden bir issue açın :)<!--tr-->
<!--tr-->
<a name="contributing"></a><!--tr-->
<!--tr-->
# :revolving_hearts: Katkıda Bulunma<!--tr-->
<!--tr-->
Katkıda bulunmak isterseniz [CONTRIBUTING.md](.github/CONTRIBUTING.md) dosyasını inceleyin.<!--tr-->
<!--tr-->
<a name="donations"></a><!--tr-->
<!--tr-->
# :coffee: Bize bir kahve ısmarlayın<!--tr-->
<!--tr-->
<img align="right" width="300" src="https://npkill.js.org/img/cat-donation-cup.png"><!--tr-->
Boş zamanlarımızda, programlama sektörüne olan tutkumuz nedeniyle npkill'i geliştirdik.<!--tr-->
Gelecekte, tamamen buna odaklanmak istiyoruz ama önümüzde uzun bir yol var.<!--tr-->
<!--tr-->
Yine de işlerimizi yapmaya devam edeceğiz, ancak bağışlar yaptığımız işi desteklemenin birçok yolundan sadece biridir.<!--tr-->
<!--tr-->
<span class="badge-opencollective"><a href="https://opencollective.com/npkill/contribute" title="Donate to this project using Open Collective"><img src="https://img.shields.io/badge/open%20collective-donate-green.svg" alt="Open Collective donate button" /></a></span><!--tr-->
<!--tr-->
### Teşekkürler!!<!--tr-->
<!--tr-->
## Destekçilerimize kocaman teşekkürler :heart:<!--tr-->
<!--tr-->
<a href="https://opencollective.com/npkill#backers" target="_blank"><img width="535" src="https://opencollective.com/npkill/tiers/backer.svg?width=535"></a><!--tr-->
<!--tr-->
---<!--tr-->
<!--tr-->
### Kripto alternatifi<!--tr-->
<!--tr-->
- btc: 1ML2DihUoFTqhoQnrWy4WLxKbVYkUXpMAX<!--tr-->
- bch: 1HVpaicQL5jWKkbChgPf6cvkH8nyktVnVk<!--tr-->
- eth: 0x7668e86c8bdb52034606db5aa0d2d4d73a0d4259<!--tr-->
<!--tr-->
<a name="license"></a><!--tr-->
<!--tr-->
# :scroll: Lisans<!--tr-->
<!--tr-->
MIT © [Nya García Gallardo](https://github.com/NyaGarcia) and [Juan Torres Gómez](https://github.com/zaldih)<!--tr-->
<!--tr-->
:cat::baby_chick:<!--tr-->
<!--tr-->
---<!--tr-->
