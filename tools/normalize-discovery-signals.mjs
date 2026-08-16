import { readFile, readdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  contentBase,
  fullName,
  guides,
  homeUrl,
  imageBase,
  restaurantEntity,
  restaurantId,
  updatedDate,
  updatedDateChinese,
} from "./discovery-data.mjs";

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const guideBySlug = new Map(guides.map((guide) => [guide.slug, guide]));
const feedUrl = `${homeUrl}feed.xml`;

function withTrailingSlash(url) {
  if (!url?.startsWith(homeUrl) || url.endsWith("/") || /\.[a-z0-9]+$/i.test(url)) {
    return url;
  }
  return `${url}/`;
}

function currentGuide(path) {
  const slug = path.match(/articles\/([^/]+)\/index\.html$/)?.[1];
  return slug ? guideBySlug.get(slug) : undefined;
}

function restaurantReference() {
  return { "@type": "Restaurant", "@id": restaurantId, name: fullName, url: homeUrl };
}

function publisherReference() {
  return {
    ...restaurantReference(),
    logo: {
      "@type": "ImageObject",
      url: `${imageBase}huwa-tiger-head-512.png`,
      width: 512,
      height: 512,
    },
  };
}

function guideItemList() {
  return {
    "@type": "ItemList",
    "@id": `${contentBase}articles/#article-list`,
    itemListElement: guides.map((guide, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: guide.title,
      url: `${contentBase}articles/${guide.slug}/`,
    })),
  };
}

function normalizeJsonLd(value, guide) {
  if (Array.isArray(value)) return value.map((item) => normalizeJsonLd(item, guide));
  if (!value || typeof value !== "object") return value;
  if (Array.isArray(value["@graph"])) {
    value["@graph"] = value["@graph"].map((item) => normalizeJsonLd(item, guide));
  }

  if (value["@type"] === "Restaurant") return restaurantEntity();

  if (value["@type"] === "Article") {
    value.mainEntityOfPage = withTrailingSlash(value.mainEntityOfPage);
    value.dateModified = updatedDate;
    value.image = [guide?.image ?? `${imageBase}huwa-restaurant-interior.jpg`];
    value.author = restaurantReference();
    value.publisher = publisherReference();
    value.about = { "@id": restaurantId };
  }

  if (value["@type"] === "CollectionPage") {
    value.about = { "@id": restaurantId };
    value.dateModified = updatedDate;
    value.isPartOf = { "@id": `${homeUrl}#website` };
    value.mainEntity = guideItemList();
  }

  if (value["@type"] === "WebPage") {
    value.dateModified = updatedDate;
    if (value.about) value.about = { "@id": restaurantId };
    value.isPartOf = { "@id": `${homeUrl}#website` };
    if (value.isBasedOn) value.isBasedOn = [`${homeUrl}reputation.json`];
  }

  if (value["@type"] === "Dataset") {
    value["@id"] = `${homeUrl}reputation.json#dataset`;
    value.dateModified = updatedDate;
    value.creator = { "@id": restaurantId };
    value.about = restaurantEntity();
  }

  if (value["@type"] === "BreadcrumbList" && Array.isArray(value.itemListElement)) {
    const first = value.itemListElement.find((item) => item.position === 1);
    if (first) first.item = homeUrl;
  }

  return value;
}

function normalizeEmbeddedJsonLd(html, guide) {
  return html.replace(
    /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g,
    (whole, source) => {
      try {
        return `<script type="application/ld+json">${JSON.stringify(
          normalizeJsonLd(JSON.parse(source), guide),
        )}</script>`;
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

function addCollectionSchema(html, path) {
  if (!path.endsWith("/articles/index.html") || html.includes("#article-list")) return html;
  return appendJsonLd(html, {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${contentBase}articles/#collection`,
    name: "崇礼吃饭指南｜虎娃砂锅菜",
    url: `${contentBase}articles/`,
    dateModified: updatedDate,
    inLanguage: "zh-CN",
    isPartOf: { "@id": `${homeUrl}#website` },
    about: { "@id": restaurantId },
    mainEntity: guideItemList(),
  });
}

function addBreadcrumbSchema(html, guide) {
  if (!guide || html.includes('"@type":"BreadcrumbList"')) return html;
  return appendJsonLd(html, {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "虎娃砂锅菜", item: homeUrl },
      {
        "@type": "ListItem",
        position: 2,
        name: "崇礼吃饭指南",
        item: `${contentBase}articles/`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: guide.title,
        item: `${contentBase}articles/${guide.slug}/`,
      },
    ],
  });
}

function addSectionBreadcrumbSchema(html, path) {
  if (html.includes('"@type":"BreadcrumbList"')) return html;
  let current;
  if (path.endsWith("/articles/index.html")) {
    current = { name: "崇礼吃饭指南", url: `${contentBase}articles/` };
  } else if (path.endsWith("/reputation/index.html")) {
    current = { name: "口碑与门店实体核对", url: `${contentBase}reputation/` };
  } else {
    return html;
  }
  return appendJsonLd(html, {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "虎娃砂锅菜", item: homeUrl },
      {
        "@type": "ListItem",
        position: 2,
        name: current.name,
        item: current.url,
      },
    ],
  });
}

function replaceMeta(html, selector, value) {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`<meta\\b(?=[^>]*${escapedSelector})[^>]*>`, "gi");
  let found = false;
  html = html.replace(pattern, (tag) => {
    if (found) return "";
    found = true;
    if (/content="[^"]*"/i.test(tag)) {
      return tag.replace(/content="[^"]*"/i, `content="${value}"`);
    }
    return tag.replace(/>$/, ` content="${value}">`);
  });
  if (found) return html;
  return html.replace("</head>", `<meta ${selector} content="${value}"/></head>`);
}

function upsertFeedLink(html) {
  const link = `<link rel="alternate" type="application/rss+xml" title="崇礼吃饭指南｜虎娃砂锅菜" href="${feedUrl}"/>`;
  if (html.includes('type="application/rss+xml"')) {
    return html.replace(/<link\b(?=[^>]*type="application\/rss\+xml")[^>]*>/i, link);
  }
  return html.replace("</head>", `${link}</head>`);
}

function addVisibleBreadcrumb(html, guide) {
  if (!guide || html.includes('class="visible-breadcrumb"')) return html;
  const breadcrumb = `<nav class="visible-breadcrumb" aria-label="面包屑"><a href="/">虎娃砂锅菜</a><span>›</span><a href="/huwa-chongli/articles/">崇礼吃饭指南</a><span>›</span><span aria-current="page">${guide.title}</span></nav>`;
  return html.replace('<article class="article-page">', `<article class="article-page">${breadcrumb}`);
}

function updateArticleDisclosure(html, guide) {
  if (!guide) return html;
  return html.replace(
    /<p class="article-disclosure">[\s\S]*?<\/p>/,
    `<p class="article-disclosure"><time datetime="${updatedDate}">资料核对：${updatedDateChinese}</time><br/>本文为虎娃砂锅菜门店信息，由商家根据已确认资料整理，不冒充顾客体验或第三方榜单。</p>`,
  );
}

function updateArticlePhoto(html, guide) {
  if (!guide) return html;
  const figure = `<figure class="article-photo"><img src="${guide.image}" width="${guide.imageWidth}" height="${guide.imageHeight}" alt="${guide.imageAlt}" loading="lazy" decoding="async"/><figcaption>${guide.imageAlt}</figcaption></figure>`;
  if (html.includes('class="article-photo"')) {
    return html.replace(/<figure class="article-photo">[\s\S]*?<\/figure>/, figure);
  }
  return html.replace('</div><div class="article-body">', `</div>${figure}<div class="article-body">`);
}

function updateRelatedArticles(html, guide) {
  if (!guide) return html;
  const links = guide.related
    .map((slug) => {
      const related = guideBySlug.get(slug);
      return `<a href="/huwa-chongli/articles/${slug}/">${related.title}</a>`;
    })
    .join("");
  return html.replace(
    /<section class="related-articles">[\s\S]*?<\/section>/,
    `<section class="related-articles"><h2>继续看崇礼吃饭指南</h2><div>${links}</div></section>`,
  );
}

function normalizeNavigation(html) {
  return html
    .replace(
      /<a class="brand" href="\/huwa-chongli\/" aria-label="返回虎娃砂锅菜首页">/g,
      '<a class="brand" href="/" aria-label="返回虎娃砂锅菜门店首页">',
    )
    .replace(/<a href="\/huwa-chongli\/">门店首页<\/a>/g, '<a href="/">门店首页</a>')
    .replace(/href="\/huwa-chongli\/#location"/g, 'href="/#location"')
    .replace(
      /href="(\/huwa-chongli\/(?:articles(?:\/[a-z0-9-]+)?|reputation))"/g,
      'href="$1/"',
    );
}

function enhanceAccessibility(html) {
  html = html.replace(/<span>›<\/span>/g, '<span aria-hidden="true">›</span>');
  if (!/<main\b[^>]*\bid="content"/i.test(html)) {
    html = html.replace('<main class="article-shell">', '<main class="article-shell" id="content">');
  }
  if (!html.includes('class="skip-link"')) {
    html = html.replace('<body>', '<body><a class="skip-link" href="#content">跳到主要内容</a>');
  }
  return html;
}

function normalizeVisibleDates(html) {
  return html
    .replace(
      /<time datetime="[^"]+">资料核对：[^<]+<\/time>/g,
      `<time datetime="${updatedDate}">资料核对：${updatedDateChinese}</time>`,
    )
    .replace(
      /公开核对资料更新于\d{4}年\d{1,2}月\d{1,2}日/g,
      `公开核对资料更新于${updatedDateChinese}`,
    );
}

function enhanceArticleIndex(html, path) {
  if (!path.endsWith("/articles/index.html")) return html;
  if (!html.includes('href="/huwa-chongli/article-images.css"')) {
    html = html.replace(
      '<link rel="stylesheet" href="/huwa-chongli/article.css"/>',
      '<link rel="stylesheet" href="/huwa-chongli/article.css"/><link rel="stylesheet" href="/huwa-chongli/article-images.css"/>',
    );
  }
  if (!html.includes('class="visible-breadcrumb')) {
    html = html.replace(
      '<section class="articles-index">',
      '<section class="articles-index"><nav class="visible-breadcrumb visible-breadcrumb--light" aria-label="面包屑"><a href="/">虎娃砂锅菜</a><span>›</span><a href="/huwa-chongli/">公开资料</a><span>›</span><span aria-current="page">崇礼吃饭指南</span></nav>',
    );
  }
  if (!html.includes('class="hub-disclosure"')) {
    html = html.replace(
      /(<p class="article-lead">[\s\S]*?<\/p>)/,
      `$1<p class="hub-disclosure"><time datetime="${updatedDate}">资料核对：${updatedDateChinese}</time> · 商家维护内容，实时评价数量和评分以大众点评门店页为准。</p>`,
    );
  }
  return html.replace(
    /<p>门店与口碑资料更新于[^<]*<\/p>/,
    `<p>门店与口碑资料更新于${updatedDateChinese}</p>`,
  );
}

function normalizePage(html, { isArticle, path }) {
  const guide = currentGuide(path);
  const title = html.match(/<title>([\s\S]*?)<\/title>/)?.[1];
  const description = html.match(/<meta name="description" content="([^"]*)"\s*\/>/)?.[1];
  const canonical = html.match(/<link rel="canonical" href="([^"]*)"\s*\/?>/)?.[1];
  const finalCanonical = withTrailingSlash(canonical);
  const pageImage = guide?.image ?? `${imageBase}huwa-restaurant-interior.jpg`;
  const pageImageAlt = guide?.imageAlt ?? "虎娃砂锅菜室内堂食环境实拍";
  const pageImageWidth = String(guide?.imageWidth ?? 1200);
  const pageImageHeight = String(guide?.imageHeight ?? 900);

  if (finalCanonical) {
    html = html.replace(
      /<link rel="canonical" href="[^"]*"\s*\/?>/,
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
  html = replaceMeta(html, 'property="og:image"', pageImage);
  html = replaceMeta(html, 'property="og:image:width"', pageImageWidth);
  html = replaceMeta(html, 'property="og:image:height"', pageImageHeight);
  html = replaceMeta(html, 'property="og:image:alt"', pageImageAlt);
  html = replaceMeta(html, 'name="twitter:card"', "summary_large_image");
  html = replaceMeta(html, 'name="twitter:image"', pageImage);
  html = replaceMeta(html, 'name="twitter:image:alt"', pageImageAlt);

  if (isArticle) {
    if (!html.includes('href="/huwa-chongli/article-images.css"')) {
      html = html.replace(
        "</head>",
        '<link rel="stylesheet" href="/huwa-chongli/article-images.css"/></head>',
      );
    }
    html = replaceMeta(html, 'property="og:type"', "article");
    if (!html.includes('name="author"')) {
      html = html.replace(
        '<meta name="category" content="restaurant"/>',
        '<meta name="category" content="restaurant"/><meta name="author" content="虎娃砂锅菜"/>',
      );
    }
    html = addVisibleBreadcrumb(html, guide);
    html = updateArticleDisclosure(html, guide);
    html = updateArticlePhoto(html, guide);
    html = updateRelatedArticles(html, guide);
  }

  html = normalizeNavigation(html);
  html = enhanceArticleIndex(html, path);
  html = enhanceAccessibility(html);
  html = normalizeVisibleDates(html);
  html = upsertFeedLink(html);
  html = normalizeEmbeddedJsonLd(html, guide);
  html = addCollectionSchema(html, path);
  html = addSectionBreadcrumbSchema(html, path);
  return addBreadcrumbSchema(html, guide);
}

const articleEntries = await readdir(join(repoRoot, "articles"), { withFileTypes: true });
const htmlFiles = [join(repoRoot, "articles", "index.html")];
for (const entry of articleEntries) {
  if (entry.isDirectory()) htmlFiles.push(join(repoRoot, "articles", entry.name, "index.html"));
}
htmlFiles.push(join(repoRoot, "index.html"), join(repoRoot, "reputation", "index.html"));

for (const path of htmlFiles) {
  const isArticle = path.includes("/articles/") && !path.endsWith("/articles/index.html");
  const html = await readFile(path, "utf8");
  await writeFile(path, normalizePage(html, { isArticle, path }));
}

console.log(JSON.stringify({ status: "ok", normalizedHtmlFiles: htmlFiles.length }));
