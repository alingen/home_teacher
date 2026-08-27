# 福岡市の個人家庭教師 LP

福岡市・地下鉄空港線沿線（姪浜〜福岡空港）を中心に活動する個人家庭教師の集客用LPです。
Astro + TypeScriptで構築した、広告費をかけずにGoogle検索・SNS・口コミからの問い合わせ獲得を狙う静的サイトです。

最終CVは「LINEで家庭教師について相談する」への到達です。

---

## 1. 作成したページ構成

`src/pages/index.astro` の1ページ構成（1LP）で、以下の順にセクションを並べています。

| # | セクション | ねらい |
|---|---|---|
| 1 | ファーストビュー（Hero） | サービス内容・対象学年・科目・エリアを一瞬で伝え、LINE相談へ誘導 |
| 2 | こんなお悩みありませんか？ | 保護者の悩みへの共感で「自分ごと化」してもらう |
| 3 | 指導方針 | 「自分で勉強できる状態を目指す」姿勢を伝え、誠実さを示す |
| 4 | こんな生徒におすすめ | 苦手な子専用に見えないよう3タイプで訴求 |
| 5 | 対応科目・学年 | 数学・英語がメイン、中学生がメイン対象と分かるカードUI |
| 6 | 家庭教師を選ぶメリット | 塾を否定せず、1対1指導の良さを説明 |
| 7 | 講師プロフィール | 差し替え前提の構造。現状はダミー/TODO表示 |
| 8 | 対応エリア | 地下鉄空港線を模した路線図UI（姪浜〜福岡空港） |
| 9 | 料金 | 体験授業案内＋学年別料金カード（仮料金） |
| 10 | 利用開始までの流れ | 5ステップ。契約必須ではないことを明記 |
| 11 | FAQ | `<details>`によるアコーディオン（JS不使用）＋FAQPage構造化データ |
| 12 | 最終CTA | 大きなLINEボタンで締める |

このほか、常時表示される要素として

- `Header`（PC/タブレットで見えるヘッダー内CTA）
- `StickyCta`（スマホ幅のみ表示される下部固定LINEボタン）
- `Footer`（ページ内リンク・コピーライト）

があります。

---

## 2. 主なコンポーネント／ファイル構成

```
site.config.mjs          ← ★最重要。LINEのURLと公開ドメインをここで一元管理
src/
  config/
    site.ts              ← サイト名・タイトル・description・GA IDなどのメタ情報
  data/                  ← 表示コンテンツのデータ（文言・数値はここを編集すればOK）
    worries.ts           ← 「お悩み」一覧
    policy.ts            ← 「指導方針」一覧
    studentTypes.ts       ← 「こんな生徒に」3タイプ
    subjects.ts           ← 対応科目・対応学年カード
    benefits.ts           ← 家庭教師を選ぶメリット
    profile.ts             ← ★講師プロフィール（要編集。詳細は3章）
    areas.ts               ← 対応エリア（駅名リスト）
    pricing.ts              ← ★料金（要編集。詳細は3章）
    flow.ts                  ← 利用開始までの流れ
    faq.ts                    ← FAQ
  components/              ← 見た目（UI）を担当。基本的にdataファイルを読むだけ
    Header.astro / Footer.astro / StickyCta.astro
    Hero.astro / WorriesSection.astro / PolicySection.astro
    StudentTypesSection.astro / SubjectsGradesSection.astro
    BenefitsSection.astro / ProfileSection.astro / AreaSection.astro
    PricingSection.astro / FlowSection.astro / FaqSection.astro
    FinalCtaSection.astro
    CtaButton.astro         ← ★LINE CTAボタン本体（全CTAがこれを使用）
    SectionHeading.astro    ← セクション共通見出し
    Analytics.astro         ← GA4タグ（IDが空の間は何も出力しない）
  layouts/
    BaseLayout.astro        ← <head>、OGP、構造化データ、canonical等
  pages/
    index.astro             ← 上記コンポーネントを並べるだけの1枚
    robots.txt.ts           ← site.tsのURLと同期したrobots.txtを動的生成
  styles/
    global.css              ← 配色・余白・ボタン・カードなどの共通スタイル
public/
  favicon.svg                ← 差し替え可能なプレースホルダーfavicon
  og-image.png                ← 差し替え前提のプレースホルダーOGP画像（単色）
```

**設計上のポイント**

- **LINE URLは1箇所** … `site.config.mjs` の `LINE_URL` を書き換えるだけで、`CtaButton.astro` を使っている全ボタン（ヘッダー・ファーストビュー・料金・最終CTA・下部固定バー）に反映されます。
- **料金・文言はコンポーネントを触らず`data/`だけ編集すればOK** … デザインを崩さずに文言調整できます。
- **JSはほぼゼロ** … FAQのアコーディオンはネイティブ`<details>`要素、下部固定CTAもCSSのみで実装。ビルド後の`dist/_astro/`にJSファイルは生成されません（GA4を設定した場合のみ、そのタグが出力されます）。

---

## 3. 私があとから入力する必要がある情報（TODO一覧）

コード内に `TODO` コメントとして残しています。`grep -rn "TODO" src site.config.mjs` で一覧できます。

### 必須（公開前に必ず対応）

| ファイル | 内容 |
|---|---|
| `site.config.mjs` | `LINE_URL`：実際のLINE公式アカウント／オープンチャットの友だち追加URL |
| `site.config.mjs` | `SITE_URL`：独自ドメインが決まったら更新（OGP・sitemap・canonicalに影響） |
| `src/data/profile.ts` | `name`：先生のお名前・呼び名（本名でなくても可） |
| `src/data/profile.ts` | `bioParagraphs`：経歴（**出身大学名・指導年数など未確定の事実は書かないこと**） |
| `src/data/profile.ts` | `personality`：趣味・人柄が伝わる文章 |
| `src/data/profile.ts` | `photoSrc`：顔写真（`public/`に画像を置いてパスを設定。未設定の間は「写真準備中」のプレースホルダーが表示されます） |

### 公開前に確認・調整（未入力でも一応表示は成立するもの）

| ファイル | 内容 |
|---|---|
| `src/config/site.ts` | `name` / `title` / `description`：屋号・サービス名が決まったら調整 |
| `src/data/pricing.ts` | **料金はすべて仮です。**（体験授業の価格、学年別料金）正式な料金体系が決まり次第、このファイルのみ更新してください。ページ上には「仮料金」といった表示はしていないので、そのまま公開すると仮の金額が実額として表示されます |

### 任意（あれば有効化される項目）

| ファイル | 内容 |
|---|---|
| `src/config/site.ts` | `gaMeasurementId`：Google Analytics 4の測定ID（`G-XXXXXXXXXX`）を入れると自動的に計測タグが有効化されます |
| `src/config/site.ts` | `googleSiteVerificationCode`：Search Console のHTMLタグ確認用コード |
| `public/favicon.svg` | 現状は簡易的な「本」アイコンのプレースホルダーです。ロゴが決まったら差し替えてください |
| `public/og-image.png` | 現状はブランドカラー1色の単色画像です（1200×630px）。SNSシェア用に、実際のデザイン画像に差し替えることを推奨します |

### 絶対に記載していないもの（架空情報を作っていません）

指示通り、以下は事実が確定するまで一切記載していません。確定次第、該当箇所（主に`profile.ts`、必要であれば新規セクション）に追記してください。

- 指導実績・合格実績
- 生徒数
- 保護者の口コミ・体験談
- 出身大学
- 指導年数
- 保有資格

---

## 4. ローカルで確認する方法

Node.js（v20.3以降 または v22以降を推奨）と npm が必要です。

```bash
npm install
npm run dev
```

`http://localhost:4321` を開くと確認できます。スマホ表示はブラウザのデベロッパーツールでエミュレートしてください。

その他のコマンド：

```bash
npm run check    # astro check（型・テンプレートの静的チェック）
npm run build    # 型チェック→本番ビルド（dist/ に静的ファイルを出力）
npm run preview  # ビルド済みファイルをローカルで確認
```

---

## 5. デプロイ方法

`npm run build` で `dist/` 以下に静的ファイル一式が出力されるため、静的ホスティングであればどこでもデプロイ可能です。Webエンジニアとのことなので詳細は割愛しますが、代表的な選択肢は以下の通りです。

- **Cloudflare Pages / Vercel / Netlify** … いずれもGitHub連携で `npm run build` → `dist/` 公開の自動デプロイが組める。無料枠あり。
- **Cloudflare Pages推奨ポイント**：日本国内含めCDNが強く、静的サイトとの相性が良い。
- 独自ドメインを設定したら、必ず `site.config.mjs` の `SITE_URL` を実ドメインに更新してから再ビルド・再デプロイしてください（OGPやsitemapのURLがずれてしまいます）。

デプロイ後にやること：

1. Google Search Console にプロパティ登録し、`src/config/site.ts` の `googleSiteVerificationCode` を設定（またはDNS認証でも可）→ サイトマップ（`https://<ドメイン>/sitemap-index.xml`）を送信
2. 必要であれば Google Analytics の測定IDを設定

---

## 6. 今後SEOのために追加した方がいいページ

現状はLP1枚に情報を集約する設計（初期フェーズとしては適切）ですが、検索経由の流入を増やすフェーズに入ったら、以下のようなページ追加を検討すると良さそうです。

- **エリア別ページ**（例：`/areas/nishijin`、`/areas/meinohama` など）
  「西新 家庭教師」「姪浜 家庭教師」のような複合キーワードで、駅ごとに個別ページを作ると検索での取りこぼしが減ります。
- **科目別・学年別ページ**（例：`/subjects/math`、`/grades/junior-high` など）
  「福岡 家庭教師 数学」「家庭教師 中学生 福岡」など、意図別の受け皿ページ。
- **ブログ／コラム**（例：`/blog/`）
  「定期テストの勉強法」「高校受験の勉強計画の立て方」など、保護者・生徒の検索意図に応える記事コンテンツ。指名検索以外の新規流入や、E-E-A-T（専門性・信頼性）の強化にも有効です。
- **よくある質問の単独ページ化**（`/faq`）
  トップページのFAQに加えて独立ページを作ると、個別の質問がより上位表示されやすくなります。
- **講師プロフィールの単独ページ化**（`/profile`）
  実績・経歴が固まってきたら、トップページ内セクションだけでなく専用ページに拡張すると、指名検索や信頼性訴求に強くなります。

いずれもコンテンツが増えるフェーズでの拡張を想定した設計（コンポーネント分割・データ分離）にしているため、着手時の実装コストは比較的小さいはずです。
