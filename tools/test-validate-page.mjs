import test from "node:test";
import assert from "node:assert/strict";
import { parseSrcset, validateHomeImages, validatePage } from "./validate-page.mjs";

const origin = "https://huwachongli.com";
const pageUrl = origin + "/huwa-chongli/articles/example/";
const guide = { title: "砂锅与堂食指南" };
const image = origin + "/huwa-chongli/assets/images/food.jpg";
const smallImage = origin + "/huwa-chongli/assets/images/food-small.webp";
const otherPage = origin + "/huwa-chongli/articles/other/";

function fixture({ article = {}, breadcrumb = {}, extra = "", graph = false } = {}) {
  const articleData = {
    "@type": "Article",
    headline: guide.title,
    mainEntityOfPage: pageUrl,
    image: [image],
    ...article,
  };
  const breadcrumbData = {
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "虎娃", item: origin + "/" },
      { "@type": "ListItem", position: 2, name: guide.title, item: pageUrl, ...breadcrumb },
    ],
  };
  const schemas = graph ? { "@graph": [articleData, breadcrumbData] } : [articleData, breadcrumbData];
  return '<html><head><title>' + guide.title + '｜虎娃砂锅菜</title>' +
    '<link href="' + pageUrl + '" rel="canonical">' +
    '<meta content="' + pageUrl + '" property="og:url">' +
    '<meta property="og:image" content="' + image + '">' +
    '<script type="application/ld+json">' + JSON.stringify(schemas) + '</script>' +
    '</head><body><h1 class="headline">' + guide.title + '</h1>' +
    '<nav class="visible-breadcrumb"><a href="/">虎娃</a>' +
    '<span aria-current="page">' + guide.title + '</span></nav>' +
    '<section id="位置"><a href="#%E4%BD%8D%E7%BD%AE">位置</a></section>' +
    '<img src="' + image + '" srcset="' + smallImage + ' 480w, ' + image + ' 1200w">' +
    extra + '</body></html>';
}

function check(html, { absent = [], onLookup } = {}) {
  const resources = new Map([
    [origin + "/", { exists: true, html: '<section id="location"></section>' }],
    [pageUrl, { exists: true, html }],
    [otherPage, { exists: true, html: '<h1 id="晚饭">晚饭</h1><a name="legacy"></a>' }],
    [image, { exists: true }],
    [smallImage, { exists: true }],
  ]);
  for (const missing of absent) resources.delete(missing);
  return validatePage({
    html, pageUrl, guide,
    lookupResource(url) {
      onLookup?.(url);
      return resources.get(url) ?? { exists: false };
    },
  });
}

function hasError(errors, pattern) {
  assert.ok(errors.some((error) => pattern.test(error)), JSON.stringify(errors));
}

test("valid guide supports nested schema, absolute images and width srcset", () => {
  assert.deepEqual(check(fixture({ graph: true })), []);
});

test("all page identities are checked even when canonical and og:url agree on the wrong page", () => {
  const html = fixture().replaceAll(pageUrl, otherPage);
  const errors = check(html);
  hasError(errors, /canonical must/);
  hasError(errors, /og:url must/);
  hasError(errors, /Article.mainEntityOfPage/);
  hasError(errors, /last breadcrumb URL/);
});

test("duplicate canonical or og:url is rejected", () => {
  hasError(check(fixture({ extra: '<link rel="canonical" href="' + pageUrl + '">' })), /canonical must/);
  hasError(check(fixture({ extra: '<meta property="og:url" content="' + pageUrl + '">' })), /og:url must/);
});

test("Article WebPage object form resolves its page identity", () => {
  assert.deepEqual(check(fixture({ article: { mainEntityOfPage: { "@type": "WebPage", "@id": pageUrl } } })), []);
  hasError(check(fixture({ article: { mainEntityOfPage: { "@id": otherPage } } })), /Article.mainEntityOfPage/);
});

test("missing Article fails for every guide", () => {
  hasError(check(fixture().replace('"@type":"Article"', '"@type":"WebPage"')), /guide must have one Article/);
});

test("each guide title, H1 and Article headline follow the source data", () => {
  hasError(check(fixture().replace('<title>' + guide.title, '<title>旧标题')), /^title differs/);
  hasError(check(fixture().replace('<h1 class="headline">' + guide.title, '<h1>旧标题')), /^H1 differs/);
  hasError(check(fixture({ article: { headline: "旧标题" } })), /Article.headline differs/);
});

test("visible and structured breadcrumb names must follow the guide", () => {
  hasError(check(fixture().replace('aria-current="page">' + guide.title, 'aria-current="page">旧标题')), /visible breadcrumb differs/);
  hasError(check(fixture({ breadcrumb: { name: "旧标题" } })), /last breadcrumb name differs/);
});

test("breadcrumb must be present with sequential positions and this page at the end", () => {
  hasError(check(fixture().replace('"@type":"BreadcrumbList"', '"@type":"ItemList"')), /must have one BreadcrumbList/);
  hasError(check(fixture({ breadcrumb: { position: 4 } })), /positions must be sequential/);
  hasError(check(fixture({ breadcrumb: { item: otherPage } })), /last breadcrumb URL/);
});

test("inline heading markup and numeric entities preserve the visible title", () => {
  const html = fixture().replace('<h1 class="headline">' + guide.title, '<h1><strong>砂锅</strong>&#19982;堂食指南');
  assert.deepEqual(check(html), []);
});

test("single-quoted href attributes and encoded fragments are checked", () => {
  assert.deepEqual(check(fixture({ extra: "<a href='" + otherPage + "#%E6%99%9A%E9%A5%AD'>晚饭</a>" })), []);
  hasError(check(fixture({ extra: "<a href='" + otherPage + "#missing'>晚饭</a>" })), /missing fragment/);
});

test("legacy named anchors and text fragments are supported", () => {
  assert.deepEqual(check(fixture({ extra: '<a href="' + otherPage + '#legacy">旧锚点</a><a href="/#:~:text=虎娃">文字定位</a>' })), []);
});

test("missing local page and same-page anchor fail", () => {
  hasError(check(fixture({ extra: '<a href="/missing/">链接</a>' })), /missing local resource \/missing\//);
  hasError(check(fixture({ extra: '<a href="#missing">链接</a>' })), /missing fragment/);
});

test("invalid fragment encoding fails cleanly", () => {
  hasError(check(fixture({ extra: '<a href="#%ZZ">链接</a>' })), /invalid fragment encoding/);
});

test("absolute image source and every srcset candidate must exist", () => {
  hasError(check(fixture(), { absent: [image] }), /img.src: missing local resource/);
  hasError(check(fixture(), { absent: [smallImage] }), /img.srcset: missing local resource/);
});

test("density srcset with relative paths and preload candidates is checked", () => {
  const html = fixture({ extra: '<picture><source srcset="../../assets/images/food-small.webp 1x, ../../assets/images/food.jpg 2x"></picture>' +
    '<link rel="preload" as="image" imagesrcset="' + smallImage + ' 480w, ' + image + ' 1200w">' });
  assert.deepEqual(check(html), []);
  hasError(check(html, { absent: [smallImage] }), /preload.imagesrcset: missing/);
});

test("invalid or empty srcset descriptors fail", () => {
  hasError(check(fixture({ extra: '<img srcset="">' })), /empty srcset/);
  hasError(check(fixture({ extra: '<img srcset="' + image + ' 0w">' })), /invalid srcset descriptor/);
  hasError(check(fixture({ extra: '<img srcset="' + image + ' 2x 800w">' })), /invalid srcset descriptor/);
});

test("data URLs containing commas are parsed without treating their data as local files", () => {
  assert.deepEqual(parseSrcset("data:image/png;base64,AAAA 1x, /photo.jpg 2x"), [
    { url: "data:image/png;base64,AAAA", descriptor: "1x" },
    { url: "/photo.jpg", descriptor: "2x" },
  ]);
  assert.deepEqual(check(fixture({ extra: '<img srcset="data:image/png;base64,AAAA 1x, ' + image + ' 2x">' })), []);
});

test("metadata and nested ImageObject URLs are checked", () => {
  hasError(check(fixture().replace('property="og:image" content="' + image, 'property="og:image" content="' + origin + '/missing.jpg')), /metadata image: missing/);
  hasError(check(fixture({ article: { image: { "@type": "ImageObject", contentUrl: origin + "/missing.jpg" } } })), /ImageObject.contentUrl: missing/);
});

test("HTTP and www internal links are reported without network access", () => {
  hasError(check(fixture({ extra: '<a href="http://huwachongli.com/">首页</a>' })), /canonical HTTPS origin/);
  hasError(check(fixture({ extra: '<img src="https://www.huwachongli.com/huwa-chongli/assets/images/food.jpg">' })), /canonical HTTPS origin/);
});

test("external links, mail and telephone never invoke resource lookup", () => {
  const checked = [];
  const html = fixture({ extra: '<a href="https://example.com/a">外链</a><a href="tel:123">电话</a><a href="mailto:a@example.com">邮箱</a><img src="https://example.com/photo.jpg">' });
  assert.deepEqual(check(html, { onLookup: (url) => checked.push(url) }), []);
  assert.ok(checked.every((url) => url.startsWith(origin + "/")));
});

test("HTML comments cannot supply canonical tags or missing anchor targets", () => {
  assert.deepEqual(check(fixture({ extra: '<!-- <link rel="canonical" href="/wrong/"> -->' })), []);
  hasError(check(fixture({ extra: '<!-- <section id="missing"></section> --><a href="#missing">链接</a>' })), /missing fragment/);
});

test("above-fold eager images are allowed without mandatory lazy loading", () => {
  assert.deepEqual(check(fixture().replace('<img src=', '<img loading="eager" fetchpriority="high" src=')), []);
});

const homeImage = { url: image, width: 1200, height: 800, alt: "真实砂锅" };
function homeFixture() {
  return {
    pageUrl: origin + "/",
    homeImages: [homeImage],
    homeShareImage: homeImage,
    html: '<meta property="og:image" content="' + image + '">' +
      '<meta name="twitter:image" content="' + image + '">' +
      '<meta property="og:image:width" content="1200">' +
      '<meta property="og:image:height" content="800">' +
      '<meta property="og:image:alt" content="真实砂锅">' +
      '<img src="/huwa-chongli/assets/images/food.jpg">',
    sitemap: '<urlset><url><loc>' + origin + '/</loc><image:image><image:loc>' +
      image + '</image:loc></image:image></url></urlset>',
  };
}

test("homepage metadata and image sitemap match actual page imagery", () => {
  assert.deepEqual(validateHomeImages(homeFixture()), []);
});

test("stale homepage share image or dimensions fail", () => {
  const input = homeFixture();
  input.html = input.html.replace('name="twitter:image" content="' + image,
    'name="twitter:image" content="' + smallImage).replace('content="1200"', 'content="600"');
  const errors = validateHomeImages(input);
  hasError(errors, /OG\/Twitter image differs/);
  hasError(errors, /dimensions\/alt differ/);
});

test("homepage discovery imagery must appear in img or source, not metadata alone", () => {
  const input = homeFixture();
  input.html = input.html.replace(/<img[^>]*>/g, "");
  hasError(validateHomeImages(input), /not rendered in HTML/);
  input.html += '<picture><source srcset="' + image + ' 1200w"></picture>';
  assert.deepEqual(validateHomeImages(input), []);
});

test("missing, duplicate and unapproved homepage sitemap images fail", () => {
  for (const replacement of ["", image + "</image:loc><image:loc>" + image, smallImage]) {
    const input = homeFixture();
    input.sitemap = input.sitemap.replace(image, replacement);
    hasError(validateHomeImages(input), /sitemap image list differs/);
  }
});
