// =============================================================
// 料金
// -------------------------------------------------------------
// ▼▼▼ 重要 ▼▼▼
// 以下の金額はすべて「仮の料金」です。正式な料金が決まったら、
// このファイルの数値だけを書き換えれば、PricingSection.astro の
// 料金表に自動的に反映されます。他のファイルの修正は不要です。
// （LP上には「仮料金」であることは表示していません。公開前に必ず確定額へ更新してください）
//
// 設計方針：時間が長くなるほど1時間あたりの単価が下がる（後ろにいくほどお得な）
// 料金体系にしており、キリのいい数字（100円単位）で刻んでいます。
// =============================================================

/** 表の列として表示する授業時間 */
export const durations = ["60分", "90分", "120分"] as const;
export type Duration = (typeof durations)[number];

export interface DurationPrice {
  /** 1回あたりの合計金額 */
  total: string;
  /** 時間換算（時間が伸びるほど下がっていく） */
  hourlyRate: string;
}

export interface PricingRow {
  grade: string;
  prices: Record<Duration, DurationPrice>;
}

/** 体験授業の案内 */
export const trialOffer = {
  label: "初回体験授業",
  price: "無料",
  duration: "60分",
  description:
    "お子さまの現在の状況や目標をヒアリングしながら、実際の授業を体験していただけます。",
};

/** 学年別・授業時間別の料金（1回あたり） */
export const pricingRows: PricingRow[] = [
  {
    grade: "小学生",
    prices: {
      "60分": { total: "3,000円", hourlyRate: "時間換算 3,000円" },
      "90分": { total: "4,200円", hourlyRate: "時間換算 2,800円" },
      "120分": { total: "5,200円", hourlyRate: "時間換算 2,600円" },
    },
  },
  {
    grade: "中学生",
    prices: {
      "60分": { total: "3,500円", hourlyRate: "時間換算 3,500円" },
      "90分": { total: "4,800円", hourlyRate: "時間換算 3,200円" },
      "120分": { total: "5,800円", hourlyRate: "時間換算 2,900円" },
    },
  },
  {
    grade: "高校生",
    prices: {
      "60分": { total: "4,000円", hourlyRate: "時間換算 4,000円" },
      "90分": { total: "5,400円", hourlyRate: "時間換算 3,600円" },
      "120分": { total: "6,400円", hourlyRate: "時間換算 3,200円" },
    },
  },
];

/**
 * 兄弟・姉妹割引
 * 割引率（90%）は仮の値です。正式に決まったら percent と description のみ更新してください。
 */
export const siblingDiscount = {
  label: "兄弟・姉妹割",
  percent: 90,
  description: "ご兄弟・ご姉妹で同時指導の場合、2人目以降の授業料が90%OFFになります。",
};

/** 料金に関する補足事項 */
export const pricingNotes: string[] = [
  "入会金はいただいておりません。",
  "お渡しする教材は無料です。",
  "交通費は実費でご請求いたします。",
  "回数・曜日・時間帯はご都合に合わせてご相談可能です。",
  "テスト前だけ回数を増やすなど、一時的な変更にも対応します。",
];
