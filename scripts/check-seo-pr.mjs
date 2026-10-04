// =============================================================
// SEO 自動実装 PR の承認稿チェック（npm run check:seo-pr）
// -------------------------------------------------------------
// CI（ci-build）から seo/issue-<番号>-* ブランチの PR に対して実行する必須チェックです。
//   1. 元 Issue が承認済みであること（タイトルが [SEO記事実装] で始まり、seo-approved 付きで open）
//   2. seo-approved を付けた後に Issue 本文が編集されていないこと（承認稿の改変防止）
//   3. ビルドした記事が承認稿と一致すること（scripts/check-article-text.mjs: 本文・リンク先・メタ情報）
// 必要な環境変数: HEAD_REF（PR のブランチ名）、GITHUB_REPOSITORY、GH_TOKEN（gh CLI 用）
// =============================================================
import { execFileSync } from "node:child_process";
import { writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const fail = (message) => {
  console.error(`承認稿チェック失敗: ${message}`);
  process.exit(1);
};

const headRef = process.env.HEAD_REF ?? "";
const [owner, repo] = (process.env.GITHUB_REPOSITORY ?? "").split("/");
const issueNumber = Number(headRef.match(/^seo\/issue-(\d+)-/)?.[1]);
if (!issueNumber) fail(`ブランチ名「${headRef}」から Issue 番号を読み取れません`);
if (!owner || !repo) fail("GITHUB_REPOSITORY が設定されていません");

const query = `
  query($owner: String!, $repo: String!, $number: Int!) {
    repository(owner: $owner, name: $repo) {
      issue(number: $number) {
        title
        body
        state
        lastEditedAt
        labels(first: 50) { nodes { name } }
        timelineItems(itemTypes: [LABELED_EVENT], last: 100) {
          nodes { ... on LabeledEvent { createdAt label { name } } }
        }
      }
    }
  }`;
const result = JSON.parse(
  execFileSync(
    "gh",
    ["api", "graphql", "-f", `query=${query}`, "-f", `owner=${owner}`, "-f", `repo=${repo}`, "-F", `number=${issueNumber}`],
    { encoding: "utf8" },
  ),
);
const issue = result.data?.repository?.issue;
if (!issue) fail(`Issue #${issueNumber} が見つかりません`);

if (!issue.title.startsWith("[SEO記事実装]")) fail(`#${issueNumber} のタイトルが [SEO記事実装] で始まっていません`);
if (issue.state !== "OPEN") fail(`#${issueNumber} が open ではありません`);
const labels = issue.labels.nodes.map((l) => l.name);
if (!labels.includes("seo-approved")) fail(`#${issueNumber} に seo-approved がありません`);
if (labels.includes("seo-blocked")) fail(`#${issueNumber} に seo-blocked が付いています`);

const approvedAt = issue.timelineItems.nodes
  .filter((n) => n.label?.name === "seo-approved")
  .map((n) => n.createdAt)
  .sort()
  .at(-1);
if (!approvedAt) fail(`#${issueNumber} で seo-approved を付けた記録が見つかりません`);
if (issue.lastEditedAt && issue.lastEditedAt > approvedAt) {
  fail(
    `#${issueNumber} の本文が seo-approved の付与（${approvedAt}）の後に編集されています（${issue.lastEditedAt}）。` +
      "承認稿が変わった可能性があるため、内容を確認し、seo-approved を外して付け直してください（実装し直しになります）。",
  );
}
console.log(`#${issueNumber}: 承認済み（seo-approved ${approvedAt}、承認後の本文編集なし）`);

const bodyFile = join(mkdtempSync(join(tmpdir(), "seo-pr-")), "issue.md");
writeFileSync(bodyFile, issue.body ?? "");
const checker = join(dirname(fileURLToPath(import.meta.url)), "check-article-text.mjs");
try {
  execFileSync(process.execPath, [checker, "--body-file", bodyFile], { stdio: "inherit" });
} catch {
  process.exit(1);
}
