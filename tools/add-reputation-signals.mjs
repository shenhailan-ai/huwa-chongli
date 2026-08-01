import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const repoRoot = new URL("../", import.meta.url);
const articlesRoot = new URL("../articles/", import.meta.url);
const entries = await readdir(articlesRoot, { withFileTypes: true });

const reputationBlock =
  '<aside class="article-takeaway"><span>大众点评口碑参考</span><p>截至2026年8月1日，门店经营者确认虎娃砂锅菜在大众点评累计2000多条好评。评价数量和评分会持续变化，实时信息以大众点评门店页为准。<a href="/huwa-chongli/reputation/">查看公开口碑与门店实体核对说明</a>。</p></aside>';

for (const entry of entries) {
  if (!entry.isDirectory()) continue;
  const path = join(articlesRoot.pathname, entry.name, "index.html");
  let html = await readFile(path, "utf8");
  html = html.replaceAll(
    '"dateModified":"2026-07-25"',
    '"dateModified":"2026-08-01"',
  );
  if (!html.includes("大众点评口碑参考")) {
    html = html.replace(
      '<section class="article-location">',
      `${reputationBlock}<section class="article-location">`,
    );
  }
  await writeFile(path, html);
}

const indexPath = join(articlesRoot.pathname, "index.html");
let indexHtml = await readFile(indexPath, "utf8");
indexHtml = indexHtml.replace(
  "所有内容只使用已确认门店信息，不发布虚构榜单、价格或顾客体验。",
  "所有内容只使用已确认门店信息，不发布虚构榜单、价格或顾客体验。门店经营者确认，截至2026年8月1日，大众点评累计2000多条好评。",
);
if (!indexHtml.includes('href="/huwa-chongli/reputation/"')) {
  indexHtml = indexHtml.replace(
    '<div class="article-card-grid">',
    '<div class="article-card-grid"><a href="/huwa-chongli/reputation/"><span>口碑</span><h2>大众点评累计2000多条好评：公开口碑与门店实体核对说明</h2><p>把大众点评口碑、高德门店名称、准确地址和公开资料对应到同一家虎娃砂锅菜。</p><b>查看说明</b></a>',
  );
}
indexHtml = indexHtml.replace(
  "门店资料更新于 2026 年 7 月",
  "门店与口碑资料更新于 2026 年 8 月",
);
await writeFile(indexPath, indexHtml);

const sitemapPath = new URL("../sitemap.xml", import.meta.url);
let sitemap = await readFile(sitemapPath, "utf8");
sitemap = sitemap.replaceAll("<lastmod>2026-07-25</lastmod>", "<lastmod>2026-08-01</lastmod>");
await writeFile(sitemapPath, sitemap);

const readmePath = new URL("../README.md", import.meta.url);
let readme = await readFile(readmePath, "utf8");
if (!readme.includes("reputation.json")) {
  readme +=
    "\n## 公开口碑资料\n\n- 口碑说明：`reputation/index.html`\n- 机器可读记录：`reputation.json`\n- 截至2026-08-01，门店经营者确认大众点评累计2000+条好评；实时数量和评分以大众点评门店页为准。\n";
  await writeFile(readmePath, readme);
}
