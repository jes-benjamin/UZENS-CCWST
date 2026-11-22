# engine/ — エンジンソースを中心にウェブページを作る

[中文](./README.md) · [English](./README.en.md) · [日本語](./README.ja.md)

> このフォルダは**すぐ動くエンジン開発キット**です。ある質問に答えます：**`engine.js` をダウンロードするだけで使えるか？— いいえ、でもこのスターターを使えば 5 分で自分のページが作れます。**

## 1. まず明確に：エンジン単体では使えません

`engine.js` は**レンダリング エンジン（接着層）**です。「設定データをページの骨格に流し込む」だけを行い、文字・画像・スタイルは一切含まれません。なので**このファイル1つだけではページは開きません**。他の3つと組み合わせて初めて動きます：

| 構成 | 役割 | キット内の場所 |
|---|---|---|
| `engine.js` | レンダリング エンジン：設定を読み、ページを埋め、操作をバインド | `./engine.js` |
| HTML 骨格 | 構造マーカーのみ、内容は書き込まない | `./starter/index.html` |
| `content/*.txt` | 実際のサイト内容（実は JS） | `./starter/content/` |
| `style.css` | レイアウトと CSS 変数の設定層 | `./starter/style.css` |

**良い知らせ**：このフォルダには4つすべて揃っています。`starter/` は最小の実行可能サンプルです——**`starter/index.html` をダブルクリックするだけで完全なページが見られます**、Node もサーバーもビルドも不要です。

## 2. 3 ステップで始める（最短ルート）

```bash
# ステップ 1：スターター骨格をプロジェクトへコピー
cp -r engine/starter my-site/

# ステップ 2：エンジンを starter から見える場所へ置く
#   starter/index.html の末尾は <script src="../engine.js"></script>
#   なので engine/engine.js を一段上へコピー、またはパスを書き換える
cp engine/engine.js my-site-engine.js   # HTML のパスを ./my-site-engine.js に変更

# ステップ 3：my-site/index.html をダブルクリック — 完了、ビルド不要
```

> 重要：**エンジンはどこに置いても構いません、HTML 末尾の `<script src="...">` がそれを指していれば OK**。設定 txt も同様で、パスは `<head>` の `<script src>` に書きます。

## 3. エンジンとページの「契約」

エンジンはあなたのデザインを知りませんが、**固定のマーカー規約**は知っています。HTML がそれに従えばエンジンは動きます。これがエンジン中心開発の核心です。

### 3.1 `<body>` の `data-page`

```html
<body data-page="index">
```

エンジンはこれを読み、`window.SITE_PAGES.index` から本ページの設定を取得します。2 ページ目は `data-page="about"` と書き、エンジンは `window.SITE_PAGES.about` を探します。

### 3.2 `<head>` の読み込み順（**順番厳守**）

```html
<script src="content/global.txt"></script>  <!-- ① 全体設定、最初必須 -->
<script src="content/index.txt"></script>   <!-- ② 本ページ設定 -->
<!-- ...エンジンは </body> 直前、最後に読み込む -->
<script src="../engine.js"></script>
```

`fetch()` ではなく `<script src>` を使うのは、**ダブルクリック `file://` でも動く**ためです（ローカルファイルの fetch は CORS でブロックされます）。これが全体アーキテクチャが「サーバーゼロ」でいられる根本原因です。

### 3.3 内容マーカー：エンジンがどこに文字を流し込むか

| マーカー | 役割 | 例 |
|---|---|---|
| `data-i18n="字段名"` | 辞書から現在の言語の文字を要素へ | `<p data-i18n="hero_sub">副标题</p>` |
| `data-i18n-aria="字段名"` | `aria-label` アクセシビリティ文案へ | テーマボタン |
| `data-i18n-title="字段名"` | `title` 属性へ | 任意 |
| `data-list="配列名"` | 空コンテナ、エンジンが配列からカード群を生成 | `<div data-list="features"></div>` |

辞書は各 txt の `i18n` オブジェクト（4 言語：zh/en/tw/ja）から来ます。文字を言語切替可能にするには、txt の `i18n` にフィールドを追加し、HTML 要素に `data-i18n="字段名"` を書きます。

### 3.4 固定 ID：エンジンが認識する「スロット」

これらの ID はエンジンのインターフェースです。改名すると該当機能は無効になります（ページはクラッシュしません）：

| ID | 機能 | 必要な場合 |
|---|---|---|
| `#navLinks` | ナビリンク コンテナ、`global.nav` から生成 | ナビがある |
| `#pageName` | ナビの表示ページ名（`pageName` が書き込む） | 任意 |
| `#brandText` | サイト名の文字 | 任意 |
| `#langSeg` | 言語切替ボタン群 | 言語切替が欲しい |
| `#themeToggle` | テーマ切替ボタン | テーマ切替が欲しい |
| `#typed` | タイプライター文字コンテナ | ホームのタイプライター |
| `#infoModal` / `#infoModalClose` / `#infoModalTitle` / `#infoModalHint` | 汎用情報モーダル | モーダルが欲しい |
| `#toast` | 軽いトースト通知 | 通知が欲しい |
| `#showcase` 系 | 画像ショーケース（任意パーツ、丸ごと削除可） | 任意 |

> 補足：すべての ID は**任意**です——エンジンは各スロットを `if (!el) return` でガードしています。一部だけ使って最小ページを作れます。

### 3.5 設定ファイル = 正しい JS

`content/*.txt` は txt という名前ですが、中身は JS の代入文です：

```js
window.SITE_PAGES = window.SITE_PAGES || {};
window.SITE_PAGES.index = {
    pageName: { zh: '首页', en: 'Home', tw: '首頁', ja: 'ホーム' },
    i18n: { zh: { hero_sub: '副标题' }, en: { hero_sub: 'Sub title' }, ... }
};
```

各 txt は同じ `window.SITE_PAGES` ストアに自分の設定を流し込み、互いに上書きしません。内容変更は単一引用符内の文字を書き換えるだけです。

## 4. ゼロから自作ページへ（完全フロー）

1. **骨格をコピー**：`cp -r engine/starter my-site/`、不要なパーツを削除。
2. **全体設定を編集** `content/global.txt`：サイト名、ナビ、全体文案辞書。
3. **本ページ設定を編集** `content/index.txt`：`pageName`、タイプライター文字、`features` 配列、本ページ文案。
4. **HTML 骨格を編集** `index.html`：必要なスロット ID と `data-i18n`/`data-list` マーカーを残し、未使用セクションを削除。
5. **エンジンを指定**：末尾の `<script src="...">` が `engine.js` の実際の場所を指すことを確認。
6. **ダブルクリックで開く**：`file://` で直接動作、txt を編集してリフレッシュ。

**ページ追加**：`index.html` をコピー → `<body data-page="about">` に変更 → `content/about.txt` を作成 → `<head>` に `<script src="content/about.txt"></script>` を追加 → `global.txt` の `nav` 配列に項目を追加。詳細は本家ドキュメント `DOCS.md` 第 13 節。

## 5. エンジンの拡張（上級）

2 つの拡張ポイントとランタイム API：

- **新しいリスト種別**：`engine.js` の `RENDERERS` に同名関数（例 `newsList`）を追加し、HTML に `<div data-list="newsList">`。`DOCS.md` 第 14 節参照。
- **言語追加**：各 txt の `i18n` に言語ブロックを追加し、`engine.js` の `LANG_NAME` に名前を追加。
- **画像変更**：設定入口 `global.imageFx` / ページ `showcase.fx`、ランタイム `window.UZ.image.set/filter/reset`。`DOCS.md` 第 16 節参照。
- **AI Agent 接続**：`window.UZ.ai` が自己記述型 API を公開し、内容と外観を読み書き。`DOCS.md` 第 17 節とルートの `AIagent/` フォルダ参照。
- **機械翻訳**：`content/i18n.txt` で Google/Bing/有道を設定、既定はオフ。

## 6. よくある落とし穴

| 症状 | 原因 / 対処 |
|---|---|
| 「内容設定が読み込まれていません」と表示 | `global.txt` が見つからない：HTML が `content/` と同階層にあり `<script src>` パスが正しいか確認 |
| 開いても文字が出ない | txt の構文エラー（多くはカンマ/引用符の抜け）。txt を `.js` にコピーし `node --check` で検査 |
| 言語切替が効かない | 要素に `data-i18n` がない、または辞書フィールドが未記述 |
| txt を変更しても変わらない | ブラウザ キャッシュ、ハード リフレッシュ（Ctrl+F5） |
| カードが生成されない | HTML に `data-list="features"` がない、または txt の配列が空 |

## 7. ファイル一覧

```
engine/
├── engine.js          # エンジンソース（そのまま使用/改造可、詳細な注释付き）
├── README.md          # 本チュートリアル（中）
├── README.en.md       # チュートリアル（英）
├── README.ja.md       # チュートリアル（日）
└── starter/           # 最小実行骨格（index.html ダブルクリックで確認可）
    ├── index.html
    ├── style.css
    └── content/
        ├── global.txt
        └── index.txt
```

完全な原理はルートの `DOCS.md`（18 節）を参照してください。
