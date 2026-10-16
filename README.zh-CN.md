<p align="center">
  <img src="./docs/npkill-text-clean.svg" width="380" alt="npkill logo" />
</p>
<p align="center">
<img alt="npm" src="https://img.shields.io/npm/dy/npkill.svg">
<a href="#donations"><img src="https://img.shields.io/badge/donate-<3-red" alt="Donations Badge"/></a>
<img alt="npm version" src="https://img.shields.io/npm/v/npkill.svg">
<img alt="NPM" src="https://img.shields.io/npm/l/npkill.svg">
</p>

### 轻松查找并**删除**陈旧且臃肿的 <font color="red">**node_modules**</font> 文件夹 :sparkles:

<p align="center">
  <img src="/docs/npkill-demo-0.10.0.gif" alt="npkill demo GIF" />
</p>

这个工具可以列出你系统中的所有 _node_modules_ 目录，以及它们占用的磁盘空间。然后你可以选择想删除的目录来释放空间。就是这么直接。

## i18n

我们正在持续推进 Npkill 文档的国际化。当前可用的翻译如下：

- [English](./README.md)
- [Español](./README.es.md)
- [Indonesian](./README.id.md)
- [Português](./README.pt.md)
- [Turkish](./README.tr.md)

## 目录

- [特性](#features)
- [安装](#installation)
- [用法](#usage)
  - [多选模式](#multi-select-mode)
  - [选项](#options)
  - [示例](#examples)
  - [JSON 输出](#json-output)
- [本地开发](#setup-locally)
- [API](#API)
- [路线图](#roadmap)
- [已知问题](#known-bugs)
- [贡献](#contributing)
- [请我们喝杯咖啡](#donations)
- [许可证](#license)

<a name="features"></a>

# :heavy_check_mark: 特性

- **清理空间：** 删除那些陈旧、积灰的 _node_modules_，把磁盘空间还给你的机器。

- **最近工作区使用时间：** 你可以查看工作区里最后一次修改文件的时间（显示在 **last_mod** 列）。

- **速度很快：** NPKILL 使用 TypeScript 编写，但搜索在较底层执行，性能表现相当好。

- **简单易用：** 不再需要冗长命令。使用 npkill 就像浏览一份 node_modules 列表，然后按下 Del 删除它们一样简单。还能更省事吗？ ;)

- **依赖极少：** 它几乎没有什么依赖。

<a name="installation"></a>

# :cloud: 安装

其实你不需要安装它也能直接使用。
执行下面的命令即可：

```bash
$ npx npkill
```

如果你确实想全局安装：

```bash
$ npm i -g npkill
# Unix 用户可能需要配合 sudo 运行，请谨慎操作
```

> NPKILL 不支持 node<v14。如果这会影响你，可以使用 `npkill@0.8.3`

<a name="usage"></a>

# :clipboard: 用法

```bash
$ npx npkill
# 如果已全局安装，也可以直接运行 npkill
```

默认情况下，npkill 会从你执行 `npkill` 命令时所在的路径开始扫描 `node_modules`。

你可以使用 <kbd>↑</kbd> <kbd>↓</kbd> 在列出的文件夹之间移动，并通过 <kbd>Space</kbd> 或 <kbd>Del</kbd> 删除当前选中的文件夹。
你也可以使用 <kbd>j</kbd> 和 <kbd>k</kbd> 在结果之间移动。

按下 <kbd>o</kbd> 可以打开当前选中结果所在的目录。

退出时可按 <kbd>Q</kbd>，或者如果你够勇，也可以用 <kbd>Ctrl</kbd> + <kbd>c</kbd>。

**注意！** 系统中有些应用依赖自己的 node_modules 目录才能正常工作，删除后可能会导致它们损坏。NPKILL 会用一个 :warning: 标记这些目录，提醒你谨慎处理。

## 搜索模式

搜索模式允许你过滤结果。这在你想把视图限制到某条特定路径，或者只“全选”符合某个条件的结果时尤其有用。

例如，你可以使用这个表达式，把结果限制为位于 `work` 目录下，并且路径中某处包含 `data` 的项目：`/work/.*/data`。

按下 <kbd>/</kbd> 进入搜索模式。你可以输入一个正则表达式来过滤结果。

按下 <kbd>Enter</kbd> 确认搜索并在过滤后的结果中导航，或按 <kbd>Esc</kbd> 清空并退出。

如果想退出这个模式，留空即可。

## Multi-Select Mode

这个模式允许你一次选择并删除多个文件夹，在清理大量目录时会更高效。

### 进入多选模式

按下 <kbd>T</kbd> 可切换多选模式。启用后，你会在结果顶部看到已选计数和额外操作提示。

### 控制方式

- **<kbd>Space</kbd>**：切换当前文件夹的选中状态。
- **<kbd>V</kbd>**：开始或结束范围选择模式。
- **<kbd>A</kbd>**：切换全选或取消全选所有文件夹。
- **<kbd>Enter</kbd>**：删除所有已选文件夹。
- **<kbd>T</kbd>**：取消全部选择并返回普通模式。

### 范围选择

按下 <kbd>V</kbd> 进入范围选择模式后：

- 使用方向键、<kbd>j</kbd>/<kbd>k</kbd>、<kbd>Home</kbd>/<kbd>End</kbd> 或 Page Up/Page Down 移动光标
- 起始位置和当前光标位置之间的所有文件夹都会被选中或取消选中
- 再次按下 <kbd>V</kbd> 退出范围选择模式

<a name="options"></a>

## 选项

| 参数 | 说明 |
| --- | --- |
| -p, --profiles | 允许你选择要使用的 [profile](./docs/profiles.md)（目标集合）。如果未指定选项，会列出可用 profile _（默认是 **node**）_。 |
| --config | 自定义 `.npkillrc` 配置文件的路径。默认情况下，npkill 会先查找 `./.npkillrc`，再查找 `~/.npkillrc`。 |
| -d, --directory | 设置开始搜索的目录。默认起始点为当前目录 `.`。 |
| -D, --delete-all | 自动删除找到的所有文件夹。建议与 `-x` 一起使用。 |
| -e, --hide-errors | 如有错误则隐藏错误信息。 |
| -E, --exclude | 从搜索中排除目录（目录列表需放在双引号 `""` 中，并以 `,` 分隔）。示例：`"ignore1, ignore2"` |
| -f, --full | 从当前用户的主目录开始搜索（例如 Linux 中的 `"/home/user"`）。 |
| --size-unit | 设置文件夹大小的显示单位。_可选值：**auto**、mb、gb_。使用 `auto` 时，小于 1024MB 的大小显示为 MB（四舍五入），更大的显示为 GB（带小数）。 |
| -h, --help, ? | 显示帮助页面。 |
| -nu, --no-check-update | 启动时不检查更新。 |
| -s, --sort | 按 `size`、`path` 或 `age` 排序结果。 |
| -t, --targets | 禁用 profiles 功能，并指定你想搜索的目录名称。可使用逗号分隔定义多个目标。示例：`-t node_modules,.cache` |
| -x, --exclude-sensitive | 排除敏感目录。 |
| -y | 执行 `--delete-all` 时不显示警告。 |
| --dry-run | 不会真正删除任何内容（会用随机延迟模拟删除过程）。 |
| --json | 在扫描结束时以 JSON 格式输出结果。适合自动化和脚本处理。 |
| --json-stream | 以流式 JSON 格式输出结果（每找到一个结果就输出一行 JSON 对象）。适合实时处理。 |
| -v, --version | 显示 npkill 版本。 |

<a name="examples"></a>

## 示例

- 在你的 _projects_ 目录中搜索 **node_modules** 目录：

```bash
npkill -d ~/projects

# 另一种方式：
cd ~/projects
npkill
```

- 列出 _projects_ 目录中的 **node_modules**，但排除位于 _progress_ 和 _ignore-this_ 目录下的结果：

```bash
npkill -d 'projects' --exclude "progress, ignore-this"
```

- 自动删除那些“潜入”备份目录中的所有 node_modules：

```bash
npkill -d ~/backups/ --delete-all
```

- 以 JSON 格式获取结果，用于自动化或后续处理：

```bash
npkill --json > results.json
```

- 以实时 JSON 流的方式输出结果（适合监控或管道给其他工具）：

```bash
npkill --json-stream | jq '.'
```

- 只保存成功结果到文件，忽略错误：

```bash
npkill --json-stream 2>/dev/null | jq -s '.' > clean-results.json
```

<a name="json-output"></a>

## JSON 输出

Npkill 支持 JSON 输出格式，便于自动化以及与其他工具集成：

- **`--json`**：在扫描结束时，将所有结果作为单个 JSON 对象输出
- **`--json-stream`**：实时将每个结果作为单独的 JSON 对象输出

更详细的文档、示例以及 TypeScript 接口定义，请参阅 [JSON Output Documentation](./docs/json-output.md)。

**快速示例：**

```bash
# 以 JSON 获取所有结果
npkill --json > results.json

# 实时处理结果
npkill --json-stream | jq '.result.path'

# 查找大于 100MB 的目录
npkill --json | jq '.results[] | select(.size > 104857600)'
```

<a name="setup-locally"></a>

# :pager: 本地开发

```bash
# -- 先克隆仓库
git clone https://github.com/voidcosmos/npkill.git

# -- 进入目录
cd npkill

# -- 安装依赖
npm install

# -- 运行
npm run start


# -- 如果你想附带参数运行，需要像下面这样加上 "--"：
npm run start -- -f -e
```

<a name="API"></a>

# :bookmark_tabs: API

这个 API 允许你从 Node 环境中与 npkill 交互，以便在你自己的脚本中构建实现（例如自动化场景）。

你可以在 [这里](./API.md) 查看基础 API，或者查看网页版本（即将推出）。

<a name="roadmap"></a>

# :crystal_ball: 路线图

- [x] 发布 0.1.0！
- [x] 改进代码
  - [x] 提升性能
  - [ ] 进一步提升性能！
- [x] 按大小和路径排序结果
- [x] 允许搜索其他类型的目录（targets）
- [ ] 减少依赖，做成更轻量的模块
- [ ] 支持按一段时间未使用的目录进行筛选
- [ ] 增加树状格式显示目录的选项
- [x] 添加一些菜单
- [x] 添加日志服务
- [ ] 周期性自动清理（？）

<a name="known-bugs"></a>

# :bug: 已知问题 :bug:

- 有时在删除文件夹时 CLI 会卡住。
- 排序，尤其是按路径排序时，在结果很多的情况下可能会拖慢终端。
- 有时大小计算结果会比实际偏大。
- （已解决）从高层级目录开始搜索时存在性能问题（例如 Linux 中的 `/`）。
- （已解决）更新 CLI 时文本有时会塌陷。
- （已解决）分析目录大小耗时比预期更长。

> 如果你发现了 bug，欢迎直接提 issue :)

<a name="contributing"></a>

# :revolving_hearts: 贡献

如果你想参与贡献，请查看 [CONTRIBUTING.md](.github/CONTRIBUTING.md)

<a name="donations"></a>

# :coffee: 请我们喝杯咖啡

<img align="right" width="300" src="https://npkill.js.org/img/cat-donation-cup.png">
我们在业余时间开发了 npkill，因为我们真心热爱编程这个领域。
未来我们希望能全职投入这件事，但在那之前，还有很长的路要走。

无论如何我们都会继续做下去，不过捐赠是支持我们工作方式中的一种。

<span class="badge-opencollective"><a href="https://opencollective.com/npkill/contribute" title="Donate to this project using Open Collective"><img src="https://img.shields.io/badge/open%20collective-donate-green.svg" alt="Open Collective donate button" /></a></span>

### 感谢！！

## 衷心感谢所有支持者 :heart:

<a href="https://opencollective.com/npkill#backers" target="_blank"><img width="535" src="https://opencollective.com/npkill/tiers/backer.svg?width=535"></a>

---

### 加密货币方式

- btc: 1ML2DihUoFTqhoQnrWy4WLxKbVYkUXpMAX
- bch: 1HVpaicQL5jWKkbChgPf6cvkH8nyktVnVk
- eth: 0x7668e86c8bdb52034606db5aa0d2d4d73a0d4259

<a name="license"></a>

# :scroll: 许可证

MIT · [Nya García Gallardo](https://github.com/NyaGarcia) 和 [Juan Torres Gómez](https://github.com/zaldih)

:cat::baby_chick:

---
