// =============================================================
// 記事本文の照合（npm run check:article -- <slug> --issue <番号> | --body-file <path>）
// -------------------------------------------------------------
// SEO担当の原稿（GitHub Issue の「本文」欄、または Markdown ファイル）と、
// npm run build で生成された記事ページの本文が一致しているかを確認します。
//   - 見出し・段落・箇条書き・表のセルを1ブロックずつ比較します
//   - 空白の違いと Markdown 記法（#, -, 1., **, `, [文言](URL) など）は無視します
// 一致しないブロックがあれば一覧を出し、終了コード1で終わります。
// 表や装飾ブロックなど、組み方の都合で差分が出た場合は内容を確認したうえでPRに記載してください。
// =============================================================
import { readFileSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const args = process.argv.slice(2);
let slug, issueNumber, bodyFile;
for (let i = 0; i < args.length; i++) {
  if (args[i] === "--issue") issueNumber = args[++i];
  else if (args[i] === "--body-file") bodyFile = args[++i];
  else slug ??= args[i];
}

if (!slug || (!issueNumber && !bodyFile)) {
  console.error("使い方: npm run check:article -- <slug> --issue <Issue番号>");
  console.error("    または: npm run check:article -- <slug> --body-file <原稿のMarkdownファイル>");
  process.exit(1);
}

/**
 * Issueフォームの欄名（.github/ISSUE_TEMPLATE/seo-article.yml の label の先頭部分）。
 * 本文中の H3（### 見出し）と欄の区切りを見分けるため、欄名に一致する「### 」行だけを区切りとみなします。
 */
const FORM_LABELS = ["SEOタイトル", "H1", "meta description", "slug", "公開日", "記事一覧の紹介文", "本文", "内部リンク", "CTA", "備考"];

// ---- 原稿を取得 ------------------------------------------------
let source;
if (issueNumber) {
  const issueBody = execFileSync("gh", ["issue", "view", issueNumber, "--json", "body", "-q", ".body"], {
    encoding: "utf8",
  });
  source = extractIssueSection(issueBody, "本文");
  if (source === null) {
    console.error(`Issue #${issueNumber} に「### 本文」欄が見つかりません。`);
    process.exit(1);
  }
} else {
  const text = readFileSync(bodyFile, "utf8");
  // Issue本文をそのまま保存したファイルなら「本文」欄だけを取り出す
  source = extractIssueSection(text, "本文") ?? text;
}

/** Issueフォームの欄のうち、指定した欄名で始まる欄の中身を返す */
function extractIssueSection(body, label) {
  const lines = body.replace(/\r\n/g, "\n").split("\n");
  const isFormHeading = (line) => line.startsWith("### ") && FORM_LABELS.some((l) => line.slice(4).startsWith(l));
  const start = lines.findIndex((line) => isFormHeading(line) && line.slice(4).startsWith(label));
  if (start < 0) return null;
  const rest = lines.slice(start + 1);
  const end = rest.findIndex(isFormHeading);
  return (end < 0 ? rest : rest.slice(0, end)).join("\n");
}

// ---- 原稿（Markdown）をブロックに分解 ----------------------------
function markdownBlocks(md) {
  const blocks = [];
  let paragraph = [];
  const flush = () => {
    if (paragraph.length) blocks.push(paragraph.join(""));
    paragraph = [];
  };
  for (const rawLine of md.replace(/\r\n/g, "\n").split("\n")) {
    const line = rawLine.trim();
    if (!line || /^_No response_$/.test(line)) {
      flush();
      continue;
    }
    if (/^\|.*\|$/.test(line)) {
      flush();
      if (/^\|[\s:|-]+\|$/.test(line)) continue; // 表の区切り行
      blocks.push(...line.slice(1, -1).split("|").map((cell) => cell.trim()).filter(Boolean));
      continue;
    }
    if (/^(#{1,6}\s|[-*+]\s|\d+[.)]\s|>\s?)/.test(line)) {
      flush();
      blocks.push(line.replace(/^(#{1,6}\s+|[-*+]\s+|\d+[.)]\s+|>\s?)/, ""));
      continue;
    }
    paragraph.push(line);
  }
  flush();
  return blocks.map(stripInlineMarkdown);
}

function stripInlineMarkdown(text) {
  return text
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/(\*\*|__)(.+?)\1/g, "$2")
    .replace(/(^|[^*])\*(?!\s)(.+?)\*/g, "$1$2")
    .replace(/`([^`]*)`/g, "$1");
}

// ---- ビルド結果（HTML）をブロックに分解 ---------------------------
const htmlPath = join(root, "dist", "articles", slug, "index.html");
if (!existsSync(htmlPath)) {
  console.error(`${htmlPath} がありません。slug を確認し、先に npm run build を実行してください。`);
  process.exit(1);
}
const html = readFileSync(htmlPath, "utf8");
const bodyMatch = html.match(/<div class="article-body"[^>]*>([\s\S]*?)<div class="article-cta"/);
if (!bodyMatch) {
  console.error("記事本文（.article-body）が見つかりません。ArticleLayout を使っているか確認してください。");
  process.exit(1);
}

function htmlBlocks(fragment) {
  const blockTags = "p|li|h[1-6]|td|th|blockquote|div|br|tr|ul|ol|table|figure|figcaption|pre";
  return decodeEntities(
    fragment
      .replace(/<(style|script)[\s\S]*?<\/\1>/g, "")
      .replace(new RegExp(`<\\/?(?:${blockTags})\\b[^>]*>`, "g"), "\n")
      .replace(/<[^>]+>/g, ""),
  )
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}

function decodeEntities(text) {
  const named = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, code) => {
    if (code[0] === "#") {
      const n = code[1].toLowerCase() === "x" ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
      return String.fromCodePoint(n);
    }
    return named[code.toLowerCase()] ?? m;
  });
}

// ---- 比較 --------------------------------------------------------
const normalize = (s) => s.replace(/\s+/g, "");
const expected = markdownBlocks(source);
const actual = htmlBlocks(bodyMatch[1]);

const diffs = [];
const max = Math.max(expected.length, actual.length);
for (let i = 0; i < max; i++) {
  if (normalize(expected[i] ?? "") !== normalize(actual[i] ?? "")) {
    diffs.push({ index: i + 1, expected: expected[i] ?? "（なし）", actual: actual[i] ?? "（なし）" });
  }
}

if (diffs.length > 0) {
  console.error(`本文の不一致: ${diffs.length}ブロック（原稿 ${expected.length}／ページ ${actual.length}ブロック）`);
  for (const d of diffs.slice(0, 20)) {
    console.error(`\n[${d.index}]\n  原稿: ${d.expected}\n  実装: ${d.actual}`);
  }
  if (diffs.length > 20) console.error(`\n…ほか ${diffs.length - 20}件`);
  process.exit(1);
}

console.log(`本文一致: ${expected.length}ブロックすべて原稿と一致しました。`);
