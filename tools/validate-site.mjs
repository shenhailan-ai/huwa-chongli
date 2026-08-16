import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import {
  formatRfcDate,
  guides,
  publishedDate,
  restaurantEntity,
  restaurantId,
  updatedDate,
} from "./discovery-data.mjs";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const rootSite = resolve(repoRoot, "../shenhailan-ai.github.io");
const errors = [];
let htmlCount = 0;
let jsonLdCount = 0;

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function validateHtml(file, root) {
  htmlCount += 1;
  const html = readFileSync(file, "utf8");
  const ogImage = html.match(
    /<meta\b(?=[^>]*property="og:image")[^>]*content="([^"]*)"[^>]*>/i,
  )?.[1];

  const canonicalCount = html.match(/<link\b(?=[^>]*rel="canonical")[^>]*>/gi)?.length ?? 0;
  if (canonicalCount !== 1) {
    errors.push(`${relative(root, file)}: canonical count is ${canonicalCount}`);
  }

  const feedCount =
    html.match(/<link\b(?=[^>]*type="application\/rss\+xml")[^>]*>/gi)?.length ?? 0;
  if (feedCount !== 1) {
    errors.push(`${relative(root, file)}: RSS discovery link count is ${feedCount}`);
  }

  for (const match of html.matchAll(
    /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g,
  )) {
    jsonLdCount += 1;
    try {
      const data = JSON.parse(match[1]);
      const queue = [data];
      while (queue.length > 0) {
        const current = queue.pop();
        if (Array.isArray(current)) {
          queue.push(...current);
        } else if (current && typeof current === "object") {
          if (current["@type"] === "Restaurant" && current["@id"] !== restaurantId) {
            errors.push(
              `${relative(root, file)}: Restaurant @id is ${current["@id"] ?? "missing"}`,
            );
          }
          queue.push(...Object.values(current));
        }
      }
      if (data["@type"] === "Article") {
        if (!Array.isArray(data.image) || data.image.length !== 1) {
          errors.push(`${relative(root, file)}: Article.image must have one item`);
        } else if (data.image[0] !== ogImage) {
          errors.push(`${relative(root, file)}: Article.image differs from og:image`);
        }
        if (data.dateModified !== updatedDate) {
          errors.push(`${relative(root, file)}: stale Article.dateModified`);
        }
        if (data.author?.["@id"] !== restaurantId || data.publisher?.["@id"] !== restaurantId) {
          errors.push(`${relative(root, file)}: Article author/publisher entity differs`);
        }
      }
    } catch (error) {
      errors.push(`${relative(root, file)}: invalid JSON-LD (${error.message})`);
    }
  }

  for (const match of html.matchAll(
    /(?:src|href|srcset)="(\/huwa-chongli\/(?:assets\/images\/[^"]+|(?:article-images|site)\.css))"/g,
  )) {
    const local = join(repoRoot, match[1].replace(/^\/huwa-chongli\//, ""));
    if (!existsSync(local)) {
      errors.push(`${relative(root, file)}: missing ${match[1]}`);
    }
  }

  for (const selector of ['property="og:image"', 'name="twitter:image"']) {
    const pattern = new RegExp(
      `<meta\\b(?=[^>]*${escapeRegex(selector)})[^>]*>`,
      "gi",
    );
    const count = html.match(pattern)?.length ?? 0;
    if (count !== 1) {
      errors.push(`${relative(root, file)}: ${selector} count is ${count}`);
    }
  }

  const isGuide =
    file.includes(`${sep}articles${sep}`) &&
    file.endsWith(`${sep}index.html`) &&
    file !== join(root, "articles", "index.html");
  if (isGuide) {
    const photoCount = html.match(/class="article-photo"/g)?.length ?? 0;
    const cssCount =
      html.match(/href="\/huwa-chongli\/article-images\.css"/g)?.length ?? 0;
    if (photoCount !== 1) {
      errors.push(`${relative(root, file)}: article-photo count is ${photoCount}`);
    }
    if (cssCount !== 1) {
      errors.push(`${relative(root, file)}: article image CSS count is ${cssCount}`);
    }
    if (!html.includes('class="visible-breadcrumb"')) {
      errors.push(`${relative(root, file)}: missing visible breadcrumb`);
    }
    if (!html.includes(`datetime="${updatedDate}"`)) {
      errors.push(`${relative(root, file)}: missing visible verification date`);
    }
    if (!html.includes('loading="lazy"')) {
      errors.push(`${relative(root, file)}: article image is not lazy loaded`);
    }
  }
}

function validateTree(root, directory = root) {
  for (const name of readdirSync(directory)) {
    if (name === ".git") continue;
    const file = join(directory, name);
    if (statSync(file).isDirectory()) {
      validateTree(root, file);
    } else if (name.endsWith(".html") && !/^baidu_verify_[^.]+\.html$/.test(name)) {
      validateHtml(file, root);
    } else if (name.endsWith(".json")) {
      try {
        JSON.parse(readFileSync(file, "utf8"));
      } catch (error) {
        errors.push(`${relative(root, file)}: invalid JSON (${error.message})`);
      }
    }
  }
}

validateTree(repoRoot);
validateTree(rootSite);

const rootRestaurant = readFileSync(join(rootSite, "restaurant.json"), "utf8");
const projectRestaurant = readFileSync(join(repoRoot, "restaurant.json"), "utf8");
const rootReputation = readFileSync(join(rootSite, "reputation.json"), "utf8");
const projectReputation = readFileSync(join(repoRoot, "reputation.json"), "utf8");
if (rootRestaurant !== projectRestaurant) {
  errors.push("restaurant.json copies differ");
}
if (rootReputation !== projectReputation) {
  errors.push("reputation.json copies differ");
}

const restaurant = JSON.parse(rootRestaurant);
if (restaurant["@id"] !== restaurantId || restaurant.url !== "https://huwachongli.com/") {
  errors.push("canonical restaurant identity is inconsistent");
}

function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, item]) => [key, stableValue(item)]),
  );
}

const rootHomeHtml = readFileSync(join(rootSite, "index.html"), "utf8");
let embeddedRestaurant;
for (const match of rootHomeHtml.matchAll(
  /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g,
)) {
  const data = JSON.parse(match[1]);
  embeddedRestaurant = data["@graph"]?.find((item) => item["@type"] === "Restaurant");
  if (embeddedRestaurant) break;
}
const expectedEmbeddedRestaurant = restaurantEntity();
delete expectedEmbeddedRestaurant["@context"];
if (
  !embeddedRestaurant ||
  JSON.stringify(stableValue(embeddedRestaurant)) !==
    JSON.stringify(stableValue(expectedEmbeddedRestaurant))
) {
  errors.push("root homepage Restaurant differs from the discovery fact source");
}
for (const expected of [
  "https://www.amap.com/place/B0L1SRQCMW",
  "https://m.dianping.com/shop/1743046600",
  "https://map.baidu.com/?newmap=1&s=inf%26uid%3D7e4369ff178e673ff942b2e8",
]) {
  if (!restaurant.sameAs?.includes(expected)) errors.push(`restaurant sameAs missing ${expected}`);
}

const feedPath = join(rootSite, "feed.xml");
if (!existsSync(feedPath)) {
  errors.push("missing canonical feed.xml");
} else {
  const feed = readFileSync(feedPath, "utf8");
  const itemCount = feed.match(/<item>/g)?.length ?? 0;
  if (itemCount !== 6) errors.push(`feed.xml item count is ${itemCount}`);
  if (!feed.includes(`<lastBuildDate>${formatRfcDate(updatedDate)}</lastBuildDate>`)) {
    errors.push("feed.xml has a stale lastBuildDate");
  }
  for (const guide of guides) {
    const url = `https://huwachongli.com/huwa-chongli/articles/${guide.slug}/`;
    const item = feed.match(
      new RegExp(`<item>[\\s\\S]*?<guid isPermaLink="true">${escapeRegex(url)}</guid>[\\s\\S]*?</item>`),
    )?.[0];
    if (!item) {
      errors.push(`feed.xml missing item for ${guide.slug}`);
      continue;
    }
    if (!item.includes(`<pubDate>${formatRfcDate(publishedDate)}</pubDate>`)) {
      errors.push(`feed.xml ${guide.slug} has a stale pubDate`);
    }
    if (!item.includes(`<dcterms:modified>${updatedDate}</dcterms:modified>`)) {
      errors.push(`feed.xml ${guide.slug} has a stale modified date`);
    }
  }
}

const rejectedDianpingId = "125" + "966321";
for (const root of [repoRoot, rootSite]) {
  for (const file of ["README.md", "llms.txt", "restaurant.json", "reputation.json", "index.html"]) {
    const path = join(root, file);
    if (existsSync(path) && readFileSync(path, "utf8").includes(rejectedDianpingId)) {
      errors.push(`${relative(repoRoot, path)} contains rejected Dianping shop ID`);
    }
  }
}

for (const [file, expectedCount] of [
  [join(rootSite, "sitemap.xml"), 10],
  [join(repoRoot, "sitemap.xml"), 9],
]) {
  const sitemap = readFileSync(file, "utf8");
  const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
  const pageUrls = urls.filter((url) => !url.includes("/assets/images/"));
  if (pageUrls.length !== expectedCount) {
    errors.push(`${relative(repoRoot, file)} page URL count is ${pageUrls.length}`);
  }
  if (new Set(pageUrls).size !== pageUrls.length) {
    errors.push(`${relative(repoRoot, file)} contains duplicate page URLs`);
  }
}

for (const image of [
  "huwa-xuyi-crayfish-four-flavors.jpg",
  "huwa-xuyi-crayfish-closeup.jpg",
  "huwa-grilled-skewers.jpg",
  "huwa-hand-threaded-skewers.jpg",
  "huwa-restaurant-interior.jpg",
  "huwa-entrance-wide.jpg",
  "huwa-interior-wide.jpg",
  "huwa-sandpot-mapo-tofu.jpg",
]) {
  const file = join(repoRoot, "assets/images", image);
  if (!existsSync(file)) errors.push(`missing image: ${image}`);
}

if (errors.length > 0) {
  console.error(errors.join("\n"));
  process.exitCode = 1;
} else {
  console.log(
    JSON.stringify({ status: "ok", htmlCount, jsonLdCount, checkedImages: 8 }),
  );
}
