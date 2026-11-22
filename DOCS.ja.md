<!-- 言語切替 / Language / 语言: [中文](./DOCS.md) · [English](./DOCS.en.md) · [日本語](./DOCS.ja.md) -->

# 仕組みの解説：txt を分けて网页内容を設定する方法

> **UZENS CCWST** — UZENS Convenient Configure WebSite Technology
> 言語：[中文](./DOCS.md) · [English](./DOCS.en.md) · [日本語](./DOCS.ja.md) ｜ 紹介：[中文](./README.md) · [English](./README.en.md) · [日本語](./README.ja.md)

> 実行可能なサンプルはパッケージ直下の `index.html` / `about.html` / `engine.js` / `content/` にあります。
> コードを横に開きながら読むことをおすすめします。

この構成が解決する課題は明確です：**コードを書けない人が、几个の `.txt` の文字を書き換えるだけでサイト全体の内容を変更できる** ようにすること。しかも `index.html` をダブルクリックするだけで結果が見え、環境構築もサーバーもビルド工具も不要です。

最も根本的なところから順に、層をめくって説明します。

---

## 目次

1. [核心となる考え方：内容と構造の分離](#1-核心となる考え方内容と構造の分離)
2. [なぜ txt は `<script src>` で読み込めるのか（fetch ではなく）](#2-なぜ-txt-は-script-src-で読み込めるのかfetch-ではなく)
3. [`window.SITE_PAGES`：複数 txt が共有する設定ストア](#3-windowsite_pages複数-txt-が共有する設定ストア)
4. [エンジンが「現在のページ」の設定をどう見つけるか](#4-エンジンが現在のページの設定をどう見つけるか)
5. [i18n：全体文案とページ文案の浅いマージ](#5-i18n全体文案とページ文案の浅いマージ)
6. [`data-i18n`：辞書の文字をページに流し込む](#6-data-i18n辞書の文字をページに流し込む)
7. [多言語オブジェクト `L()`：リストや部件も言語切替できるようにする](#7-多言語オブジェクト-lリストや部件も言語切替できるようにする)
8. [データ駆動リスト：配列ひとつでカード群を生成](#8-データ駆動リスト配列ひとつでカード群を生成)
9. [CSS 変数の階層：フォント/テーマ/背景の「設定層」](#9-css-変数の階層フォントテーマ背景の設定層)
10. ["既定で無影響"：`#` と空値をプレースホルダーにする](#10-既定で無影響-と空値をプレースホルダーにする)
11. [ボタンの三種類のバインド：遷移 / モーダル / ヒント](#11-ボタンの三種類のバインド遷移--モーダル--ヒント)
12. [イベント委譲：動的に生成した要素も反応させる](#12-イベント委譲動的に生成した要素も反応させる)
13. [新しいページを追加する](#13-新しいページを追加する)
14. [新しいリストを追加する](#14-新しいリストを追加する)
15. [応用：機械翻訳 API を接続する](#15-応用機械翻訳-api-を接続する)
16. [画像の変更：差し替えと CSS フィルター](#16-画像の変更差し替えと-css-フィルター)
17. [AI Agent 向け接続 API](#17-ai-agent-向け接続-api)
18. [この方式の限界と注意点](#18-この方式の限界と注意点)
19. [エンジン中心で自分のページを作る：engine/ キット](#19-エンジン中心で自分のページを作るengine-キット)

---

## 1. 核心となる考え方：内容と構造の分離

ウェブページは三つの層に分けられます：

| 層 | ファイル | 編集者 | 中身 |
|---|---|---|---|
| **内容層** | `content/*.txt` | 内容担当者 | 文字、画像 URL、リンク、リストデータ |
| **構造層** | `*.html` | 開発者（ほぼ触らない） | ページ骨格、プレースホルダー `data-i18n` / `data-list` |
| **表現層** | `style.css` | 開発者（ほぼ触らない） | 色、レイアウト、アニメーション |

さらに「接着層」`engine.js` を加えます。内容層を読み、構造層へデータを流し込みます。

```
   content/global.txt ─┐
   content/index.txt  ─┼─→  window.SITE_PAGES（ストア）
   content/about.txt  ─┘            │
                                    │ engine.js が読取
                                    ▼
                          index.html / about.html
                     （data-i18n / data-list の箇所が埋まる）
```

**利点**：

- 一文を変えるなら txt の一行を変えるだけ、HTML 構造を乱しません；
- ページごとに txt なので、追加しても既存ページに影響しません；
- 内容ファイルはプレーンテキスト、誰でもメモ帳で編集できます。

---

## 2. なぜ txt は `<script src>` で読み込めるのか（fetch ではなく）

これが「ダブルクリックで動く」ための肝であり、最も見落とされやすい细节です。

初心者は「内容は txt にあるから `fetch('content/index.txt')` で読めばいい」と考えがちです。しかしローカルでダブルクリックするとアドレスバーは `file://...` になり、ブラウザの**同一オリジンポリシー**がローカルファイルの fetch をクロスオリジンとしてブロックし、エラーになります。

`<script src="content/index.txt">` は違います。ブラウザは `<script src>` が指すファイルを（ローカルでも）JavaScript として実行します。つまり **txt の中身自体が正しい JavaScript であれば**、読み込めます。

そこで txt には JSON ではなく JS の代入文を書きます：

```js
// content/index.txt の中身は実は JS
window.SITE_PAGES = window.SITE_PAGES || {};
window.SITE_PAGES.index = {
    typed: { full: '大見出し' },
    // ...
};
```

HTML では次の順で読み込みます（順番が重要）：

```html
<script src="content/global.txt"></script>
<script src="content/index.txt"></script>
<script src="engine.js"></script>
```

> `.txt` という拡張子は人間のためだけです。ブラウザは `<script>` として実行し、拡張子は見ません。
> `.js` でも構いませんが、`.txt` にすることで「これはコードではなく人が編集する内容ファイルです」と強調しています。
>
> 代償：これらの txt に**本物の秘密情報**（API 鍵など）は置けません。訪問者に見えるからです。翻訳鍵がデモ/内部用にとどまる理由もここにあり、本番站点ではドメインのホワイトリストやバックエンドが必要です。

---

## 3. `window.SITE_PAGES`：複数 txt が共有する設定ストア

すべての txt は次の二行で始まります：

```js
window.SITE_PAGES = window.SITE_PAGES || {};
window.SITE_PAGES.index = { /* このページの設定 */ };
```

一行目が肝です。`||` は「左が存在しなければ右を使う」の意味です：

- `window.SITE_PAGES` がまだ無い（最初の txt 読み込み時）→ 空オブジェクト `{}` を新規作成；
- 既にある（後の txt 読み込み時）→ 既存の内容を保持。

結果、三つの txt が順に読み込まれ、**同じオブジェクト**に三つのキーが入ります：

```js
window.SITE_PAGES = {
    global: { /* 全体設定 */ },
    index:  { /* 首页設定 */ },
    about:  { /* 关于页設定 */ }
};
```

もし各 txt が `window.SITE_PAGES = {}` と書いたら、後のものが前を上書きします。だから `= window.SITE_PAGES || {}` は省けません。

---

## 4. エンジンが「現在のページ」の設定をどう見つけるか

複数ページ站点では `index.html` と `about.html` が同じ `engine.js` を共有します。どの設定を読むかをどう判断するか？答えは `<body>` のカスタム属性です：

```html
<!-- index.html -->
<body data-page="index">
```

```html
<!-- about.html -->
<body data-page="about">
```

エンジンは先頭でこう取得します：

```js
var PAGES = window.SITE_PAGES || {};
var G = PAGES.global;                                  // 全体設定
var pageKey = document.body.getAttribute('data-page'); // 'index' か 'about'
var cur = PAGES[pageKey] || {};                        // 現在ページの設定
```

`data-*` は HTML 標準が認めるカスタム属性で、表示に影響せず JS へ情報を渡すために使います。`data-page="about"` で `window.SITE_PAGES.about` を読めと指示しています。

> `global.txt` の読み込みに失敗すると `G` が空になります。エンジンはそれを検知して白画面ではなく親切なメッセージを出します。必要な耐錯性です。

---

## 5. i18n：全体文案とページ文案の浅いマージ

各設定には言語別にグループ化した `i18n` オブジェクトがあります：

```js
i18n: {
    zh: { brand: 'タイトル', nav_home: 'ホーム', ... },
    en: { brand: 'Brand', nav_home: 'Home', ... },
    tw: { /* ... */ },
    ja: { /* ... */ }
}
```

共通文案は `global.txt`、ページ専用文案はそのページの txt。エンジン起動時に**言語別に浅くマージ**します：

```js
var I18N = { zh: {}, en: {}, tw: {}, ja: {} };
function mergeI18n() {
    ['zh', 'en', 'tw', 'ja'].forEach(function (lang) {
        var g = (G.i18n && G.i18n[lang]) || {};     // 全体
        var p = (cur.i18n && cur.i18n[lang]) || {}; // このページ
        var out = {};
        Object.keys(g).forEach(function (k) { out[k] = g[k]; }); // 全体を先に
        Object.keys(p).forEach(function (k) { out[k] = p[k]; }); // ページが上書き
        I18N[lang] = out;
    });
}
```

「浅い」とはオブジェクトの一段目だけをマージすること。`zh` の層では `brand` や `nav_home` が項目ごとにマージされ、**ページの同名字段が全体のを上書き**します。これが「共通は global、専用はページ、ページ優先」の実装です。

マージ結果は大きな辞書 `I18N.zh.字段名`、`I18N.en.字段名` …… になり、以降の文字はすべてここから取ります。

---

## 6. `data-i18n`：辞書の文字をページに流し込む

HTML 骨格の文字位置には文案を直接書かず、マーカーを書きます：

```html
<p class="eyebrow" data-i18n="eyebrow">サブタイトル</p>
<h2 data-i18n="section_title">大見出し</h2>
```

`data-i18n="eyebrow"` は「ここの文字は辞書の `eyebrow` 字段で決まる」の意味。タグ内に元から書かれた文字は**プレースホルダー**で、ページを開くと置き換えられます（JS が読めなくても最低限見た目が残る）。

エンジンはこのマーカーを持つ要素を走査し、現在の言語辞書の値を流し込みます：

```js
function applyI18n() {
    var d = I18N[state.lang] || {};
    $$('[data-i18n]').forEach(function (el) {
        var key = el.getAttribute('data-i18n');
        if (d[key] != null) el.textContent = d[key];
    });
    // aria-label などのテキスト以外は data-i18n-aria
    applyPageName(d);
}
```

言語を切るには `state.lang` を変えて `applyI18n()` をもう一度呼ぶだけ。ページ全体が瞬時に言語を変えます。「ワンクリック四言語切替」の全秘密です。

### 网页名称（見出し）`pageName`

各ページは自分の txt で `pageName`（四言語オブジェクト）により「このページの名前」を定義できます。エンジンの `applyPageName()` がそれを二箇所へ書き込みます：ブラウザのタブ `document.title` と、ナビの表示タイトル `#pageName`。言語切替時は他の文字と一緒に更新されます。

```js
// content/index.txt
pageName: { zh: '首页', en: 'Home', tw: '首頁', ja: 'ホーム' }
```

優先順位：`pageName` > `i18n.docTitle` > `global.siteInfo.title`。これが「各ページが独立して名称を変えられる」実装で、ページ txt がそれぞれの見出しを持ち、干渉しません。

---

## 7. 多言語オブジェクト `L()`：リストや部件も言語切替できるようにする

`data-i18n` は HTML に直接書かれた静的な文字に向いています。しかしリストカードは JS が動的に生成し、ショーケースの文字も設定オブジェクト内にあります。これらの文字はどう書くか？

答えは**多言語オブジェクト**です。一つの字段に四言語の値を直接書きます。

```js
title: { zh: 'タイトル', en: 'Title', tw: '標題', ja: 'タイトル' }
```

エンジンは `L()` で現在の言語の値を取り出します：

```js
function L(obj) {
    if (obj == null) return '';
    if (typeof obj !== 'object') return obj;          // 普通の文字列はそのまま
    return obj[state.lang] || obj.zh || obj.en || ''; // 現在語→中文→英文→空
}
```

描画時に `L(item.title)` を使い、言語切替時に**リストを再描画**すればカードの文字も追従します。だから `setLang()` は `renderLists()` と `renderShowcase()` を呼ぶのです。これらは内部で多言語オブジェクトを使っています。

> 互換性：`L()` は文字列にも効きます。設定に `'タイトル'`（全言語同じ）でも四言語オブジェクトでも書けます。言語が欠けても中文にフォールバックし、空白になりません。

---

## 8. データ駆動リスト：配列ひとつでカード群を生成

「内容を変えるのに HTML を触らない」の最も典型的な例です。

設定内の配列：

```js
features: [
    { icon: '✦', desc: {zh:'小見出し',...}, paras: [{zh:'内容',...}] },
    { icon: '◆', desc: {...}, paras: [...] },
    { icon: '●', desc: {...}, paras: [...] }
]
```

HTML には空のコンテナが一つ：

```html
<div class="card-grid" data-list="features"></div>
```

エンジンには「描画関数のレジストリ」があり、キー名が配列名と `data-list` 値に対応します：

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
        var arr = cur[name];                       // 設定の配列
        var fn = RENDERERS[name];                  // 対応する描画関数
        if (!arr || !fn) return;
        box.innerHTML = arr.map(function (item, i) {
            return fn(item, i);                    // 各項目 → HTML 断片
        }).join('');
    });
}
```

カードを足したい？配列にオブジェクトを追加。消したい？削除。HTML は一行も触りません。

**三つの名前を揃える**のが要点：設定の配列名（`features`）、HTML の `data-list="features"`、レジストリの `RENDERERS.features`。これがこの仕組み唯一の「約束」で、覚えれば間違いません。

---

## 9. CSS 変数の階層：フォント/テーマ/背景の「設定層」

フォントや背景も CSS を触らず txt で設定できるのはなぜか？答えは **CSS 変数＋フォールバック値**です。

CSS はフォントを直接書かず、変数とフォールバックを書きます：

```css
:root { --font-ui: 'PingFang SC', sans-serif; }
body { font-family: var(--font-ui); }
.hero-title { font-family: var(--pg-title, Georgia, serif); }
```

JS は CSS ルールに一切触れず、要素に**変数を設定**するだけ：

```js
function applyFonts() {
    if (G.font.site && G.font.site !== '#')
        document.documentElement.style.setProperty('--font-ui', G.font.site);
    if (cur.font.title && cur.font.title !== '#')
        document.body.style.setProperty('--pg-title', cur.font.title);
}
```

- 未設定：変数が設定されず、CSS がフォールバックを使う＝テンプレート既定の見た目；
- 設定済み：変数が書き込まれ、`var(--pg-title, …)` を使う全部所が一度に効く。

**テーマ**も同じ発想で、違いはルート要素の属性にスイッチを置くこと：

```js
document.documentElement.setAttribute('data-theme', 'light');
```

CSS には二組の変数：

```css
:root { --bg: #0a0a0c; }                    /* ダーク */
[data-theme="light"] { --bg: #f2f2f5; }    /* ライト */
```

**背景画像**も変数です：`--bg-img`、`--bg-blur`、`--bg-bright` を `applyBackground()` が `global.txt` の `background` から設定。CSS の `.background-layer` が `background-image: var(--bg-img)` で読みます。

この「JS は変数を書くだけ、CSS は変数を読むだけ」の階層の利点：
- 外観ロジックは CSS に集中、JS は値を渡すだけ；
- テーマ切替にスタイル再計算が不要、属性を変えるだけ；
- 設定と既定フォールバックが自然に分離し、互いに干渉しません。

---

## 10. "既定で無影響"：`#` と空値をプレースホルダーにする

設定の中で `'#'` と `''`（空文字）を何度も見かけます。これは意図的な約束です：

> **`#` ＝ プレースホルダー、「この項目は未設定、既定値を使う」の意味。**

例えばフォント：

```js
font: { site: '#', title: '#' }
```

JS は設定を適用する箇所すべてでまず判定します：

```js
if (f.title && f.title !== '#') { /* ここで初めて変数を設定 */ }
```

だからテンプレート配布時は全オプションがプレースホルダー状態で、**見た目＝テンプレート既定**。利用者は変えたい項目だけを埋め、他は `#` のままで誤って変わることがありません。空文字 `''` は画像/リンク字段に似た意味で使います：「画像が無ければプレースホルダー、リンクが無ければヒントを表示」。

この約束によりテンプレートは「すぐ使える」かつ「段階的にカスタマイズできる」ものになり、コードを知らない人へ安全に渡せる前提になっています。

---

## 11. ボタンの三種類のバインド：遷移 / モーダル / ヒント

ボタンの挙動も HTML マーカーで宣言し、ボタンごとに JS を書く必要はありません：

| 書き方 | 挙動 | 用途 |
|---|---|---|
| `<a href="https://…">` | リンクへ遷移 | 外部リンク、ページナビ |
| `<button data-modal>` | 情報モーダルを開く | 「もっと見る」、説明 |
| `<a href="#" data-link-unset>` | 「未設定」ヒントを表示 | 設定の url が空のときのプレースホルダー |

三番目が特に便利です。設定の `url` が空だと描画関数が自動で `data-link-unset` を付け、クリックで「未設定」と表示し、壊れたリンクへ飛びません。利用者が `url` を埋めると描画関数が本物の `<a href>` に差し替えます。「未設定」状態が明確で親切で、サイレント失敗になりません。

---

## 12. イベント委譲：動的に生成した要素も反応させる

リストカードは JS 生成なので、ページ読み込み時には存在しません。各ボタンに個別にイベントを付けると、新規生成ボタンは反応しません。

エンジンは**イベント委譲**を使います：`document` にクリックリスナーを一つだけ置き、`closest()` でどの種類の要素がクリックされたか判定します：

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

イベントは `document` までバブルするので、新規要素でも既存要素でもこのリスナーが捉えます。動的コンテンツのイベント処理の標準的なやり方です。

---

## 13. 新しいページを追加する

「ニュース」ページを足す例：

**ステップ 1**：`index.html` を `news.html` にコピーし、二箇所を変更：
```html
<script src="content/news.txt"></script>   <!-- 新しい txt へ -->
<body data-page="news">                     <!-- 新しいページ名へ -->
```
不要な区块を削り、骨格とプレースホルダーを残します。

**ステップ 2**：`content/news.txt` を新規作成：
```js
window.SITE_PAGES = window.SITE_PAGES || {};
window.SITE_PAGES.news = {
    pageName: { zh: '新闻', en: 'News', tw: '新聞', ja: 'ニュース' },
    font: { title: '#', button: '#', text: '#', modal: '#' },
    i18n: {
        zh: { docTitle: 'タイトル', page_title: '大見出し' },
        en: { docTitle: 'Title', page_title: 'Big title' },
        tw: { docTitle: '標題', page_title: '大標題' },
        ja: { docTitle: 'タイトル', page_title: '大見出し' }
    }
};
```

**ステップ 3**（任意）：`global.txt` の `nav` 配列に一项追加するとナビに入口が増え、現在ページが正しくハイライトされます：
```js
{ i18n: 'nav_news', href: './news.html', page: 'news' }
```
さらに `global.txt` の四言語 `i18n` それぞれに `nav_news: '按钮'` を追加。

完了。既存ページは完全に無影響です。設定がページごとに隔離されているからです。

---

## 14. 新しいリストを追加する

ニュースページに「ニュースリスト」が欲しい例：

**ステップ 1**：`news.txt` に配列を追加：
```js
newsList: [
    { title: {zh:'タイトル', en:'Title'}, date: '内容' },
    { title: {zh:'タイトル', en:'Title'}, date: '内容' }
]
```

**ステップ 2**：`news.html` に空コンテナ：
```html
<div data-list="newsList"></div>
```

**ステップ 3**：`engine.js` の `RENDERERS` に同名関数：
```js
newsList: function (item) {
    return '<article class="card"><h3>' + esc(L(item.title)) +
           '</h3><p>' + esc(item.date) + '</p></article>';
}
```

三つの名前（`newsList`）を揃えればリストが現れ、言語切替でタイトルも追従します。

---

## 15. 応用：機械翻訳 API を接続する

各言語を手で埋めたくなければ、中文だけを書き翻訳 API に他を補わせられます。本パッケージはこの能力を**内蔵**しています：設定は `content/i18n.txt`（既定 `enabled: '#'` オフ）、実装は `engine.js` 第 8 部分、両 HTML が txt を読み込みます。

**動作の流れ**：

1. 起動時 `autoEnabled()` がスイッチを確認。オフなら完全スキップ、**ネットワーク通信ゼロ**、副作用ゼロ；
2. オンなら `collectSlots()` が全中文スロットを収集——辞書内の文字列＋`global`/現在ページ設定内の全 `{zh,en,tw,ja}` オブジェクトの `.zh` 値を再帰的に辿り、文案で重複排除；
3. `onlyFillMissing: true` なら「訳が空またはまだ中文と同じ」スロットだけを翻訳し、手入力の訳を上書きしません；
4. `provider` に応じて Google / Bing / 有道 を 40 件ずつ呼び、訳を辞書と多言語オブジェクトへ書き戻し；
5. 完了後 `setLang(state.lang, false)` で再描画し、ページが即座に訳を表示。

設定字段（`i18n.txt`）：

```js
window.SITE_PAGES.i18nConfig = {
    enabled: '#',              // '#' オフ；true オン
    provider: 'google',        // google / bing / youdao
    targets: ['en','tw','ja'], // 生成する言語（zh は源言語）
    onlyFillMissing: true,     // true = 既存の訳を上書きしない
    google:  { apiKey: '' },
    bing:    { apiKey: '', region: '' },
    youdao:  { appKey: '', appSecret: '' }
};
```

三つの主流 API のブラウザ側呼び出し：

| 事業者 | エンドポイント | 認証 | ブラウザ CORS |
|---|---|---|---|
| Google | `translation.googleapis.com/language/translate/v2` | API Key | CORS OK |
| Bing | `api.cognitive.microsofttranslator.com/translate` | Key + Region | CORS OK |
| 有道 | `openapi.youdao.com/api` | appKey + appSecret + SHA256 署名 | サーバー API、直結はブロックされがち |

言語コードのマッピングが必要（例：中文は Google `zh-CN`、Bing `zh-Hans`、有道 `zh-CHS`）。エンジンは `LANG_GOOGLE`/`LANG_BING`/`LANG_YOUDAO` の三表で処理します。有道の署名は `crypto.subtle.digest('SHA-256', …)` で計算。三家の鍵申請手順は `i18n.txt` の先頭コメントにあります。

**セキュリティ注意**（重要）：フロントエンド txt の鍵は全訪問者に見えます。必ず事業者管理画面で**ドメインのホワイトリスト＋使用量上限**を設定してください。本番はバックエンド プロキシに鍵を置き、フロントが鍵に触れないようにします。有道は Web Crypto と CORS のため `file://` では概して動かないので、デモは Google/Bing を優先してください。

---

## 16. 画像の変更：差し替えと CSS フィルター

「画像を変える」は「文字を変える」と同じ発想——**データを設定に入れ、エンジンが読んで描画**。二つの入口があります：

**① 設定入口（恒久）**。`global.txt` にサイト共通の既定フィルター `imageFx`、ショーケースに自身の `fx`（ページ優先）：

```js
// global.txt
imageFx: { brightness: '#', blur: '#' }   // 全部 '#' = 無効

// index.txt → showcase.fx
showcase: {
    img: 'banner.png',
    fx: { brightness: 1.1, saturate: 1.2, rotate: 2 }
}
```

エンジンの `applyFx(img, fx)` はフィルターオブジェクトを二つの CSS に組み立てます：`filter`（明度/コントラスト/饱和度/グレー/ぼかし/セピア/反転/色相/不透明度）と `transform`（回転/缩放/反転）を画像の `style` へ。`filterCSS()` は `'#'` と既定値の字段をスキップし「既定で無影響」を保証します。

**② 実行時入口（即時）**。`engine.js` 第 9 部分が `window.UZ.image` を公開：

```js
UZ.image.set('#showcaseImg', 'new.png');            // 差し替え
UZ.image.filter('#showcaseImg', { grayscale: 1 });  // フィルター変更
UZ.image.get('#showcaseImg');                       // 現在状態を読む
UZ.image.reset('#showcaseImg');                     // 復元
```

要点：差し替えは `img.src` だけ、フィルターは CSS だけを書き、元画像ファイルには触りません。だから自由に試していつでも `reset()` で戻せます。「設定＝データ」と一脈相通じます。画像の「見せ方」はタグに直接書いた属性ではなく、設定可能なデータなのです。

---

## 17. AI Agent 向け接続 API

AI Agent がサイト編集を手伝うとき、`engine.js` を先に全部読むべきではありません。本パッケージは `engine.js` 第 10 部分に**自己記述的で意味的に安定した** API を公開します：`window.UZ.ai`。

設計の要点：

- **`describe()` が自己記述**：全能力の名前、引数、用途を返します。Agent は呼ぶだけで源码を読まずに何ができるか分かります。
- **読んでから書く**：`getConfig()` / `exportConfig()` で現状スナップショット、`getImageInfo()` で画像を読んでから変更方法を決めます。
- **即時描画**：各 `set*` は変更後すぐ再描画、「見たままが結果」。
- **一括実行**：`apply([{op,args}...])` で複数変更を一度に。一項が失敗しても他は続行し `{ok, fail, errors}` を返します。

```js
UZ.ai.describe();                    // 能力清单
UZ.ai.getConfig();                   // 現状を読む
UZ.ai.apply([
  { op:'setLang',  args:['en'] },
  { op:'setPageName', args:['Home','en'] },
  { op:'setText',  args:['section_title','All-in-one','en'] },
  { op:'setImageFilter', args:['#showcaseImg',{ grayscale:1 }] }
]);
```

> **重要な境界**：実行時 API はメモリだけを変え、リフレッシュで消えます。Agent が**恒久的に**変更するにはファイル編集ツールで `content/*.txt` へ書き戻す必要があります。この規則は `AIagent/AGENTS.md` の操作守則にあります。

また `AIagent/` フォルダは Agent の「接続キット」です：`README.md`（ワークフロー）、`AGENTS.md`（何を変える/変えない）、`API.md`（完全 API）、`manifest.json`（機械可読の字段表）、`examples/`（Playwright とコンソール例）。汎用サイトを AI に渡すなら「`AIagent/README.md` を読め」だけで始められます。

---

## 18. この方式の限界と注意点

限界を理解して正しく使いましょう：

- **向いている**：内容型/表示型サイト（公式サイト、ポートフォリオ、ランディング、ドキュメント）で、非技術者が内容を維持し、ゼロビルド・ダブルクリック利用を望む場合。
- **向いていない**：ログイン、データベース、リアルタイム対話、複雑な状態管理が必要なアプリ——それらはフレームワークとバックエンドの出番です。
- **SEO**：内容は JS 描画なので、検索エンジンは JS を実行して本文を見る必要があります。現代のエンジン（Google、Baidu）は実行しますが、ファーストビューの重要文案は HTML にもプレースホルダーとして置くのがより安全です（本例はそうしています）。
- **鍵の安全**：前節参照。フロント設定に秘密情報は置きません。
- **設定＝コード**：txt のカンマ一つ間違えで JS エラーになります。非技術者へ渡すなら「カンマと引用符を消さないで」と明記し、記入テンプレートを用意するのが望ましいです。
- **命名約束**：`data-list` / 配列名 / 描画関数名を揃え、`body[data-page]` を `window.SITE_PAGES.xxx` に合わせます。単純な約束ですが守る必要があります。

---

## 19. エンジン中心で自分のページを作る：engine/ キット

最初の 18 節は「このシステムがどう動くか」を説明しました。原理を理解していて、**エンジンを使って自分のサイトを作りたい**なら、本パッケージは `engine/` に自己完結の開発キットを用意しています——これは「`engine.js` を単体でダウンロードして使えるか」への完全な回答です。

**結論：`engine.js` 単体では使えません。** これはレンダリングの接着層だけで、文字・画像・スタイルを含みません。3 つと組み合わせる必要があります：

1. `content/*.txt` 設定（`global.txt` が無いと通知を出して停止）；
2. `data-page` / `data-i18n` / `data-list` と固定 ID（`#navLinks`、`#typed`、`#infoModal` など）を持つ HTML 骨格；
3. CSS 変数とレイアウトを提供する `style.css`。

`engine/` フォルダの構成：

```
engine/
├── engine.js       # エンジンソース（そのまま改造可、詳細注释付き）
├── README.md / .en.md / .ja.md  # 3 言語の開発チュートリアル
└── starter/        # 最小実行骨格、index.html ダブルクリックで動く
    ├── index.html / style.css
    └── content/global.txt / index.txt
```

**最短スタート**：`cp -r engine/starter my-site/` し、`engine/engine.js` を末尾の `<script src>` が指す場所へ置き、`index.html` をダブルクリックすれば完全なページが見られます。あとは txt を書き換え、不要なセクションを削除するだけです。

エンジン中心開発の鍵は、ページとの**契約**です（詳細は `engine/README.md`）：

- `<body data-page="xxx">` がどの `window.SITE_PAGES.xxx` 設定を読むかを決める；
- `<head>` で txt は `global.txt → ページ txt` の順に読み、エンジンは `</body>` 直前に最後に読む（`fetch` ではなく `<script src>` を使うことで `file://` ダブルクリックが動く）；
- 文字は `data-i18n="字段"` でバインドし、リストは空の `<div data-list="配列名">` に任せる；
- 固定 ID はすべて任意で、エンジンは各スロットを `if (!el) return` でガードするため最小ページも作れる；
- 拡張ポイントは `RENDERERS`（新リスト種別）と `LANG_NAME`（新言語）、さらにランタイム `window.UZ.image` / `window.UZ.ai` API。

これによりエンジンは「このテンプレート内でしか動かないスクリプト」から、**任意の静的サイトを中心に組み立てられるコア**へ変わります。

---

## まとめ

この構成の本質を一文で：

> **「内容」を JS オブジェクトとして txt に書き、`<script src>` でグローバル ストアへ読み込み、汎用エンジンがページごとにストアを読んでプレースホルダー付き HTML へデータを流し込む。**

四つの步驟——**登録（txt）→ 読込（script src）→ 取得（data-page + data-i18n/data-list）→ 描画（engine.js）**——を押さえれば、このシステムを自分で再現し拡張できます。
