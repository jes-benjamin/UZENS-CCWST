# engine/ — Build web pages around the engine source

[中文](./README.md) · [English](./README.en.md) · [日本語](./README.ja.md)

> This folder is a **ready-to-run engine development kit**. It answers one question: **Can you just download `engine.js` and use it? No — but with this starter you can build your own page in 5 minutes.**

## 1. First, the truth: the engine can't be used alone

`engine.js` is a **rendering engine (glue layer)**. It only "fills config data into a page skeleton". It contains no text, images, or styles itself, so **downloading this one file alone won't open a page**. It works with three other things:

| Part | Role | Location in this kit |
|---|---|---|
| `engine.js` | Rendering engine: reads config, fills page, binds interactions | `./engine.js` |
| HTML skeleton | Structure markers only, no hard-coded content | `./starter/index.html` |
| `content/*.txt` | The actual site content (actually JS) | `./starter/content/` |
| `style.css` | Layout and CSS-variable config layer | `./starter/style.css` |

**Good news**: this folder has all four ready. `starter/` is a minimal runnable example — **double-click `starter/index.html` to see a complete page**, no Node, no server, no build.

## 2. Three steps to start (fastest path)

```bash
# Step 1: copy the starter skeleton into your project
cp -r engine/starter my-site/

# Step 2: place the engine where starter can find it
#   starter/index.html ends with <script src="../engine.js"></script>
#   so either copy engine/engine.js one level up, or edit that path
cp engine/engine.js my-site-engine.js   # then change the HTML path to ./my-site-engine.js

# Step 3: double-click my-site/index.html — done, no build needed
```

> Key: **the engine can live anywhere, as long as the `<script src="...">` at the end of the HTML points to it**. Same for the config txt files — their paths are written in `<head>`.

## 3. The "contract" between engine and page

The engine doesn't know your design, but it knows a set of **fixed marker conventions**. If your HTML follows them, the engine works. This is the core of developing around the engine.

### 3.1 `data-page` on `<body>`

```html
<body data-page="index">
```

The engine reads this and looks up `window.SITE_PAGES.index` for the page config. For a second page use `data-page="about"` and the engine looks for `window.SITE_PAGES.about`.

### 3.2 Load order in `<head>` (**order matters**)

```html
<script src="content/global.txt"></script>  <!-- ① global config, must be first -->
<script src="content/index.txt"></script>   <!-- ② this page's config -->
<!-- ...engine loads last, just before </body> -->
<script src="../engine.js"></script>
```

`<script src>` is used instead of `fetch()` so it works via double-click `file://` (fetch on local files is blocked by CORS). This is the root reason the whole architecture is "zero-server".

### 3.3 Content markers: where the engine fills text

| Marker | Role | Example |
|---|---|---|
| `data-i18n="field"` | Fill element with current-language text from the dictionary | `<p data-i18n="hero_sub">Subtitle</p>` |
| `data-i18n-aria="field"` | Fill `aria-label` accessibility text | theme button |
| `data-i18n-title="field"` | Fill `title` attribute | optional |
| `data-list="arrayName"` | Empty container; engine generates a set of cards from the array | `<div data-list="features"></div>` |

The dictionary comes from each txt's `i18n` object (four languages: zh/en/tw/ja). To make text switchable, add a field to a txt's `i18n` and put `data-i18n="field"` on the HTML element.

### 3.4 Fixed IDs: the "slots" the engine recognizes

These IDs are the engine's interface. Renaming them disables the matching feature (but won't crash the page):

| ID | Feature | Needed when |
|---|---|---|
| `#navLinks` | Nav link container, generated from `global.nav` | you have navigation |
| `#pageName` | Visible page name in nav (written by `pageName`) | optional |
| `#brandText` | Site name text | optional |
| `#langSeg` | Language switch buttons | you want language switching |
| `#themeToggle` | Theme toggle button | you want theme switching |
| `#typed` | Typewriter text container | homepage typewriter |
| `#infoModal` / `#infoModalClose` / `#infoModalTitle` / `#infoModalHint` | Generic info modal | you want a modal |
| `#toast` | Lightweight toast | you want notifications |
| `#showcase` series | Image showcase (optional part, can be removed entirely) | optional |

> Note: all IDs are **optional** — the engine guards every slot with `if (!el) return`. You can use only a few and make a minimal page.

### 3.5 Config files = valid JS

`content/*.txt` are named txt but contain JS assignments:

```js
window.SITE_PAGES = window.SITE_PAGES || {};
window.SITE_PAGES.index = {
    pageName: { zh: 'Home', en: 'Home', tw: '首頁', ja: 'ホーム' },
    i18n: { zh: { hero_sub: 'Subtitle' }, en: { hero_sub: 'Sub title' }, ... }
};
```

Each txt pours its config object into the same `window.SITE_PAGES` store without overwriting others. To change content, just edit text inside single quotes.

## 4. Build your own page from scratch (full flow)

1. **Copy the skeleton**: `cp -r engine/starter my-site/`, remove parts you don't need.
2. **Edit global config** `content/global.txt`: site name, nav, global text dictionary.
3. **Edit page config** `content/index.txt`: `pageName`, typewriter text, `features` array, page text.
4. **Edit the HTML skeleton** `index.html`: keep the slot IDs and `data-i18n`/`data-list` markers you need, remove unused sections.
5. **Point to the engine**: make sure the trailing `<script src="...">` points to `engine.js`'s real location.
6. **Double-click to open**: `file://` works directly; edit txt and refresh.

**Add a page**: copy `index.html` → change `<body data-page="about">` → create `content/about.txt` → add a line `<script src="content/about.txt"></script>` in `<head>` → add an item to `nav` in `global.txt`. See main doc `DOCS.md` section 13.

## 5. Extending the engine (advanced)

Two extension points plus runtime APIs:

- **New list type**: add a same-named function in `engine.js`'s `RENDERERS` (e.g. `newsList`), then write `<div data-list="newsList">` in HTML. See `DOCS.md` section 14.
- **New language**: add a language block to each txt's `i18n` and add its name to `LANG_NAME` in `engine.js`.
- **Modify images**: config entries `global.imageFx` / page `showcase.fx`; runtime `window.UZ.image.set/filter/reset`. See `DOCS.md` section 16.
- **AI Agent integration**: `window.UZ.ai` exposes a self-describing API to read/write content and looks. See `DOCS.md` section 17 and the root `AIagent/` folder.
- **Machine translation**: `content/i18n.txt` configures Google/Bing/Youdao, off by default.

## 6. Common pitfalls

| Symptom | Cause / Fix |
|---|---|
| "Content config not loaded" message | `global.txt` not found: confirm HTML sits next to `content/` and the `<script src>` path is correct |
| Text doesn't appear after opening | Syntax error in a txt (usually a missing comma/quote). Copy the txt to `.js` and run `node --check` |
| Language switch does nothing | Element lacks `data-i18n`, or the dictionary field is missing |
| Edited txt but no change | Browser cache, hard refresh (Ctrl+F5) |
| Cards not generated | HTML lacks `data-list="features"`, or the array in txt is empty |

## 7. File list

```
engine/
├── engine.js          # Engine source (use/modify directly, fully commented)
├── README.md          # This tutorial (Chinese)
├── README.en.md       # Tutorial (English)
├── README.ja.md       # Tutorial (Japanese)
└── starter/           # Minimal runnable skeleton (double-click index.html)
    ├── index.html
    ├── style.css
    └── content/
        ├── global.txt
        └── index.txt
```

For full principles, see root `DOCS.md` (18 sections).
