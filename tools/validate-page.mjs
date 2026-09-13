// Pure, offline checks. The caller supplies resource lookup; no network or writes.
function decodeHtml(value = "") {
  const named = { amp: "&", quot: '"', apos: "'", lt: "<", gt: ">", nbsp: " " };
  return value.replace(/&(#x[0-9a-f]+|#\d+|amp|quot|apos|lt|gt|nbsp);/gi, (source, entity) => {
    if (!entity.startsWith("#")) return named[entity.toLowerCase()];
    const code = /^#x/i.test(entity) ? parseInt(entity.slice(2), 16) : Number(entity.slice(1));
    return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : source;
  });
}

function textContent(html = "") {
  return decodeHtml(html.replace(/<[^>]*>/g, "")).replace(/\s+/g, " ").trim();
}

function attributes(source = "") {
  const result = {};
  for (const match of source.matchAll(/([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g)) {
    result[match[1].toLowerCase()] = decodeHtml(match[2] ?? match[3] ?? match[4] ?? "");
  }
  return result;
}

function tags(html) {
  return [...html.matchAll(/<([a-z][\w:-]*)\b((?:"[^"]*"|'[^']*'|[^'">])*)>/gi)]
    .map((match) => ({ name: match[1].toLowerCase(), attrs: attributes(match[2]) }));
}

function hasType(value, type) {
  return [].concat(value?.["@type"] ?? []).includes(type);
}

function schemaObjects(value) {
  if (Array.isArray(value)) return value.flatMap(schemaObjects);
  if (!value || typeof value !== "object") return [];
  return [value, ...Object.values(value).flatMap(schemaObjects)];
}

function schemaUrl(value) {
  return typeof value === "string" ? value : value?.url ?? value?.["@id"];
}

export function parseSrcset(source) {
  const candidates = [];
  let remaining = source.trim();
  while (remaining) {
    remaining = remaining.replace(/^[\s,]+/, "");
    if (!remaining) break;
    const token = remaining.match(/^\S+/)[0];
    remaining = remaining.slice(token.length);
    if (token.endsWith(",")) {
      candidates.push({ url: token.replace(/,+$/, ""), descriptor: "" });
      continue;
    }
    const end = remaining.indexOf(",");
    const descriptor = (end === -1 ? remaining : remaining.slice(0, end)).trim();
    remaining = end === -1 ? "" : remaining.slice(end + 1);
    candidates.push({ url: token, descriptor });
  }
  return candidates;
}

export function validatePage({ html, pageUrl, guide, lookupResource }) {
  const errors = [];
  const markup = html.replace(/<!--[\s\S]*?-->/g, "");
  const elements = tags(markup.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ""));
  const base = new URL(pageUrl);
  const localHosts = new Set([base.hostname, `www.${base.hostname}`]);
  const canonical = elements.filter(({ name, attrs }) => name === "link" && (attrs.rel ?? "").split(/\s+/).includes("canonical"));
  const ogUrl = elements.filter(({ name, attrs }) => name === "meta" && attrs.property === "og:url");
  if (canonical.length !== 1 || canonical[0]?.attrs.href !== pageUrl) {
    errors.push("canonical must occur once and equal this page URL");
  }
  if (ogUrl.length !== 1 || ogUrl[0]?.attrs.content !== pageUrl) {
    errors.push("og:url must occur once and equal this page URL");
  }

  const schemas = [];
  for (const match of markup.matchAll(/<script\b((?:"[^"]*"|'[^']*'|[^'">])*)>([\s\S]*?)<\/script>/gi)) {
    if (attributes(match[1]).type?.toLowerCase() !== "application/ld+json") continue;
    try {
      schemas.push(...schemaObjects(JSON.parse(match[2])));
    } catch {
      errors.push("invalid JSON-LD");
    }
  }
  const articles = schemas.filter((value) => hasType(value, "Article"));
  for (const article of articles) {
    if (schemaUrl(article.mainEntityOfPage) !== pageUrl) {
      errors.push("Article.mainEntityOfPage differs from this page URL");
    }
    if (guide && article.headline !== guide.title) {
      errors.push("Article.headline differs from guide title");
    }
  }

  const breadcrumbs = schemas.filter((value) => hasType(value, "BreadcrumbList"));
  if (base.pathname !== "/" && breadcrumbs.length !== 1) {
    errors.push("non-home page must have one BreadcrumbList");
  }
  for (const breadcrumb of breadcrumbs) {
    const items = breadcrumb.itemListElement;
    if (!Array.isArray(items) || items.length === 0) {
      errors.push("BreadcrumbList is empty");
      continue;
    }
    if (items.some((item, index) => item.position !== index + 1)) {
      errors.push("BreadcrumbList positions must be sequential");
    }
    const last = items.at(-1);
    if (schemaUrl(last.item) !== pageUrl) {
      errors.push("last breadcrumb URL differs from this page URL");
    }
    if (guide && last.name !== guide.title) {
      errors.push("last breadcrumb name differs from guide title");
    }
  }

  if (guide) {
    const titles = [...markup.matchAll(/<title\b[^>]*>([\s\S]*?)<\/title>/gi)];
    const headings = [...markup.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)];
    if (titles.length !== 1 || textContent(titles[0]?.[1]) !== `${guide.title}｜虎娃砂锅菜`) {
      errors.push("title differs from guide title");
    }
    if (headings.length !== 1 || textContent(headings[0]?.[1]) !== guide.title) {
      errors.push("H1 differs from guide title");
    }
    if (articles.length !== 1) errors.push("guide must have one Article");
    const visibleBreadcrumbs = [...markup.matchAll(/<nav\b([^>]*)>([\s\S]*?)<\/nav>/gi)]
      .filter((match) => (attributes(match[1]).class ?? "").split(/\s+/).includes("visible-breadcrumb"));
    const currentItems = visibleBreadcrumbs.flatMap((match) =>
      [...match[2].matchAll(/<(span|a)\b([^>]*)>([\s\S]*?)<\/\1>/gi)]
        .filter((item) => attributes(item[2])["aria-current"] === "page"));
    if (currentItems.length !== 1 || textContent(currentItems[0]?.[3]) !== guide.title) {
      errors.push("visible breadcrumb differs from guide title");
    }
  }

  function checkUrl(raw, context, checkFragment = false) {
    let url;
    try {
      url = new URL(raw, pageUrl);
    } catch {
      errors.push(`${context}: invalid URL`);
      return;
    }
    if (!/^https?:$/.test(url.protocol) || !localHosts.has(url.hostname)) return;
    if (url.origin !== base.origin) {
      errors.push(`${context}: use canonical HTTPS origin (${url.pathname})`);
    }
    const targetUrl = new URL(url.pathname + url.search, base.origin).href;
    const resource = lookupResource(targetUrl);
    if (!resource?.exists) {
      errors.push(`${context}: missing local resource ${url.pathname}`);
      return;
    }
    if (checkFragment && url.hash && !url.hash.startsWith("#:~:text=")) {
      let fragment;
      try {
        fragment = decodeURIComponent(url.hash.slice(1).split(":~:text=")[0]);
      } catch {
        errors.push(`${context}: invalid fragment encoding`);
        return;
      }
      const targetHtml = targetUrl === pageUrl ? markup : resource.html;
      if (typeof targetHtml === "string" && !tags(targetHtml.replace(/<!--[\s\S]*?-->/g, "")
        .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")).some(({ name, attrs }) =>
        attrs.id === fragment || (name === "a" && attrs.name === fragment))) {
        errors.push(`${context}: missing fragment ${url.pathname}#${fragment}`);
      }
    }
  }

  function checkSrcset(source, context) {
    const candidates = parseSrcset(source);
    if (!candidates.length) errors.push(`${context}: empty srcset`);
    for (const { url, descriptor } of candidates) {
      const validWidth = /^[1-9]\d*w$/.test(descriptor);
      const validDensity = /^(?:\d+(?:\.\d+)?|\.\d+)x$/.test(descriptor) && parseFloat(descriptor) > 0;
      if (descriptor && !validWidth && !validDensity) errors.push(`${context}: invalid srcset descriptor ${descriptor}`);
      checkUrl(url, context);
    }
  }

  for (const { name, attrs } of elements) {
    if (name === "a" && attrs.href !== undefined) checkUrl(attrs.href, "link", true);
    if (name === "img" || name === "source") {
      if (attrs.src !== undefined) checkUrl(attrs.src, `${name}.src`);
      if (attrs.srcset !== undefined) checkSrcset(attrs.srcset, `${name}.srcset`);
    }
    if (name === "link") {
      if (attrs.href) checkUrl(attrs.href, "link.href");
      if (attrs.imagesrcset !== undefined) checkSrcset(attrs.imagesrcset, "preload.imagesrcset");
    }
    if (name === "meta" && ["og:image", "twitter:image"].includes(attrs.property ?? attrs.name)) {
      if (attrs.content) checkUrl(attrs.content, "metadata image");
    }
  }
  for (const schema of schemas) {
    if (hasType(schema, "ImageObject")) {
      if (schema.url) checkUrl(schema.url, "ImageObject.url");
      if (schema.contentUrl) checkUrl(schema.contentUrl, "ImageObject.contentUrl");
    }
    for (const image of [].concat(schema.image ?? [])) {
      if (typeof image === "string") checkUrl(image, "structured image");
    }
  }
  return [...new Set(errors)];
}

export function validateHomeImages({ html, pageUrl, homeImages, homeShareImage, sitemap }) {
  const errors = [];
  const elements = tags(html.replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ""));
  const metadata = new Map(elements.filter(({ name }) => name === "meta")
    .map(({ attrs }) => [attrs.property ?? attrs.name, attrs.content]));
  if (metadata.get("og:image") !== homeShareImage.url ||
      metadata.get("twitter:image") !== homeShareImage.url) {
    errors.push("homepage OG/Twitter image differs from homeShareImage");
  }
  if (metadata.get("og:image:width") !== String(homeShareImage.width) ||
      metadata.get("og:image:height") !== String(homeShareImage.height) ||
      metadata.get("og:image:alt") !== homeShareImage.alt) {
    errors.push("homepage share image dimensions/alt differ from homeShareImage");
  }
  const visibleImages = new Set();
  for (const { name, attrs } of elements) {
    if (name !== "img" && name !== "source") continue;
    const urls = [attrs.src, ...parseSrcset(attrs.srcset ?? "").map((item) => item.url)];
    for (const url of urls.filter(Boolean)) {
      try { visibleImages.add(new URL(url, pageUrl).href); } catch { /* Covered by validatePage. */ }
    }
  }
  for (const image of homeImages) {
    if (!visibleImages.has(image.url)) errors.push("homepage discovery image is not rendered in HTML: " + image.url);
  }
  const homeEntry = [...sitemap.matchAll(/<url>([\s\S]*?)<\/url>/g)]
    .find((match) => decodeHtml(match[1].match(/<loc>([^<]+)<\/loc>/)?.[1]) === pageUrl)?.[1];
  const sitemapImages = [...(homeEntry ?? "").matchAll(/<image:loc>([^<]+)<\/image:loc>/g)]
    .map((match) => decodeHtml(match[1]));
  const expected = homeImages.map((image) => image.url);
  if (!homeEntry || sitemapImages.length !== expected.length ||
      new Set(sitemapImages).size !== sitemapImages.length ||
      expected.some((url) => !sitemapImages.includes(url))) {
    errors.push("homepage sitemap image list differs from homeImages");
  }
  return errors;
}
