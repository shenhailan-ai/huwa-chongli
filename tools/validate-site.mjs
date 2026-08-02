import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

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

  for (const match of html.matchAll(
    /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g,
  )) {
    jsonLdCount += 1;
    try {
      const data = JSON.parse(match[1]);
      if (data["@type"] === "Article") {
        if (!Array.isArray(data.image) || data.image.length !== 1) {
          errors.push(`${relative(root, file)}: Article.image must have one item`);
        } else if (data.image[0] !== ogImage) {
          errors.push(`${relative(root, file)}: Article.image differs from og:image`);
        }
      }
    } catch (error) {
      errors.push(`${relative(root, file)}: invalid JSON-LD (${error.message})`);
    }
  }

  for (const match of html.matchAll(
    /(?:src|href)="(\/huwa-chongli\/(?:assets\/images\/[^"]+|article-images\.css))"/g,
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
  }
}

function validateTree(root, directory = root) {
  for (const name of readdirSync(directory)) {
    if (name === ".git") continue;
    const file = join(directory, name);
    if (statSync(file).isDirectory()) {
      validateTree(root, file);
    } else if (name.endsWith(".html")) {
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

for (const image of [
  "huwa-xuyi-crayfish-four-flavors.jpg",
  "huwa-xuyi-crayfish-closeup.jpg",
  "huwa-grilled-skewers.jpg",
  "huwa-hand-threaded-skewers.jpg",
  "huwa-restaurant-interior.jpg",
]) {
  const file = join(repoRoot, "assets/images", image);
  if (!existsSync(file)) errors.push(`missing image: ${image}`);
}

if (errors.length > 0) {
  console.error(errors.join("\n"));
  process.exitCode = 1;
} else {
  console.log(
    JSON.stringify({ status: "ok", htmlCount, jsonLdCount, checkedImages: 5 }),
  );
}
