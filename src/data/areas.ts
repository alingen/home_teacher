// 「対応エリア」セクションに地域の例として載せる、福岡市地下鉄空港線の駅（姪浜〜福岡空港の順）。
// 対応範囲の全体を示すものではない（記載のない福岡市内の地域からも相談を受け付ける）。
// AreaSection.astro 側でこの順番のまま路線図風に表示する。
export interface Station {
  name: string;
}

export const stations: Station[] = [
  { name: "姪浜" },
  { name: "室見" },
  { name: "藤崎" },
  { name: "西新" },
  { name: "唐人町" },
  { name: "大濠公園" },
  { name: "赤坂" },
  { name: "天神" },
  { name: "中洲川端" },
  { name: "祇園" },
  { name: "博多" },
  { name: "東比恵" },
  { name: "福岡空港"},
];
