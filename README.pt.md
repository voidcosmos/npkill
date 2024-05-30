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

### Encontre e **remova** facilemente pastas <font color="red">**node_modules**</font> antigas e pesadas :sparkles:

<p align="center">
  <img src="/docs/npkill-demo-0.10.0.gif" alt="npkill demo GIF" />
</p>

Esta ferramenta permite que você liste as pastas _node_modules_ em seu sistema, bem como o espaço que ocupam. Então você pode selecionar quais deles deseja apagar para liberar espaço!

## i18n

Estamos fazendo esforço para internacionalizar a documentação do Npkill. Aqui está uma lista das traduções disponíveis:

- [Español](./README.es.md)
- [Português](./README.pt.md)

## Table of Contents

- [Funcionalidades](#features)
- [Instalação](#installation)
- [Utilização](#usage)
  - [Opções](#options)
  - [Exemplos](#examples)
- [Configurar localmente](#setup-locally)
- [Roteiro](#roadmap)
- [Problemas conhecidos](#known-bugs)
- [Contribuindo](#contributing)
- [Compre-nos um café](#donations)
- [Licença](#license)

<a name="features"></a>

# :heavy_check_mark: Funcionalidades

- **Liberar espaço:** Livre-se dos antigos e empoeirados node_modules que ocupam espaço em sua máquina.

- **Último Uso do Espaço de Trabalho**: Verifique quando foi a última vez que você modificou um arquivo no espaço de trabalho (indicado na coluna **última_modificação**).

- **Muito rápido:** O NPKILL é escrito em TypeScript, mas as pesquisas são realizadas em um nível baixo, melhorando muito o desempenho.

- **Fácil de usar:** Diga adeus aos comandos longos. Usar o npkill é tão simples quanto ler uma lista de seus node_modules e pressionar Delete para se livrar deles. Pode ser mais fácil do que isso? ;)

- **Minificado:** Ele mal possui dependências.

<a name="installation"></a>

# :cloud: Instalação

Você nem precisa instalá-lo para usar!
Basta usar o seguinte comando:

```bash
$ npx npkill
```

Ou, se por algum motivo você realmente deseja instalá-lo:

```bash
$ npm i -g npkill
# Usuários do Unix podem precisar executar o comando com sudo. Tome cuidado.
```

> O NPKILL não suporta versões node<v14. Se isso afeta você, use npkill@0.8.3.

<a name="usage"></a>

# :clipboard: Utilização

```bash
$ npx npkill
# ou apenas npkill se você instalou globalmente
```

Por padrão, o npkill fará a varredura em busca de node_modules a partir do local onde o comando npkill é executado.

Para mover entre as pastas listadas, utilize as teclas <kbd>↓</kbd> e <kbd>↑</kbd>, e use <kbd>Space</kbd> ou <kbd>Del</kbd> para excluir a pasta selecionada.
Você também pode usar <kbd>j</kbd> e <kbd>k</kbd> para se mover entre os resultados.

Para abrir o diretório onde o resultado selecionado está localizado, pressione <kbd>o</kbd>.

Para sair, use <kbd>Q</kbd> ou <kbd>Ctrl</kbd> + <kbd>c</kbd> se você estiver se sentindo corajoso.

**Importante!** Algumas aplicações instaladas no sistema precisam do diretório node_modules delas para funcionar, e excluí-los pode quebrá-las. O NPKILL irá destacá-los exibindo um :warning: para que você tenha cuidado.

<a name="options"></a>

## Opções

| Comando                          | Descrição                                                                                                                                                           |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| -c, --bg-color                   | Troca a cor de destaque da linha. _(Disponível: **blue**, cyan, magenta, white, red e yellow)_                                                                      |
| -d, --directory                  | Defina o diretório a partir do qual iniciar a pesquisa. Por padrão, o ponto de partida é a raiz is .                                                                |
| -D, --delete-all                 | Exclui automaticamente todos os node_modules encontrados. Recomendado para usar junto com `-x`                                                                      |
| -e, --hide-errors                | Oculta erros                                                                                                                                                        |
| -E, --exclude                    | Excluir diretórios da pesquisa (a lista de diretórios deve estar entre aspas duplas "", com cada diretório separado por vírgula ','). Exemplo: "ignorar1, ignorar2" |
| -f, --full                       | Iniciar a pesquisa a partir do diretório pessoal do usuário (exemplo: "/home/user" no Linux)                                                                        |
| -gb                              | Mostra as pastas em Gigabytes ao invés de Megabytes.                                                                                                                |
| -h, --help, ?                    | Mostrar a página de ajuda e sair                                                                                                                                    |
| -nu, --no-check-update           | Não verificar atualizações na inicialização                                                                                                                         |
| -s, --sort                       | Ordenar resultados por: `size` (tamanho), `path`(localização) ou `last-mod`(última modificação)                                                                     |
| -t, --target                     | Especifique o nome dos diretórios que deseja pesquisar (por padrão, é node_modules)                                                                                 |
| -x, --exclude-hidden-directories | Excluir diretórios ocultos ("diretórios com ponto") da pesquisa.                                                                                                    |
| --dry-run                        | Não exclui nada (irá simular com um atraso aleatório).                                                                                                              |
| -v, --version                    | Mostrar versão do npkill                                                                                                                                            |

**Aviso:** _No futuro alguns comandos podem mudar_

<a name="examples"></a>

## Examples

- Busque pastas **node_modules** no seu diretório de projetos:

```bash
npkill -d ~/projetos

# alternativa:
cd ~/projetos
npkill
```

- Listar diretórios com o nome "dist" e mostrar erros, se houver algum:

```bash
npkill --target dist -e
```

- Exibe o cursor na cor magenta... porque eu gosto de magenta!

```bash
npkill --color magenta
```

- Listar pastas **vendor** no seu diretório de _projetos_, ordenar por tamanho e mostrar o tamanho em GB:

```bash
npkill -d '~/more projetos' -gb --sort size --target vendor
```

- Listar **node_modules** no seu diretório de _projetos_, exceto nas pastas _progresso_ e _ignorar_:

```bash
npkill -d 'projetos' --exclude "progresso, ignorar"
```

- Exclua automaticamente todos os node_modules que tenham entrado em seus backups:

```bash
npkill -d ~/backups/ --delete-all
```

<a name="setup-locally"></a>

# :pager: Configurar localmente

```bash
# -- Primeiramente, clone o repositório
git clone https://github.com/voidcosmos/npkill.git

# -- Acesse a pasta
cd npkill

# -- Instale as dependências
npm install

# -- E rode!
npm run start


# -- Se você deseja executá-lo com algum parâmetro, você terá que adicionar "--" como no seguinte exemplo:
npm run start -- -f -e
```

<a name="roadmap"></a>

# :crystal_ball: Roteiro

- [x] Lançamento 0.1.0 !
- [x] Melhorias de código
  - [x] Melhorias de performance
  - [ ] Ainda mais melhorias de performance!
- [x] Ordenação de resultados por tamanho e localização
- [x] Permitir a pesquisa por outros tipos de diretórios (alvo)
- [ ] Reduzir as dependências para tornar o módulo mais minimalista
- [ ] Permitir filtrar por diretórios que não foram usados em um período de tempo
- [ ] Criar opção para mostrar as pastas em formato de árvore
- [x] Adicionar menus
- [x] Adicionar logs
- [ ] Limpeza automatizada periódica (?)

<a name="known-bugs"></a>

# :bug: Problemas conhecidos :bug:

- Às vezes, a CLI fica bloqueada enquanto a pasta está sendo excluída.
- Alguns terminais que não utilizam TTY (como o git bash no Windows) não funcionam.
- A ordenação, especialmente por rotas, pode deixar o terminal mais lento quando há muitos resultados ao mesmo tempo.
- Às vezes, os cálculos de tamanho são maiores do que deveriam ser.
- (RESOLVIDO) Problemas de desempenho ao pesquisar em diretórios de alto nível (como / no Linux).
- (RESOLVIDO) Às vezes, o texto se desfaz ao atualizar a interface de linha de comando (CLI).
- (RESOLVIDO) A análise do tamanho dos diretórios leva mais tempo do que deveria.

> Se você encontrar algum erro, não hesite em abrir uma solicitação (via issue) :)

<a name="contributing"></a>

# :revolving_hearts: Contribuindo

Se você quer contribuir confira o [CONTRIBUTING.md](.github/CONTRIBUTING.md)

<a name="donations"></a>

# :coffee: Compre-nos um café

<img align="right" width="300" src="https://npkill.js.org/img/cat-donation-cup.png">
Desenvolvemos o npkill em nosso tempo livre, porque somos apaixonados pelo setor de programação. Amanhã, gostaríamos de nos dedicar mais a isso, mas antes, temos um longo caminho a percorrer.

Continuaremos a fazer as coisas de qualquer maneira, mas as doações são uma das muitas formas de apoiar o que fazemos.

<span class="badge-opencollective"><a href="https://opencollective.com/npkill/contribute" title="Faça uma doação para este projeto usando o Open Collective"><img src="https://img.shields.io/badge/open%20collective-donate-green.svg" alt="Open Collective donate button" /></a></span>

### Obrigado!!

## Um enorme agradecimento aos nossos apoiadores :heart:

<a href="https://opencollective.com/npkill#backers" target="_blank"><img width="535" src="https://opencollective.com/npkill/tiers/backer.svg?width=535"></a>

---

### via Crypto

- btc: 1ML2DihUoFTqhoQnrWy4WLxKbVYkUXpMAX
- bch: 1HVpaicQL5jWKkbChgPf6cvkH8nyktVnVk
- eth: 0x7668e86c8bdb52034606db5aa0d2d4d73a0d4259

<a name="license"></a>

# :scroll: Licença

MIT © [Nya García Gallardo](https://github.com/NyaGarcia) e [Juan Torres Gómez](https://github.com/zaldih)

:cat::baby_chick:

---
