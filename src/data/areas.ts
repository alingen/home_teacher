// 「対応エリア」セクション。福岡市地下鉄空港線の駅を、姪浜〜東比恵の順に並べる。
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
];
