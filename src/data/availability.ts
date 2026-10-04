// トップページ上部に表示する「受付状況」のお知らせ。
// ここを書き換えるだけで、ファーストビュー直下の表示が切り替わります。

/** 状態ごとの配色。closed＝控えめな赤、open＝ブランドカラー、info＝通常の文字色 */
export type AvailabilityTone = "closed" | "open" | "info";

export interface AvailabilityStatus {
  label: string;
  value: string;
  tone: AvailabilityTone;
}

export const availability = {
  /** 画面に表示する更新日ラベル（自由記述） */
  updatedOnLabel: "2026年10月5日時点",

  /** 見出し直下に大きく表示する状態（1項目＝1行。「ラベル：値」の形で表示） */
  statuses: [
    { label: "通常募集", value: "停止中", tone: "closed" },
    { label: "個別相談", value: "受付中", tone: "open" },
    { label: "次回の通常募集", value: "2027年3月予定", tone: "info" },
  ] satisfies AvailabilityStatus[],

  /** 状態の下に表示する説明文（1要素＝1段落） */
  messages: [
    "現在、定期的にご案内できる指導枠が限られているため、新規の通常募集は停止しております。",
    "ただし、曜日・時間帯やご相談内容によっては、個別にお引き受けできる場合があります。ご相談は随時受け付けておりますので、ご希望の方はお問い合わせください。",
  ],

  /** 説明文の下に小さく表示する注記（先頭に「※」が付きます） */
  notes: [
    "少人数で一人ひとりに責任を持って指導するため、お問い合わせ後に学習状況、ご希望の指導内容、スケジュール、指導方針との相性などを確認したうえで、受入可否をご案内しています。お問い合わせいただいた場合でも、必ずしも指導をお引き受けできるとは限りません。",
  ],
};
