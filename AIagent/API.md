# API 参考：`window.UZ.ai` 与 `window.UZ.image`

> 引擎加载后暴露在 `window.UZ`。所有方法可在浏览器控制台、Playwright `page.evaluate()` 或内联脚本里调用。
> 修改类方法立即重渲染；**仅改内存，不写文件**。

---

## 自描述与读取

| 方法 | 返回 | 说明 |
|------|------|------|
| `UZ.ai.describe()` | 对象 | 能力清单：每个方法的名字、参数、用途。Agent 应首先调用它。 |
| `UZ.ai.version` | `'1.1'` | API 版本。 |
| `UZ.ai.getState()` | `{lang,theme,page,url}` | 当前运行状态。 |
| `UZ.ai.getConfig()` | `{global,page,i18n,i18nConfig}` | 当前配置的深拷贝快照。 |
| `UZ.ai.exportConfig()` | JSON 字符串 | 整个 `window.SITE_PAGES` 导出，可直接保存/分析。 |

示例：
```js
const caps = UZ.ai.describe().capabilities; // 能力列表
const cfg  = UZ.ai.getConfig();             // 读现状
```

---

## 内容修改

### `setLang(lang)`
切换语言。`lang` ∈ `'zh'|'en'|'tw'|'ja'`。返回当前语言。

### `setTheme(theme)`
切换主题。`theme` ∈ `'light'|'dark'`。

### `setText(key, value, lang?)`
修改某条 i18n 文案。`lang` 省略则改当前语言。会同步回写源配置对象并重新渲染。
```js
UZ.ai.setText('section_title', '多功能一体化平台', 'zh');
```

### `setPageName(name, lang?)` —— 改网页名称（题头）
修改**本页**的网页名称，即浏览器标签标题 `document.title` 与导航栏可见标题 `#pageName`。`lang` 省略则改当前语言；写入 `cur.pageName` 对应语言。永久修改请写回页面 txt 的 `pageName` 字段。
```js
UZ.ai.setPageName('产品首页', 'zh');
document.title;                  // => '产品首页'
```

### `setList(name, array)`
整体替换一个数据列表（数组），随后重渲染。
```js
UZ.ai.setList('features', [
  { icon:'★', desc:{zh:'新特性',en:'New',tw:'新特性',ja:'新機能'}, paras:[{zh:'说明',en:'Desc',tw:'說明',ja:'説明'}] }
]);
```

### `addListItem(name, item)`
向列表追加一项，返回新长度。

---

## 图片修改

### `UZ.ai.setImage(selector, src)`
替换某张图片地址。`selector` 为 CSS 选择器（如 `'#showcaseImg'`）或 DOM 元素。成功返回 `true`。

### `UZ.ai.setImageFilter(selector, fx)`
给图片设置滤镜对象，返回生成的 CSS filter 字符串。字段（均可选，省略/=默认='#' 不生效）：

| 字段 | 含义 | 默认 |
|------|------|------|
| `brightness` | 亮度 | 1 |
| `contrast` | 对比度 | 1 |
| `saturate` | 饱和度 | 1 |
| `grayscale` | 灰度 0~1 | 0 |
| `blur` | 模糊（px） | 0 |
| `sepia` | 复古 0~1 | 0 |
| `invert` | 反色 0~1 | 0 |
| `hueRotate` | 色相旋转（deg） | 0 |
| `opacity` | 不透明度 | 1 |
| `rotate` | 旋转（deg，走 transform） | 0 |
| `scale` | 缩放（走 transform） | 1 |
| `flipX` / `flipY` | 水平/垂直翻转 | false |

```js
UZ.ai.setImageFilter('#showcaseImg', { brightness:1.1, saturate:1.3, blur:0, rotate:3 });
```

### `UZ.ai.resetImageFilter(selector)`
清除该图滤镜，恢复原样。

### `UZ.ai.getImageInfo(selector)`
返回 `{selector, src, filter, transform, fx}`，用于"先读后改"。

### `UZ.ai.applyImageFxAll()`
按配置重新应用所有图片滤镜。

### `UZ.ai.filterCSS(fx)` / `UZ.ai.transformCSS(fx)`
仅返回字符串，不应用到元素（便于预览/测试）。

> 同组工具也在 `UZ.image`：`set / filter / reset / get / applyAll / filterCSS / transformCSS`。

---

## 弹窗与提示

| 方法 | 说明 |
|------|------|
| `UZ.ai.showToast(msg)` | 轻量提示条 |
| `UZ.ai.openModal()` | 打开信息弹窗 |
| `UZ.ai.closeModal()` | 关闭信息弹窗 |

---

## 翻译与重渲染

### `UZ.ai.translateTo(lang)`
触发自动翻译到指定语言（需先在 `content/i18n.txt` 设 `enabled:true` 并填密钥）。

### `UZ.ai.rerender()`
合并配置并重新渲染全部部件（字体/背景/图片/文字/列表）。

### `UZ.ai.apply(changes)` —— 批量修改
`changes` 为数组，每项 `{op: 方法名, args: [参数...]}`。返回 `{ok, fail, errors}`。
```js
UZ.ai.apply([
  { op:'setLang',   args:['en'] },
  { op:'setTheme',  args:['light'] },
  { op:'setText',   args:['section_title','All-in-one', 'en'] },
  { op:'setImageFilter', args:['#showcaseImg', { grayscale:1 }] }
]);
// => { ok:4, fail:0, errors:[] }
```

> `apply` 里的 `op` 必须是 `UZ.ai` 上存在的方法名；未知操作会记入 `errors` 而不中断其它项。

---

## 与 Playwright 配合

```js
const { chromium } = require('playwright');
const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto('file:///path/to/txt-config-website/index.html');
const info = await page.evaluate(() => {
  UZ.ai.apply([{ op:'setLang', args:['en'] }]);
  return UZ.ai.getState();
});
console.log(info); // { lang:'en', ... }
await browser.close();
```
