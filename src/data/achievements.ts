// 「合格実績」ページ・LPの表示内容。
// 塾ではなく、家庭教師として個人で指導した生徒の合格実績のみを掲載しています。
// カテゴリ（中学・高校・大学）ごとにグルーピングして一覧表示します。
export type AchievementCategory = "中学" | "高校" | "大学";

export interface Achievement {
  school: string;
  category: AchievementCategory;
  /** レイアウト確認用のダミーデータには true を設定（LPの抜粋には出さない） */
  sample?: boolean;
}

// 表示順（グルーピングの並び順）
export const achievementCategoryOrder: AchievementCategory[] = ["中学", "高校", "大学"];

export const achievements: Achievement[] = [
  { school: "慶應義塾大学 薬学部", category: "大学" },
  { school: "神奈川県立鎌倉高校", category: "高校" },
  { school: "神奈川県立深沢高校", category: "高校" },
  { school: "神奈川県立藤沢西高校", category: "高校" },

  // ---------------------------------------------------------------
  // ↓ここから下はレイアウト確認用のダミーです。
  // 一覧ページ（/results）を「カード」ではなく「ひたすら列挙するだけ」の
  // シンプルな一覧形式にした際の見え方を確認するために追加しています。
  // 本番公開前に、実際の合格実績に差し替えるか削除してください。
  // ---------------------------------------------------------------
  { school: "○○県立○○中学校", category: "中学", sample: true },
  { school: "○○県立○○中学校", category: "中学", sample: true },
  { school: "○○県立○○高等学校", category: "高校", sample: true },
  { school: "○○県立○○高等学校", category: "高校", sample: true },
  { school: "○○県立○○高等学校", category: "高校", sample: true },
  { school: "○○大学 ○○学部", category: "大学", sample: true },
  { school: "○○大学 ○○学部", category: "大学", sample: true },
];
