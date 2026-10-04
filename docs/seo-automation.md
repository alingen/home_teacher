# SEO記事実装の自動化 運用手順

承認済みの記事・リライト原稿を、GitHub Issue → Claude Code → PR → CI → 自動 merge で公開する仕組みの運用メモです。
**人間の承認ポイントは「Dots が作成した完成原稿の承認」だけ** です。main への merge がそのまま公開になります。

## 全体の流れ

1. Dots が SEO テーマを決める
2. Dots が人間にインタビューする
3. Dots が完成原稿（新規記事またはリライト）を作る
4. 人間が原稿を承認する
5. Dots が GitHub Issue を作成する（タイトル `[SEO記事実装] ...`、本文は下記テンプレート）
6. `seo-approved` ラベルを付与する（Issue 作成時に付けてよい）
7. Claude Code が自動実装する（`seo-in-progress` が付く）
8. Claude Code が `seo/issue-<番号>-...` ブランチから main 向け PR を作成する
9. CI（`ci-build`: npm ci → npm run build → npm run check:links）が走る
10. CI が成功すると自動で squash merge される（GitHub 標準の auto-merge）
11. 元 Issue が自動で close され、結果が1件コメントされる

## 仕組み

| ファイル | 役割 |
|---|---|
| `.github/workflows/seo-implement.yml` | `seo-approved` 付与で起動。権限確認 → Claude Code が実装・PR 作成。PR が作られなければ `seo-blocked` |
| `.github/workflows/seo-automerge.yml` | SEO 自動実装 PR だけを検証して auto-merge（squash）を有効化。merge 後に Issue へ結果をコメント |
| `.github/workflows/seo-ci-fix.yml` | SEO 自動実装 PR の CI が失敗したら Claude が修正を試みる（最大2回）。直らなければ `seo-blocked` |
| `.github/workflows/ci.yml` | main 向け PR の必須チェック `ci-build`。`seo-blocked` ラベル付きの PR は失敗させる |
| `CLAUDE.md` | Claude Code が従う実装ルール |

### 起動条件（すべて必須）

- Issue タイトルが `[SEO記事実装]` で始まる
- `seo-approved` ラベルが付与された
- ラベルを付与したのが、このリポジトリに admin / maintain / write 権限を持つ **ユーザーアカウント**（bot・GitHub App は不可）

### 自動 merge の条件（すべて必須）

- main 向け・このリポジトリ内のブランチで、ブランチ名が `seo/issue-<番号>-` で始まる
- PR の作成者が `claude[bot]`（Claude GitHub App）
- PR 本文に `Closes #<番号>` があり、その Issue が `[SEO記事実装]`＋`seo-approved` で open、`seo-blocked` なし
- PR に `seo-blocked` がない
- 変更ファイルが `src/pages/articles/*.astro` と `src/data/articles.ts` だけ
- required check `ci-build` が成功し、conflict がない（GitHub が判定）

## ラベル

| ラベル | 意味 |
|---|---|
| `seo-approved` | 承認済み。付与すると実装が始まる |
| `seo-in-progress` | 実装中〜merge 待ち（merge 後に自動で外れる） |
| `seo-blocked` | 人間の確認が必要で停止中。PR に付いている間は CI が失敗し、merge されない |
| `seo-automation` | SEO 自動実装 PR の目印（自動で付く） |
| `seo-needs-review` | 任意。人が内容を見たいときに手動で付ける（自動処理では使わない） |

## 通常時に人間がやること

- Dots の完成原稿を確認・承認する。**それ以外は何もしなくてよい**
- たまに Issue 一覧で `seo-blocked` が付いたものがないか確認する

## seo-blocked になった場合

1. Issue（または PR）のコメントで、停止した理由と実行ログを確認する
2. 原稿や Issue の問題なら、Issue 本文を直す（必要なら Dots に作り直してもらう）
3. 再実行：Issue の `seo-blocked` を外し、`seo-approved` を **外してから付け直す**（新しいブランチと PR で実装し直す）
   - PR だけ止まっている場合は、内容を確認して PR の `seo-blocked` を外せば CI が再実行され、成功すれば merge される（auto-merge が外れていたら PR 画面で有効にするか、手動で squash merge する）
4. 不要になった PR は close する（ブランチは merge 時のみ自動削除。close した場合は PR 画面から削除する）

## 自動化を止めたい場合

- **新しい実装を止める**：Actions → 「SEO記事実装」→ ⋯ → Disable workflow（`gh workflow disable seo-implement.yml`）
- **自動 merge を止める**：Actions → 「SEO自動merge」を Disable。進行中の PR は PR 画面で「Disable auto-merge」
- **特定の PR だけ止める**：PR に `seo-blocked` を付ける
- **完全に止める**：上記に加え、Settings → Secrets から `CLAUDE_CODE_OAUTH_TOKEN` を削除する

## Dots が作成する Issue

- タイトル：`[SEO記事実装] <記事タイトル>`（リライトは `[SEO記事実装] <既存記事タイトル>をリライト`）
- ラベル：`seo-approved`（原稿承認済みの場合のみ。Issue 作成時に付けてよい）
- 作成・ラベル付与に使う GitHub アカウント：このリポジトリに write 以上の権限を持つユーザーアカウント
- 本文：下記テンプレート。欄の見出し（`### 種別` など）は変えないこと。完成原稿は ```` ```markdown ```` のコードブロックに入れる（原稿中の `##`/`###` と欄見出しを区別するため）
- 不要な欄は削除せず `_No response_` または「なし」と書く。リライトで変えない項目は「変更なし」

````markdown
### 種別

新規記事

### 対象URL・slug

/articles/example-slug

### title

（SEOタイトル）

### meta description

（meta description）

### H1

（ページ上部の見出し）

### 公開日

2026-10-11

### 記事一覧の紹介文

（トップの記事カードに表示する50〜60字程度の紹介文）

### この記事を作る理由

（任意）

### 検索意図

（任意）

### H2 / H3構成

- H2 ...
  - H3 ...

### 完成原稿

```markdown
（導入文）

## 見出し2

本文……

### 見出し3

本文……
```

### 内部リンク

記事末尾：福岡の家庭教師の料金について読む → /articles/home-teacher-fees-fukuoka

### CTA

現在の募集状況・指導内容を確認する → /

### 実装上の注意

なし
````

GitHub の Issue フォーム（New issue → 「SEO記事実装」）から作っても同じ形式になります。
