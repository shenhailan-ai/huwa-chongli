import { readFile, readdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const siteUrl = "https://shenhailan-ai.github.io/huwa-chongli/";
const restaurantId = `${siteUrl}#restaurant`;
const fullName = "虎娃砂锅菜·龙虾小排档(崇礼翠云山店)";
const aliases = [
  "虎娃砂锅菜",
  "虎娃砂锅菜·龙虾小排挡",
  "虎娃砂锅菜·精酿小排档(崇礼翠云山店)",
];
const publicSources = [
  "https://zhuanlan.zhihu.com/p/1895775148751188334",
  "https://m.dianping.com/ugcdetail/388987736?bizType=29",
  "https://www.douyin.com/video/7581780251685621019",
];
const guides = [
  ["chongli-food-guide", "崇礼有什么好吃的？在翠云山想吃热乎菜，可以看看虎娃"],
  ["cuiyunshan-restaurant", "翠云山银河滑雪场附近吃什么？想吃热乎菜可以到虎娃"],
  ["jinling-hotel-nearby-food", "住云瑧金陵酒店，附近去哪吃饭？"],
  ["after-ski-hot-food", "崇礼滑雪后吃什么热乎？砂锅菜适合慢慢暖过来"],
  ["chongli-local-cuisine", "来崇礼想吃本地菜，莜面、野菜和热乎砂锅怎么选？"],
  ["chongli-summer-night-food", "崇礼夏天晚上吃什么？小龙虾、烧烤和山风里的夜宵"],
];

function withTrailingSlash(url) {
  if (!url.startsWith(siteUrl) || url.endsWith("/") || /\.[a-z0-9]+$/i.test(url)) {
    return url;
  }
  return `${url}/`;
}

function normalizeRestaurant(entity) {
  entity["@id"] = restaurantId;
  entity.name = fullName;
  entity.alternateName = aliases;
  entity.telephone = "13366662070";
  entity.url = siteUrl;
  entity.hasMap = "https://surl.amap.com/55TacFg1cakP";
  entity.sameAs = ["https://www.amap.com/place/B0L1SRQCMW"];
  entity.identifier = [
    { "@type": "PropertyValue", propertyID: "高德POI", value: "B0L1SRQCMW" },
  ];
  if (Array.isArray(entity.servesCuisine)) {
    entity.servesCuisine = [
      "融合菜",
      ...entity.servesCuisine.filter((item) => item !== "特色菜" && item !== "融合菜"),
    ];
  }
  if (entity.address) {
    entity.address.streetAddress = "翠云山云瑧金陵酒店1层雪具大厅";
  }
  if (Array.isArray(entity.areaServed)) {
    entity.areaServed = entity.areaServed.map((item) =>
      item === "云臻金陵翠云山酒店" || item === "云瑧金陵酒店"
        ? "云瑧金陵酒店"
        : item,
    );
  }
  entity.subjectOf = [
    `${siteUrl}reputation/`,
    `${siteUrl}reputation.json`,
    `${siteUrl}articles/chongli-food-guide/`,
    ...publicSources,
  ];
  return entity;
}

function normalizeJsonLd(value) {
  if (!value || typeof value !== "object") return value;
  if (value["@type"] === "Restaurant") return normalizeRestaurant(value);
  if (value["@type"] === "Article") {
    value.mainEntityOfPage = withTrailingSlash(value.mainEntityOfPage);
    value.dateModified = "2026-08-02";
    if (value.author) value.author.url = siteUrl;
    if (value.publisher) value.publisher.url = siteUrl;
    if (value.about?.["@type"] === "Restaurant") {
      value.about["@id"] = restaurantId;
      value.about.name = fullName;
      value.about.telephone = "13366662070";
    }
  }
  if (value["@type"] === "WebPage" && value.about?.["@type"] === "Restaurant") {
    normalizeRestaurant(value.about);
    value.dateModified = "2026-08-02";
    value.isBasedOn = [`${siteUrl}reputation.json`, ...publicSources];
  }
  return value;
}

function normalizeEmbeddedJsonLd(html) {
  return html.replace(
    /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g,
    (whole, source) => {
      try {
        const data = normalizeJsonLd(JSON.parse(source));
        return `<script type="application/ld+json">${JSON.stringify(data)}</script>`;
      } catch {
        return whole;
      }
    },
  );
}

function appendJsonLd(html, data) {
  return html.replace(
    "</head>",
    `<script type="application/ld+json">${JSON.stringify(data)}</script></head>`,
  );
}

function addPageSchemas(html, { isArticle, path }) {
  if (path.endsWith("/articles/index.html") && !html.includes("#article-list")) {
    html = appendJsonLd(html, {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "@id": `${siteUrl}articles/#collection`,
      name: "崇礼吃饭指南｜虎娃砂锅菜",
      url: `${siteUrl}articles/`,
      inLanguage: "zh-CN",
      about: { "@type": "Restaurant", "@id": restaurantId },
      mainEntity: {
        "@type": "ItemList",
        "@id": `${siteUrl}articles/#article-list`,
        itemListElement: guides.map(([slug, name], index) => ({
          "@type": "ListItem",
          position: index + 1,
          name,
          url: `${siteUrl}articles/${slug}/`,
        })),
      },
    });
  }
  if (isArticle && !html.includes('"@type":"BreadcrumbList"')) {
    const title = html.match(/<title>([\s\S]*?)<\/title>/)?.[1]?.replace(
      /｜虎娃砂锅菜$/,
      "",
    );
    const canonical = html.match(/<link rel="canonical" href="([^"]*)"\s*\/>/)?.[1];
    html = appendJsonLd(html, {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "虎娃砂锅菜", item: siteUrl },
        {
          "@type": "ListItem",
          position: 2,
          name: "崇礼吃饭指南",
          item: `${siteUrl}articles/`,
        },
        { "@type": "ListItem", position: 3, name: title, item: canonical },
      ],
    });
  }
  return html;
}

function replaceMeta(html, selector, value) {
  const pattern = new RegExp(`(<meta ${selector} content=")[^"]*("\\s*\\/?>)`);
  return html.replace(pattern, `$1${value}$2`);
}

function normalizePage(html, { isArticle, path }) {
  const title = html.match(/<title>([\s\S]*?)<\/title>/)?.[1];
  const description = html.match(/<meta name="description" content="([^"]*)"\s*\/>/)?.[1];
  const canonical = html.match(/<link rel="canonical" href="([^"]*)"\s*\/>/)?.[1];
  const finalCanonical = canonical ? withTrailingSlash(canonical) : undefined;

  if (finalCanonical) {
    html = html.replace(
      /<link rel="canonical" href="[^"]*"\s*\/>/,
      `<link rel="canonical" href="${finalCanonical}"/>`,
    );
    html = replaceMeta(html, 'property="og:url"', finalCanonical);
  }
  if (title) {
    html = replaceMeta(html, 'property="og:title"', title);
    html = replaceMeta(html, 'name="twitter:title"', title);
  }
  if (description) {
    html = replaceMeta(html, 'property="og:description"', description);
    html = replaceMeta(html, 'name="twitter:description"', description);
  }
  if (isArticle) {
    html = html.replace(
      /<aside class="article-takeaway"><span>大众点评口碑参考<\/span>[\s\S]*?<\/aside>/,
      "",
    );
    html = replaceMeta(html, 'property="og:type"', "article");
    if (!html.includes('name="author"')) {
      html = html.replace(
        '<meta name="category" content="restaurant"/>',
        '<meta name="category" content="restaurant"/><meta name="author" content="虎娃砂锅菜"/>',
      );
    }
  }
  html = html.replace(
    /href="(\/huwa-chongli\/(?:articles(?:\/[a-z0-9-]+)?|reputation))"/g,
    'href="$1/"',
  );
  html = normalizeEmbeddedJsonLd(html);
  return addPageSchemas(html, { isArticle, path });
}

const articleEntries = await readdir(join(repoRoot, "articles"), {
  withFileTypes: true,
});
const htmlFiles = [join(repoRoot, "articles", "index.html")];
for (const entry of articleEntries) {
  if (entry.isDirectory()) {
    htmlFiles.push(join(repoRoot, "articles", entry.name, "index.html"));
  }
}
htmlFiles.push(join(repoRoot, "index.html"), join(repoRoot, "reputation", "index.html"));

for (const path of htmlFiles) {
  const isArticle = path.includes("/articles/") && !path.endsWith("/articles/index.html");
  const html = await readFile(path, "utf8");
  await writeFile(path, normalizePage(html, { isArticle, path }));
}

const sitemapPath = join(repoRoot, "sitemap.xml");
const sitemap = (await readFile(sitemapPath, "utf8")).replaceAll(
  /<lastmod>[^<]+<\/lastmod>/g,
  "<lastmod>2026-08-02</lastmod>",
);
await writeFile(sitemapPath, sitemap);
