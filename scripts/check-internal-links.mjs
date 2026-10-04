// =============================================================
// 内部リンク切れチェック（npm run check:links）
// -------------------------------------------------------------
// npm run build で生成された dist/ 内のHTMLをすべて走査し、
// サイト内へのリンク（/... ・#... ・公開ドメインの絶対URL）について
//   - リンク先のページ／ファイルが dist/ に存在するか
//   - #アンカーがある場合、リンク先ページにその id が存在するか
// を確認します。切れたリンクが1件でもあれば終了コード1で終わります。
// =============================================================
import { readdirSync, readFileSync, existsSync, statSync } from "node:fs";
import { join, relative, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { SITE_URL } from "../site.config.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const distDir = join(root, "dist");

if (!existsSync(distDir)) {
  console.error("dist/ がありません。先に npm run build を実行してください。");
  process.exit(1);
}

const siteOrigin = new URL(SITE_URL).origin;

/** dist/ 以下の .html ファイルを再帰的に列挙 */
function listHtmlFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) return listHtmlFiles(fullPath);
    return entry.name.endsWith(".html") ? [fullPath] : [];
  });
}

/** 属性値を引用符あり・なしの両方で取り出す */
function collectAttr(html, attr) {
  const re = new RegExp(`\\s${attr}=(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, "g");
  return [...html.matchAll(re)].map((m) => m[1] ?? m[2] ?? m[3]);
}

const idCache = new Map();
function idsOf(file) {
  if (!idCache.has(file)) {
    idCache.set(file, new Set(collectAttr(readFileSync(file, "utf8"), "id")));
  }
  return idCache.get(file);
}

/** URLパスを dist/ 内のファイルに解決する。見つからなければ null */
function resolveToFile(pathname) {
  const decoded = decodeURIComponent(pathname);
  const candidates = [
    join(distDir, decoded),
    join(distDir, decoded, "index.html"),
    join(distDir, `${decoded.replace(/\/$/, "")}.html`),
  ];
  return candidates.find((p) => existsSync(p) && statSync(p).isFile()) ?? null;
}

const htmlFiles = listHtmlFiles(distDir);
const broken = [];
let checked = 0;

for (const file of htmlFiles) {
  const html = readFileSync(file, "utf8");
  const pagePath = "/" + relative(distDir, file).replace(/index\.html$/, "").replace(/\.html$/, "");

  for (const href of collectAttr(html, "href")) {
    let url;
    try {
      url = new URL(href, `${siteOrigin}${pagePath}`);
    } catch {
      broken.push({ page: pagePath, href, reason: "URLとして解釈できません" });
      continue;
    }
    // 外部サイト・mailto・tel などは対象外
    if (url.origin !== siteOrigin) continue;

    checked++;
    const target = resolveToFile(url.pathname);
    if (!target) {
      broken.push({ page: pagePath, href, reason: "リンク先のページ／ファイルがありません" });
      continue;
    }
    const hash = decodeURIComponent(url.hash.slice(1));
    if (hash && target.endsWith(".html") && !idsOf(target).has(hash)) {
      broken.push({ page: pagePath, href, reason: `リンク先に id="${hash}" がありません` });
    }
  }
}

if (broken.length > 0) {
  console.error(`内部リンク切れ: ${broken.length}件（${checked}件中）`);
  for (const b of broken) console.error(`  ${b.page} → ${b.href}  … ${b.reason}`);
  process.exit(1);
}

console.log(`内部リンクOK: ${htmlFiles.length}ページ・${checked}件のリンクを確認しました。`);
