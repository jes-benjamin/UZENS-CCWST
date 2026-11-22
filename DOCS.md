<!-- 语言切换 / Language / 言語 : [中文](./DOCS.md) · [English](./DOCS.en.md) · [日本語](./DOCS.ja.md) -->

# 原理详解：如何用 txt 分文件配置网页内容

> **UZENS CCWST** — UZENS Convenient Configure WebSite Technology
> 语言：[中文](./DOCS.md) · [English](./DOCS.en.md) · [日本語](./DOCS.ja.md) ｜ 项目介绍：[中文](./README.md) · [English](./README.en.md) · [日本語](./README.ja.md)

> 配套可运行示例见本包根目录的 `index.html` / `about.html` / `engine.js` / `content/`。
> 建议边看文档边打开示例代码对照。

这套架构要解决的问题很具体：**让不会写代码的人，只改几个 `.txt` 文件里的文字，就能改一个完整网站的内容**，而且双击 `index.html` 就能看到效果，不需要装环境、不需要服务器、不需要构建工具。

下面从最根本的问题开始，一层一层讲清楚它是怎么做到的。

---

## 目录

1. [核心思路：内容与结构分离](#1-核心思路内容与结构分离)
2. [为什么 txt 能用 `<script src>` 加载（而不是 fetch）](#2-为什么-txt-能用-script-src-加载而不是-fetch)
3. [`window.SITE_PAGES`：多个 txt 共用的配置仓库](#3-windowsite_pages多个-txt-共用的配置仓库)
4. [引擎如何找到"当前页"的配置](#4-引擎如何找到当前页的配置)
5. [i18n：全站文案与页面文案的浅合并](#5-i18n全站文案与页面文案的浅合并)
6. [`data-i18n`：把字典里的文字填进页面](#6-data-i18n把字典里的文字填进页面)
7. [多语言对象 `L()`：让列表和部件也能切语言](#7-多语言对象-l让列表和部件也能切语言)
8. [数据驱动列表：一个数组生成一组卡片](#8-数据驱动列表一个数组生成一组卡片)
9. [CSS 变量分层：字体/主题/背景的"配置层"](#9-css-变量分层字体主题背景的配置层)
10. ["默认零影响"：用 `#` 和空值当占位符](#10-默认零影响用--和空值当占位符)
11. [按钮的三种绑定：跳转 / 弹窗 / 提示](#11-按钮的三种绑定跳转--弹窗--提示)
12. [事件委托：让动态生成的元素也能响应](#12-事件委托让动态生成的元素也能响应)
13. [如何新增一个页面](#13-如何新增一个页面)
14. [如何新增一种列表](#14-如何新增一种列表)
15. [进阶：接入机器翻译 API](#15-进阶接入机器翻译-api)
16. [修改图片：换图与 CSS 滤镜](#16-修改图片换图与-css-滤镜)
17. [给 AI Agent 的接入 API](#17-给-ai-agent-的接入-api)
18. [这套模式的边界与注意点](#18-这套模式的边界与注意点)
19. [围绕引擎开发自己的网页：engine/ 开发套件](#19-围绕引擎开发自己的网页engine-开发套件)

---

## 1. 核心思路：内容与结构分离

一个网页可以拆成三层：

| 层 | 文件 | 谁改 | 装的是什么 |
|---|---|---|---|
| **内容层** | `content/*.txt` | 内容维护者 | 文字、图片地址、链接、列表数据 |
| **结构层** | `*.html` | 开发者（很少动） | 页面骨架、占位标记 `data-i18n` / `data-list` |
| **表现层** | `style.css` | 开发者（很少动） | 颜色、布局、动画 |

再加一个**粘合层** `engine.js`：它读取内容层，把数据填进结构层。

```
   content/global.txt ─┐
   content/index.txt  ─┼─→  window.SITE_PAGES（仓库）
   content/about.txt  ─┘            │
                                    │ engine.js 读取
                                    ▼
                          index.html / about.html
                        （data-i18n / data-list 占位处被填充）
```

**好处**：

- 改一句文案，只改一个 txt 的一行，不会碰乱 HTML 结构；
- 每个页面一个 txt，新增页面不会牵连旧页面；
- 内容文件是纯文本，任何人都能用记事本改。

---

## 2. 为什么 txt 能用 `<script src>` 加载（而不是 fetch）

这是整套方案能"双击打开就用"的关键，也是最容易被忽略的细节。

初学者通常会想：内容在 txt 里，那就用 `fetch('content/index.txt')` 读进来呗。但在本地双击打开网页时，地址栏是 `file://...`，浏览器的**同源策略**会把 `fetch` 本地文件当成跨域请求拦下来，直接报错。

而 `<script src="content/index.txt">` 不一样：浏览器把任何 `<script src>` 指向的文件都当 JavaScript 来执行，本地文件也照常加载。所以只要 **txt 文件内容本身就是合法的 JavaScript**，它就能被"加载"。

于是 txt 里不写 JSON，而写 JS 赋值语句：

```js
// content/index.txt 的内容其实是 JS
window.SITE_PAGES = window.SITE_PAGES || {};
window.SITE_PAGES.index = {
    typed: { full: '大标题' },
    // ...
};
```

HTML 里这样加载（顺序很重要）：

```html
<script src="content/global.txt"></script>
<script src="content/index.txt"></script>
<script src="engine.js"></script>
```

> `.txt` 后缀只是给人看的，浏览器按 `<script>` 的方式执行它，不看后缀。
> 也可以叫 `.js`，叫 `.txt` 是为了强调"这是给人改的内容文件，不是代码"。
>
> 代价：这些 txt 里**不能有真正的私密信息**（比如 API 密钥），因为访问者能看到。这也是为什么机器翻译密钥只适合演示/内部使用，正式站要点域名白名单或走后端。

---

## 3. `window.SITE_PAGES`：多个 txt 共用的配置仓库

每个 txt 开头都有这两行：

```js
window.SITE_PAGES = window.SITE_PAGES || {};
window.SITE_PAGES.index = { /* 本页配置 */ };
```

第一行是关键技巧。`||` 的意思是"左边的若不存在就用右边"：

- 如果 `window.SITE_PAGES` 还没被创建（第一个 txt 加载时），就新建一个空对象 `{}`；
- 如果已经存在（后面的 txt 加载时），就保留已有的内容。

这样三个 txt 依次加载，结果是往**同一个对象**里塞了三个键：

```js
window.SITE_PAGES = {
    global: { /* 全站配置 */ },
    index:  { /* 首页配置 */ },
    about:  { /* 关于页配置 */ }
};
```

如果每个 txt 都写 `window.SITE_PAGES = {}`，后加载的就会把前面的覆盖掉——所以 `= window.SITE_PAGES || {}` 这个写法不能省。

---

## 4. 引擎如何找到"当前页"的配置

多页面站点里，`index.html` 和 `about.html` 共用同一个 `engine.js`。引擎怎么知道该读哪份配置？答案在 `<body>` 的一个自定义属性上：

```html
<!-- index.html -->
<body data-page="index">
```

```html
<!-- about.html -->
<body data-page="about">
```

引擎开头这样取：

```js
var PAGES = window.SITE_PAGES || {};
var G = PAGES.global;                                  // 全站配置
var pageKey = document.body.getAttribute('data-page'); // 'index' 或 'about'
var cur = PAGES[pageKey] || {};                        // 当前页配置
```

`data-*` 是 HTML 标准允许的自定义属性，专门用来给 JS 传递信息，不影响页面显示。`data-page="about"` 就让引擎去读 `window.SITE_PAGES.about`。

> 如果 `global.txt` 没加载成功，`G` 是空的。引擎检测到后会显示一句友好提示，而不是白屏——这是必要的容错。

---

## 5. i18n：全站文案与页面文案的浅合并

每份配置里都有一个 `i18n` 对象，按语言分组：

```js
i18n: {
    zh: { brand: '标题', nav_home: '首页', ... },
    en: { brand: 'Brand', nav_home: 'Home', ... },
    tw: { /* ... */ },
    ja: { /* ... */ }
}
```

全站通用文案放 `global.txt`，某页专有文案放该页 txt。引擎启动时把它们**按语言浅合并**：

```js
var I18N = { zh: {}, en: {}, tw: {}, ja: {} };
function mergeI18n() {
    ['zh', 'en', 'tw', 'ja'].forEach(function (lang) {
        var g = (G.i18n && G.i18n[lang]) || {};   // 全站
        var p = (cur.i18n && cur.i18n[lang]) || {}; // 本页
        var out = {};
        Object.keys(g).forEach(function (k) { out[k] = g[k]; }); // 先放全站
        Object.keys(p).forEach(function (k) { out[k] = p[k]; }); // 本页覆盖同名字段
        I18N[lang] = out;
    });
}
```

"浅合并"指只合并对象的第一层。`zh` 这一层里，`brand`、`nav_home` 这些字段被逐项合并；**本页的同名字段会覆盖全站的**——这就是"通用放 global，专属放本页，且本页优先"的实现。

合并后得到一张大字典 `I18N.zh.字段名`、`I18N.en.字段名`……后续所有文字都从这里取。

---

## 6. `data-i18n`：把字典里的文字填进页面

HTML 骨架里的文字位置不写死文案，而是写一个标记：

```html
<p class="eyebrow" data-i18n="eyebrow">小标题</p>
<h2 data-i18n="section_title">大标题</h2>
```

`data-i18n="eyebrow"` 的意思是"这里的文字由字典里 `eyebrow` 这个字段决定"。标签里原本写的"小标题"只是**占位文字**，页面一打开就会被替换掉（万一 JS 没加载，至少还有个样子）。

引擎扫描所有带这个标记的元素，把当前语言字典里对应的值填进去：

```js
function applyI18n() {
    var d = I18N[state.lang] || {};
    $$('[data-i18n]').forEach(function (el) {
        var key = el.getAttribute('data-i18n');
        if (d[key] != null) el.textContent = d[key];
    });
    // aria-label 等非文本内容用 data-i18n-aria
    document.title = d.docTitle || ...;
}
```

切换语言时，只需改 `state.lang` 再调一次 `applyI18n()`，全页文字瞬间换语言。这就是"四语言一键切换"的全部秘密。

### 网页名称（题头）`pageName`

每个页面可以在自己的 txt 里用 `pageName`（四语言对象）定义"这页叫什么"，引擎的 `applyPageName()` 会把它写到两处：浏览器标签 `document.title` 和导航栏的可见标题 `#pageName`。切语言时它和别的文字一起更新。

```js
// content/index.txt
pageName: { zh: '首页', en: 'Home', tw: '首頁', ja: 'ホーム' }
```

取值优先级：`pageName` > `i18n.docTitle` > `global.siteInfo.title`。这是"每页可独立改网页名称"的实现——页面 txt 各自管各自的题头，互不影响。

---

## 7. 多语言对象 `L()`：让列表和部件也能切语言

`data-i18n` 适合处理 HTML 里写死的静态文字。但列表卡片是 JS 动态生成的，图片展示块的文字也在配置对象里——它们的文字怎么写？

答案是**多语言对象**：一个字段直接写成四种语言的值。

```js
title: { zh: '标题', en: 'Title', tw: '標題', ja: 'タイトル' }
```

引擎提供 `L()` 函数按当前语言取值：

```js
function L(obj) {
    if (obj == null) return '';
    if (typeof obj !== 'object') return obj;          // 普通字符串原样返回
    return obj[state.lang] || obj.zh || obj.en || ''; // 当前语言→中文→英文→空
}
```

渲染时用 `L(item.title)`，切语言时**重新渲染一遍列表**，卡片文字就跟着变了。这就是 `setLang()` 里要调用 `renderLists()` 和 `renderShowcase()` 的原因——它们内部用了多语言对象。

> 兼容性设计：`L()` 对字符串也有效。所以配置里既能写 `'标题'`（所有语言都一样），也能写四语言对象，灵活度很高。缺某种语言会自动回退中文，不会显示空白。

---

## 8. 数据驱动列表：一个数组生成一组卡片

这是"改内容不用改 HTML"最典型的体现。

配置里一个数组：

```js
features: [
    { icon: '✦', desc: {zh:'小标题',...}, paras: [{zh:'内容',...}] },
    { icon: '◆', desc: {...}, paras: [...] },
    { icon: '●', desc: {...}, paras: [...] }
]
```

HTML 里只有一个空容器：

```html
<div class="card-grid" data-list="features"></div>
```

引擎有个"渲染函数注册表"，键名和数组名、`data-list` 值三者对应：

```js
var RENDERERS = {
    features: function (item) {
        return '<article class="card">…' + esc(L(item.desc)) + '…</article>';
    },
    works: function (item) { /* … */ }
};

function renderLists() {
    $$('[data-list]').forEach(function (box) {
        var name = box.getAttribute('data-list'); // 'features'
        var arr = cur[name];                       // 配置里的数组
        var fn = RENDERERS[name];                  // 对应的渲染函数
        if (!arr || !fn) return;
        box.innerHTML = arr.map(function (item, i) {
            return fn(item, i);                    // 每项 → 一段 HTML
        }).join('');
    });
}
```

想加一张卡片？往数组里加一个对象即可。想删？删一个对象。HTML 一行都不用动。

**三个名字要对齐**：配置里的数组名（`features`）、HTML 的 `data-list="features"`、注册表里的 `RENDERERS.features`。这是这套机制唯一的"约定"，记住就不会出错。

---

## 9. CSS 变量分层：字体/主题/背景的"配置层"

如果字体、背景这些也能在 txt 里配，且不改 CSS，怎么做到的？答案是 **CSS 变量 + 回退值**。

CSS 里不写死字体，而是写变量，并给一个回退值：

```css
:root { --font-ui: 'PingFang SC', sans-serif; }
body { font-family: var(--font-ui); }
.hero-title { font-family: var(--pg-title, Georgia, serif); }
```

JS 不碰任何 CSS 规则，只在元素上**设置变量**：

```js
function applyFonts() {
    if (G.font.site && G.font.site !== '#')
        document.documentElement.style.setProperty('--font-ui', G.font.site);
    if (cur.font.title && cur.font.title !== '#')
        document.body.style.setProperty('--pg-title', cur.font.title);
}
```

- 没配置时：变量没被设置，CSS 用回退值 = 模板默认外观；
- 配置了：变量一写，所有用 `var(--pg-title, …)` 的地方同时生效。

**主题**用同样的思路，只是开关放在根元素的属性上：

```js
document.documentElement.setAttribute('data-theme', 'light');
```

CSS 里写两套变量：

```css
:root { --bg: #0a0a0c; }                    /* 深色 */
[data-theme="light"] { --bg: #f2f2f5; }    /* 浅色 */
```

**背景图片**也是变量：`--bg-img`、`--bg-blur`、`--bg-bright`，由 `applyBackground()` 根据 `global.txt` 的 `background` 设置。CSS 里 `.background-layer` 用 `background-image: var(--bg-img)` 读取。

这种"JS 只写变量、CSS 只读变量"的分层，好处是：
- 外观逻辑集中在 CSS，JS 只负责传值；
- 换主题不用重新算样式，改一个属性即可；
- 配置与默认回退天然分离，互不干扰。

---

## 10. "默认零影响"：用 `#` 和空值当占位符

你会在配置里反复看到 `'#'` 和 `''`（空字符串）。这是一个刻意的设计约定：

> **`#` = 占位符，表示"这一项没配置，用默认值"。**

比如字体：

```js
font: { site: '#', title: '#' }
```

JS 里所有应用配置的地方都先判断：

```js
if (f.title && f.title !== '#') { /* 才设置变量 */ }
```

所以模板交付时所有可选项都是占位状态，**外观 = 模板默认**。使用者只填自己想改的项，其它项保持 `#`，不会被意外改动。空字符串 `''` 用于图片/链接字段，含义类似："没填图片就显示占位图，没填链接就弹提示"。

这条约定让模板既"开箱即用"，又"可渐进定制"——这是它能安全地发给不懂代码的人用的前提。

---

## 11. 按钮的三种绑定：跳转 / 弹窗 / 提示

按钮的行为也通过 HTML 标记声明，不需要为每个按钮写 JS：

| 写法 | 行为 | 场景 |
|---|---|---|
| `<a href="https://…">` | 跳转链接 | 外链、页面导航 |
| `<button data-modal>` | 打开信息弹窗 | "了解更多"、说明 |
| `<a href="#" data-link-unset>` | 弹"未配置"提示 | 配置里 url 为空时的占位 |

第三种特别有用：配置里 `url` 为空时，渲染函数自动给按钮加 `data-link-unset`，点击就提示"未配置"，而不是跳到一个坏链接。使用者填上 `url` 后，渲染函数就换成真正的 `<a href>`。这样"没配好"的状态是明显且友好的，而不是静默失败。

---

## 12. 事件委托：让动态生成的元素也能响应

列表卡片是 JS 生成的，页面加载时它们还不存在。如果给每个按钮单独绑事件，新生成的按钮就没反应。

引擎用**事件委托**解决：只在 `document` 上挂一个点击监听，通过 `closest()` 判断点到的是哪类元素：

```js
document.addEventListener('click', function (e) {
    var langBtn = e.target.closest && e.target.closest('#langSeg button[data-lang]');
    if (langBtn) { setLang(langBtn.getAttribute('data-lang')); return; }

    var unset = e.target.closest && e.target.closest('[data-link-unset]');
    if (unset) { e.preventDefault(); showToast(...); return; }

    var modalBtn = e.target.closest && e.target.closest('[data-modal]');
    if (modalBtn) { e.preventDefault(); openModal(); }
});
```

因为事件会冒泡到 `document`，所以无论元素是新生成的还是原本就有的，都能被这个监听器捕获。这是处理动态内容事件的标准做法。

---

## 13. 如何新增一个页面

假设要加一个"新闻"页：

**第 1 步**：复制 `index.html` 为 `news.html`，改两处：
```html
<script src="content/news.txt"></script>   <!-- 换成新 txt -->
<body data-page="news">                     <!-- 换成新页名 -->
```
删掉不需要的区块，留下骨架和占位标记。

**第 2 步**：新建 `content/news.txt`：
```js
window.SITE_PAGES = window.SITE_PAGES || {};
window.SITE_PAGES.news = {
    font: { title: '#', button: '#', text: '#', modal: '#' },
    i18n: {
        zh: { docTitle: '标题', page_title: '大标题' },
        en: { docTitle: 'Title', page_title: 'Big title' },
        tw: { docTitle: '標題', page_title: '大標題' },
        ja: { docTitle: 'タイトル', page_title: '大見出し' }
    }
};
```

**第 3 步**（可选）：在 `global.txt` 的 `nav` 数组里加一项，导航就多了入口，且会正确高亮当前页：
```js
{ i18n: 'nav_news', href: './news.html', page: 'news' }
```
并在 `global.txt` 的 `i18n` 四语言里各加 `nav_news: '按钮'`。

完成。旧页面完全不受影响——因为配置是按页隔离的。

---

## 14. 如何新增一种列表

假设新闻页要一个"新闻列表"：

**第 1 步**：在 `news.txt` 加数组：
```js
newsList: [
    { title: {zh:'标题', en:'Title'}, date: '内容' },
    { title: {zh:'标题', en:'Title'}, date: '内容' }
]
```

**第 2 步**：在 `news.html` 放空容器：
```html
<div data-list="newsList"></div>
```

**第 3 步**：在 `engine.js` 的 `RENDERERS` 里加同名函数：
```js
newsList: function (item) {
    return '<article class="card"><h3>' + esc(L(item.title)) +
           '</h3><p>' + esc(item.date) + '</p></article>';
}
```

三处名字对齐（`newsList`），列表就出来了，切语言时标题也会跟着变。

---

## 15. 进阶：接入机器翻译 API

如果不想为每种语言手填文案，可以只写中文，让翻译 API 自动补全其它语言。本包**已内置**这套能力：配置在 `content/i18n.txt`（默认 `enabled: '#'` 关闭），实现在 `engine.js` 第 8 部分，两个 HTML 都已加载该 txt。

**运行流程**：

1. 启动时 `autoEnabled()` 检查开关：没开就直接跳过，**零网络请求**、零副作用；
2. 开了则 `collectSlots()` 收集所有中文槽位——字典里的字符串 + 递归遍历 `global`/当前页配置里所有 `{zh,en,tw,ja}` 多语言对象的 `.zh` 值，按文案去重；
3. `onlyFillMissing: true` 时只翻译"译文为空或还等于中文"的槽位，不覆盖你手填的译文；
4. 按 `provider` 选 Google / Bing / 有道，每 40 条一批调用，译文写回字典与多语言对象；
5. 完成后 `setLang(state.lang, false)` 重新渲染，页面立刻显示译文。

配置字段（`i18n.txt`）：

```js
window.SITE_PAGES.i18nConfig = {
    enabled: '#',              // '#' 关闭；true 开启
    provider: 'google',        // google / bing / youdao
    targets: ['en','tw','ja'], // 要生成哪些语言（zh 是源语言）
    onlyFillMissing: true,     // true 不覆盖已有译文
    google:  { apiKey: '' },
    bing:    { apiKey: '', region: '' },
    youdao:  { appKey: '', appSecret: '' }
};
```

三家主流 API 的浏览器端调用方式：

| 服务商 | 端点 | 鉴权 | 浏览器跨域 |
|---|---|---|---|
| Google | `translation.googleapis.com/language/translate/v2` | API Key | 支持 CORS |
| 微软必应 | `api.cognitive.microsofttranslator.com/translate` | Key + Region | 支持 CORS |
| 有道 | `openapi.youdao.com/api` | appKey + appSecret + SHA256 签名 | 服务端 API，浏览器直连常被拦 |

语言码要做映射（如中文：Google `zh-CN`、Bing `zh-Hans`、有道 `zh-CHS`），引擎里用 `LANG_GOOGLE`/`LANG_BING`/`LANG_YOUDAO` 三张表处理。有道的签名用 `crypto.subtle.digest('SHA-256', …)` 计算。三家申请密钥的步骤写在 `i18n.txt` 头部注释里。

**安全提醒**（重要）：前端 txt 里的密钥任何访问者都能看到。务必在服务商后台设置**域名白名单 + 用量上限**；正式项目建议把密钥放到后端代理，前端不接触密钥。有道在 `file://` 下因 Web Crypto 与跨域通常不可用，演示优先用 Google/必应。

---

## 16. 修改图片：换图与 CSS 滤镜

"改图片"和"改文字"用的是同一套思路——**把数据放进配置，引擎读配置渲染**。本包支持两种入口：

**① 配置入口（永久）**。在 `global.txt` 写全站默认滤镜 `imageFx`，在展示块写自己的 `fx`（本页优先）：

```js
// global.txt
imageFx: { brightness: '#', blur: '#' }   // 全是 '#' = 不生效

// index.txt → showcase.fx
showcase: {
    img: 'banner.png',
    fx: { brightness: 1.1, saturate: 1.2, rotate: 2 }
}
```

引擎的 `applyFx(img, fx)` 把滤镜对象拼成两段 CSS：`filter`（亮度/对比度/饱和度/灰度/模糊/复古/反色/色相/不透明度）和 `transform`（旋转/缩放/翻转），写到图片的 `style` 上。`filterCSS()` 会跳过 `'#'` 和等于默认值的字段，保证"默认零影响"。

**② 运行时入口（即时）**。`engine.js` 第 9 部分暴露 `window.UZ.image`：

```js
UZ.image.set('#showcaseImg', 'new.png');            // 换图
UZ.image.filter('#showcaseImg', { grayscale: 1 });  // 改滤镜
UZ.image.get('#showcaseImg');                       // 读当前状态
UZ.image.reset('#showcaseImg');                     // 恢复
```

关键点：换图只改 `img.src`，改滤镜只写 CSS，都不碰原始图片文件——所以可以随意试，随时 `reset()` 还原。这与"配置即数据"一脉相承：图片的"呈现方式"是可配置的数据，而不是写死在标签里的属性。

---

## 17. 给 AI Agent 的接入 API

当 AI Agent 要帮你改站时，它不该先去通读 `engine.js`。本包在 `engine.js` 第 10 部分暴露一个**自描述、语义稳定**的 API：`window.UZ.ai`。

设计要点：

- **`describe()` 自描述**：返回所有能力的名字、参数、用途。Agent 调用它就知道能做什么，不必读源码。
- **先读后改**：`getConfig()` / `exportConfig()` 让 Agent 拿到现状快照，`getImageInfo()` 先读图片再决定怎么改。
- **即时渲染**：每个 `set*` 改完立刻重渲染，"所见即所得"。
- **批量执行**：`apply([{op,args}...])` 一次完成多处修改，单项失败不中断其它项，返回 `{ok, fail, errors}`。

```js
UZ.ai.describe();                    // 能力清单
UZ.ai.getConfig();                   // 读现状
UZ.ai.apply([
  { op:'setLang',  args:['en'] },
  { op:'setText',  args:['section_title','All-in-one','en'] },
  { op:'setImageFilter', args:['#showcaseImg',{ grayscale:1 }] }
]);
```

> **重要边界**：运行时 API 只改内存，刷新即失效。Agent 若要**永久**修改，必须用文件编辑工具写回 `content/*.txt`。这一条写在 `AIagent/AGENTS.md` 的操作守则里。

配套的 `AIagent/` 文件夹是给 Agent 的"接入包"：`README.md`（工作流）、`AGENTS.md`（该改什么/不该改什么）、`API.md`（完整 API）、`manifest.json`（机器可读字段表）、`examples/`（Playwright 与控制台示例）。这样把一个通用站点交给 AI 时，只需让它读 `AIagent/README.md` 即可上手。

---

## 18. 这套模式的边界与注意点

理解边界，才能用对地方：

- **适合**：内容型/展示型站点（官网、作品集、落地页、文档站），内容由非技术人员维护，希望零构建、双击可用。
- **不适合**：需要登录、数据库、实时交互、复杂状态管理的应用——那些该用框架和后端。
- **SEO**：内容是 JS 渲染的，搜索引擎要执行 JS 才能看到正文。现代搜索引擎（Google、百度）能执行 JS，但首屏关键文案建议也在 HTML 里放占位文字（本示例就是这么做的），更稳妥。
- **密钥安全**：见上一节，前端配置不放私密信息。
- **配置即代码**：txt 里写错一个逗号会导致 JS 报错。交付给非技术人员时，注释要写清楚"别删逗号引号"，最好提供填写模板。
- **命名约定**：`data-list` / 数组名 / 渲染函数名三者要对齐，`body[data-page]` 要和 `window.SITE_PAGES.xxx` 对齐。约定简单但要遵守。

---

## 19. 围绕引擎开发自己的网页：engine/ 开发套件

前面 18 节讲的都是"这套系统怎么运作"。如果你已经理解原理，想**直接拿引擎去开发自己的网站**，本包在 `engine/` 文件夹准备了一套自包含的开发套件——这也是对"`engine.js` 能不能单独下载用"这个问题的完整回答。

**先说结论：`engine.js` 不能单独使用。** 它只是渲染粘合层，自身不含任何文字、图片、样式。它必须和三样东西配合：

1. `content/*.txt` 配置（缺 `global.txt` 会直接显示提示并停止）；
2. 带 `data-page` / `data-i18n` / `data-list` 及固定 ID（`#navLinks`、`#typed`、`#infoModal` 等）的 HTML 骨架；
3. 提供 CSS 变量与布局的 `style.css`。

`engine/` 文件夹的结构：

```
engine/
├── engine.js       # 引擎源文件（可直接拿去改造，带完整注释）
├── README.md / .en.md / .ja.md  # 三语开发教程
└── starter/        # 最小可运行骨架，双击 index.html 即用
    ├── index.html / style.css
    └── content/global.txt / index.txt
```

**最快上手**：`cp -r engine/starter my-site/`，把 `engine/engine.js` 放到 HTML 末尾 `<script src>` 指向的位置，双击 `index.html` 就能看到完整页面。然后改 txt 的内容、删掉不需要的 section 即可。

围绕引擎开发的关键，是遵守引擎与页面之间的**契约**（详见 `engine/README.md`）：

- `<body data-page="xxx">` 决定读哪份 `window.SITE_PAGES.xxx` 配置；
- `<head>` 里 txt 必须按 `global.txt → 页面 txt` 顺序加载，引擎放 `</body>` 前最后加载（用 `<script src>` 而非 `fetch`，才能双击 `file://` 运行）；
- 文字用 `data-i18n="字段"` 绑定字典，列表用空容器 `<div data-list="数组名">` 交给引擎生成；
- 所有固定 ID 都是可选的，引擎对每个插槽做了 `if (!el) return` 保护，因此可以做极简页面；
- 扩展点在 `RENDERERS`（新列表类型）与 `LANG_NAME`（新语言），运行时还有 `window.UZ.image` / `window.UZ.ai` API。

这样，引擎就从一个"只能在本模板里跑的脚本"，变成了一个**可以围绕它快速搭建任意静态站点**的核心。

---

## 小结

这套架构的本质，用一句话概括：

> **把"内容"写成 JS 对象放在 txt 里，用 `<script src>` 加载进一个全局仓库，再用一个通用引擎按页面读取仓库、把数据填进带占位标记的 HTML。**

掌握这四步——**注册（txt）→ 加载（script src）→ 取用（data-page + data-i18n/data-list）→ 渲染（engine.js）**——你就能自己复刻和扩展这套系统了。
