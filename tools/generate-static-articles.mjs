import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const localOrigin = "http://127.0.0.1:3000";
const officialOrigin = "https://huwa-chongli.aware-maple-3401.chatgpt.site";
const mirrorOrigin = "https://huwachongli.com/huwa-chongli";
const paths = [
  "/articles",
  "/articles/chongli-food-guide",
  "/articles/cuiyunshan-restaurant",
  "/articles/jinling-hotel-nearby-food",
  "/articles/after-ski-hot-food",
  "/articles/chongli-local-cuisine",
  "/articles/chongli-summer-night-food",
];

function makeStatic(html) {
  const document = html.slice(0, html.indexOf("</html>") + "</html>".length);
  return document
    .replace(
      /<link rel="stylesheet"[^>]+>/,
      '<link rel="stylesheet" href="/huwa-chongli/article.css"/>',
    )
    .replace(/<link rel="modulepreload"[^>]+>/g, "")
    .replace(/<script(?! type="application\/ld\+json")[\s\S]*?<\/script>/g, "")
    .replaceAll(officialOrigin, mirrorOrigin)
    .replace(/href="\/(?!huwa-chongli\/)/g, 'href="/huwa-chongli/')
    .replace(/href="\/huwa-chongli\/#location"/g, 'href="/huwa-chongli/#location"');
}

for (const pathname of paths) {
  const response = await fetch(`${localOrigin}${pathname}`);
  if (!response.ok) {
    throw new Error(`${pathname} returned ${response.status}`);
  }
  const html = makeStatic(await response.text());
  const destination = join(repoRoot, pathname.slice(1), "index.html");
  await mkdir(dirname(destination), { recursive: true });
  await writeFile(destination, html);
}

const cssSource = join(
  dirname(repoRoot),
  "huwa-ai-site",
  "dist",
  "client",
  "assets",
);
const assetNames = await import("node:fs/promises").then(({ readdir }) =>
  readdir(cssSource),
);
const cssName = assetNames.find((name) => name.endsWith(".css"));
if (!cssName) {
  throw new Error("Built CSS asset not found");
}
await writeFile(
  join(repoRoot, "article.css"),
  `${await readFile(join(cssSource, cssName))}\n.article-photo{max-width:1120px;margin:0 auto;background:#17120f}.article-photo img{width:100%;aspect-ratio:4/3;object-fit:cover}.article-photo figcaption{color:#fff7e9a8;padding:12px max(7vw,24px) 16px;font-family:PingFang SC,sans-serif;font-size:12px}\n`,
);
