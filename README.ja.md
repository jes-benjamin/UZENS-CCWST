<!-- 言語切替 / Language / 语言: [中文](./README.md) · [English](./README.en.md) · [日本語](./README.ja.md) -->

# UZENS CCWST

> **UZENS Convenient Configure WebSite Technology** —— 依存ゼロ・ビルドゼロの静的サイト構成です。**サイトの内容を `.txt` ファイルに分割し、テキストを書き換えるだけで更新、HTML をダブルクリックするだけでプレビューできます。** 本プロジェクトは実行可能な教材用ソースパッケージで、仕組みを完全に解説します。

![pure static](https://img.shields.io/badge/依存-ゼロ-brightgreen)
![no build](https://img.shields.io/badge/ビルド-不要-blue)
![license](https://img.shields.io/badge/license-AGPL--3.0-blue)
![i18n](https://img.shields.io/badge/ドキュメント-中日英-purple)

[中文](./README.md) · [English](./README.en.md) · [原理详解 DOCS](./DOCS.md) · [DOCS English](./DOCS.en.md) · [DOCS 日本語](./DOCS.ja.md)

---

## これは何か

こんなサイトを想像してください：**担当者は HTML に触れず、メモ帳で几个の `.txt` の文字を書き換えるだけで内容が変わる**。しかも `index.html` をダブルクリックするだけで動き、Node もサーバーもバンドラーも不要です。

本プロジェクトはこの仕組みを端から端まで実装し、各手順を丁寧に説明します。次の三つの悩みを解決します：

- **内容を編集して構造を壊すのが心配** —— 内容と HTML は完全分離、文字を変えてもタグは乱れません。
- **ページ追加のたびに全体が崩れる** —— ページごとに独立した txt、新規ページは既存に影響しません。
- **初心者でもかんたん** —— コードの知識は一切不要、txt には「タイトル / 内容 / ボタン」のようなプレースホルダーだけ、置き換えるだけです。

## 特徴

- 📝 **内容＝テキスト**：すべての文字・画像 URL・リンク・リストデータは `content/*.txt` に
- 🏷️ **ページ名を設定可能**：各ページ txt の `pageName` でブラウザタイトルと見出しを定義、言語連動で自動切替
- 🌐 **4 言語切替**：中 / 英 / 繁 / 日、ワンクリックで切替し選択を記憶（機械翻訳での自動補完も可）
- 🎨 **外観を自由設定**：サイト全体のフォント、背景（画像/単色/ぼかし/明度/光晕）、ページ別フォント
- 🃏 **データ駆動リスト**：配列ひとつでカード群を生成、項目の追加削除は配列を編集するだけ
- 🖼️ **画像ショーケース**：画像＋テキスト＋角丸ボタン、サイズ調整可、フィルター/回転も自由
- 🌗 **2 テーマ**：ダーク/ライト切替、記憶されます
- ⚡ **依存ゼロ・ビルドゼロ**：素の HTML/CSS/JS、ダブルクリックで動作、静的ホスティングへそのまま配置
- 🛡️ **デフォルト無影響**：すべてのオプションは既定 `#`、触らなければテンプレートのまま
- 🤖 **AI Agent に優しい**：`AIagent/` 接続キットと安定した `UZ.ai` API を内蔵
- 🧩 **エンジン中心開発**：[`engine/`](./engine/README.ja.md) キット（エンジンソース＋3 言語チュートリアル＋ダブルクリック起步骨格）で自分のページを作れる
- 📚 **教材に最適**：詳細コメント付きコード＋[中日英の原理解説](#ドキュメントと言語)

## ドキュメントと言語

紹介ドキュメント（README）と原理ドキュメント（DOCS）はともに**中国語 / 英語 / 日本語**の 3 版を用意し、各ファイル上部で相互に切り替えられます：

| ドキュメント | 中文 | English | 日本語 |
|---|---|---|---|
| 紹介 | [README.md](./README.md) | [README.en.md](./README.en.md) | [README.ja.md](./README.ja.md) |
| 原理解説 | [DOCS.md](./DOCS.md) | [DOCS.en.md](./DOCS.en.md) | [DOCS.ja.md](./DOCS.ja.md) |
| エンジン開発キット | [engine/README.md](./engine/README.md) | [engine/README.en.md](./engine/README.en.md) | [engine/README.ja.md](./engine/README.ja.md) |
| AI 接続 | [AIagent/README.md](./AIagent/README.md) | 同じ（コード中心） | 同じ（コード中心） |

> 💡 **エンジンで自分のページを作りたい？** [`engine/`](./engine/README.ja.md) 開発キットをご覧ください：エンジンソース、3 言語チュートリアル、**ダブルクリックで動く**最小骨格付き。なお `engine.js` 単体では使えず、HTML 骨格＋txt 設定＋CSS が必要です。

## クイックスタート

### 実行

```bash
# 方法 1：index.html をダブルクリック（最简单的、file:// 対応）
# 方法 2：任意の静的サーバー
python3 -m http.server 8000
# ブラウザで http://localhost:8000 を開く
```

### 内容の変更

`content/` 配下の txt を開き、単一引用符内の文字だけを変更します：

```js
// content/index.txt
pageName: { zh: '首页', en: 'Home', tw: '首頁', ja: 'ホーム' },  // ← ページ名/見出し
typed: { full: '大标题', highlight: '标题' },                    // ← この文字を変更
```

```js
// content/global.txt
i18n: {
    zh: { brand: '标题', nav_home: '首页' },     // ← サイト名とナビに変更
    en: { brand: 'Brand', nav_home: 'Home' }
}
```

保存してリフレッシュするだけです。**引用符内の文字だけを変え、カンマ `,`・引用符 `'`・括弧 `{}` `[]` は削除しないでください。**

### ディレクトリ構成

```
UZENS-CCWST/  (ソースパッケージ txt-config-website/)
├── README.md            # このファイル（中国語の紹介）
├── README.en.md         # 英語の紹介
├── README.ja.md         # 日本語の紹介
├── DOCS.md / .en.md / .ja.md  # 3 言語の原理解説
├── LICENSE              # AGPL-3.0 ライセンス
├── index.html           # サンプル首页（構造＋設定清单）
├── about.html           # サンプル 2 ページ目（複数ページで共有するエンジン）
├── style.css            # スタイル層（テーマ/フォント/背景変数）
├── engine.js            # レンダリング エンジン（注释＋画像編集＋AI Agent API）
├── engine/              # ★ エンジン中心開発の自己完結キット（下記参照）
│   ├── engine.js        # エンジンソースのコピー（そのまま改造可）
│   ├── README.md / .en.md / .ja.md  # 3 言語の開発チュートリアル
│   └── starter/         # 最小実行骨格：index.html をダブルクリック
│       ├── index.html / style.css
│       └── content/global.txt / index.txt
├── content/
│   ├── global.txt       # 全体設定：サイト情報、ナビ、フォント、背景、画像フィルター、共通テキスト
│   ├── index.txt        # 首页設定：pageName、タイプライター、ショーケース（fx）、機能カード
│   ├── about.txt        # 关于页設定：pageName、作品リスト
│   └── i18n.txt         # 翻訳 API 設定（Google/Bing/Youdao、既定オフ）
└── AIagent/             # AI Agent 接続キット
    ├── README.md        # AI 入口：ワークフローとファイル地図
    ├── AGENTS.md        # AI 操作ルール
    ├── API.md           # UZ.ai / UZ.image API リファレンス
    ├── manifest.json    # 機械可読のメタデータとフィールド表
    └── examples/        # Playwright / コンソール例
```

## 仕組みの概要

```
content/global.txt ─┐
content/index.txt  ─┼─ <script src> で読込 → window.SITE_PAGES ストア
content/about.txt  ─┘                          │
                                               │ body[data-page] が現在ページを指定
                                               ▼
                                         engine.js が読取
                                               │
                        data-i18n（文字）/ data-list（リスト）のプレースホルダー
                                               ▼
                                    index.html / about.html
```

四つの核心手順：**登録（txt が `window.SITE_PAGES` に書き込む）→ 読込（HTML が `<script src>` を使う）→ 取得（`data-page` でページを特定）→ レンダリング（エンジンが `data-i18n` / `data-list` を埋める）。**

> **なぜ txt に fetch ではなく `<script src>` を使うのか？** ダブルクリック時はアドレスが `file://` になり、ローカルファイルへの `fetch` は CORS でブロックされますが、`<script src>` は読み込めます。だから txt の中身は正しい JavaScript です。詳細は [DOCS.md 第 2 节](./DOCS.md#2-为什么-txt-能用-script-src-加载而不是-fetch)（中国語）をご覧ください。

## 何をどこで変更するか

| 変更したい内容 | ファイル / フィールド |
|---|---|
| ページ名／見出し（タイトルバー＋表示タイトル） | 各ページ txt → `pageName` |
| 既定のブラウザタイトル、Logo、ナビ、フッター | `global.txt` → `siteInfo` / `nav` / `i18n` |
| サイト全体のフォント | `global.txt` → `font.site` |
| 背景（画像/色/ぼかし/明度/色调） | `global.txt` → `background` |
| 画像フィルター（明度/グレースケール/ぼかし/回転…） | `global.txt` → `imageFx`、または `index.txt` → `showcase.fx` |
| 翻訳 API（Google/Bing/Youdao） | `content/i18n.txt` |
| 首页のタイプライター、ショーケース | `index.txt` → `typed` / `showcase` |
| 首页の機能カード | `index.txt` → `features` 配列 |
| 关于页の作品カード | `about.txt` → `works` 配列 |
| 某ページのタイトル/ボタン/本文/モーダルのフォント | 該当ページ txt → `font` |
| 言語を追加 | 各 txt の `i18n` に段落追加＋`engine.js` の `LANG_NAME` |

## よくある操作

<details>
<summary><b>ページ名（見出し）を設定する</b></summary>

各ページの txt が `pageName` フィールド（4 言語オブジェクト）で「このページの名前」を定義します。エンジンがブラウザのタイトルバーとナビの表示タイトルを更新し、言語切替に連動します：

```js
// content/index.txt
pageName: { zh: '首页', en: 'Home', tw: '首頁', ja: 'ホーム' }
```

優先順位：`pageName` > `i18n.docTitle` > `global.siteInfo.title`。実行時に `UZ.ai.setPageName('ホーム','ja')` で即時プレビューできます（恒久変更は txt へ書き戻す必要があります）。
</details>

<details>
<summary><b>新しいページを追加する</b></summary>

1. `index.html` を `news.html` にコピーし、設定清单の `index.txt` を `news.txt` に、`<body data-page="index">` を `data-page="news"` に変更；
2. `content/news.txt` を新規作成し `window.SITE_PAGES.news = { pageName:{...}, i18n: {...} }` と書く；
3. ナビに表示するなら `global.txt` の `nav` に `{ i18n:'nav_news', href:'./news.html', page:'news' }` を追加し、4 言語の `i18n` それぞれに `nav_news` を追加。

既存ページには一切影響しません。詳細は [DOCS.md 第 13 节](./DOCS.md#13-如何新增一个页面)（中国語）。
</details>

<details>
<summary><b>新しいリストを追加する</b></summary>

1. ページ txt に配列を追加（例 `newsList: [...]`）；
2. HTML に `<div data-list="newsList"></div>` を置く；
3. `engine.js` の `RENDERERS` に同名関数 `newsList: function(item){...}` を追加。

三つの名前を揃えるだけです。詳細は [DOCS.md 第 14 节](./DOCS.md#14-如何新增一种列表)（中国語）。
</details>

<details>
<summary><b>機械翻訳を接続する（Google/Bing/Youdao）</b></summary>

中国語だけを書き、他言語を自動生成：すべての中文テキストを収集 → API を一括呼出 → 訳を辞書へ書き戻し → 再レンダリング。三家 API のエンドポイント、認証、言語コード対応、セキュリティ注意は [DOCS.md 第 15 节](./DOCS.md#15-进阶接入机器翻译-api)（中国語）にあります。

⚠️ フロントエンド txt の鍵は訪問者に見えます。ドメインのホワイトリストと使用量上限を設け、本番はバックエンド プロキシを使ってください。

`content/i18n.txt` はパッケージに同梱され、両 HTML が既定で読み込みます。既定 `enabled: '#'` ＝オフ・ネットワーク通信ゼロ。使うなら `enabled: true` にして一社の鍵を入力してください。三家の申請手順は `i18n.txt` の先頭コメントにあります。
</details>

<details>
<summary><b>画像を変更する（差し替え＋フィルター/回転）</b></summary>

二つの方法、どちらでも可：

**① txt を編集（恒久）** —— 文字編集と同じくリフレッシュ後も残ります：
```js
// index.txt の showcase
showcase: {
    img: 'banner.png',
    fx: { brightness: 1.1, saturate: 1.2, rotate: 2 }  // 画像フィルター
}
```
サイト共通の既定フィルターは `global.txt` の `imageFx`、各画像自身の `fx` が優先されます。

**② 実行時 API（即時プレビュー）** —— ブラウザ コンソールで呼出し、リフレッシュで消えます：
```js
UZ.image.set('#showcaseImg', 'https://example.com/new.png');  // 差し替え
UZ.image.filter('#showcaseImg', { grayscale: 1, blur: 2 });    // フィルター
UZ.image.reset('#showcaseImg');                                // 復元
```
対応フィルター：`brightness / contrast / saturate / grayscale / blur / sepia / invert / hueRotate / opacity`、変形 `rotate / scale / flipX / flipY`。既定 `'#'` または既定値＝無効（無影響）。完全なフィールド表は [AIagent/API.md](./AIagent/API.md#图片修改)。
</details>

<details>
<summary><b>AI Agent に本プロジェクトを操作させる</b></summary>

`AIagent/` 接続キットを内蔵：`README.md`（入口）→ `AGENTS.md`（操作ルール）→ `API.md`（API リファレンス）→ `manifest.json`（機械可読メタデータ）＋ `examples/`（サンプル）。

エンジンは安定した `window.UZ.ai` API を公開——自己記述・状態読取・一括編集が可能：
```js
UZ.ai.describe();   // 能力と引数
UZ.ai.getConfig();  // 現在の全設定を読取
UZ.ai.apply([
  { op:'setLang',  args:['en'] },
  { op:'setPageName', args:['Home','en'] },
  { op:'setText',  args:['section_title','All-in-one','en'] },
  { op:'setImageFilter', args:['#showcaseImg',{ grayscale:1 }] }
]);                 // 一括変更、即時反映
```
> ⚠️ 実行時 API はメモリのみを変更しリフレッシュで消えます。恒久変更は `content/*.txt` へ書き戻す必要があります。詳細は [AIagent/README.md](./AIagent/README.md)。
</details>

## 技術スタック

素の HTML + CSS + JavaScript（ES5 構文、互換性良好）、フレームワーク・依存・ビルド不要。使用するブラウザ API：`querySelector`、`localStorage`、`IntersectionObserver`、`URLSearchParams`、CSS カスタムプロパティ。

## ライセンス

[AGPL-3.0](./LICENSE) —— 自由に使用・変更・配布可能。ネットワーク経由で提供する場合は対応するソースを公開する必要があります。全文は LICENSE をご覧ください。

---

<p align="center">UZENS CCWST · 「設定駆動の静的サイト」の理解に役立ったら Star ⭐ をお願いします</p>
