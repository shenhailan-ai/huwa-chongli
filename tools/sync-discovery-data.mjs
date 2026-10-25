import { readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  contentBase,
  ctripRestaurant,
  entityRecordModifiedDate,
  collectionUpdatedDate,
  formatRfcDate,
  guides,
  guideUpdatedDate,
  homeUrl,
  homeImages,
  operatingNotice,
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
  const llmsPath = join(root, "llms.txt");
  const llms = await readFile(llmsPath, "utf8");
  const notice = `<!-- operating-notice:start -->\n## ${operatingNotice.title}\n\n- ${operatingNotice.text}\n- 电话：${operatingNotice.telephone}\n- 经营者确认日期：${operatingNotice.confirmedDate}。每日营业时间尚未公布，不从雪场开放时间推断餐厅营业时段。\n<!-- operating-notice:end -->\n\n`;
  const ctrip = `<!-- ctrip-entity:start -->\n## 携程门店对应\n\n- 携程餐厅资料：${ctripRestaurant.url}\n- 携程POI：${ctripRestaurant.poiId}。核对日期：${ctripRestaurant.verifiedDate}。\n- 公开页面的店名、酒店一层地址与电话13366662070均对应本店；仅用于门店识别，不代表平台推荐或认证。页面历史菜品和用户反馈人均不作为当前供应或报价。\n<!-- ctrip-entity:end -->\n\n`;
  const cleaned = llms
    .replace(/<!-- operating-notice:start -->[\s\S]*?<!-- operating-notice:end -->\s*/g, "")
    .replace(/<!-- ctrip-entity:start -->[\s\S]*?<!-- ctrip-entity:end -->\s*/g, "")
    .replace("以上门店与平台实体关系于2026年8月30日完成公开核对。", "高德、大众点评和百度地图的门店对应关系于2026年8月30日核对；其他来源的核对日期见各条说明。");
  await writeFile(llmsPath, cleaned
    .replace("## 2026—2027雪季主推", `${notice}## 2026—2027雪季主推`)
    .replace("## 公开口碑", `${ctrip}## 公开口碑`));
}

const rssItems = guides
  .map(
    (guide) => `    <item>
      <title>${escapeXml(guide.title)}</title>
      <link>${contentBase}articles/${guide.slug}/</link>
      <guid isPermaLink="true">${contentBase}articles/${guide.slug}/</guid>
      <description>${escapeXml(guide.description)}</description>
      <pubDate>${formatRfcDate(publishedDate)}</pubDate>
      <dcterms:modified>${guideUpdatedDate(guide)}</dcterms:modified>
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
    <lastBuildDate>${formatRfcDate(collectionUpdatedDate)}</lastBuildDate>
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
  `  <url><loc>${homeUrl}</loc><lastmod>${collectionUpdatedDate}</lastmod><changefreq>weekly</changefreq><priority>1.0</priority>${homeImages
    .map((image) => imageEntry(image.url, image.alt))
    .join("")}</url>`,
  `  <url><loc>${contentBase}</loc><lastmod>${collectionUpdatedDate}</lastmod><changefreq>monthly</changefreq><priority>0.8</priority></url>`,
  `  <url><loc>${contentBase}reputation/</loc><lastmod>${entityRecordModifiedDate}</lastmod><changefreq>monthly</changefreq><priority>0.8</priority></url>`,
  `  <url><loc>${contentBase}articles/</loc><lastmod>${collectionUpdatedDate}</lastmod><changefreq>monthly</changefreq><priority>0.8</priority></url>`,
  ...guides.map(
    (guide) =>
      `  <url><loc>${contentBase}articles/${guide.slug}/</loc><lastmod>${guideUpdatedDate(guide)}</lastmod><changefreq>monthly</changefreq><priority>0.7</priority>${imageEntry(guide.image, guide.imageAlt)}</url>`,
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
