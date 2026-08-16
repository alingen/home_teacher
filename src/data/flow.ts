// 「利用開始までの流れ」セクション。
export interface FlowStep {
  step: number;
  title: string;
  description: string;
}

export const flowSteps: FlowStep[] = [
  {
    step: 1,
    title: "LINEから相談",
    description: "まずは気軽にLINEでメッセージを送ってください。この時点では料金は一切かかりません。",
  },
  {
    step: 2,
    title: "学年・科目・お悩みをヒアリング",
    description: "現在の学年や科目、お子さまの状況・お悩みについて、トークのやり取りや簡単な面談でお伺いします。",
  },
  {
    step: 3,
    title: "体験授業・面談",
    description: "実際の授業を体験していただきながら、目標や進め方についてすり合わせます。",
  },
  {
    step: 4,
    title: "相性を確認",
    description: "体験を受けたからといって、必ず契約する必要はありません。お子さまとの相性をゆっくりご検討ください。",
  },
  {
    step: 5,
    title: "問題なければ指導開始",
    description: "ご納得いただけましたら、曜日・時間・頻度を決めて指導をスタートします。",
  },
];
