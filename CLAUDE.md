# CLAUDE.md

福岡市の個人家庭教師サイト（Astro 5 の静的サイト）。main への merge で自動公開される。
このファイルのルールは、GitHub Actions 上の Claude にも、ローカルの Claude Code セッションにも常に適用される。

## サイト構成

- LP: `src/pages/index.astro`（セクションは `src/components/`、表示内容は `src/data/*.ts`）
- 記事: `src/pages/articles/<slug>.astro`。`src/layouts/ArticleLayout.astro` に `seoTitle`・`description`・`h1`・`publishDate`（・`eyebrow`）を渡し、本文はスロットに直接書く
- 記事一覧: `src/data/articles.ts`（slug・title・excerpt・publishDate）。トップの「お役立ち記事」が公開日の新しい順に表示する
- canonical・OGP・構造化データは Layout が、sitemap は `@astrojs/sitemap` が自動生成する
- 共通 CTA: 記事下の LINE ボタンは ArticleLayout 内。LINE の URL は `site.config.mjs` で一元管理
- 内部リンクの書き方: 記事は `/articles/<slug>`（末尾スラッシュなし）、トップは `/`、LP の節は `/#<id>-heading`

## Claude Code の役割

SEO 戦略・記事企画・記事本文の作成・掲載内容の承認は、別担当（Dots と人間）が行う。
`[SEO記事実装]` で始まる承認済み Issue が来たら、Claude Code はその Issue を **承認済みの実装仕様書** として扱い、既存サイトに実装する。
SEO 戦略やテーマの再検討、本文の書き直しは Claude Code の担当ではない。

## 記事実装ルール

- Issue の完成原稿の意味を変えない。言い換え・加筆・削除・要約・表記の統一もしない。誤字らしきものも直さず PR で指摘する
- SEO 戦略・記事テーマ・title・description・slug・見出し構成を独自に変えない
- 実績・経験・料金・サービス内容を追加しない。事実関係を推測で補わない。存在しない指導実績や生徒事例を作らない
- 既存記事の構造・デザイン・コンポーネントを優先して再利用する。装飾が必要なら既存記事の部分スタイル（`worked-example`、`reading-example`）にならい、そのページの `<style>` 内で完結させる
- PC・スマホ双方で崩れないようにする。375px 幅で長い英文・表・固定幅の要素がはみ出さないか、意味のまとまりの途中で改行されないかを確認する。表は `<div class="table-scroll"><table>` で組む
- 指定された内部リンク・CTA を、指定の位置に実装する。記事下の共通 LINE ボタンは変えない
- slug の重複を確認する。title・description などの metadata を ArticleLayout に渡す
- 記事一覧（`src/data/articles.ts`）に正しく載せる。sitemap などの自動生成の仕組みは変えない
- 変更してよいのは原則 `src/pages/articles/**` と `src/data/articles.ts` だけ。関係のない既存ページ・LP・料金・レイアウト・設定は変えない

### 実装を停止すべきケース

次の場合は仕様を変えずに停止し、理由を Issue（または PR）に書いて人間の確認を求める。GitHub Actions 上では PR を作らずに終了すれば、ワークフローが `seo-blocked` を付ける。

- 新規記事なのに指定 slug が既に存在する、またはリライト対象が存在しないなど、意図が不明
- 指定された内部リンク先が存在しない
- 新規記事かリライトか判断できない
- Issue 内容と既存サイト構造が明らかに矛盾する
- 本文を大幅に変えないと実装できない
- 本文中の料金・サービス内容・受付状況が `src/data/*.ts` と矛盾する
- build を通すために記事仕様そのものを変える必要がある
- 記事ファイル以外の変更が必要になる

## 実装手順（SEO 記事 Issue）

1. Issue の必須項目を確認する（形式は `docs/seo-automation.md`）。新規は 種別・slug・title・meta description・H1・公開日・記事一覧の紹介文・完成原稿、リライトは 種別・slug・完成原稿 が必須
2. 新規なら `src/pages/articles/<slug>.astro` と `src/data/articles.ts` に同じ slug がないこと、リライトなら対象が存在することを確認する
3. 記事ページを作成（リライトは本文を差し替え）し、`src/data/articles.ts` を更新する
4. 検証する（下記）。`npm run check:article` で不一致が出たら原稿どおりに実装を直す。表など組み方の都合で残る差分は、内容が同じことを確かめて PR に書く
5. コミットして push し、main 向けの PR を作る（下記の形式）

## 検証

- `npm ci`
- `npm run build` … `astro check`（型チェック）＋ `astro build`
- `npm run check:links` … ビルド結果の内部リンク切れ（ページ・`#id`）を検出
- `npm run check:article -- <slug> --body-file <Issue本文を保存したファイル>`（または `--issue <番号>`）… ビルドした記事本文が完成原稿と一致するか照合
- lint・テストは未導入

## Git 運用

- main へ直接 push しない。必ず作業ブランチを作り、Pull Request を経由する
- SEO 記事のブランチは `seo/issue-<番号>-...`（GitHub Actions ではワークフローが作成する）
- required CI（`ci-build`）が成功した PR だけを merge する。CI 失敗中・conflict がある PR は merge しない
- 条件を満たした SEO 自動実装 PR は自動で squash merge される（仕組みは `docs/seo-automation.md`）

## PR

- タイトル: 新規は `[SEO] <記事タイトル>`、リライトは `[SEO] <既存記事タイトル>をリライト`
- 本文:

```
Closes #<Issue番号>

## 実装した記事
種別（新規／リライト）・タイトル・URL（/articles/<slug>）・公開日

## 変更したファイル

## 実施した検証
npm ci / npm run build / npm run check:links / npm run check:article の結果

## 仕様上の注意点
原稿とサイト情報の食い違い、組み方で判断した箇所など。なければ「なし」
```
