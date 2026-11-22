<!-- Language: [中文](./README.md) · [English](./README.en.md) · [日本語](./README.ja.md) -->

# UZENS CCWST

> **UZENS Convenient Configure WebSite Technology** — a zero-dependency, zero-build static website architecture: **split site content into `.txt` files; change words by editing txt; double-click the HTML to preview.** This repo is a runnable teaching source package with a full explanation of how it works.

![pure static](https://img.shields.io/badge/deps-zero-brightgreen)
![no build](https://img.shields.io/badge/build-none-blue)
![license](https://img.shields.io/badge/license-AGPL--3.0-blue)
![i18n](https://img.shields.io/badge/docs-ZH-EN-JA-purple)

[中文](./README.md) · [日本語](./README.ja.md) · [DOCS (原理详解)](./DOCS.md) · [DOCS English](./DOCS.en.md) · [DOCS 日本語](./DOCS.ja.md)

---

## What is it

Imagine a website where the content editor **never touches HTML** — they just edit a few `.txt` files in Notepad, and the site content changes. Double-click `index.html` and it works: no Node, no server, no bundler.

This project implements that mechanism end-to-end and explains every step. It solves three real pain points:

- **Afraid of breaking structure while editing content** — content and HTML are fully separated; editing text never disturbs tags.
- **Adding a page breaks everything else** — each page has its own txt; a new page never affects old ones.
- **Simple for complete beginners** — no coding knowledge needed; txt files contain placeholder words like "title / content / button"; just replace them.

## Features

- 📝 **Content as text**: all text, image URLs, links and list data live in `content/*.txt`
- 🏷️ **Per-page site name**: each page's txt `pageName` field sets the browser title and visible header, switching with the language
- 🌐 **Four languages**: Chinese / English / Traditional Chinese / Japanese, one click to switch, choice remembered (optional machine translation to auto-fill)
- 🎨 **Fully configurable look**: site-wide font, background (image/solid/blur/brightness/tone), per-page fonts
- 🃏 **Data-driven lists**: one array generates a group of cards; add/remove by editing the array
- 🖼️ **Image showcase block**: image + text + rounded button, adjustable size, filters and rotation
- 🌗 **Two themes**: dark/light toggle, persisted
- ⚡ **Zero dependency, zero build**: plain HTML/CSS/vanilla JS, works by double-click, deployable to any static host
- 🛡️ **Zero-impact defaults**: every option defaults to `#` — leave it alone and the template looks unchanged
- 🤖 **AI-Agent friendly**: built-in `AIagent/` package and stable `UZ.ai` API
- 🧩 **Build around the engine**: [`engine/`](./engine/README.en.md) kit with engine source + trilingual tutorials + a double-click starter, so you can build your own pages
- 📚 **Teaching friendly**: heavily commented code + [docs in ZH/EN/JA](#docs-and-languages)

## Docs and languages

Both the intro (README) and the architecture guide (DOCS) come in **Chinese / English / Japanese**, switchable via links at the top of each file:

| Document | 中文 | English | 日本語 |
|---|---|---|---|
| Intro | [README.md](./README.md) | [README.en.md](./README.en.md) | [README.ja.md](./README.ja.md) |
| Architecture | [DOCS.md](./DOCS.md) | [DOCS.en.md](./DOCS.en.md) | [DOCS.ja.md](./DOCS.ja.md) |
| Engine dev kit | [engine/README.md](./engine/README.md) | [engine/README.en.md](./engine/README.en.md) | [engine/README.ja.md](./engine/README.ja.md) |
| AI integration | [AIagent/README.md](./AIagent/README.md) | same (code/instructions) | same (code/instructions) |

> 💡 **Want to build your own page with the engine?** See the [`engine/`](./engine/README.en.md) dev kit: engine source, trilingual tutorials, and a **double-click-to-run** starter skeleton. Note `engine.js` can't be used alone — it needs the HTML skeleton + txt config + CSS.

## Quick start

### Run

```bash
# Option 1: just double-click index.html (easiest, works with file://)
# Option 2: or use any static server
python3 -m http.server 8000
# open http://localhost:8000
```

### Change content

Open a txt under `content/` and edit only the text inside single quotes:

```js
// content/index.txt
pageName: { zh: '首页', en: 'Home', tw: '首頁', ja: 'ホーム' },  // <- page name / header
typed: { full: '大标题', highlight: '标题' },                    // <- change these words
```

```js
// content/global.txt
i18n: {
    zh: { brand: '标题', nav_home: '首页' },     // <- your site name and nav
    en: { brand: 'Brand', nav_home: 'Home' }
}
```

Save and refresh. **Only change the text inside quotes; don't delete commas `,`, quotes `'` or brackets `{}` `[]`.**

### Folder structure

```
UZENS-CCWST/  (source package folder txt-config-website/)
├── README.md            # this file (Chinese intro)
├── README.en.md         # English intro
├── README.ja.md         # Japanese intro
├── DOCS.md / .en.md / .ja.md  # architecture guide in 3 languages
├── LICENSE              # AGPL-3.0
├── index.html           # sample home (structure + config manifest)
├── about.html           # sample second page (shared engine across pages)
├── style.css            # styles (theme/font/background variables)
├── engine.js            # render engine (commented + image edit + AI Agent API)
├── engine/              # ★ self-contained kit for building pages around the engine
│   ├── engine.js        # engine source copy (use/modify directly)
│   ├── README.md / .en.md / .ja.md  # trilingual dev tutorials
│   └── starter/         # minimal runnable skeleton: double-click index.html
│       ├── index.html / style.css
│       └── content/global.txt / index.txt
├── content/
│   ├── global.txt       # global config: site info, nav, fonts, background, image FX, common text
│   ├── index.txt        # home config: pageName, typewriter, showcase (fx), feature cards
│   ├── about.txt        # about config: pageName, works list
│   └── i18n.txt         # translation API config (Google/Bing/Youdao, off by default)
└── AIagent/             # AI Agent integration package
    ├── README.md        # AI entry: workflow & file map
    ├── AGENTS.md        # AI operating rules
    ├── API.md           # UZ.ai / UZ.image API reference
    ├── manifest.json    # machine-readable metadata & field table
    └── examples/        # Playwright / console examples
```

## How it works (quick look)

```
content/global.txt ─┐
content/index.txt  ─┼─ loaded via <script src> → window.SITE_PAGES store
content/about.txt  ─┘                          │
                                               │ body[data-page] picks current page
                                               ▼
                                         engine.js reads it
                                               │
                        data-i18n (text) / data-list (lists) placeholders
                                               ▼
                                    index.html / about.html
```

Four core steps: **register (txt writes to `window.SITE_PAGES`) → load (HTML uses `<script src>`) → pick (`data-page` locates the page) → render (engine fills `data-i18n` / `data-list`).**

> **Why `<script src>` for txt instead of fetch?** When opened by double-click the address is `file://`; `fetch` on local files is blocked by CORS, while `<script src>` works. So the txt content is valid JavaScript. See [DOCS.md section 2](./DOCS.md#2-为什么-txt-能用-script-src-加载而不是-fetch).

## What to edit, where

| Want to change | File / field |
|---|---|
| Page name / header (title bar + visible title) | each page's txt → `pageName` |
| Default browser title, Logo, nav menu, footer | `global.txt` → `siteInfo` / `nav` / `i18n` |
| Site-wide font | `global.txt` → `font.site` |
| Background (image/color/blur/brightness/tone) | `global.txt` → `background` |
| Image filters (brightness/grayscale/blur/rotate…) | `global.txt` → `imageFx`, or `index.txt` → `showcase.fx` |
| Translation API (Google/Bing/Youdao) | `content/i18n.txt` |
| Home typewriter, showcase block | `index.txt` → `typed` / `showcase` |
| Home feature cards | `index.txt` → `features` array |
| About works cards | `about.txt` → `works` array |
| A page's title/button/body/modal font | that page's txt → `font` |
| Add a language | add a block to each txt's `i18n` + `LANG_NAME` in `engine.js` |

## Common operations

<details>
<summary><b>Configure the page name (header)</b></summary>

Each page's txt uses a `pageName` field (four-language object) to define "what this page is called". The engine updates the browser title bar and the visible nav title, and switches with the language:

```js
// content/index.txt
pageName: { zh: '首页', en: 'Home', tw: '首頁', ja: 'ホーム' }
```

Priority: `pageName` > `i18n.docTitle` > `global.siteInfo.title`. At runtime use `UZ.ai.setPageName('Home','en')` for a live preview (permanent changes still go back into the txt).
</details>

<details>
<summary><b>Add a new page</b></summary>

1. Copy `index.html` → `news.html`, change `index.txt` to `news.txt` in the manifest, and `<body data-page="index">` to `data-page="news"`;
2. Create `content/news.txt` with `window.SITE_PAGES.news = { pageName:{...}, i18n: {...} }`;
3. To show it in nav, add `{ i18n:'nav_news', href:'./news.html', page:'news' }` to `nav` in `global.txt` and add `nav_news` to all four `i18n` blocks.

Old pages are unaffected. See [DOCS.md section 13](./DOCS.md#13-如何新增一个页面).
</details>

<details>
<summary><b>Add a new list</b></summary>

1. Add an array to the page txt (e.g. `newsList: [...]`);
2. Put `<div data-list="newsList"></div>` in the HTML;
3. Add a same-named function in `RENDERERS` in `engine.js`: `newsList: function(item){...}`.

Just align the three names. See [DOCS.md section 14](./DOCS.md#14-如何新增一种列表).
</details>

<details>
<summary><b>Connect machine translation (Google/Bing/Youdao)</b></summary>

Write Chinese only and generate other languages automatically: collect all Chinese text → batch-call the API → write translations back → re-render. Endpoints, auth, language-code mapping and security notes are in [DOCS.md section 15](./DOCS.md#15-进阶接入机器翻译-api).

⚠️ Keys in front-end txt are visible to visitors — set domain whitelists and usage caps; use a back-end proxy for production.

`content/i18n.txt` ships with the package and both HTML files load it. Default `enabled: '#'` = off, zero network requests; set `enabled: true` and fill one provider's key to use it. Application steps for all three are in the header comments of `i18n.txt`.
</details>

<details>
<summary><b>Modify images (replace + filter/rotate)</b></summary>

Two ways, pick either:

**① Edit txt (permanent)** — like editing text, survives refresh:
```js
// showcase in index.txt
showcase: {
    img: 'banner.png',
    fx: { brightness: 1.1, saturate: 1.2, rotate: 2 }  // image filter
}
```
Site-wide default filters go in `global.txt` → `imageFx`; an image's own `fx` wins.

**② Runtime API (live preview)** — call in the browser console, lost on refresh:
```js
UZ.image.set('#showcaseImg', 'https://example.com/new.png');  // replace
UZ.image.filter('#showcaseImg', { grayscale: 1, blur: 2 });    // filter
UZ.image.reset('#showcaseImg');                                // restore
```
Filter fields: `brightness / contrast / saturate / grayscale / blur / sepia / invert / hueRotate / opacity`, plus transforms `rotate / scale / flipX / flipY`. Default `'#'` or the default value = no effect. Full field table: [AIagent/API.md](./AIagent/API.md#图片修改).
</details>

<details>
<summary><b>Let an AI Agent operate this project</b></summary>

The package includes an `AIagent/` integration kit: `README.md` (entry) → `AGENTS.md` (rules) → `API.md` (API reference) → `manifest.json` (machine-readable metadata) + `examples/` (sample scripts).

The engine exposes a stable `window.UZ.ai` API — self-describing, read state, batch-edit:
```js
UZ.ai.describe();   // capabilities and arguments
UZ.ai.getConfig();  // read all current config
UZ.ai.apply([
  { op:'setLang',  args:['en'] },
  { op:'setPageName', args:['Home','en'] },
  { op:'setText',  args:['section_title','All-in-one','en'] },
  { op:'setImageFilter', args:['#showcaseImg',{ grayscale:1 }] }
]);                 // batch apply, immediately rendered
```
> ⚠️ Runtime API only changes memory and is lost on refresh; permanent changes must be written back to `content/*.txt`. See [AIagent/README.md](./AIagent/README.md).
</details>

## Tech stack

Plain HTML + CSS + JavaScript (ES5 syntax, wide compatibility), no framework, no dependencies, no build step. Browser APIs used: `querySelector`, `localStorage`, `IntersectionObserver`, `URLSearchParams`, CSS custom properties.

## License

[AGPL-3.0](./LICENSE) — free to use, modify and distribute; if you serve it over a network you must make the corresponding source available. See LICENSE for the full text.

---

<p align="center">UZENS CCWST · If this helped you understand "config-driven static sites", please Star ⭐</p>
