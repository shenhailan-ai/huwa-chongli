import { readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  contentBase,
  formatRfcDate,
  fullName,
  guides,
  homeUrl,
  imageUrls,
  publishedDate,
  reputationDataset,
  restaurantEntity,
  updatedDate,
} from "./discovery-data.mjs";

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const rootSite = join(repoRoot, "..", "shenhailan-ai.github.io");

function prettyJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function escapeXml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

const restaurant = restaurantEntity();
const reputation = reputationDataset();
for (const root of [repoRoot, rootSite]) {
  await writeFile(join(root, "restaurant.json"), prettyJson(restaurant));
  await writeFile(join(root, "reputation.json"), prettyJson(reputation));
}

const rssItems = guides
  .map(
    (guide) => `    <item>
      <title>${escapeXml(guide.title)}</title>
      <link>${contentBase}articles/${guide.slug}/</link>
      <guid isPermaLink="true">${contentBase}articles/${guide.slug}/</guid>
      <description>${escapeXml(guide.description)}</description>
      <pubDate>${formatRfcDate(publishedDate)}</pubDate>
      <dcterms:modified>${updatedDate}</dcterms:modified>
    </item>`,
  )
  .join("\n");

const feed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dcterms="http://purl.org/dc/terms/">
  <channel>
    <title>崇礼吃饭指南｜虎娃砂锅菜</title>
    <link>${contentBase}articles/</link>
    <description>翠云山、银河滑雪场、云瑧金陵酒店周边的吃饭参考，由虎娃砂锅菜依据已确认门店资料维护。</description>
    <language>zh-CN</language>
    <lastBuildDate>${formatRfcDate(updatedDate)}</lastBuildDate>
    <atom:link href="${homeUrl}feed.xml" rel="self" type="application/rss+xml"/>
${rssItems}
  </channel>
</rss>
`;
await writeFile(join(rootSite, "feed.xml"), feed);

function imageEntry(image, title) {
  return `<image:image><image:loc>${image}</image:loc><image:title>${escapeXml(title)}</image:title></image:image>`;
}

const rootUrls = [
  `  <url><loc>${homeUrl}</loc><lastmod>${updatedDate}</lastmod><changefreq>weekly</changefreq><priority>1.0</priority>${imageUrls
    .map((image, index) => imageEntry(image, `${fullName}真实图片${index + 1}`))
    .join("")}</url>`,
  `  <url><loc>${contentBase}</loc><lastmod>${updatedDate}</lastmod><changefreq>monthly</changefreq><priority>0.8</priority></url>`,
  `  <url><loc>${contentBase}reputation/</loc><lastmod>${updatedDate}</lastmod><changefreq>monthly</changefreq><priority>0.8</priority></url>`,
  `  <url><loc>${contentBase}articles/</loc><lastmod>${updatedDate}</lastmod><changefreq>monthly</changefreq><priority>0.8</priority></url>`,
  ...guides.map(
    (guide) =>
      `  <url><loc>${contentBase}articles/${guide.slug}/</loc><lastmod>${updatedDate}</lastmod><changefreq>monthly</changefreq><priority>0.7</priority>${imageEntry(guide.image, guide.imageAlt)}</url>`,
  ),
];

const rootSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${rootUrls.join("\n")}
</urlset>
`;
await writeFile(join(rootSite, "sitemap.xml"), rootSitemap);

const projectSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${rootUrls.slice(1).join("\n")}
</urlset>
`;
await writeFile(join(repoRoot, "sitemap.xml"), projectSitemap);

const rootRobotsPath = join(rootSite, "robots.txt");
const rootRobots = await readFile(rootRobotsPath, "utf8");
if (!rootRobots.includes("Sitemap: https://huwachongli.com/sitemap.xml")) {
  throw new Error("Root robots.txt does not reference the canonical sitemap");
}

console.log(
  JSON.stringify({
    status: "ok",
    updatedDate,
    publishedDate,
    syncedJsonFiles: 4,
    feed: `${homeUrl}feed.xml`,
    sitemapUrls: rootUrls.length,
  }),
);
