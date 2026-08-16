// 「対応科目・学年」セクション用データ。
export interface SubjectCard {
  name: string;
  description: string;
  isMain: boolean;
}

export const subjects: SubjectCard[] = [
  {
    name: "数学",
    description: "計算の基礎から、図形・関数・文章題まで。つまずきの根本から一緒に整理します。",
    isMain: true,
  },
  {
    name: "英語",
    description: "単語・文法の基礎から、長文読解・定期テスト対策まで対応します。",
    isMain: true,
  },
  {
    name: "その他の教科",
    description: "国語・理科・社会なども対応可能な範囲でご相談ください。まずはお気軽にどうぞ。",
    isMain: false,
  },
];

export interface GradeCard {
  name: string;
  description: string;
  isMain: boolean;
}

export const grades: GradeCard[] = [
  {
    name: "小学生",
    description: "算数・英語の基礎固めや、中学進学に向けた準備に対応します。",
    isMain: false,
  },
  {
    name: "中学生",
    description: "定期テスト対策から高校受験まで、メインの指導対象学年です。",
    isMain: true,
  },
  {
    name: "高校生",
    description: "数学・英語を中心に、学校の授業のフォローや定期テスト対策に対応します。",
    isMain: false,
  },
];
