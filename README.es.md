<p align="center">
  <img src="https://npkill.js.org/img/npkill-text-outlined.svg" width="320" alt="npkill logo" />
  <img src="https://npkill.js.org/img/npkill-scope-mono.svg" width="50" alt="npkill logo scope" />
</p>
<p align="center">
<img alt="npm" src="https://img.shields.io/npm/dy/npkill.svg">
<a href="#donations"><img src="https://img.shields.io/badge/donate-<3-red" alt="Donations Badge"/></a>
<img alt="npm version" src="https://img.shields.io/npm/v/npkill.svg">
<img alt="NPM" src="https://img.shields.io/npm/l/npkill.svg">
</p>

### Encuentra y **destruye** directorios <font color="red">**node_modules**</font> viejos y pesados :sparkles:

<p align="center">
  <img src="/docs/npkill-demo-0.10.0.gif" alt="npkill demo GIF" />
</p>

Esta herramienta te permite listar cualquier directorio _node_modules_ que haya en tu sistema, además del espacio que ocupa. Entonces puedes seleccionar los que quieras borrar para liberar espacio. ¡Yay!

## Table of Contents

- [Características](#features)
- [Instalación](#installation)
- [Uso](#usage)
  - [Opciones](#options)
  - [Ejemplos](#examples)
- [Configuración local](#setup-locally)
- [Roadmap](#roadmap)
- [Bugs conocidos](#known-bugs)
- [Cómo contribuir](#contributing)
- [Invítanos a un café](#donations)
- [Licencia](#license)

<a name="features"></a>

# :heavy_check_mark: Características

- **Libera espacio:** Elimina tus directorios _node_modules_ viejos y polvorientos que le roban espacio a tu máquina.

- **Último uso del Workspace**: Comprueba cuándo ha sido la última vez que has modificado un fichero en el workspace (indicado en la columna **last_mod**).

- **Rapidez:** NPKILL está escrito en TypeScript, pero las búsquedas se llevan a cabo a bajo nivel, lo que supone una mejora considerable del rendimiento.

- **Fácil de utilizar:** Despídete de comandos largos y difíciles. Utilizar Npkill es tan sencillo como leer la lista de tus node_modules, y pulsar la tecla Del para eliminarlos. ¿Podría ser más fácil? ;)

- **Minificado:** Apenas tiene dependencias.

<a name="installation"></a>

# :cloud: Instalación

¡Lo mejor es que no tienes que instalar Npkill para utilizarlo!
Simplemente utiliza el siguiente comando:

```bash
$ npx npkill
```

O, si por alguna razón te apetece instalarlo:

```bash
$ npm i -g npkill
# Los usuarios de Unix quizá tengan que ejecutar el comando con sudo. Ve con cuidado
```

> NPKILL no tiene soporte para node<v14. Si esto te afecta puedes utilizar `npkill@0.8.3`

<a name="usage"></a>

# :clipboard: Uso

```bash
$ npx npkill
# o solo npkill si está instalado de forma global
```

Por defecto, Npkill comenzará la búsqueda de node_modules comenzando en la ruta donde se ejecute el comando `npkill`.

Muévete por los distintos directorios listados con <kbd>↓</kbd> <kbd>↑</kbd>, y utiliza <kbd>Space</kbd> para borrar el directorio seleccionado.

También puedes usar <kbd>j</kbd> y <kbd>k</kbd> para moverte por los resultados.

Puedes abrir el directorio donde se aloja el resultado seleccionado pulsando <kbd>o</kbd>.

Para salir de Npkill, utiliza <kbd>Q</kbd>, o si te sientes valiente, <kbd>Ctrl</kbd> + <kbd>c</kbd>.

**¡Importante!** Algunas aplicaciones que están instaladas en el sistema necesitan su directorio node_modules para funcionar, y borrarlo puede romperlas. NPKILL te mostrará un :warning: para que sepas que tienes que tener cuidado.

<a name="options"></a>

## Opciones

| ARGUMENTO                        | DESCRIPCIÓN                                                                                                                                                    |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| -c, --bg-color                   | Cambia el color de selección de la fila. _(Colores disponibles: **azul**, cyan, magenta, blanco, rojo y amarillo)_                                             |
| -d, --directory                  | Permite seleccionar el directorio desde el que comienza la búsqueda. Por defecto, se empieza en .                                                              |
| -D, --delete-all                 | Borra automáticamente todos los node_modules que se encuentren. Recomendable utilizar junto a `-x`                                                             |
| -e, --hide-errors                | Esconde los errores en el caso de que ocurra alguno                                                                                                            |
| -E, --exclude                    | Excluye directorios de la búsqueda (la lista de directorios debe estar entre comillas dobles "", cada directorio separado por ',' Ejemplo: "ignore1, ignore2") |
| -f, --full                       | Comienza la búsqueda en el home del usuario (ejemplo: "/home/user" en Linux)                                                                                   |
| -gb                              | Muestra el tamaño en Gigabytes en lugar de en Megabytes.                                                                                                       |
| -h, --help, ?                    | Muestra esta página de ayuda y finaliza                                                                                                                        |
| -nu, --no-check-update           | No comprobar si hay actualizaciones al iniciar la aplicación                                                                                                   |
| -s, --sort                       | Ordena los resultados por: `size`, `path` or `last-mod`                                                                                                        |
| -t, --target                     | Especifica el nombre del directorio que se buscará (por defecto es node_modules)                                                                               |
| -x, --exclude-hidden-directories | Excluye directorios ocultos (directorios "dot") de la búsqueda                                                                                                 |
| --dry-run                        | No borra nada (simula un tiempo de borrado aleatorio)                                                                                                          |
| -v, --version                    | Muestra la versión de Npkill                                                                                                                                   |

**Precaución:** _Algunos comandos pueden cambiar en versiones futuras_

<a name="examples"></a>

## Ejemplo

- Busca y encuentra los directorios **node_modules** en un directorio _projects_ :

```bash
npkill -d ~/projects

# otra alternativa:
cd ~/projects
npkill
```

- Lista los directorios llamados "dist" y muestra los errores que ocurran:

```bash
npkill --target dist -e
```

- Muestra el cursor de color magenta... ¡Porque me gusta el magenta!

```bash
npkill --color magenta
```

- Lista los directorios **vendor** en un directorio _projects_, ordenados por tamaño y mostrando el tamaño en gb:

```bash
npkill -d '~/more projects' -gb --sort size --target vendor
```

- Lista los **node_modules** en el directorio _projects_, excluyendo los que están en los directorios _progress_ e _ignore-this_:

```bash
npkill -d 'projects' --exclude "progress, ignore-this"
```

- Borra automáticamente todos los **node_modules** que se encuentren en el directorio _backups_:

```bash
npkill -d ~/backups/ --delete-all
```

<a name="setup-locally"></a>

# :pager: Configuración local

```bash
# -- Primero, clona el repositorio
git clone https://github.com/voidcosmos/npkill.git

# -- Navega al dir
cd npkill

# -- Instala las dependencias
npm install

# -- ¡Y ejecuta!
npm run start


# -- Si quieres ejecutar con algún parámetro, hay que añadir "--", tal y como se muestra a continuación:
npm run start -- -f -e
```

<a name="roadmap"></a>

# :crystal_ball: Roadmap

- [x] Lanzar la versión 0.1.0 !
- [x] Mejorar el código
  - [x] Mejorar el rendimiento
  - [ ] ¡Mejorar el rendimiento aún más!
- [x] Ordenar los resultados por tamaño y ruta
- [x] Permitir la búsqueda de otro tipo de directorios (targets)
- [ ] Reducir las dependencies para ser un módulo más minimalista
- [ ] Permitir el filtrado por directorios que no se hayan utilizado en un periodo de tiempo determinado
- [ ] Crear una opción para mostrar los directorios en formato árbol
- [x] Añadir menús
- [x] Añadir un servicio de logs
- [ ] Limpieza periódica y automática (?)

<a name="known-bugs"></a>

# :bug: Bugs conocidos :bug:

- A veces, el CLI se bloquea mientras un directorio se está borrando.
- Algunas terminales que no utilizan TTY (como git bash en Windows) no funcionan.
- La ordenación, especialmente por rutas, puede ralentizar la terminal cuando haya muchos resultados al mismo tiempo.
- A veces, los cálculos de tamaño son mayores de lo que deberían ser.
- (RESUELTO) Problemas de rendimiento al hacer la búsqueda desde directorios de alto nivel (como / en Linux).
- (RESUELTO) A veces el texto se colapsa al actualizar el CLI.
- (RESUELTO) Analizar el tamaño de los directorios tarda más de lo que debería.

> Si encuentras algún bug, no dudes en abrir un issue :)

<a name="contributing"></a>

# :revolving_hearts: Cómo contribuir

Si quieres contribuir, échale un vistazo al [CONTRIBUTING.md](.github/CONTRIBUTING.es.md)

<a name="donations"></a>

# :coffee: Invítanos a un café

<img align="right" width="300" src="https://npkill.js.org/img/cat-donation-cup.png">
Hemos desarrollado Npkill en nuestro tiempo libre, porque nos apasiona la programación.

El día de mañana nos gustaría dedicarnos al open source completamente, pero antes, nos queda un largo camino por recorrer.

Seguiremos contribuyendo al open source por y para siempre, pero las donaciones son una de las muchas formas de apoyarnos.

¡Invítanos a un café! (O a un té para Nya, la única programadora a la que no le gusta el café).

<span class="badge-opencollective"><a href="https://opencollective.com/npkill/contribute" title="Dona a este proyecto utilizando Open Collective"><img src="https://img.shields.io/badge/open%20collective-donate-green.svg" alt="Botón de donar con Open Collective" /></a></span>

### ¡¡Mil gracias!!

## Muchísimas gracias a todos los que nos han apoyado :heart:

<a href="https://opencollective.com/npkill#backers" target="_blank"><img width="535" src="https://opencollective.com/npkill/tiers/backer.svg?width=535"></a>

---

### Alternativa cripto

- btc: 1ML2DihUoFTqhoQnrWy4WLxKbVYkUXpMAX
- bch: 1HVpaicQL5jWKkbChgPf6cvkH8nyktVnVk
- eth: 0x7668e86c8bdb52034606db5aa0d2d4d73a0d4259

<a name="license"></a>

# :scroll: Licencia

MIT © [Nya García Gallardo](https://github.com/NyaGarcia) y [Juan Torres Gómez](https://github.com/zaldih)

:cat::baby_chick:

---
