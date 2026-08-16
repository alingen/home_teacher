import type { APIRoute } from "astro";
import { site } from "../config/site";

// robots.txt を動的に生成することで、Sitemap の参照URLが
// site.ts（= site.config.mjs の SITE_URL）と常に同期するようにしています。
export const GET: APIRoute = () => {
  const body = [
    "User-agent: *",
    "Allow: /",
    "",
    `Sitemap: ${new URL("sitemap-index.xml", site.url).toString()}`,
    "",
  ].join("\n");

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
