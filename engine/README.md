# engine/ —— 围绕引擎源文件开发网页

[中文](./README.md) · [English](./README.en.md) · [日本語](./README.ja.md)

> 本文件夹是一套**可直接运行的引擎开发套件**。回答一个问题：**`engine.js` 单独下载就能用吗？——不能，但照本套件的骨架，5 分钟就能搭起自己的网页。**

## 1. 先说清楚：引擎不能单独用

`engine.js` 是一个**渲染引擎（粘合层）**，它只负责"把配置里的数据填进页面骨架"。它本身不含任何文字、图片或样式，所以**只下载这一个文件是打不开网页的**。它必须和另外三样东西配合：

| 组成 | 作用 | 本套件里的位置 |
|---|---|---|
| `engine.js` | 渲染引擎：读配置、填页面、绑定交互 | `./engine.js` |
| HTML 骨架 | 只有结构标记，没有写死的内容 | `./starter/index.html` |
| `content/*.txt` | 真正的网站内容（其实是 JS） | `./starter/content/` |
| `style.css` | 布局与 CSS 变量配置层 | `./starter/style.css` |

**好消息**：本文件夹已经把四样东西都备齐了。`starter/` 是一个最小可运行示例——**双击 `starter/index.html` 就能看到完整网页**，无需 Node、无需服务器、无需打包。

## 2. 三步上手（最快路径）

```bash
# 第 1 步：复制起步骨架到你的项目
cp -r engine/starter my-site/

# 第 2 步：把引擎放到能让 starter 找到的位置
#   starter/index.html 末尾写的是 <script src="../engine.js"></script>
#   所以把 engine/engine.js 复制到 my-site/ 的上一级，或改成你的实际路径
cp engine/engine.js my-site-engine.js   # 再把 HTML 里的路径改成 ./my-site-engine.js

# 第 3 步：双击 my-site/index.html —— 完成，无需构建
```

> 关键：**引擎文件放哪都行，只要 HTML 末尾 `<script src="...">` 指向它**。配置 txt 也是同理，路径写在 `<head>` 的 `<script src>` 里。

## 3. 引擎与页面之间的"契约"

引擎不认识你的设计，但它认识一套**固定的标记约定**。你的 HTML 只要遵守这些约定，引擎就能工作。这是围绕引擎开发的核心。

### 3.1 `<body>` 上的 `data-page`

```html
<body data-page="index">
```

引擎读这个属性，去 `window.SITE_PAGES.index` 找本页配置。做第二个页面时写 `data-page="about"`，引擎就会去找 `window.SITE_PAGES.about`。

### 3.2 `<head>` 里的加载顺序（**顺序不能错**）

```html
<script src="content/global.txt"></script>  <!-- ① 全站配置，必须第一 -->
<script src="content/index.txt"></script>   <!-- ② 本页配置 -->
<!-- ...引擎放 </body> 前最后加载 -->
<script src="../engine.js"></script>
```

用 `<script src>` 而不是 `fetch()`，是为了**双击 `file://` 打开也能用**（fetch 本地文件会被 CORS 拦截）。这也是整套架构能"零服务器"的根本原因。

### 3.3 内容标记：引擎往哪里填文字

| 标记 | 作用 | 示例 |
|---|---|---|
| `data-i18n="字段名"` | 从字典取当前语言的文字填入元素 | `<p data-i18n="hero_sub">副标题</p>` |
| `data-i18n-aria="字段名"` | 填入 `aria-label` 无障碍文案 | 主题按钮 |
| `data-i18n-title="字段名"` | 填入 `title` 属性 | 可选 |
| `data-list="数组名"` | 空容器，引擎按数组生成一组卡片 | `<div data-list="features"></div>` |

字典来自各 txt 的 `i18n` 对象（四语言：zh/en/tw/ja）。想让一段文字能切语言，就在 txt 的 `i18n` 里加一个字段，再在 HTML 元素上写 `data-i18n="字段名"`。

### 3.4 固定 ID：引擎认识的"插槽"

这些 ID 是引擎约定的接口，改名会导致对应功能失效（但不会报错崩溃）：

| ID | 功能 | 是否需要 |
|---|---|---|
| `#navLinks` | 导航链接容器，按 `global.nav` 生成 | 有导航就需要 |
| `#pageName` | 导航栏可见的网页名称（`pageName` 写入） | 可选 |
| `#brandText` | 站点名称文字 | 可选 |
| `#langSeg` | 语言切换按钮组 | 要切语言就需要 |
| `#themeToggle` | 主题切换按钮 | 要切主题就需要 |
| `#typed` | 打字机文字容器 | 首页打字机需要 |
| `#infoModal` / `#infoModalClose` / `#infoModalTitle` / `#infoModalHint` | 通用信息弹窗 | 要弹窗就需要 |
| `#toast` | 轻提示 | 要提示就需要 |
| `#showcase` 系列 | 图片展示块（可选部件，可整个删掉） | 可选 |

> 说明：所有 ID 都是**可选**的——引擎对每个插槽都做了 `if (!el) return` 的空值保护。你可以只用其中一部分，做一个极简页面。

### 3.5 配置文件 = 合法的 JS

`content/*.txt` 虽然叫 txt，内容是 JS 赋值语句：

```js
window.SITE_PAGES = window.SITE_PAGES || {};
window.SITE_PAGES.index = {
    pageName: { zh: '首页', en: 'Home', tw: '首頁', ja: 'ホーム' },
    i18n: { zh: { hero_sub: '副标题' }, en: { hero_sub: 'Sub title' }, ... }
};
```

每个 txt 往同一个 `window.SITE_PAGES` 仓库里塞自己的配置对象，互不覆盖。改内容只需改单引号里的文字。

## 4. 从零做一个自己的页面（完整流程）

1. **复制骨架**：`cp -r engine/starter my-site/`，删掉不需要的部件。
2. **改全站配置** `content/global.txt`：站点名、导航、全站文案字典。
3. **改本页配置** `content/index.txt`：`pageName`、打字机文字、`features` 数组、本页文案。
4. **改 HTML 骨架** `index.html`：保留需要的插槽 ID 和 `data-i18n`/`data-list` 标记，删掉不用的 section。
5. **指向引擎**：确认末尾 `<script src="...">` 指向 `engine.js` 的实际位置。
6. **双击打开**：`file://` 直接看效果，改 txt 刷新即可。

**新增页面**：复制 `index.html` → 改 `<body data-page="about">` → 新建 `content/about.txt` → 在 `<head>` 配置清单加一行 `<script src="content/about.txt"></script>` → 在 `global.txt` 的 `nav` 数组加一项。详见主文档 `DOCS.md` 第 13 节。

## 5. 扩展引擎（高级）

引擎的两个扩展点与运行时 API：

- **新增列表类型**：在 `engine.js` 的 `RENDERERS` 里加同名函数（如 `newsList`），HTML 里写 `<div data-list="newsList">`。见 `DOCS.md` 第 14 节。
- **新增语言**：在各 txt 的 `i18n` 加语言段落，并在 `engine.js` 的 `LANG_NAME` 里加名字。见 `DOCS.md` 各语言章节的"常见操作"。
- **修改图片**：配置入口 `global.imageFx` / 页面 `showcase.fx`；运行时 `window.UZ.image.set/filter/reset`。见 `DOCS.md` 第 16 节。
- **AI Agent 接入**：`window.UZ.ai` 提供自描述 API，可读写内容与外观。见 `DOCS.md` 第 17 节与根目录 `AIagent/` 文件夹。
- **机器翻译**：`content/i18n.txt` 配置谷歌/必应/有道，默认关闭。

## 6. 常见坑

| 现象 | 原因 / 解决 |
|---|---|
| 打开显示"内容配置未加载" | `global.txt` 没找到：确认 HTML 在 `content/` 同级、`<script src>` 路径正确 |
| 双击后文字不出现 | txt 里有语法错误（多半是漏逗号/引号）。可把 txt 复制成 `.js` 用 `node --check` 检查 |
| 切语言没反应 | 元素缺 `data-i18n` 标记，或对应字典字段没写 |
| 改了 txt 没变化 | 浏览器缓存，强制刷新（Ctrl+F5） |
| 卡片不生成 | HTML 缺 `data-list="features"`，或 txt 里数组名为空 |

## 7. 文件清单

```
engine/
├── engine.js          # 引擎源文件（直接拿去用/改造，带完整教学注释）
├── README.md          # 本教程（中）
├── README.en.md       # 教程（英）
├── README.ja.md       # 教程（日）
└── starter/           # 最小可运行骨架（双击 index.html 即可看）
    ├── index.html
    ├── style.css
    └── content/
        ├── global.txt
        └── index.txt
```

深入原理见根目录 `DOCS.md`（18 节完整讲解）。
