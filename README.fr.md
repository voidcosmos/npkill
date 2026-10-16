<p align="center">
  <img src="./docs/npkill-text-clean.svg" width="380" alt="npkill logo" />
</p>
<p align="center">
<img alt="npm" src="https://img.shields.io/npm/dy/npkill.svg">
<a href="#donations"><img src="https://img.shields.io/badge/donate-<3-red" alt="Donations Badge"/></a>
<img alt="npm version" src="https://img.shields.io/npm/v/npkill.svg">
<img alt="NPM" src="https://img.shields.io/npm/l/npkill.svg">
</p>

### Trouvez facilement et **supprimez** les dossiers <font color="red">**node_modules**</font> anciens et volumineux :sparkles:

<p align="center">
  <img src="/docs/npkill-demo-0.10.0.gif" alt="npkill demo GIF" />
</p>

Cet outil vous permet de lister tous les dossiers _node_modules_ sur votre systeme, ainsi que l'espace qu'ils occupent. Vous pouvez ensuite choisir ceux que vous voulez supprimer pour liberer de la place. Yay!

## i18n

Nous faisons des efforts pour internationaliser la documentation de Npkill. Voici la liste des traductions disponibles:

- [Espanol](./README.es.md)
- [Francais](./README.fr.md)
- [Indonesian](./README.id.md)
- [Portugues](./README.pt.md)
- [Turkish](./README.tr.md)

## Table des matieres

- [Fonctionnalites](#features)
- [Installation](#installation)
- [Utilisation](#usage)
  - [Mode multi-selection](#multi-select-mode)
  - [Options](#options)
  - [Exemples](#examples)
  - [Sortie JSON](#json-output)
- [Configuration locale](#setup-locally)
- [API](#API)
- [Feuille de route](#roadmap)
- [Bugs connus](#known-bugs)
- [Contribuer](#contributing)
- [Offrez-nous un cafe](#donations)
- [Licence](#license)

<a name="features"></a>

# :heavy_check_mark: Fonctionnalites

- **Liberez de l'espace:** Debarrassez-vous des vieux _node_modules_ poussiereux qui encombrent votre machine.

- **Derniere utilisation du workspace**: Verifiez la derniere fois ou vous avez modifie un fichier dans le workspace (indique dans la colonne **last_mod**).

- **Tres rapide:** NPKILL est ecrit en TypeScript, mais les recherches sont effectuees a bas niveau, ce qui ameliore grandement les performances.

- **Facile a utiliser:** Dites adieu aux commandes longues. Utiliser npkill est aussi simple que lire la liste de vos node_modules et appuyer sur Del pour les supprimer. Peut-on faire plus simple ? ;)

- **Minimaliste:** Il a tres peu de dependances.

<a name="installation"></a>

# :cloud: Installation

Vous n'avez pas vraiment besoin de l'installer pour l'utiliser !
Utilisez simplement la commande suivante:

```bash
$ npx npkill
```

Ou si, pour une raison quelconque, vous voulez vraiment l'installer:

```bash
$ npm i -g npkill
# Les utilisateurs Unix devront peut-etre executer la commande avec sudo. Soyez prudent
```

> NPKILL ne prend pas en charge node<v14. Si cela vous concerne, vous pouvez utiliser `npkill@0.8.3`

<a name="usage"></a>

# :clipboard: Utilisation

```bash
$ npx npkill
# ou simplement npkill s'il est installe globalement
```

Par defaut, npkill recherche les node_modules a partir du chemin ou la commande `npkill` est executee.

Deplacez-vous entre les dossiers listes avec <kbd>↓</kbd> <kbd>↑</kbd>, et utilisez <kbd>Space</kbd> ou <kbd>Del</kbd> pour supprimer le dossier selectionne.
Vous pouvez aussi utiliser <kbd>j</kbd> et <kbd>k</kbd> pour naviguer entre les resultats.

Vous pouvez ouvrir le repertoire contenant le resultat selectionne en appuyant sur <kbd>o</kbd>.

Pour quitter: <kbd>Q</kbd> ou <kbd>Ctrl</kbd> + <kbd>c</kbd> si vous etes temeraire.

**Important !** Certaines applications installees sur le systeme ont besoin de leur dossier node_modules pour fonctionner, et les supprimer peut les casser. NPKILL les signalera avec un :warning: pour vous inciter a la prudence.

## Mode recherche

Le mode recherche vous permet de filtrer les resultats. C'est particulierement utile pour limiter l'affichage a un chemin precis ou pour s'assurer que seuls les resultats correspondant a une condition donnee soient "tout selectionnes".

Par exemple, vous pouvez utiliser cette expression pour limiter les resultats a ceux qui sont dans le dossier `work` et qui contiennent `data` quelque part dans le chemin: `/work/.*/data`.

Appuyez sur <kbd>/</kbd> pour entrer en mode recherche. Vous pouvez saisir un motif regex pour filtrer les resultats.

Appuyez sur <kbd>Enter</kbd> pour confirmer la recherche et naviguer dans les resultats filtres, ou sur <kbd>Esc</kbd> pour effacer et quitter.

Pour quitter ce mode, laissez vide.

## Mode multi-selection

Ce mode vous permet de selectionner et supprimer plusieurs dossiers a la fois, ce qui est plus efficace pour nettoyer de nombreux repertoires.

### Activer le mode multi-selection

Appuyez sur <kbd>T</kbd> pour activer/desactiver le mode multi-selection. Lorsqu'il est actif, vous verrez un compteur de selection et des instructions supplementaires en haut des resultats.

### Controles

- **<kbd>Space</kbd>**: Activer/desactiver la selection du dossier courant.
- **<kbd>V</kbd>**: Demarrer/terminer le mode de selection par plage.
- **<kbd>A</kbd>**: Tout selectionner/tout deselectionner.
- **<kbd>Enter</kbd>**: Supprimer tous les dossiers selectionnes.
- **<kbd>T</kbd>**: Tout deselectionner et revenir au mode normal.

### Selection par plage

Apres avoir appuye sur <kbd>V</kbd> pour entrer en mode selection par plage:

- Deplacez le curseur avec les fleches, <kbd>j</kbd>/<kbd>k</kbd>, <kbd>Home</kbd>/<kbd>End</kbd>, ou page up/down
- Tous les dossiers entre la position de depart et la position courante du curseur seront selectionnes/deselectionnes
- Appuyez a nouveau sur <kbd>V</kbd> pour quitter le mode selection par plage

<a name="options"></a>

## Options

| ARGUMENT                | DESCRIPTION                                                                                                                                                                   |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| -p, --profiles          | Permet de selectionner le [profile](./docs/profiles.md) (ensemble de cibles) a utiliser. Si aucune option n'est precisee, les profils disponibles sont listes _(**node** par defaut)_. |
| --config                | Chemin vers un fichier de configuration .npkillrc personnalise. Par defaut, npkill cherche d'abord `./.npkillrc`, puis `~/.npkillrc`.                                      |
| -d, --directory         | Definit le repertoire a partir duquel lancer la recherche. Le point de depart par defaut est .                                                                              |
| -D, --delete-all        | Supprime automatiquement tous les dossiers trouves. Il est conseille de l'utiliser avec `-x`.                                                                               |
| -e, --hide-errors       | Cache les erreurs, s'il y en a.                                                                                                                                               |
| -E, --exclude           | Exclut des repertoires de la recherche (la liste doit etre entre guillemets doubles "", chaque repertoire separe par ','). Exemple: "ignore1, ignore2"                   |
| -f, --full              | Lance la recherche depuis le dossier personnel de l'utilisateur (exemple: "/home/user" sous Linux).                                                                        |
| --size-unit             | Definit l'unite d'affichage des tailles de dossiers. _(Disponibles: **auto**, mb, gb)_. Avec auto, les tailles < 1024MB sont affichees en MB (arrondi), au-dela en GB (avec decimales). |
| -h, --help, ?           | Affiche la page d'aide.                                                                                                                                                       |
| -nu, --no-check-update  | Ne verifie pas les mises a jour au demarrage.                                                                                                                                 |
| -s, --sort              | Trie les resultats par: `size`, `path` ou `age`.                                                                                                                             |
| -t, --targets           | Desactive la fonctionnalite des profils et permet de specifier le nom des repertoires a rechercher. Vous pouvez definir plusieurs cibles separees par des virgules. Ex: `-t node_modules,.cache`. |
| -x, --exclude-sensitive | Exclut les repertoires sensibles.                                                                                                                                             |
| -y                      | Evite d'afficher un avertissement lors de l'execution de --delete-all.                                                                                                      |
| --dry-run               | Ne supprime rien (simule avec un delai aleatoire).                                                                                                                           |
| --json                  | Affiche les resultats au format JSON a la fin du scan. Utile pour l'automatisation et le scripting.                                                                         |
| --json-stream           | Affiche les resultats en JSON de maniere continue (un objet JSON par ligne au fur et a mesure). Utile pour du traitement en temps reel.                                    |
| -v, --version           | Affiche la version de npkill.                                                                                                                                                 |

<a name="examples"></a>

## Exemples

- Rechercher les dossiers **node_modules** dans votre repertoire _projects_:

```bash
npkill -d ~/projects

# autre alternative:
cd ~/projects
npkill
```

- Lister les **node_modules** de votre repertoire _projects_, en excluant ceux dans _progress_ et _ignore-this_:

```bash
npkill -d 'projects' --exclude "progress, ignore-this"
```

- Supprimer automatiquement tous les node_modules qui se sont glisses dans vos sauvegardes:

```bash
npkill -d ~/backups/ --delete-all
```

- Obtenir les resultats au format JSON pour automatisation ou traitement ulterieur:

```bash
npkill --json > results.json
```

- Diffuser les resultats en temps reel en JSON (utile pour la supervision ou le piping vers d'autres outils):

```bash
npkill --json-stream | jq '.'
```

- Sauvegarder uniquement les resultats reussis dans un fichier, en ignorant les erreurs:

```bash
npkill --json-stream 2>/dev/null | jq -s '.' > clean-results.json
```

<a name="json-output"></a>

## Sortie JSON

Npkill prend en charge des formats de sortie JSON pour l'automatisation et l'integration avec d'autres outils:

- **`--json`**: Affiche tous les resultats comme un unique objet JSON a la fin du scan
- **`--json-stream`**: Affiche chaque resultat comme un objet JSON distinct en temps reel

Pour une documentation detaillee, des exemples et les interfaces TypeScript, consultez [JSON Output Documentation](./docs/json-output.md).

**Exemples rapides:**

```bash
# Recuperer tous les resultats en JSON
npkill --json > results.json

# Traiter les resultats en temps reel
npkill --json-stream | jq '.result.path'

# Trouver les dossiers plus grands que 100MB
npkill --json | jq '.results[] | select(.size > 104857600)'
```

<a name="setup-locally"></a>

# :pager: Configuration locale

```bash
# -- D'abord, cloner le depot
git clone https://github.com/voidcosmos/npkill.git

# -- Aller dans le repertoire
cd npkill

# -- Installer les dependances
npm install

# -- Et lancer
npm run start


# -- Si vous voulez l'executer avec des parametres, vous devrez ajouter "--" comme dans l'exemple suivant:
npm run start -- -f -e
```

<a name="API"></a>

# :bookmark_tabs: API

L'API vous permet d'interagir avec npkill depuis Node pour creer vos propres implementations dans vos scripts (automatisations, par exemple).

Vous pouvez consulter l'API de base [ici](./API.md) ou sur le web (bientot).

<a name="roadmap"></a>

# :crystal_ball: Feuille de route

- [x] Sortir la version 0.1.0 !
- [x] Ameliorer le code
  - [x] Ameliorer les performances
  - [ ] Ameliorer encore les performances !
- [x] Trier les resultats par taille et par chemin
- [x] Autoriser la recherche d'autres types de repertoires (targets)
- [ ] Reduire les dependances pour un module plus minimaliste
- [ ] Permettre de filtrer les repertoires qui n'ont pas ete utilises depuis un certain temps
- [ ] Creer une option pour afficher les repertoires sous forme d'arborescence
- [x] Ajouter des menus
- [x] Ajouter un service de logs
- [ ] Nettoyage periodique et automatique (?)

<a name="known-bugs"></a>

# :bug: Bugs connus :bug:

- Parfois, la CLI se bloque pendant la suppression d'un dossier.
- Le tri, surtout par chemins, peut ralentir le terminal lorsqu'il y a beaucoup de resultats en meme temps.
- Parfois, les calculs de taille sont plus eleves qu'ils ne devraient l'etre.
- (RESOLU) Problemes de performance lors de recherches depuis des repertoires de haut niveau (comme / sous Linux).
- (RESOLU) Parfois, le texte se compresse lors de la mise a jour de la CLI.
- (RESOLU) L'analyse de la taille des repertoires prend plus de temps qu'elle ne devrait.

> Si vous trouvez un bug, n'hesitez pas a ouvrir une issue :)

<a name="contributing"></a>

# :revolving_hearts: Contribuer

Si vous souhaitez contribuer, consultez [CONTRIBUTING.md](.github/CONTRIBUTING.md)

<a name="donations"></a>

# :coffee: Offrez-nous un cafe

<img align="right" width="300" src="https://npkill.js.org/img/cat-donation-cup.png">
Nous avons developpe npkill sur notre temps libre, car nous sommes passionnes par la programmation.
Demain, nous aimerions nous y consacrer pleinement, mais il y a encore du chemin.

Nous continuerons quoi qu'il arrive, mais les dons sont l'une des nombreuses manieres de soutenir ce que nous faisons.

<span class="badge-opencollective"><a href="https://opencollective.com/npkill/contribute" title="Donate to this project using Open Collective"><img src="https://img.shields.io/badge/open%20collective-donate-green.svg" alt="Open Collective donate button" /></a></span>

### Merci !!

## Un immense merci a nos contributeurs :heart:

<a href="https://opencollective.com/npkill#backers" target="_blank"><img width="535" src="https://opencollective.com/npkill/tiers/backer.svg?width=535"></a>

---

### Alternative crypto

- btc: 1ML2DihUoFTqhoQnrWy4WLxKbVYkUXpMAX
- bch: 1HVpaicQL5jWKkbChgPf6cvkH8nyktVnVk
- eth: 0x7668e86c8bdb52034606db5aa0d2d4d73a0d4259

<a name="license"></a>

# :scroll: Licence

MIT © [Nya Garcia Gallardo](https://github.com/NyaGarcia) and [Juan Torres Gomez](https://github.com/zaldih)

:cat::baby_chick:

---