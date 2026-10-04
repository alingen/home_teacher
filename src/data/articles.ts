// トップページ「お役立ち記事」セクション、および各記事ページの一覧に使う記事メタ情報。
// 記事本文は src/pages/articles/*.astro に直接記述しています。
// 新しい記事を追加したら、ここにも1件追加してください。
export interface ArticleMeta {
  slug: string;
  title: string;
  excerpt: string;
  publishDate: string;
}

export const articles: ArticleMeta[] = [
  {
    slug: "how-to-choose-home-teacher-fukuoka",
    title: "福岡市で中学生の家庭教師を選ぶ5つのポイント",
    excerpt: "個人契約と家庭教師センターの違いや、体験授業で確認したいポイントを解説します。",
    publishDate: "2026-08-27",
  },
  {
    slug: "home-teacher-fees-fukuoka",
    title: "福岡市の家庭教師料金を比較｜中学生はいくらかかる？",
    excerpt: "授業料以外にかかる費用や、塾・家庭教師センター・個人契約の料金構造を比較して解説します。",
    publishDate: "2026-08-28",
  },
  {
    slug: "junior-high-math-start-over",
    title: "中学生が数学を苦手になったら、どこまで戻って勉強する？",
    excerpt: "つまずきの本当の原因を見つけ、どの単元まで戻って復習すればよいかを解説します。",
    publishDate: "2026-08-28",
  },
  {
    slug: "junior-high-english-reading-word-order",
    title: "中学英語の英文が読めないときは語順から見直そう",
    excerpt: "学校のテキストで読み方を確かめ、スラッシュリーディングで意味のまとまりを前から捉える練習を紹介します。",
    publishDate: "2026-10-04",
  },
  {
    slug: "automation-test",
    title: "自動公開の動作確認ページ",
    excerpt: "記事の自動公開の動作確認用ページです。確認後に削除します。",
    publishDate: "2026-10-04",
  },
];
