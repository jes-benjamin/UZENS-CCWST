# AGENTS.md —— 给 AI Agent 的操作守则

> 这是给 AI 看的"行为规范"。人类维护者可据此约束 Agent 的改动范围。

## 你要知道的三件事

1. **内容在 txt，不在 HTML**。HTML 只是骨架（带 `data-i18n` / `data-list` 标记）。改内容优先改 `content/`。
2. **txt 是 JavaScript**。`window.SITE_PAGES = window.SITE_PAGES || {}; window.SITE_PAGES.xxx = {...}`。语法错误会导致整页配置加载失败。
3. **运行时 ≠ 持久化**。`UZ.ai.*` 改的是内存，刷新丢失；永久修改要编辑文件。

## 配置仓库结构

```
window.SITE_PAGES = {
  global:   { siteInfo, font, background, imageFx, nav, i18n },  // 全站
  index:    { pageName, font, typed, showcase, features, i18n },  // 首页
  about:    { pageName, font, works, i18n },                      // 关于页
  i18nConfig: { enabled, provider, targets, onlyFillMissing, google, bing, youdao } // 翻译
}

项目名称：UZENS CCWST（全称 UZENS Convenient Configure WebSite Technology）。
```

- 页面 key = `<body data-page="...">` 的值，引擎据此取 `window.SITE_PAGES[key]`。
- 四语言对象形如 `{ zh:'…', en:'…', tw:'…', ja:'…' }`，用 `L()` 按当前语言取值。

## 常见任务 → 正确做法

### 任务 1：改某句文案（永久）
- 编辑 `content/global.txt` 或对应页面 txt 的 `i18n.{lang}.{key}`。
- 若该 key 只在某页出现，优先改该页面 txt（本页覆盖全站）。

### 任务 1b：改网页名称 / 题头（浏览器标题栏 + 导航可见标题）
- 永久：编辑对应页面 txt 的 `pageName` 四语言对象（如 `index.txt` → `pageName.zh`）。
- 即时预览：`UZ.ai.setPageName('新名称', 'zh')`。
- 取值优先级：`pageName` > `i18n.docTitle` > `global.siteInfo.title`。

### 任务 2：新增一张功能卡片
- 在页面 txt 的数组（如 `features`）里加一个对象：
  `{ icon:'✦', desc:{zh:'…',en:'…',tw:'…',ja:'…'}, paras:[{zh:'…',…}] }`。
- HTML 里已有一个空容器 `<div data-list="features">`，无需改。

### 任务 3：换图 / 改图片外观
- 永久：改 `showcase.img`；滤镜改 `showcase.fx` 或 `global.imageFx`。
- 即时预览：`UZ.ai.setImage('#showcaseImg','url')`、`UZ.ai.setImageFilter('#showcaseImg',{blur:2})`。
- 滤镜字段见 `API.md`；默认值/'#' 表示不生效。

### 任务 4：切换语言/主题并验证
- `UZ.ai.setLang('en')` / `UZ.ai.setTheme('light')`，再 `UZ.ai.getState()` 确认。

### 任务 5：开启自动翻译
- 编辑 `content/i18n.txt`：`enabled: true`，选 `provider`，填对应密钥，`targets`/`onlyFillMissing` 按需。
- 确保两个 HTML 都加载了 `content/i18n.txt`（默认已加）。
- 注意前端密钥暴露风险，生产用后端代理。

### 任务 6：新增一个页面
1. 复制 `index.html` → 新 `xxx.html`，改 `<body data-page="xxx">` 和配置清单里页面 txt 那行为 `content/xxx.txt`。
2. 新建 `content/xxx.txt`：`window.SITE_PAGES.xxx = {...}`。
3. 在 `global.txt` 的 `nav` 数组加一项 `{i18n:'nav_xxx', href:'./xxx.html', page:'xxx'}`，并在 i18n 里补 `nav_xxx` 四语言文案。

## 不要做的事

- ❌ 不要把内容硬编码进 HTML；那会破坏"改 txt 即改内容"的架构。
- ❌ 不要删除 `window.SITE_PAGES = window.SITE_PAGES || {}` 这行（多文件共用一个仓库）。
- ❌ 不要改名 `data-page` / `data-i18n` / `data-list` 这些标记，引擎依赖它们。
- ❌ 不要用 `fetch()` 读 txt（file:// 下会被 CORS 拦截）；保持 `<script src>` 方式。
- ❌ 不要假设运行时 API 的修改会保存；要永久生效必须写文件。

## 验证清单

- [ ] 浏览器控制台无报错（`node --check engine.js` / txt 语法正确）
- [ ] `UZ.ai.getConfig()` 能看到你的改动
- [ ] 切换语言/主题后页面正确更新
- [ ] 图片滤镜 `UZ.ai.getImageInfo('#showcaseImg')` 返回预期值
- [ ] 若改了文件，刷新页面后改动仍在
