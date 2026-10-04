// =============================================================
// 記事本文の照合（npm run check:article -- <slug> --body-file <path> | --issue <番号>）
// -------------------------------------------------------------
// SEO記事実装 Issue の「完成原稿」欄（または原稿だけの Markdown ファイル）と、
// npm run build で生成された記事ページの本文が一致しているかを確認します。
//   - 見出し・段落・箇条書き・表のセルを1ブロックずつ比較します
//   - 空白の違いと Markdown 記法（##, -, 1., **, `, [文言](URL) など）は無視します
//   - H1（# 見出し）はページ上部に表示されるため比較対象外です
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
  console.error("使い方: npm run check:article -- <slug> --body-file <Issue本文または原稿のMarkdownファイル>");
  console.error("    または: npm run check:article -- <slug> --issue <Issue番号>（gh CLI が必要）");
  process.exit(1);
}

/**
 * Issue の欄名（.github/ISSUE_TEMPLATE/seo-article.yml の label と同じ）。
 * コードブロックの外にある「### 欄名」（または「## 欄名」）の行だけを欄の区切りとみなします。
 */
const FORM_LABELS = [
  "種別",
  "対象URL・slug",
  "title",
  "meta description",
  "H1",
  "公開日",
  "記事一覧の紹介文",
  "この記事を作る理由",
  "検索意図",
  "H2 / H3構成",
  "完成原稿",
  "内部リンク",
  "CTA",
  "実装上の注意",
];
const DRAFT_LABEL = "完成原稿";

// ---- 原稿を取得 ------------------------------------------------
let source;
let issueText = "";
if (issueNumber) {
  issueText = execFileSync("gh", ["issue", "view", issueNumber, "--json", "body", "-q", ".body"], {
    encoding: "utf8",
  });
  source = extractIssueSection(issueText, DRAFT_LABEL);
  if (source === null) {
    console.error(`Issue #${issueNumber} に「### ${DRAFT_LABEL}」欄が見つかりません。`);
    process.exit(1);
  }
} else {
  issueText = readFileSync(bodyFile, "utf8");
  // Issue 本文をそのまま保存したファイルなら「完成原稿」欄だけを取り出す
  source = extractIssueSection(issueText, DRAFT_LABEL) ?? issueText;
}

/** Issue 本文から、指定した欄の中身を返す（欄を囲むコードブロックは外す） */
function extractIssueSection(body, label) {
  const lines = body.replace(/\r\n/g, "\n").split("\n");
  const headingLabel = (line) => line.match(/^#{2,3} +(.+?)\s*$/)?.[1];

  // コードブロックの外にある欄見出しの位置を集める
  const headings = [];
  let inFence = false;
  lines.forEach((line, i) => {
    if (/^\s*(```|~~~)/.test(line)) inFence = !inFence;
    else if (!inFence && FORM_LABELS.includes(headingLabel(line))) headings.push({ i, label: headingLabel(line) });
  });

  const idx = headings.findIndex((h) => h.label === label);
  if (idx < 0) return null;
  const endLine = headings[idx + 1]?.i ?? lines.length;
  let section = lines.slice(headings[idx].i + 1, endLine);

  // 前後の空行を除き、全体が1つのコードブロックで囲まれていれば外す
  while (section.length && !section[0].trim()) section.shift();
  while (section.length && !section.at(-1).trim()) section.pop();
  if (section.length >= 2 && /^\s*(```|~~~)/.test(section[0]) && /^\s*(```|~~~)\s*$/.test(section.at(-1))) {
    section = section.slice(1, -1);
  }
  return section.join("\n");
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
    if (/^#\s/.test(line)) {
      flush();
      continue; // H1 はページ上部に表示されるため比較しない
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

// Issue の「内部リンク」「CTA」欄で指定されたリンク（「置き場所：リンク文言 → リンク先」）は
// 完成原稿の外から追加されるため、原稿にない場合は照合から除く
const linkTexts = new Set(
  ["内部リンク", "CTA"]
    .flatMap((label) => (extractIssueSection(issueText, label) ?? "").split("\n"))
    .map((line) => line.match(/^(?:[-*]\s*)?(?:[^：:→]*[：:])?\s*(.+?)\s*(?:→|->)/)?.[1])
    .filter(Boolean)
    .map((text) => normalize(stripInlineMarkdown(text))),
);
const expectedSet = new Set(expected.map(normalize));
const addedLinks = [];
const actual = htmlBlocks(bodyMatch[1]).filter((block) => {
  const key = normalize(block);
  if (linkTexts.has(key) && !expectedSet.has(key)) {
    addedLinks.push(block);
    return false;
  }
  return true;
});
if (addedLinks.length) console.log(`Issue の内部リンク・CTA 指定による追加（照合対象外）: ${addedLinks.join(" / ")}`);

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
