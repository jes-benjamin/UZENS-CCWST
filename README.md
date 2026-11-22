<!-- 语言切换 / Language / 言語 : [中文](./README.md) · [English](./README.en.md) · [日本語](./README.ja.md) -->

# UZENS CCWST

> **UZENS Convenient Configure WebSite Technology** —— 一个零依赖、零构建的静态网站架构：**把网站内容拆成一个个 `.txt` 文件，改文字只需改 txt，双击 HTML 即可预览。** 本项目是一个可运行的教学源码包，附带完整的原理详解。

![pure static](https://img.shields.io/badge/依赖-零依赖-brightgreen)
![no build](https://img.shields.io/badge/构建-不需要-blue)
![license](https://img.shields.io/badge/license-AGPL--3.0-blue)
![i18n](https://img.shields.io/badge/文档-中英日三语-purple)

[English](./README.en.md) · [日本語](./README.ja.md) · [原理详解 DOCS](./DOCS.md) · [DOCS English](./DOCS.en.md) · [DOCS 日本語](./DOCS.ja.md)

---

## 这是什么

想象一个网站：**内容维护者不用碰 HTML，只用记事本改几个 `.txt` 文件里的文字，网站内容就变了**；而且双击 `index.html` 就能看到效果，不用装 Node、不用起服务器、不用打包。

这个项目完整实现了这套机制，并把每一步讲清楚。它解决了三个真实痛点：

- **改内容怕改坏结构** —— 内容和 HTML 完全分离，改文字不会碰乱标签；
- **新增页面牵一发动全身** —— 每页一个独立 txt，新页面不影响旧页面；
- **零基础上手简单** —— 完全不用懂代码，txt 里只有"标题/内容/按钮"这样的占位词，照着改就行。

## 特性

- 📝 **内容即文本**：所有文字、图片地址、链接、列表数据都在 `content/*.txt` 里
- 🏷️ **每页网页名称可配**：每个页面 txt 的 `pageName` 字段自定义浏览器标题与可见题头，切语言自动变
- 🌐 **四语言切换**：中 / 英 / 繁 / 日，一键切换并记住选择（可选接机器翻译自动补全）
- 🎨 **全站可配**：整体字体、网站背景（图片/纯色/模糊/亮度/光晕色调）、每页独立字体
- 🃏 **数据驱动列表**：一个数组生成一组卡片，增删条目只改数组
- 🖼️ **图片展示块**：图片 + 文字 + 圆角按钮，宽高缩放可调，滤镜/旋转随时改
- 🌗 **双主题**：深/浅色切换并持久化
- ⚡ **零依赖零构建**：纯 HTML/CSS/原生 JS，双击即用，也能丢到任何静态托管
- 🛡️ **默认零影响**：所有可选项默认 `#` 占位，不动就保持模板原样
- 🤖 **AI Agent 友好**：内置 `AIagent/` 接入包与 `UZ.ai` 稳定 API
- 🧩 **围绕引擎开发**：[`engine/`](./engine/README.md) 开发套件含引擎源文件 + 三语教程 + 双击即用的起步骨架，可拿它开发自己的网页
- 📚 **教学友好**：代码带详细注释 + 中/英/日三语[原理详解](#文档与语言)

## 文档与语言

本项目的介绍文档（README）与原理文档（DOCS）均提供**中文 / English / 日本語**三个版本，顶部可互相切换：

| 文档 | 中文 | English | 日本語 |
|---|---|---|---|
| 项目介绍 | [README.md](./README.md) | [README.en.md](./README.en.md) | [README.ja.md](./README.ja.md) |
| 原理详解 | [DOCS.md](./DOCS.md) | [DOCS.en.md](./DOCS.en.md) | [DOCS.ja.md](./DOCS.ja.md) |
| 引擎开发套件 | [engine/README.md](./engine/README.md) | [engine/README.en.md](./engine/README.en.md) | [engine/README.ja.md](./engine/README.ja.md) |
| AI 接入 | [AIagent/README.md](./AIagent/README.md) | 同左（代码与指令为主） | 同左（代码与指令为主） |

> 💡 **想拿引擎自己开发网页？** 见 [`engine/`](./engine/README.md) 开发套件：内含引擎源文件、三语教程与一个**双击即可运行**的最小骨架。注意 `engine.js` 不能单独使用，必须配套 HTML 骨架 + txt 配置 + CSS。

## 快速开始

### 运行

```bash
# 方式一：直接双击 index.html（最简单，支持 file:// 打开）
# 方式二：或用任意静态服务器
python3 -m http.server 8000
# 浏览器打开 http://localhost:8000
```

### 改内容

打开 `content/` 下的 txt，只改单引号里的文字：

```js
// content/index.txt
pageName: { zh: '首页', en: 'Home', tw: '首頁', ja: 'ホーム' },  // ← 网页名称/题头
typed: { full: '大标题', highlight: '标题' },                    // ← 改这两个字
```

```js
// content/global.txt
i18n: {
    zh: { brand: '标题', nav_home: '首页' },     // ← 改成你的站名和导航
    en: { brand: 'Brand', nav_home: 'Home' }
}
```

保存后刷新网页即可。**只改引号里的文字，不要删逗号 `,`、引号 `'` 和括号 `{}` `[]`。**

### 目录结构

```
UZENS-CCWST/  (源码包目录 txt-config-website/)
├── README.md            # 本文件（中文介绍）
├── README.en.md         # 英文介绍
├── README.ja.md         # 日文介绍
├── DOCS.md / .en.md / .ja.md  # 三语原理详解
├── LICENSE              # AGPL-3.0 许可证
├── index.html           # 示例首页（结构 + 配置清单）
├── about.html           # 示例第二页（演示多页面共用引擎）
├── style.css            # 样式层（主题/字体/背景变量）
├── engine.js            # 通用渲染引擎（带教学注释 + 图片修改 + AI Agent API）
├── engine/              # ★ 围绕引擎开发网页的自包含套件（见下）
│   ├── engine.js        # 引擎源文件副本（可直接拿去改造）
│   ├── README.md / .en.md / .ja.md  # 三语开发教程
│   └── starter/         # 最小可运行骨架：双击 index.html 即用
│       ├── index.html / style.css
│       └── content/global.txt / index.txt
├── content/
│   ├── global.txt       # 全站配置：站点信息、导航、字体、背景、图片滤镜、通用文案
│   ├── index.txt        # 首页配置：pageName、打字机、展示块（含 fx）、功能卡片列表
│   ├── about.txt        # 关于页配置：pageName、作品列表
│   └── i18n.txt         # 自动翻译 API 配置（谷歌/必应/有道，默认关闭）
└── AIagent/             # 给 AI Agent 的接入包（见下）
    ├── README.md        # AI 入口：工作流与文件地图
    ├── AGENTS.md        # AI 操作守则：常见任务怎么做
    ├── API.md           # UZ.ai / UZ.image API 参考
    ├── manifest.json    # 机器可读的项目元信息与字段表
    └── examples/        # Playwright / 控制台操作示例
```

## 工作原理速览

```
content/global.txt ─┐
content/index.txt  ─┼─ <script src> 加载 → window.SITE_PAGES 仓库
content/about.txt  ─┘                          │
                                               │ body[data-page] 指定当前页
                                               ▼
                                         engine.js 读取
                                               │
                        data-i18n（文字）/ data-list（列表）占位
                                               ▼
                                    index.html / about.html
```

四步核心：**注册（txt 写入 `window.SITE_PAGES`）→ 加载（HTML 用 `<script src>`）→ 取用（`data-page` 定位当前页）→ 渲染（引擎填充 `data-i18n` / `data-list`）。**

> **为什么 txt 用 `<script src>` 而不是 fetch？** 因为双击打开时地址是 `file://`，`fetch` 读本地文件会被浏览器 CORS 策略拦截，而 `<script src>` 可以正常加载。所以 txt 内容写的是合法 JavaScript。详见 [DOCS.md 第 2 节](./DOCS.md#2-为什么-txt-能用-script-src-加载而不是-fetch)。

## 改什么，打开哪个文件

| 想改的内容 | 文件 / 字段 |
|---|---|
| 网页名称/题头（标题栏 + 可见标题） | 每个页面 txt → `pageName` |
| 浏览器默认标题、Logo、导航菜单、页脚 | `global.txt` → `siteInfo` / `nav` / `i18n` |
| 网站整体字体 | `global.txt` → `font.site` |
| 网站背景（图片/颜色/模糊/亮度/色调） | `global.txt` → `background` |
| 图片滤镜（亮度/灰度/模糊/旋转…） | `global.txt` → `imageFx`，或 `index.txt` → `showcase.fx` |
| 自动翻译 API（谷歌/必应/有道） | `content/i18n.txt` |
| 首页打字机、图片展示块 | `index.txt` → `typed` / `showcase` |
| 首页功能卡片 | `index.txt` → `features` 数组 |
| 关于页作品卡片 | `about.txt` → `works` 数组 |
| 某页标题/按钮/正文/弹窗字体 | 对应页 txt → `font` |
| 新增一种语言 | 各 txt 的 `i18n` 加一段 + `engine.js` 的 `LANG_NAME` |

## 常见操作

<details>
<summary><b>配置网页名称（题头）</b></summary>

每个页面的 txt 用 `pageName` 字段（四语言对象）定义"这页叫什么"，引擎会更新浏览器标题栏和导航栏可见标题，切语言时自动变：

```js
// content/index.txt
pageName: { zh: '首页', en: 'Home', tw: '首頁', ja: 'ホーム' }
```

取值优先级：`pageName` > `i18n.docTitle` > `global.siteInfo.title`。运行时可用 `UZ.ai.setPageName('新名称','zh')` 即时预览（永久修改仍要写回 txt）。
</details>

<details>
<summary><b>新增一个页面</b></summary>

1. 复制 `index.html` → `news.html`，把配置清单里的 `index.txt` 改成 `news.txt`，把 `<body data-page="index">` 改成 `data-page="news"`；
2. 新建 `content/news.txt`，写 `window.SITE_PAGES.news = { pageName:{...}, i18n: {...} }`；
3. 想在导航显示，就在 `global.txt` 的 `nav` 加一项 `{ i18n:'nav_news', href:'./news.html', page:'news' }`，并在四语言 `i18n` 里各加 `nav_news`。

旧页面完全不受影响。详见 [DOCS.md 第 13 节](./DOCS.md#13-如何新增一个页面)。
</details>

<details>
<summary><b>新增一种列表</b></summary>

1. 页面 txt 里加一个数组（如 `newsList: [...]`）；
2. HTML 里放 `<div data-list="newsList"></div>`；
3. `engine.js` 的 `RENDERERS` 里加同名函数 `newsList: function(item){...}`。

三处名字对齐即可。详见 [DOCS.md 第 14 节](./DOCS.md#14-如何新增一种列表)。
</details>

<details>
<summary><b>接入机器翻译（谷歌/必应/有道）</b></summary>

只写中文、自动生成其它语言：收集所有中文文案 → 批量调 API → 译文写回字典 → 重新渲染。三家 API 的端点、鉴权、语言码映射与安全提醒见 [DOCS.md 第 15 节](./DOCS.md#15-进阶接入机器翻译-api)。

⚠️ 前端 txt 里的密钥访问者可见，务必配置域名白名单与用量上限，正式项目建议走后端代理。

配置文件 `content/i18n.txt` 已随包提供，两个 HTML 默认都已加载它。默认 `enabled: '#'` = 关闭、零网络请求；想用时改 `enabled: true` 并填一家密钥即可。三家申请教程写在 `i18n.txt` 的头部注释里。
</details>

<details>
<summary><b>修改图片（换图 + 滤镜/旋转）</b></summary>

两种方式，任选：

**① 改 txt（永久）**——和改文字一样，刷新后保留：
```js
// index.txt 的 showcase
showcase: {
    img: 'banner.png',
    fx: { brightness: 1.1, saturate: 1.2, rotate: 2 }  // 图片滤镜
}
```
全站默认滤镜写在 `global.txt` 的 `imageFx`，某张图自己的 `fx` 优先。

**② 运行时 API（即时预览）**——浏览器控制台调用，刷新即失效：
```js
UZ.image.set('#showcaseImg', 'https://example.com/new.png');  // 换图
UZ.image.filter('#showcaseImg', { grayscale: 1, blur: 2 });    // 改滤镜
UZ.image.reset('#showcaseImg');                                // 恢复
```
支持的滤镜字段：`brightness / contrast / saturate / grayscale / blur / sepia / invert / hueRotate / opacity`，以及变换 `rotate / scale / flipX / flipY`。默认 `'#'` 或等于默认值 = 不生效（零影响）。完整字段表见 [AIagent/API.md](./AIagent/API.md#图片修改)。
</details>

<details>
<summary><b>让 AI Agent 操作本项目</b></summary>

项目内置 `AIagent/` 接入包，AI 读完即可上手：`README.md`（总入口）→ `AGENTS.md`（操作守则）→ `API.md`（API 参考）→ `manifest.json`（机器可读元信息）+ `examples/`（示例脚本）。

引擎暴露稳定的 `window.UZ.ai` API，可自描述、读现状、批量改内容：
```js
UZ.ai.describe();   // 有哪些能力、怎么传参
UZ.ai.getConfig();  // 读当前全部配置
UZ.ai.apply([
  { op:'setLang',  args:['en'] },
  { op:'setPageName', args:['Home','en'] },
  { op:'setText',  args:['section_title','All-in-one','en'] },
  { op:'setImageFilter', args:['#showcaseImg',{ grayscale:1 }] }
]);                 // 批量修改，立即生效
```
> ⚠️ 运行时 API 只改内存、刷新失效；永久修改必须用文件编辑工具写回 `content/*.txt`。详见 [AIagent/README.md](./AIagent/README.md)。
</details>

## 技术栈

原生 HTML + CSS + JavaScript（ES5 语法，兼容性好），无框架、无依赖、无构建步骤。用到的浏览器 API：`querySelector`、`localStorage`、`IntersectionObserver`、`URLSearchParams`、`CSS 自定义属性`。

## 许可证

[AGPL-3.0](./LICENSE) —— 可以自由使用、修改、分发；若通过网络提供服务，需向用户开放对应源码。详见 LICENSE 全文。

---

<p align="center">UZENS CCWST · 如果这个项目帮你理解了"配置驱动的静态网站"，欢迎 Star ⭐</p>
