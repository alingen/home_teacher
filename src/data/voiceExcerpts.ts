// トップページに掲載する「ご利用者の声」の抜粋。
// 全文は src/data/testimonials.ts（/voices ページ）に掲載しています。
export interface VoiceExcerpt {
  quote: string;
  attribution: string;
}

export const voiceExcerpts: VoiceExcerpt[] = [
  {
    quote: "「分からないところは何回聞いても大丈夫」と言ってもらい、以前より質問できるようになりました。",
    attribution: "中学生・数学",
  },
  {
    quote: "部活動の予定も考慮しながら、無理のない学習計画を立てていただきました。",
    attribution: "中学生の保護者",
  },
];
