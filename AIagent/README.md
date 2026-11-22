# AIagent —— 给 AI Agent 的项目接入包

> 项目：**UZENS CCWST**（UZENS Convenient Configure WebSite Technology）。
> 如果你是 AI Agent（或正在让 AI Agent 帮你改这个网站），**先从这里开始读**。
> 本文件夹的目标：让 AI 用最短时间理解项目结构、找到该改的文件、用稳定 API 安全地改内容。

---

## 30 秒速览

这是一个**零依赖、零构建**的静态网站：内容全放在 `content/*.txt`（其实是 JS），`engine.js` 负责把它们渲染到页面。

- 改文字 → 改 `content/*.txt` 里的 `i18n` / 数组
- 改外观 → 改 `content/global.txt` 的 `font/background/imageFx`，或页面 txt 的 `font/showcase.fx`
- 改图片 → 改 `showcase.img`，或运行时调 `window.UZ.image.set()`
- 让 AI 直接操作 → 用 `window.UZ.ai.*`（见 `API.md`）

**最快上手方式**：在浏览器控制台（或 Playwright 页面里）执行：

```js
UZ.ai.describe()      // 自描述：有哪些能力、怎么传参
UZ.ai.getConfig()     // 读当前全部配置
UZ.ai.apply([...])    // 批量修改，立即生效
```

---

## 本文件夹内容

| 文件 | 作用 |
|------|------|
| `README.md` | 本文件：给 AI 的总入口与工作流 |
| `AGENTS.md` | 给 AI 的操作守则（该改什么、不该改什么、常见任务步骤） |
| `API.md` | `window.UZ.ai` 与 `window.UZ.image` 的完整 API 参考 |
| `manifest.json` | 机器可读的项目元信息：文件职责、配置字段、能力清单 |
| `examples/` | 可直接运行的操作示例（Playwright / 控制台脚本） |

---

## 推荐工作流（AI Agent）

1. **理解现状**：读 `manifest.json` 拿到文件职责与字段表；必要时 `UZ.ai.getConfig()` 读运行时配置。
2. **定位改动**：
   - 纯文案/语言 → `content/global.txt` 或对应页面 txt 的 `i18n`
   - 列表数据 → 页面 txt 的数组（`features` / `works`）
   - 图片 → `showcase.img` / `fx`
   - 主题/字体/背景 → `global.txt`
   - 翻译 → `content/i18n.txt`
3. **选择改动方式**：
   - 想让改动**持久化**（写回源码）→ 用文件编辑工具改对应 `.txt`。
   - 想**即时预览/验证** → 用 `UZ.ai.apply([...])` 在运行时改。
4. **验证**：`UZ.ai.getState()` / 截图 / DOM 断言确认改动生效。
5. **写回**：运行时 API 只改内存，刷新即失效；最终要写回 `.txt` 才会保留。

> ⚠️ 关键约束：**运行时 API 不写文件**。AI 若需永久修改，必须编辑 `content/*.txt` 源文件。

---

## 安全与边界

- 只改单引号 `' '` 里的内容，不要删逗号 `,`、引号 `'`、花括号 `{}`、方括号 `[]`。
- `.txt` 是 JS 源码，改完可用 `node --check` 或浏览器加载验证语法。
- API 密钥（翻译）写在前端会暴露；生产环境请用后端代理。
- 默认 `enabled: '#'` / 空值 = 功能关闭、零影响，改动时保持这一约定。
