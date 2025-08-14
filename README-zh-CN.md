<p align="center">
  <img src="./docs/npkill-text-clean.svg" width="380" alt="npkill logo" />
</p>
<p align="center">
<img alt="npm" src="https://img.shields.io/npm/dy/npkill.svg">
<a href="#donations"><img src="https://img.shields.io/badge/donate-<3-red" alt="Donations Badge"/></a>
<img alt="npm version" src="https://img.shields.io/npm/v/npkill.svg">
<img alt="NPM" src="https://img.shields.io/npm/l/npkill.svg">
</p>

### 轻松定位并 **清理** 陈旧并且体积庞大的 <font color="red">**node_modules**</font> 目录 :sparkles:

<p align="center">
  <img src="/docs/npkill-demo-0.10.0.gif" alt="npkill demo GIF" />
</p>

这个工具可以列出系统中所有的 node_modules 目录，以及它们占用的空间。然后你可以选择要删除的目录，从而释放空间。太棒了！

## i18n

我们正在努力将 Npkill 文档国际化。以下是可用翻译的列表：

- [Español](./README.es.md)
- [Indonesian](./README.id.md)
- [Português](./README.pt.md)
- [Turkish](./README.tr.md)
- [简体中文](./README-zh-cn.md)

## Table of Contents
## 目录

- [特性](#features)
- [安装](#installation)
- [使用](#usage)
  - [多选模式](#multi-select-mode)
  - [选项](#options)
  - [例子](#examples)
  - [JSON 输出](#json-output)
- [本地设置](#setup-locally)
- [API](#API)
- [路线图](#roadmap)
- [已知 bugs](#known-bugs)
- [如何贡献](#contributing)
- [请我们喝杯咖啡](#donations)
- [License](#license)

<a name="features"></a>

# :heavy_check_mark: 特性

- **清除空间:** 清除机器上陈旧且积尘的 _node_modules 文件夹。

- **最后工作区使用情况**：检查您上次修改工作区中的文件是什么时候（在 **last_mod** 列中指示）。

- **速度极快**：NPKILL 使用 TypeScript 编写，但搜索是在底层进行的，极大地提升了性能。

- **易于使用**：告别冗长的命令。使用 npkill 就像阅读你的 node_modules 列表一样简单，然后按下 Del 键就能删除它们。还能更简单吗？;)

- **精简**：它几乎没有任何依赖项。

<a name="installation"></a>

# :cloud: 安装

你其实不需要安装它就能使用！
只需运行以下命令即可：

```bash
$ npx npkill
```

或者你有其他原因而真的想要安装它：

```bash
$ npm i -g npkill
# Unix 用户可能需要使用 sudo 运行命令。请小心
```

> NPKILL 不支持 node<v14。如果这对你有影响，你可以使用 `npkill@0.8.3`

<a name="usage"></a>

# :clipboard: 使用

```bash
$ npx npkill
# 或者仅仅输入 npkill，如果已经全局安装了
```

默认情况下，npkill 会从执行 `npkill` 命令的路径开始扫描 node_modules。  

使用 <kbd>↓</kbd> <kbd>↑</kbd> 在列出的文件夹之间移动，并使用 <kbd>Space</kbd> 或 <kbd>Del</kbd> 删除所选文件夹。  
你也可以使用 <kbd>j</kbd> 和 <kbd>k</kbd> 在结果之间移动。  

按下 <kbd>o</kbd> 可以打开所选结果所在的目录。  

退出请使用 <kbd>Q</kbd>，如果你够勇敢，也可以使用 <kbd>Ctrl</kbd> + <kbd>c</kbd>。  

**重要！** 系统中有些已安装的应用需要其 node_modules 目录才能正常运行，删除这些目录可能会导致应用出错。
NPKILL 会通过显示一个 :warning: 来标记这些目录，以提醒你谨慎操作。

## 多选模式

此模式允许你一次选择并删除多个文件夹，在清理大量目录时能显著提升效率。

### 进入多选模式

按下 <kbd>T</kbd> 可切换多选模式。启用后，你会在结果顶部看到一个选择计数器和额外的操作提示。

### 控制

- **<kbd>Space</kbd>**：切换当前文件夹的选中状态。  
- **<kbd>V</kbd>**：开始/结束范围选择模式。  
- **<kbd>A</kbd>**：切换全选/取消全选所有文件夹。  
- **<kbd>Enter</kbd>**：删除所有已选中的文件夹。  
- **<kbd>T</kbd>**：取消所有选择并返回正常模式。 

### 范围选择  

按下 <kbd>V</kbd> 进入范围选择模式后：

- 使用方向键、<kbd>j</kbd>/<kbd>k</kbd>、<kbd>Home</kbd>/<kbd>End</kbd> 或 Page Up/Page Down 移动光标
- 起始位置与当前光标位置之间的所有文件夹都会被选中或取消选中
- 再次按下 <kbd>V</kbd> 可退出范围选择模式

<a name="options"></a>

## 选项

| 参数                              | 描述                                                                                                                                                                                 |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------  |
| -c, --bg-color                    | 更改行高亮颜色。 _(可选值: **blue**、cyan、magenta、white、red 和 yellow)_                                                                                                               |
| -d, --directory                   | 设置开始搜索的目录。默认情况下，起始路径为 `.`                                                                                                                                             |
| -D, --delete-all                  | 自动删除找到的所有 `node_modules` 文件夹。建议与 `-x` 一起使用。                                                                                                                           |
| -e, --hide-errors                 | 隐藏错误（如果有的话）                                                                                                                                                                  |
| -E, --exclude                     | 从搜索中排除指定目录（目录列表必须放在双引号 `""` 中，每个目录之间用 `,` 分隔）示例: `"ignore1, ignore2"`                                                                                       |
| -f, --full                        | 从用户主目录开始搜索（示例：Linux 系统中为 `"/home/user"`）                                                                                                                               |
| --size-unit                       | 设置文件夹大小的显示单位。 _(可选值: **auto**、mb、gb)_。选择 auto 时，小于 1024MB 的大小将以 MB（取整）显示，更大的将以 GB（带小数）显示。                                                          |
| -h, --help, ?                     | 显示此帮助页面并退出                                                                                                                                                                   |
| -nu, --no-check-update            | 启动时不检查更新                                                                                                                                                                       |
| -s, --sort                        | 按以下方式排序结果：`size`、`path` 或 `last-mod`                                                                                                                                         |
| -t, --target                      | 指定想要搜索的目录名称（默认为 `node_modules`）。可用逗号分隔定义多个目标，例如：`-t node_modules,.cache,`                                                                                       |
|                                   |                                                                                                                                                                                      |
| -x, --exclude-hidden-directories  | 从搜索中排除隐藏目录（以点开头的目录）。                                                                                                                                                    |
| --dry-run                         | 不会删除任何内容（会模拟删除过程并随机延迟）。                                                                                                                                               |
| --json                            | 在扫描结束时以 JSON 格式输出结果。适用于自动化与脚本化处理。                                                                                                                                 |
| --json-stream                     | 以流式 JSON 格式输出结果（每找到一个结果输出一行 JSON 对象）。适用于实时处理。                                                                                                                  |
| -v, --version                     | 显示 npkill 版本                                                                                                                                                                     |

**警告：_在未来的版本中，一些命令可能会发生变化_**

<a name="examples"></a>

## 例子

- 在你的 _projects_ 目录中搜索 **node_modules** 目录：

```bash
npkill -d ~/projects

# 其他替代方案：
cd ~/projects
npkill
```

- 列出名为 dist 的目录，并在发生错误时显示错误信息：

```bash
npkill --target dist -e
```

- 显示洋红色光标……因为我就是喜欢洋红色！

```bash
npkill --bg-color magenta
```

- 列出 **vendor** 目录（位于你的 _projects_ 目录中），按大小排序，并以 GB 为单位显示大小：

```bash
npkill -d '~/more projects' --size-unit gb --sort size --target vendor
```

- 列出 **node_modules** 目录（位于你的 _projects_ 目录中），排除位于 _progress_ 和 _ignore-this_ 目录中的那些：

```bash
npkill -d 'projects' --exclude "progress, ignore-this"
```

- 自动删除所有偷偷出现在你备份中的 **node_modules** 目录：

```bash
npkill -d ~/backups/ --delete-all
```

- 以 JSON 格式获取结果，用于自动化或后续处理：

```bash
npkill --json > results.json
```

- 以 JSON 格式实时流式输出结果（适用于监控或通过管道传输到其他工具）：

```bash
npkill --json-stream | jq '.'
```

- 仅将成功的结果保存到文件中，忽略错误：

```bash
npkill --json-stream 2>/dev/null | jq -s '.' > clean-results.json
```

<a name="json-output"></a>

## JSON 输出

Npkill 支持 JSON 输出格式，用于自动化和与其他工具集成：  

- **`--json`**：在扫描结束时，将所有结果作为单个 JSON 对象输出  
- **`--json-stream`**：实时输出每个结果为单独的 JSON 对象  

有关详细文档、示例和 TypeScript 接口，请参阅 [JSON 输出文档](./docs/json-output.md)。

**快速上手例子:**

```bash
# 以 JSON 格式获取结果
npkill --json > results.json

# 实时处理结果
npkill --json-stream | jq '.result.path'

# 查找大于 100MB 的目录
npkill --json | jq '.results[] | select(.size > 104857600)'
```

<a name="setup-locally"></a>

# :pager: 本地设置

```bash
# -- 第一步，克隆仓库
git clone https://github.com/voidcosmos/npkill.git

# -- 进入文件夹
cd npkill

# -- 安装以来
npm install

# -- 运行！
npm run start


# -- 如果你想在运行时添加一些参数，需要像下面的示例一样加上 `--`：
npm run start -- -f -e
```

<a name="API"></a>

# :bookmark_tabs: API

该 API 允许你在 Node 中与 npkill 交互，从而在脚本中创建你自己的实现（例如自动化任务）。  

你可以在[这里](./API.md)查看基本 API，或稍后在网页上查看（即将上线）。

<a name="roadmap"></a>

# :crystal_ball: 路线图

- [x] 发布 0.1.0 版本！  
- [x] 改进代码  
  - [x] 提升性能  
  - [ ] 进一步提升性能！  
- [x] 按大小和路径排序结果  
- [x] 允许搜索其他类型的目录（targets）  
- [ ] 减少依赖，使其成为更精简的模块  
- [ ] 允许按一段时间内未使用的目录进行过滤  
- [ ] 创建以树状格式显示目录的选项  
- [x] 添加一些菜单  
- [x] 添加日志服务  
- [ ] 定期自动清理（？）  

<a name="known-bugs"></a>

# :bug: 已知 bugs :bug:

- 有时在删除文件夹时，CLI 会被阻塞。  
- 某些不使用 TTY 的终端（如 Windows 下的 Git Bash）无法正常工作。  
- 排序操作，尤其是按路径排序时，如果同时存在大量结果，会导致终端变慢。  
- 有时计算出来的大小会比实际值偏大。  
- （已解决）从高层级目录（如 Linux 中的 `/`）开始搜索时的性能问题。  
- （已解决）更新 CLI 时有时会出现文本错位或重叠。  
- （已解决）分析目录大小耗时比预期更长。  

> 如果你发现任何 bug，请不要犹豫，直接打开一个 issue :)

<a name="contributing"></a>

# :revolving_hearts: 如何贡献

如果你想贡献请参考 [CONTRIBUTING.md](.github/CONTRIBUTING.md)

<a name="donations"></a>

# :coffee: 请我们喝杯咖啡

<img align="right" width="300" src="https://npkill.js.org/img/cat-donation-cup.png">
我们在空闲时间开发了 npkill，因为我们对编程领域充满热情。  
将来我们希望能全职投入其中，但在此之前，我们还有很长的路要走。  

无论如何，我们都会继续做下去，但捐赠是支持我们工作的一种方式。

<span class="badge-opencollective"><a href="https://opencollective.com/npkill/contribute" title="Donate to this project using Open Collective"><img src="https://img.shields.io/badge/open%20collective-donate-green.svg" alt="Open Collective donate button" /></a></span>

### 感谢!!

## 向我们的支持者致以诚挚的感谢 :heart:

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
