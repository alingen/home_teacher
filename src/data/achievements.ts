// 「指導実績」セクション。
// 塾ではなく、家庭教師として個人で指導した生徒の合格実績のみを掲載しています。
export interface Achievement {
  school: string;
  category: "大学" | "高校";
}

export const achievements: Achievement[] = [
  { school: "慶應義塾大学 薬学部", category: "大学" },
  { school: "神奈川県立鎌倉高校", category: "高校" },
  { school: "神奈川県立深沢高校", category: "高校" },
  { school: "神奈川県立藤沢西高校", category: "高校" },
];
