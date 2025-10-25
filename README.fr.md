<p align="center">
  <img src="./docs/npkill-text-clean.svg" width="380" alt="logo npkill" />
</p>
<p align="center">
<img alt="npm" src="https://img.shields.io/npm/dy/npkill.svg">
<a href="#donations"><img src="https://img.shields.io/badge/donate-<3-red" alt="Badge de dons"/></a>
<img alt="version npm" src="https://img.shields.io/npm/v/npkill.svg">
<img alt="NPM" src="https://img.shields.io/npm/l/npkill.svg">
</p>

### Trouvez et **supprimez** facilement les anciens dossiers <font color="red">**node_modules**</font> volumineux :sparkles:

<p align="center">
  <img src="/docs/npkill-demo-0.10.0.gif" alt="GIF de démonstration npkill" />
</p>

Cet outil vous permet de lister tous les répertoires _node_modules_ de votre système, ainsi que l'espace qu'ils occupent. Vous pouvez ensuite sélectionner ceux que vous souhaitez supprimer pour libérer de l'espace. Génial !

## i18n

Nous faisons un effort pour internationaliser la documentation de Npkill. Voici la liste des traductions disponibles :

- [Español](./README.es.md)
- [Indonesian](./README.id.md)
- [Português](./README.pt.md)
- [Turkish](./README.tr.md)
- [Français](./README.fr.md)

## Table des matières

- [Fonctionnalités](#fonctionnalités)
- [Installation](#installation)
- [Utilisation](#utilisation)
  - [Mode multi-sélection](#mode-multi-sélection)
  - [Options](#options)
  - [Exemples](#exemples)
  - [Sortie JSON](#sortie-json)
- [Configuration locale](#configuration-locale)
- [API](#API)
- [Feuille de route](#feuille-de-route)
- [Bugs connus](#bugs-connus)
- [Contribuer](#contribuer)
- [Offrez-nous un café](#donations)
- [Licence](#licence)

<a name="fonctionnalités"></a>

# :heavy_check_mark: Fonctionnalités

- **Libérer de l'espace :** Débarrassez-vous des anciens _node_modules_ poussiéreux qui encombrent votre machine.

- **Utilisation du dernier espace de travail** : Vérifiez quand vous avez modifié un fichier dans l'espace de travail pour la dernière fois (indiqué dans la colonne **last_mod**).

- **Très rapide :** NPKILL est écrit en TypeScript, mais les recherches sont effectuées à bas niveau, améliorant considérablement les performances.

- **Facile à utiliser :** Dites adieu aux longues commandes. Utiliser npkill est aussi simple que de lire une liste de vos node_modules et d'appuyer sur Suppr pour vous en débarrasser. Peut-il être plus facile ? ;)

- **Minimisé :** Il n'a pratiquement aucune dépendance.

<a name="installation"></a>

# :cloud: Installation

Vous n'avez pas vraiment besoin de l'installer pour l'utiliser !
Utilisez simplement la commande suivante :

```bash
$ npx npkill
```

Ou si pour une raison quelconque vous voulez vraiment l'installer :

```bash
$ npm i -g npkill
# Les utilisateurs Unix peuvent avoir besoin d'exécuter la commande avec sudo. Procédez avec prudence
```

> NPKILL ne prend pas en charge node<v14. Si cela vous concerne, vous pouvez utiliser `npkill@0.8.3`

<a name="utilisation"></a>

# :clipboard: Utilisation

```bash
$ npx npkill
# ou simplement npkill si installé globalement
```

Par défaut, npkill analysera les node_modules en commençant par le chemin où la commande `npkill` est exécutée.

Naviguez entre les dossiers listés avec <kbd>↓</kbd> <kbd>↑</kbd>, et utilisez <kbd>Espace</kbd> ou <kbd>Suppr</kbd> pour supprimer le dossier sélectionné.
Vous pouvez également utiliser <kbd>j</kbd> et <kbd>k</kbd> pour naviguer entre les résultats.

Vous pouvez ouvrir le répertoire où se trouve le résultat sélectionné en appuyant sur <kbd>o</kbd>.

Pour quitter, <kbd>Q</kbd> ou <kbd>Ctrl</kbd> + <kbd>c</kbd> si vous êtes courageux.

**Important !** Certaines applications installées sur le système ont besoin de leur répertoire node_modules pour fonctionner et les supprimer peut les casser. NPKILL les mettra en évidence en affichant un :warning: pour être prudent.

## Mode multi-sélection

Ce mode vous permet de sélectionner et supprimer plusieurs dossiers à la fois, le rendant plus efficace lors du nettoyage de nombreux répertoires.

### Entrer en mode multi-sélection

Appuyez sur <kbd>T</kbd> pour activer/désactiver le mode multi-sélection. Lorsqu'il est actif, vous verrez un compteur de sélection et des instructions supplémentaires en haut des résultats.

### Contrôles

- **<kbd>Espace</kbd>** : Basculer la sélection du dossier actuel.
- **<kbd>V</kbd>** : Démarrer/terminer le mode de sélection par plage.
- **<kbd>A</kbd>** : Basculer sélectionner/désélectionner tous les dossiers.
- **<kbd>Entrée</kbd>** : Supprimer tous les dossiers sélectionnés.
- **<kbd>T</kbd>** : Désélectionner tout et revenir au mode normal.

### Sélection par plage

Après avoir appuyé sur <kbd>V</kbd> pour entrer en mode de sélection par plage :

- Déplacez le curseur avec les touches fléchées, <kbd>j</kbd>/<kbd>k</kbd>, <kbd>Début</kbd>/<kbd>Fin</kbd>, ou page haut/bas
- Tous les dossiers entre la position de départ et la position actuelle du curseur seront sélectionnés/désélectionnés
- Appuyez sur <kbd>V</kbd> à nouveau pour quitter le mode de sélection par plage

<a name="options"></a>

## Options

| ARGUMENT                         | DESCRIPTION                                                                                                                                                                         |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| -c, --bg-color                   | Changer la couleur de surbrillance des lignes. _(Disponible : **blue**, cyan, magenta, white, red et yellow)_                                                                      |
| -d, --directory                  | Définir le répertoire à partir duquel commencer la recherche. Par défaut, le point de départ est .                                                                                 |
| -D, --delete-all                 | Supprimer automatiquement tous les dossiers node_modules trouvés. Il est suggéré d'être utilisé avec `-x`.                                                                        |
| -e, --hide-errors                | Masquer les erreurs s'il y en a                                                                                                                                                     |
| -E, --exclude                    | Exclure les répertoires de la recherche (la liste des répertoires doit être entre guillemets doubles "", chaque répertoire séparé par ',') Exemple : "ignore1, ignore2"         |
| -f, --full                       | Commencer la recherche depuis le répertoire personnel de l'utilisateur (exemple : "/home/user" sous linux)                                                                        |
| --size-unit                      | Définir l'unité d'affichage des tailles de dossiers. _(Disponible : **auto**, mb, gb)_. Avec auto, les tailles < 1024MB sont affichées en MB (arrondies), les plus grandes en GB (avec décimales). |
| -h, --help, ?                    | Afficher cette page d'aide et quitter                                                                                                                                               |
| -nu, --no-check-update           | Ne pas vérifier les mises à jour au démarrage                                                                                                                                       |
| -s, --sort                       | Trier les résultats par : `size`, `path` ou `last-mod`                                                                                                                              |
| -t, --target                     | Spécifier le nom des répertoires que vous voulez rechercher (par défaut, c'est 'node_modules'). Vous pouvez définir plusieurs cibles en les séparant par une virgule. Ex. `-t node_modules,.cache,`. |
|                                  |
| -x, --exclude-hidden-directories | Exclure les répertoires cachés (répertoires "point") de la recherche.                                                                                                              |
| --dry-run                        | Ne supprime rien (le simulera avec un délai aléatoire).                                                                                                                             |
| --json                           | Sortir les résultats au format JSON à la fin de l'analyse. Utile pour l'automatisation et les scripts.                                                                             |
| --json-stream                    | Sortir les résultats au format JSON en streaming (un objet JSON par ligne au fur et à mesure que les résultats sont trouvés). Utile pour le traitement en temps réel.           |
| -v, --version                    | Afficher la version de npkill                                                                                                                                                       |

**Attention :** _Dans les futures versions, certaines commandes peuvent changer_

<a name="exemples"></a>

## Exemples

- Rechercher les répertoires **node_modules** dans votre répertoire _projects_ :

```bash
npkill -d ~/projects

# autre alternative :
cd ~/projects
npkill
```

- Lister les répertoires nommés "dist" et afficher les erreurs s'il y en a :

```bash
npkill --target dist -e
```

- Afficher le curseur de couleur magenta... parce que j'aime le magenta !

```bash
npkill --bg-color magenta
```

- Lister les répertoires **vendor** dans votre répertoire _projects_, trier par taille, et afficher la taille en gb :

```bash
npkill -d '~/more projects' --size-unit gb --sort size --target vendor
```

- Lister **node_modules** dans votre répertoire _projects_, en excluant ceux dans les répertoires _progress_ et _ignore-this_ :

```bash
npkill -d 'projects' --exclude "progress, ignore-this"
```

- Supprimer automatiquement tous les node_modules qui se sont glissés dans vos sauvegardes :

```bash
npkill -d ~/backups/ --delete-all
```

- Obtenir les résultats au format JSON pour l'automatisation ou un traitement ultérieur :

```bash
npkill --json > results.json
```

- Diffuser les résultats en temps réel sous forme de JSON (utile pour la surveillance ou le passage à d'autres outils) :

```bash
npkill --json-stream | jq '.'
```

- Sauvegarder seulement les résultats réussis dans un fichier, en ignorant les erreurs :

```bash
npkill --json-stream 2>/dev/null | jq -s '.' > clean-results.json
```

<a name="sortie-json"></a>

## Sortie JSON

Npkill prend en charge les formats de sortie JSON pour l'automatisation et l'intégration avec d'autres outils :

- **`--json`** : Sortir tous les résultats comme un seul objet JSON à la fin de l'analyse
- **`--json-stream`** : Sortir chaque résultat comme un objet JSON séparé en temps réel

Pour une documentation détaillée, des exemples et des interfaces TypeScript, voir [Documentation de sortie JSON](./docs/json-output.md).

**Exemples rapides :**

```bash
# Obtenir tous les résultats sous forme de JSON
npkill --json > results.json

# Traiter les résultats en temps réel
npkill --json-stream | jq '.result.path'

# Trouver les répertoires plus grands que 100MB
npkill --json | jq '.results[] | select(.size > 104857600)'
```

<a name="configuration-locale"></a>

# :pager: Configuration locale

```bash
# -- D'abord, cloner le dépôt
git clone https://github.com/voidcosmos/npkill.git

# -- Naviguer vers le répertoire
cd npkill

# -- Installer les dépendances
npm install

# -- Et lancer !
npm run start


# -- Si vous voulez l'exécuter avec un paramètre, vous devrez ajouter "--" comme dans l'exemple suivant :
npm run start -- -f -e
```

<a name="API"></a>

# :bookmark_tabs: API

L'API vous permet d'interagir avec npkill depuis node pour créer vos propres implémentations dans vos scripts (automatisations, par exemple).

Vous pouvez consulter l'API de base [ici](./API.md) ou sur le web (bientôt disponible).

<a name="feuille-de-route"></a>

# :crystal_ball: Feuille de route

- [x] Sortie de la version 0.1.0 !
- [x] Améliorer le code
  - [x] Améliorer les performances
  - [ ] Améliorer encore plus les performances !
- [x] Trier les résultats par taille et chemin
- [x] Permettre la recherche d'autres types de répertoires (cibles)
- [ ] Réduire les dépendances pour être un module plus minimaliste
- [ ] Permettre de filtrer par répertoires qui n'ont pas été utilisés pendant une période de temps
- [ ] Créer une option pour afficher les répertoires au format arbre
- [x] Ajouter quelques menus
- [x] Ajouter un service de journalisation
- [ ] Nettoyage périodique et automatique (?)

<a name="bugs-connus"></a>

# :bug: Bugs connus :bug:

- Parfois, la CLI est bloquée pendant la suppression du dossier.
- Certains terminaux qui n'utilisent pas TTY (comme git bash sous windows) ne fonctionnent pas.
- Le tri, en particulier par routes, peut ralentir le terminal lorsqu'il y a beaucoup de résultats en même temps.
- Parfois, les calculs de taille sont plus élevés qu'ils ne devraient l'être.
- (RÉSOLU) Problèmes de performance lors de la recherche depuis des répertoires de haut niveau (comme / sous linux).
- (RÉSOLU) Parfois le texte s'effondre lors de la mise à jour de la cli.
- (RÉSOLU) L'analyse de la taille des répertoires prend plus de temps qu'elle ne devrait.

> Si vous trouvez des bugs, n'hésitez pas et ouvrez une issue :)

<a name="contribuer"></a>

# :revolving_hearts: Contribuer

Si vous voulez contribuer, consultez le [CONTRIBUTING.md](.github/CONTRIBUTING.md)

<a name="donations"></a>

# :coffee: Offrez-nous un café

<img align="right" width="300" src="https://npkill.js.org/img/cat-donation-cup.png">
Nous avons développé npkill sur notre temps libre, parce que nous sommes passionnés par le secteur de la programmation.
Demain, nous aimerions nous consacrer à cela, mais d'abord, nous avons un long chemin à parcourir.

Nous continuerons à faire des choses de toute façon, mais les dons sont l'un des nombreux moyens de soutenir ce que nous faisons.

<span class="badge-opencollective"><a href="https://opencollective.com/npkill/contribute" title="Faire un don à ce projet en utilisant Open Collective"><img src="https://img.shields.io/badge/open%20collective-donate-green.svg" alt="Bouton de don Open Collective" /></a></span>

### Merci !!

## Un énorme merci à nos contributeurs :heart:

<a href="https://opencollective.com/npkill#backers" target="_blank"><img width="535" src="https://opencollective.com/npkill/tiers/backer.svg?width=535"></a>

---

### Alternative crypto

- btc: 1ML2DihUoFTqhoQnrWy4WLxKbVYkUXpMAX
- bch: 1HVpaicQL5jWKkbChgPf6cvkH8nyktVnVk
- eth: 0x7668e86c8bdb52034606db5aa0d2d4d73a0d4259

<a name="licence"></a>

# :scroll: Licence

MIT © [Nya García Gallardo](https://github.com/NyaGarcia) et [Juan Torres Gómez](https://github.com/zaldih)

:cat::baby_chick:

---