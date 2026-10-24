import sharp from "sharp";
import { mkdir, writeFile, readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
const out = new URL("../public-safe/", import.meta.url);
await mkdir(new URL("brand/", out), { recursive: true });
const brand = [
  ["logotrimmos.png", "trimmos.png", 600],
  ["hesed-core-isotipo-transparente.png", "hesed.png", 160],
  ["core-hesed.png", "core.webp", 800],
];
for (const [source, dest, width] of brand) {
  const image = sharp(
    fileURLToPath(new URL("../public/" + source, import.meta.url)),
  );
  await image
    .resize({ width, withoutEnlargement: true })
    .toFile(fileURLToPath(new URL("brand/" + dest, out)));
}
await writeFile(
  new URL("robots.txt", out),
  "User-agent: *\nAllow: /\nSitemap: https://www.trimmos.com/sitemap.xml\n",
);
await writeFile(
  new URL("sitemap.xml", out),
  '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://www.trimmos.com/</loc></url></urlset>\n',
);
console.log("Official brand assets and SEO files prepared.");

// Explicitly authorized deterministic redaction; originals are never modified.
// Hash and dimensions bind each mask to the individually reviewed screenshot.
const regions = JSON.parse(
  (
    await readFile(new URL("./privacy-regions.json", import.meta.url), "utf8")
  ).replace(/^\uFEFF/, ""),
);
assert.equal(regions.length, 11, "All eleven reviewed screenshots are required");
await mkdir(new URL("showcase/", out), { recursive: true });
const assets = {};
for (const [id, width, height, expectedHash, rectangles] of regions) {
  const source = new URL(
    "../public/images/showcase/" + id + ".png",
    import.meta.url,
  );
  const original = await readFile(source);
  assert.equal(
    createHash("sha256").update(original).digest("hex").toUpperCase(),
    expectedHash,
    "Screenshot changed: review privacy masks for " + id,
  );
  const metadata = await sharp(original).metadata();
  assert.equal(metadata.width, width);
  assert.equal(metadata.height, height);
  const overlays = rectangles.map(([left, top, w, h]) => {
    assert(left >= 0 && top >= 0 && left + w <= width && top + h <= height);
    return {
      input: {
        create: {
          width: w,
          height: h,
          channels: 4,
          background: { r: 40, g: 36, b: 49, alpha: 1 },
        },
      },
      left,
      top,
    };
  });
  // Flatten into raw pixels before encoding: no layers, no original metadata,
  // no recoverable text under CSS, blur, transparency or vector overlays.
  const { data, info } = await sharp(original)
    .composite(overlays)
    .flatten({ background: "#100d17" })
    .raw()
    .toBuffer({ resolveWithObject: true });
  for (const [left, top, w, h] of rectangles) {
    for (let y = top; y < top + h; y++)
      for (let x = left; x < left + w; x++) {
        const offset = (y * info.width + x) * info.channels;
        assert.equal(data[offset], 40);
        assert.equal(data[offset + 1], 36);
        assert.equal(data[offset + 2], 49);
      }
  }
  await sharp(data, { raw: info })
    .webp({ lossless: true })
    .toFile(fileURLToPath(new URL("showcase/" + id + ".webp", out)));
  await sharp(data, { raw: info })
    .resize({ width: 240 })
    .webp({ quality: 78 })
    .toFile(fileURLToPath(new URL("showcase/" + id + "-thumb.webp", out)));
  assert.equal(
    createHash("sha256")
      .update(await readFile(source))
      .digest("hex")
      .toUpperCase(),
    expectedHash,
  );
  assets[id] = { width, height, masks: rectangles };
}
await writeFile(
  new URL("../src/data/assets.generated.json", import.meta.url),
  JSON.stringify(assets, null, 2) + "\n",
);
console.log("Verified and anonymized screenshots:", Object.keys(assets).length);
