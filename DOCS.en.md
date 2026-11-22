<!-- Language: [中文](./DOCS.md) · [English](./DOCS.en.md) · [日本語](./DOCS.ja.md) -->

# How it works: configuring a website with separate txt files

> **UZENS CCWST** — UZENS Convenient Configure WebSite Technology
> Language: [中文](./DOCS.md) · [English](./DOCS.en.md) · [日本語](./DOCS.ja.md) ｜ Intro: [中文](./README.md) · [English](./README.en.md) · [日本語](./README.ja.md)

> The runnable example lives at the package root: `index.html` / `about.html` / `engine.js` / `content/`.
> Read along with the code open beside you.

This architecture solves a very concrete problem: **let people who don't code change an entire website's content by editing text in a few `.txt` files**, and see the result by double-clicking `index.html` — no environment, no server, no build tool.

Let's start from the most fundamental question and peel back the layers.

---

## Table of contents

1. [Core idea: separate content from structure](#1-core-idea-separate-content-from-structure)
2. [Why txt loads via `<script src>` (not fetch)](#2-why-txt-loads-via-script-src-not-fetch)
3. [`window.SITE_PAGES`: a shared config store for many txt files](#3-windowsite_pages-a-shared-config-store-for-many-txt-files)
4. [How the engine finds the "current page" config](#4-how-the-engine-finds-the-current-page-config)
5. [i18n: shallow-merging global and page text](#5-i18n-shallow-merging-global-and-page-text)
6. [`data-i18n`: filling dictionary text into the page](#6-data-i18n-filling-dictionary-text-into-the-page)
7. [Multi-language object `L()`: letting lists and widgets switch language](#7-multi-language-object-l-letting-lists-and-widgets-switch-language)
8. [Data-driven lists: one array generates a set of cards](#8-data-driven-lists-one-array-generates-a-set-of-cards)
9. [CSS variable layering: the "config layer" for fonts/theme/background](#9-css-variable-layering-the-config-layer-for-fontsthemebackground)
10. ["Zero-impact defaults": using `#` and empty values as placeholders](#10-zero-impact-defaults-using--and-empty-values-as-placeholders)
11. [Three button bindings: link / modal / hint](#11-three-button-bindings-link--modal--hint)
12. [Event delegation: making dynamically generated elements responsive](#12-event-delegation-making-dynamically-generated-elements-responsive)
13. [How to add a page](#13-how-to-add-a-page)
14. [How to add a list](#14-how-to-add-a-list)
15. [Advanced: connecting a machine-translation API](#15-advanced-connecting-a-machine-translation-api)
16. [Modifying images: replacement and CSS filters](#16-modifying-images-replacement-and-css-filters)
17. [The AI Agent integration API](#17-the-ai-agent-integration-api)
18. [Boundaries and caveats of this pattern](#18-boundaries-and-caveats-of-this-pattern)
19. [Build your own pages around the engine: the engine/ kit](#19-build-your-own-pages-around-the-engine-the-engine-kit)

---

## 1. Core idea: separate content from structure

A web page can be split into three layers:

| Layer | Files | Edited by | Holds |
|---|---|---|---|
| **Content** | `content/*.txt` | content editor | text, image URLs, links, list data |
| **Structure** | `*.html` | developer (rarely) | page skeleton, placeholder markers `data-i18n` / `data-list` |
| **Presentation** | `style.css` | developer (rarely) | colors, layout, animation |

Add a fourth "glue" layer, `engine.js`: it reads the content layer and fills data into the structure layer.

```
   content/global.txt ─┐
   content/index.txt  ─┼─→  window.SITE_PAGES (store)
   content/about.txt  ─┘            │
                                    │ read by engine.js
                                    ▼
                          index.html / about.html
                     (data-i18n / data-list placeholders filled)
```

**Benefits**:

- Change one sentence: edit one line in one txt, never disturb HTML structure;
- One txt per page: adding a page never drags down old ones;
- Content files are plain text — anyone can edit them in Notepad.

---

## 2. Why txt loads via `<script src>` (not fetch)

This is the key to "double-click and it works", and the most easily overlooked detail.

A beginner would think: content is in txt, so just `fetch('content/index.txt')`. But when you double-click a local page the address bar shows `file://...`, and the browser's **same-origin policy** treats a local file fetch as cross-origin and blocks it with an error.

`<script src="content/index.txt">` is different: the browser executes whatever a `<script src>` points to as JavaScript, local files included. So as long as **the txt's content is itself valid JavaScript**, it can be "loaded".

So txt doesn't hold JSON — it holds JS assignment statements:

```js
// content/index.txt is actually JS
window.SITE_PAGES = window.SITE_PAGES || {};
window.SITE_PAGES.index = {
    typed: { full: 'Big title' },
    // ...
};
```

Load it in HTML like this (order matters):

```html
<script src="content/global.txt"></script>
<script src="content/index.txt"></script>
<script src="engine.js"></script>
```

> The `.txt` extension is only for humans — the browser executes it as a `<script>` regardless of extension.
> You could call it `.js`; `.txt` emphasizes "this is content for humans to edit, not code".
>
> Trade-off: these txt files **cannot hold real secrets** (like API keys), because visitors can see them. That's why translation keys are demo/internal-only, and production sites need a domain whitelist or a back-end.

---

## 3. `window.SITE_PAGES`: a shared config store for many txt files

Every txt starts with these two lines:

```js
window.SITE_PAGES = window.SITE_PAGES || {};
window.SITE_PAGES.index = { /* this page's config */ };
```

The first line is the key trick. `||` means "if the left side doesn't exist, use the right side":

- If `window.SITE_PAGES` doesn't exist yet (first txt loads), create an empty object `{}`;
- If it already exists (later txts load), keep what's there.

So three txts load in sequence, all placing a key into the **same object**:

```js
window.SITE_PAGES = {
    global: { /* global config */ },
    index:  { /* home config */ },
    about:  { /* about config */ }
};
```

If every txt wrote `window.SITE_PAGES = {}`, later ones would overwrite earlier ones — so the `= window.SITE_PAGES || {}` form can't be omitted.

---

## 4. How the engine finds the "current page" config

In a multi-page site, `index.html` and `about.html` share one `engine.js`. How does the engine know which config to read? The answer is a custom attribute on `<body>`:

```html
<!-- index.html -->
<body data-page="index">
```

```html
<!-- about.html -->
<body data-page="about">
```

The engine reads it at the top:

```js
var PAGES = window.SITE_PAGES || {};
var G = PAGES.global;                                  // global config
var pageKey = document.body.getAttribute('data-page'); // 'index' or 'about'
var cur = PAGES[pageKey] || {};                        // current page config
```

`data-*` are custom attributes allowed by the HTML standard, meant to pass info to JS without affecting display. `data-page="about"` tells the engine to read `window.SITE_PAGES.about`.

> If `global.txt` failed to load, `G` is empty. The engine detects this and shows a friendly message instead of a blank screen — necessary fault tolerance.

---

## 5. i18n: shallow-merging global and page text

Every config has an `i18n` object grouped by language:

```js
i18n: {
    zh: { brand: 'Title', nav_home: 'Home', ... },
    en: { brand: 'Brand', nav_home: 'Home', ... },
    tw: { /* ... */ },
    ja: { /* ... */ }
}
```

Global text goes in `global.txt`, page-specific text in that page's txt. At startup the engine **shallow-merges them by language**:

```js
var I18N = { zh: {}, en: {}, tw: {}, ja: {} };
function mergeI18n() {
    ['zh', 'en', 'tw', 'ja'].forEach(function (lang) {
        var g = (G.i18n && G.i18n[lang]) || {};     // global
        var p = (cur.i18n && cur.i18n[lang]) || {}; // this page
        var out = {};
        Object.keys(g).forEach(function (k) { out[k] = g[k]; }); // global first
        Object.keys(p).forEach(function (k) { out[k] = p[k]; }); // page overrides
        I18N[lang] = out;
    });
}
```

"Shallow" means only the first object level is merged. Within the `zh` level, fields like `brand` and `nav_home` are merged one by one; **the page's same-named field overrides the global one** — that's "global for common, page for specific, page wins".

The result is one big dictionary `I18N.zh.fieldName`, `I18N.en.fieldName`, … — all later text comes from here.

---

## 6. `data-i18n`: filling dictionary text into the page

Text positions in the HTML skeleton don't hard-code words — they carry a marker:

```html
<p class="eyebrow" data-i18n="eyebrow">Subtitle</p>
<h2 data-i18n="section_title">Big title</h2>
```

`data-i18n="eyebrow"` means "the text here is decided by the `eyebrow` field in the dictionary". The words originally inside the tag are just **placeholder text**, replaced as soon as the page opens (so if JS fails, there's still something visible).

The engine scans all elements with this marker and fills in the value from the current language dictionary:

```js
function applyI18n() {
    var d = I18N[state.lang] || {};
    $$('[data-i18n]').forEach(function (el) {
        var key = el.getAttribute('data-i18n');
        if (d[key] != null) el.textContent = d[key];
    });
    // non-text content like aria-label uses data-i18n-aria
    applyPageName(d);
}
```

To switch language, just change `state.lang` and call `applyI18n()` again — the whole page changes language instantly. That's the whole secret of "one-click four-language switching".

### Page name (header) `pageName`

Each page can define "what this page is called" in its own txt with `pageName` (a four-language object). The engine's `applyPageName()` writes it to two places: the browser tab `document.title` and the visible nav title `#pageName`. It updates together with all other text when the language changes.

```js
// content/index.txt
pageName: { zh: '首页', en: 'Home', tw: '首頁', ja: 'ホーム' }
```

Priority: `pageName` > `i18n.docTitle` > `global.siteInfo.title`. This is how "each page can independently change its name" works — each page txt owns its header, no cross-talk.

---

## 7. Multi-language object `L()`: letting lists and widgets switch language

`data-i18n` suits static text hard-coded in HTML. But list cards are generated dynamically by JS, and the showcase block's text also lives in a config object — how is their text written?

The answer is a **multi-language object**: one field directly holds four language values.

```js
title: { zh: 'Title', en: 'Title', tw: '標題', ja: 'タイトル' }
```

The engine provides `L()` to pick the current language:

```js
function L(obj) {
    if (obj == null) return '';
    if (typeof obj !== 'object') return obj;          // plain string returned as-is
    return obj[state.lang] || obj.zh || obj.en || ''; // current -> Chinese -> English -> empty
}
```

Render with `L(item.title)`; on language switch, **re-render the list** and the card text follows. That's why `setLang()` calls `renderLists()` and `renderShowcase()` — they use multi-language objects internally.

> Compatibility: `L()` also works on strings. So a config can use `'Title'` (same in all languages) or a four-language object — very flexible. A missing language falls back to Chinese, never blank.

---

## 8. Data-driven lists: one array generates a set of cards

This is the most typical expression of "change content without touching HTML".

An array in the config:

```js
features: [
    { icon: '✦', desc: {zh:'Subtitle',...}, paras: [{zh:'Content',...}] },
    { icon: '◆', desc: {...}, paras: [...] },
    { icon: '●', desc: {...}, paras: [...] }
]
```

One empty container in HTML:

```html
<div class="card-grid" data-list="features"></div>
```

The engine has a "renderer registry" whose key matches the array name and the `data-list` value:

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
        var arr = cur[name];                       // config array
        var fn = RENDERERS[name];                  // matching renderer
        if (!arr || !fn) return;
        box.innerHTML = arr.map(function (item, i) {
            return fn(item, i);                    // each item -> HTML fragment
        }).join('');
    });
}
```

Want to add a card? Add an object to the array. Remove one? Delete an object. No HTML change needed.

**Three names must align**: the array name in config (`features`), HTML's `data-list="features"`, and `RENDERERS.features`. That's the only "convention" in this mechanism — remember it and you won't go wrong.

---

## 9. CSS variable layering: the "config layer" for fonts/theme/background

If fonts and backgrounds can also be configured in txt without touching CSS, how? Answer: **CSS variables + fallback values**.

CSS doesn't hard-code a font — it writes a variable with a fallback:

```css
:root { --font-ui: 'PingFang SC', sans-serif; }
body { font-family: var(--font-ui); }
.hero-title { font-family: var(--pg-title, Georgia, serif); }
```

JS never touches a CSS rule — it only **sets variables** on elements:

```js
function applyFonts() {
    if (G.font.site && G.font.site !== '#')
        document.documentElement.style.setProperty('--font-ui', G.font.site);
    if (cur.font.title && cur.font.title !== '#')
        document.body.style.setProperty('--pg-title', cur.font.title);
}
```

- Not configured: the variable isn't set, CSS uses the fallback = template default look;
- Configured: the variable is written and every `var(--pg-title, …)` takes effect at once.

**Theme** uses the same idea, just with a switch on the root element's attribute:

```js
document.documentElement.setAttribute('data-theme', 'light');
```

CSS holds two sets of variables:

```css
:root { --bg: #0a0a0c; }                    /* dark */
[data-theme="light"] { --bg: #f2f2f5; }    /* light */
```

**Background image** is also variables: `--bg-img`, `--bg-blur`, `--bg-bright`, set by `applyBackground()` from `global.txt`'s `background`. CSS's `.background-layer` reads them with `background-image: var(--bg-img)`.

This layering of "JS only writes variables, CSS only reads variables" gives:
- appearance logic stays in CSS; JS only passes values;
- switching themes doesn't recompute styles — just change one attribute;
- config and default fallbacks are naturally separated, no interference.

---

## 10. "Zero-impact defaults": using `#` and empty values as placeholders

You'll see `'#'` and `''` (empty string) repeatedly in configs. This is a deliberate convention:

> **`#` = placeholder, meaning "this item isn't configured, use the default".**

Fonts, for example:

```js
font: { site: '#', title: '#' }
```

Everywhere JS applies a config it first checks:

```js
if (f.title && f.title !== '#') { /* only then set the variable */ }
```

So when the template ships, all options are in placeholder state, **look = template default**. Users fill only what they want to change; everything else stays `#` and isn't accidentally altered. Empty string `''` is used for image/link fields with a similar meaning: "no image → show placeholder, no link → show a hint".

This convention makes the template both "works out of the box" and "progressively customizable" — the premise for safely handing it to non-coders.

---

## 11. Three button bindings: link / modal / hint

Button behavior is also declared through HTML markers — no per-button JS needed:

| Markup | Behavior | Use case |
|---|---|---|
| `<a href="https://…">` | navigate to link | external links, page nav |
| `<button data-modal>` | open info modal | "learn more", descriptions |
| `<a href="#" data-link-unset>` | show "not configured" hint | placeholder when config url is empty |

The third is especially useful: when `url` is empty in config, the renderer automatically adds `data-link-unset`, so clicking shows "not configured" instead of following a broken link. Once the user fills in `url`, the renderer swaps in a real `<a href>`. This makes the "not ready" state obvious and friendly rather than a silent failure.

---

## 12. Event delegation: making dynamically generated elements responsive

List cards are generated by JS — they don't exist at page load. If you bound a handler to each button individually, newly generated buttons wouldn't respond.

The engine uses **event delegation**: one click listener on `document`, using `closest()` to tell which kind of element was clicked:

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

Because events bubble up to `document`, the listener catches both new and pre-existing elements. This is the standard way to handle events on dynamic content.

---

## 13. How to add a page

Say you want a "news" page:

**Step 1**: copy `index.html` to `news.html`, change two places:
```html
<script src="content/news.txt"></script>   <!-- new txt -->
<body data-page="news">                     <!-- new page name -->
```
Remove unneeded sections, keep the skeleton and placeholder markers.

**Step 2**: create `content/news.txt`:
```js
window.SITE_PAGES = window.SITE_PAGES || {};
window.SITE_PAGES.news = {
    pageName: { zh: '新闻', en: 'News', tw: '新聞', ja: 'ニュース' },
    font: { title: '#', button: '#', text: '#', modal: '#' },
    i18n: {
        zh: { docTitle: 'Title', page_title: 'Big title' },
        en: { docTitle: 'Title', page_title: 'Big title' },
        tw: { docTitle: '標題', page_title: '大標題' },
        ja: { docTitle: 'タイトル', page_title: '大見出し' }
    }
};
```

**Step 3** (optional): add an item to `nav` in `global.txt` so navigation gains an entry and highlights the current page correctly:
```js
{ i18n: 'nav_news', href: './news.html', page: 'news' }
```
And add `nav_news: 'Button'` to all four `i18n` languages in `global.txt`.

Done. Old pages are completely unaffected — config is isolated per page.

---

## 14. How to add a list

Say the news page needs a "news list":

**Step 1**: add an array to `news.txt`:
```js
newsList: [
    { title: {zh:'Title', en:'Title'}, date: 'Content' },
    { title: {zh:'Title', en:'Title'}, date: 'Content' }
]
```

**Step 2**: put an empty container in `news.html`:
```html
<div data-list="newsList"></div>
```

**Step 3**: add a same-named function to `RENDERERS` in `engine.js`:
```js
newsList: function (item) {
    return '<article class="card"><h3>' + esc(L(item.title)) +
           '</h3><p>' + esc(item.date) + '</p></article>';
}
```

Align the three names (`newsList`) and the list appears, with titles following language switches.

---

## 15. Advanced: connecting a machine-translation API

If you don't want to hand-fill every language, write Chinese only and let a translation API fill the rest. This package **includes** this capability: config in `content/i18n.txt` (default `enabled: '#'` off), implementation in `engine.js` part 8, and both HTML files load the txt.

**Flow**:

1. At startup `autoEnabled()` checks the switch: if off, skip entirely — **zero network requests**, zero side effects;
2. If on, `collectSlots()` gathers all Chinese slots — strings in the dictionary + recursively walking all `{zh,en,tw,ja}` objects in `global`/current page for `.zh` values, deduplicated by text;
3. With `onlyFillMissing: true`, only slots whose translation is empty or still equals Chinese are translated — your manual translations aren't overwritten;
4. Based on `provider`, call Google / Bing / Youdao in batches of 40, write translations back to the dictionary and multi-language objects;
5. When done, `setLang(state.lang, false)` re-renders and the page immediately shows translations.

Config fields (`i18n.txt`):

```js
window.SITE_PAGES.i18nConfig = {
    enabled: '#',              // '#' off; true on
    provider: 'google',        // google / bing / youdao
    targets: ['en','tw','ja'], // languages to generate (zh is source)
    onlyFillMissing: true,     // true = don't overwrite existing translations
    google:  { apiKey: '' },
    bing:    { apiKey: '', region: '' },
    youdao:  { appKey: '', appSecret: '' }
};
```

Browser-side calls for the three mainstream APIs:

| Provider | Endpoint | Auth | Browser CORS |
|---|---|---|---|
| Google | `translation.googleapis.com/language/translate/v2` | API Key | CORS OK |
| Bing | `api.cognitive.microsofttranslator.com/translate` | Key + Region | CORS OK |
| Youdao | `openapi.youdao.com/api` | appKey + appSecret + SHA256 signature | server API, often blocked direct |

Language codes need mapping (e.g. Chinese: Google `zh-CN`, Bing `zh-Hans`, Youdao `zh-CHS`), handled by `LANG_GOOGLE`/`LANG_BING`/`LANG_YOUDAO` tables. Youdao's signature uses `crypto.subtle.digest('SHA-256', …)`. Key application steps for all three are in `i18n.txt`'s header comments.

**Security note** (important): keys in front-end txt are visible to every visitor. Always set a **domain whitelist + usage cap** in the provider console; production should use a back-end proxy so the front end never touches keys. Youdao generally won't work under `file://` due to Web Crypto and CORS — use Google/Bing for demos.

---

## 16. Modifying images: replacement and CSS filters

"Changing images" uses the same idea as "changing text" — **put data in config, engine reads and renders**. Two entry points:

**① Config entry (permanent)**. Write site-wide default filters `imageFx` in `global.txt`, and a block's own `fx` in the showcase (page wins):

```js
// global.txt
imageFx: { brightness: '#', blur: '#' }   // all '#' = no effect

// index.txt -> showcase.fx
showcase: {
    img: 'banner.png',
    fx: { brightness: 1.1, saturate: 1.2, rotate: 2 }
}
```

The engine's `applyFx(img, fx)` assembles the filter object into two CSS chunks: `filter` (brightness/contrast/saturate/grayscale/blur/sepia/invert/hue/opacity) and `transform` (rotate/scale/flip), written to the image's `style`. `filterCSS()` skips `'#'` and default-valued fields, guaranteeing "zero-impact defaults".

**② Runtime entry (instant)**. Part 9 of `engine.js` exposes `window.UZ.image`:

```js
UZ.image.set('#showcaseImg', 'new.png');            // replace image
UZ.image.filter('#showcaseImg', { grayscale: 1 });  // change filter
UZ.image.get('#showcaseImg');                       // read current state
UZ.image.reset('#showcaseImg');                     // restore
```

Key point: replacing changes only `img.src`, filtering only writes CSS — neither touches the original image file, so you can experiment freely and `reset()` anytime. This continues the "config is data" theme: an image's *presentation* is configurable data, not attributes hard-coded in a tag.

---

## 17. The AI Agent integration API

When an AI Agent helps you edit the site, it shouldn't have to read all of `engine.js` first. This package exposes a **self-describing, semantically stable** API in part 10 of `engine.js`: `window.UZ.ai`.

Design points:

- **`describe()` self-describes**: returns every capability's name, arguments and purpose. The Agent calls it and knows what it can do without reading source.
- **Read before write**: `getConfig()` / `exportConfig()` give a state snapshot; `getImageInfo()` reads an image before deciding how to change it.
- **Instant render**: every `set*` re-renders immediately — "what you see is what you get".
- **Batch execution**: `apply([{op,args}...])` does many changes at once; one failure doesn't stop the others; returns `{ok, fail, errors}`.

```js
UZ.ai.describe();                    // capability list
UZ.ai.getConfig();                   // read current state
UZ.ai.apply([
  { op:'setLang',  args:['en'] },
  { op:'setPageName', args:['Home','en'] },
  { op:'setText',  args:['section_title','All-in-one','en'] },
  { op:'setImageFilter', args:['#showcaseImg',{ grayscale:1 }] }
]);
```

> **Important boundary**: the runtime API only changes memory and is lost on refresh. For a **permanent** change the Agent must use a file-editing tool to write back to `content/*.txt`. This rule lives in `AIagent/AGENTS.md`.

The companion `AIagent/` folder is the Agent's "integration kit": `README.md` (workflow), `AGENTS.md` (what to / not to change), `API.md` (full API), `manifest.json` (machine-readable field table), `examples/` (Playwright and console examples). Handing a generic site to AI then only needs "read `AIagent/README.md`".

---

## 18. Boundaries and caveats of this pattern

Understand the boundaries to use it correctly:

- **Good for**: content/presentation sites (official sites, portfolios, landing pages, docs) maintained by non-technical people who want zero build and double-click use.
- **Not for**: apps needing login, databases, real-time interaction or complex state — those belong in a framework and a back end.
- **SEO**: content is JS-rendered, so search engines must execute JS to see the body text. Modern engines (Google, Baidu) do, but it's safer to also put placeholder text in HTML for key first-screen copy (this example does).
- **Key security**: see previous section — no secrets in front-end config.
- **Config is code**: a wrong comma in txt breaks JS. When handing to non-coders, comment clearly "don't delete commas/quotes" and ideally supply a fill-in template.
- **Naming conventions**: `data-list` / array name / renderer name must align; `body[data-page]` must match `window.SITE_PAGES.xxx`. Simple conventions, but follow them.

---

## 19. Build your own pages around the engine: the engine/ kit

The first 18 sections explain how the system works. If you already understand the principles and want to **use the engine to build your own site**, this package includes a self-contained development kit under `engine/` — a complete answer to "can `engine.js` be downloaded and used on its own?"

**The short answer: no, `engine.js` can't be used alone.** It's only the rendering glue and contains no text, images, or styles. It needs three things:

1. `content/*.txt` config (missing `global.txt` shows a notice and stops);
2. an HTML skeleton with `data-page` / `data-i18n` / `data-list` and fixed IDs (`#navLinks`, `#typed`, `#infoModal`, etc.);
3. `style.css` providing CSS variables and layout.

The `engine/` folder:

```
engine/
├── engine.js       # engine source (use/modify directly, fully commented)
├── README.md / .en.md / .ja.md  # trilingual dev tutorials
└── starter/        # minimal runnable skeleton, double-click index.html
    ├── index.html / style.css
    └── content/global.txt / index.txt
```

**Fastest start**: `cp -r engine/starter my-site/`, place `engine/engine.js` where the trailing `<script src>` points, then double-click `index.html` to see a complete page. From there edit txt content and remove sections you don't need.

The key to developing around the engine is its **contract** with the page (see `engine/README.md`):

- `<body data-page="xxx">` decides which `window.SITE_PAGES.xxx` config to read;
- txt must load in order `global.txt → page txt` in `<head>`, engine last before `</body>` (use `<script src>` not `fetch`, so double-click `file://` works);
- bind text with `data-i18n="field"`, hand lists to an empty `<div data-list="arrayName">`;
- all fixed IDs are optional — the engine guards every slot with `if (!el) return`, so minimal pages are fine;
- extension points are `RENDERERS` (new list types) and `LANG_NAME` (new languages), plus runtime `window.UZ.image` / `window.UZ.ai` APIs.

This turns the engine from "a script that only runs in this template" into a core you can build any static site around.

---

## Summary

The essence of this architecture in one sentence:

> **Write "content" as JS objects in txt, load them into a global store with `<script src>`, then use a generic engine to read the store per page and fill data into HTML with placeholder markers.**

Master the four steps — **register (txt) → load (script src) → pick (data-page + data-i18n/data-list) → render (engine.js)** — and you can reproduce and extend this system yourself.
