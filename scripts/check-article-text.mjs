// =============================================================
// 承認稿との照合（npm run check:article -- [<slug>] --body-file <path> | --issue <番号>）
// -------------------------------------------------------------
// SEO記事実装 Issue（承認稿）と、npm run build で生成された記事ページを照合します。
//   1. 本文: 「完成原稿」と記事本文（.article-body）の見出し・段落・箇条書き・表のセルを1ブロックずつ比較
//      （空白の違いと Markdown 記法は無視。H1 はページ上部に表示されるため比較対象外）
//   2. リンク: 記事本文内のリンク（文言とリンク先の組）が、承認稿のリンクと過不足なく一致するか
//      承認稿のリンク = 完成原稿中の [文言](リンク先) ＋「内部リンク」「CTA」欄の「置き場所：文言 → リンク先」
//      （記事下の共通 LINE ボタンは ArticleLayout のもので、記事本文の外にあるため対象外）
//   3. メタ情報: title・meta description・H1・公開日・記事一覧の紹介文（「変更なし」の欄は対象外）
// <slug> を省略すると Issue の「対象URL・slug」欄から読み取ります。
// 不一致が1件でもあれば一覧を出し、終了コード1で終わります。
// =============================================================
import { readFileSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { SITE_URL } from "../site.config.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const args = process.argv.slice(2);
let slugArg, issueNumber, bodyFile;
for (let i = 0; i < args.length; i++) {
  if (args[i] === "--issue") issueNumber = args[++i];
  else if (args[i] === "--body-file") bodyFile = args[++i];
  else slugArg ??= args[i];
}

if (!issueNumber && !bodyFile) {
  console.error("使い方: npm run check:article -- [<slug>] --body-file <Issue本文を保存したファイル>");
  console.error("    または: npm run check:article -- [<slug>] --issue <Issue番号>（gh CLI が必要）");
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

// ---- 承認稿を取得 ------------------------------------------------
const issueText = issueNumber
  ? execFileSync("gh", ["issue", "view", issueNumber, "--json", "body", "-q", ".body"], { encoding: "utf8" })
  : readFileSync(bodyFile, "utf8");

/** Issue 本文から、指定した欄の中身を返す（欄を囲むコードブロックは外す）。欄がなければ null */
function extractIssueSection(body, label) {
  const lines = body.replace(/\r\n/g, "\n").split("\n");
  const headingLabel = (line) => line.match(/^#{2,3} +(.+?)\s*$/)?.[1];

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

  while (section.length && !section[0].trim()) section.shift();
  while (section.length && !section.at(-1).trim()) section.pop();
  if (section.length >= 2 && /^\s*(```|~~~)/.test(section[0]) && /^\s*(```|~~~)\s*$/.test(section.at(-1))) {
    section = section.slice(1, -1);
  }
  return section.join("\n");
}

/** 欄の値。未記入（空・_No response_・なし）は ""、変更なしは null */
function fieldValue(label) {
  const raw = (extractIssueSection(issueText, label) ?? "").trim();
  if (raw === "変更なし") return null;
  if (raw === "" || raw === "_No response_" || raw === "なし") return "";
  return raw;
}

const isIssueForm = extractIssueSection(issueText, "完成原稿") !== null;
const draft = isIssueForm ? extractIssueSection(issueText, "完成原稿") : issueText;

const slug =
  slugArg ??
  (extractIssueSection(issueText, "対象URL・slug") ?? "")
    .trim()
    .replace(/^https?:\/\/[^/]+/, "")
    .replace(/^\/?articles\//, "")
    .replace(/\/$/, "");
if (!/^[a-z0-9-]+$/.test(slug ?? "")) {
  console.error(`slug を特定できません（「${slug}」）。<slug> を指定するか、Issue の「対象URL・slug」欄を確認してください。`);
  process.exit(1);
}

// ---- ビルド結果を読み込む ------------------------------------------
const htmlPath = join(root, "dist", "articles", slug, "index.html");
const indexPath = join(root, "dist", "index.html");
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
const bodyHtml = bodyMatch[1];

// ---- 共通の小道具 ------------------------------------------------
const normalize = (s) => s.replace(/\s+/g, "");
const siteOrigin = new URL(SITE_URL).origin;

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

const textOf = (fragment) => decodeEntities(fragment.replace(/<[^>]+>/g, "")).trim();

function stripInlineMarkdown(text) {
  return text
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/(\*\*|__)(.+?)\1/g, "$2")
    .replace(/(^|[^*])\*(?!\s)(.+?)\*/g, "$1$2")
    .replace(/`([^`]*)`/g, "$1");
}

/** リンク先を比較用にそろえる（公開ドメインの絶対URL→パス、末尾スラッシュを除去） */
function normalizeHref(href) {
  let h = decodeEntities(href.trim());
  if (h.startsWith(siteOrigin)) h = h.slice(siteOrigin.length) || "/";
  const [, path = "", rest = ""] = h.match(/^([^?#]*)(.*)$/) ?? [];
  const trimmedPath = path.length > 1 ? path.replace(/\/+$/, "") : path;
  return trimmedPath + rest;
}

const errors = [];

// ---- 1. 本文 ------------------------------------------------------
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

// ---- 2. リンク（承認稿側） -------------------------------------------
/** 「内部リンク」「CTA」欄の各行（置き場所：文言 → リンク先）を読む */
function fieldLinks(label) {
  const raw = (extractIssueSection(issueText, label) ?? "").trim();
  if (raw === "変更なし") {
    errors.push(`「${label}」欄が「変更なし」です。リンク先を照合するため、ページに置くリンクをすべて「置き場所：文言 → リンク先」で書いてください。`);
    return [];
  }
  const links = [];
  for (const rawLine of raw.split("\n")) {
    const line = rawLine.trim();
    if (!line || line === "_No response_" || line === "なし") continue;
    const m = line.match(/^(?:[-*]\s*)?(?:[^：:→]*[：:])?\s*(.+?)\s*(?:→|->)\s*(\S+)\s*$/);
    if (!m) {
      errors.push(`「${label}」欄の行を「置き場所：文言 → リンク先」として読み取れません: ${line}`);
      continue;
    }
    links.push({ text: stripInlineMarkdown(m[1]), href: m[2], from: `「${label}」欄` });
  }
  return links;
}

const draftLinks = [...draft.matchAll(/(?<!!)\[([^\]]+)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g)].map((m) => ({
  text: stripInlineMarkdown(m[1]),
  href: m[2],
  from: "完成原稿",
}));
const specLinks = isIssueForm ? fieldLinks("内部リンク").concat(fieldLinks("CTA")) : [];
const expectedLinks = [...draftLinks, ...specLinks];

// ---- 1. 本文の比較 -------------------------------------------------
const expectedBlocks = markdownBlocks(draft);
const expectedSet = new Set(expectedBlocks.map(normalize));
// 「内部リンク」「CTA」欄のリンクは完成原稿の外から追加されるため、原稿にない文言なら本文比較から除く
const specLinkTexts = new Set(specLinks.map((l) => normalize(l.text)));
const actualBlocks = htmlBlocks(bodyHtml).filter((b) => !(specLinkTexts.has(normalize(b)) && !expectedSet.has(normalize(b))));

const blockDiffs = [];
for (let i = 0; i < Math.max(expectedBlocks.length, actualBlocks.length); i++) {
  if (normalize(expectedBlocks[i] ?? "") !== normalize(actualBlocks[i] ?? "")) {
    blockDiffs.push(`[${i + 1}]\n    原稿: ${expectedBlocks[i] ?? "（なし）"}\n    実装: ${actualBlocks[i] ?? "（なし）"}`);
  }
}
if (blockDiffs.length) {
  errors.push(
    `本文の不一致: ${blockDiffs.length}ブロック（原稿 ${expectedBlocks.length}／ページ ${actualBlocks.length}ブロック）\n  ` +
      blockDiffs.slice(0, 20).join("\n  ") +
      (blockDiffs.length > 20 ? `\n  …ほか ${blockDiffs.length - 20}件` : ""),
  );
}

// ---- 2. リンクの比較 -----------------------------------------------
const actualLinks = [...bodyHtml.matchAll(/<a\s[^>]*?href=(?:"([^"]*)"|'([^']*)'|([^\s>]+))[^>]*>([\s\S]*?)<\/a>/g)].map((m) => ({
  text: textOf(m[4]),
  href: m[1] ?? m[2] ?? m[3],
}));
const linkKey = (l) => `${normalize(l.text)}\u0000${normalizeHref(l.href)}`;
const remaining = new Map();
for (const l of actualLinks) remaining.set(linkKey(l), [...(remaining.get(linkKey(l)) ?? []), l]);
const missingLinks = [];
for (const l of expectedLinks) {
  const list = remaining.get(linkKey(l));
  if (list?.length) list.pop();
  else missingLinks.push(l);
}
const unexpectedLinks = [...remaining.values()].flat();
for (const l of missingLinks) errors.push(`承認稿のリンクが記事にありません（${l.from}）: 「${l.text}」→ ${l.href}`);
for (const l of unexpectedLinks) errors.push(`承認稿にないリンクが記事にあります: 「${l.text}」→ ${l.href}`);

// ---- 3. メタ情報の比較 ---------------------------------------------
if (isIssueForm) {
  const metaChecks = [];
  const title = fieldValue("title");
  if (title) metaChecks.push(["title", title, textOf(html.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? "")]);
  const description = fieldValue("meta description");
  if (description) {
    metaChecks.push([
      "meta description",
      description,
      decodeEntities(html.match(/<meta name="description" content="([^"]*)"/)?.[1] ?? ""),
    ]);
  }
  const h1 = fieldValue("H1");
  if (h1) metaChecks.push(["H1", h1, textOf(html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)?.[1] ?? "")]);
  const publishDate = fieldValue("公開日");
  if (publishDate) metaChecks.push(["公開日", publishDate, html.match(/"datePublished":"([^"]*)"/)?.[1] ?? ""]);
  for (const [label, want, got] of metaChecks) {
    if (normalize(want) !== normalize(got)) errors.push(`${label} が承認稿と一致しません\n    承認稿: ${want}\n    実装: ${got || "（なし）"}`);
  }

  const excerpt = fieldValue("記事一覧の紹介文");
  if (excerpt) {
    const indexHtml = existsSync(indexPath) ? readFileSync(indexPath, "utf8") : "";
    const card = [...indexHtml.matchAll(/<a href="([^"]*)" class="article-card__link"[^>]*>([\s\S]*?)<\/a>/g)].find(
      (m) => normalizeHref(m[1]) === `/articles/${slug}`,
    );
    if (!card) errors.push(`トップの記事一覧に /articles/${slug} のカードがありません`);
    else if (!normalize(textOf(card[2])).includes(normalize(excerpt))) {
      errors.push(`記事一覧の紹介文が承認稿と一致しません\n    承認稿: ${excerpt}\n    実装: ${textOf(card[2])}`);
    }
  }
}

// ---- 結果 --------------------------------------------------------
if (errors.length) {
  console.error(`承認稿との不一致: ${errors.length}件（/articles/${slug}）\n`);
  for (const e of errors) console.error(`- ${e}\n`);
  process.exit(1);
}
console.log(
  `承認稿と一致: /articles/${slug}（本文 ${expectedBlocks.length}ブロック・リンク ${expectedLinks.length}件` +
    (isIssueForm ? "・メタ情報" : "") +
    "）",
);
