import assert from "node:assert/strict";
import { readFile, access, readdir } from "node:fs/promises";
import { resolve, join } from "node:path";
import { createHash } from "node:crypto";
import sharp from "sharp";
const root = resolve("dist");
const html = await readFile(join(root, "index.html"), "utf8");
assert.equal((html.match(/<h1\b/g) || []).length, 1, "Exactly one H1");
assert.match(html, /<html lang="es-MX"/);
assert.match(html, /<link rel="canonical" href="https:\/\/www\.trimmos\.com\//);
assert(
  !/528126076947|barber-preview\.png|beauty-preview\.png|swiper|\$200/.test(
    html,
  ),
  "No legacy references",
);
const ids = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]));
const resources = [...html.matchAll(/\b(?:src|href)="([^"]+)"/g)].map(
  (m) => m[1],
);
for (const resource of resources) {
  if (resource.startsWith("#"))
    assert(ids.has(resource.slice(1)), "Missing anchor " + resource);
  if (resource.startsWith("/")) {
    const p = resolve(root, "." + resource.split("?")[0]);
    assert(p.startsWith(root), "Path stays in output");
    await access(p);
  }
  if (resource.startsWith("https://wa.me/"))
    assert(
      resource.startsWith("https://wa.me/528135731273?text="),
      "Official WhatsApp",
    );
}
assert(
  html.includes("$399") && html.includes("$599") && html.includes("$100"),
  "Approved prices",
);
assert(html.includes("https://www.hesedcore.com/"), "Corporate link");
await access(join(root, "robots.txt"));
await access(join(root, "sitemap.xml"));
const walk = async (dir) => {
  let list = [];
  for (const f of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, f.name);
    list.push(...(f.isDirectory() ? await walk(p) : [p]));
  }
  return list;
};
const files = await walk(root);
assert(
  !files.some(
    (f) =>
      f.includes("images\\showcase") ||
      f.includes("images/showcase") ||
      f.endsWith("auditoria-trimmos.json") ||
      /(^|[\\/])\.env(?:\.[^\\/]*)?$/.test(f),
  ),
  "No original screenshots, local audit or environment files in output",
);
const assets = JSON.parse(
  await readFile("src/data/assets.generated.json", "utf8"),
);
assert.equal(
  Object.keys(assets).length,
  11,
  "All eleven reviewed screenshots integrated",
);
const showcaseDir = join(root, "showcase");
const showcaseFiles = (await readdir(showcaseDir)).sort();
const expectedFiles = Object.keys(assets)
  .flatMap((id) => [id + ".webp", id + "-thumb.webp"])
  .sort();
assert.deepEqual(showcaseFiles, expectedFiles, "Exactly 22 public images built");
const maskedColor = [40, 36, 49];
for (const [id, asset] of Object.entries(assets)) {
  const { width, height, masks } = asset;
  assert(
    Number.isInteger(width) &&
      Number.isInteger(height) &&
      Array.isArray(masks) &&
      masks.length > 0,
    "Valid public asset metadata: " + id,
  );
  const safePath = join(showcaseDir, id + ".webp");
  const thumbPath = join(showcaseDir, id + "-thumb.webp");
  await access(safePath);
  await access(thumbPath);

  const metadata = await sharp(safePath).metadata();
  assert.equal(metadata.format, "webp");
  assert.equal(metadata.width, width);
  assert.equal(metadata.height, height);
  assert(
    !metadata.exif && !metadata.xmp && !metadata.icc,
    "No embedded private metadata: " + id,
  );

  const { data, info } = await sharp(safePath)
    .raw()
    .toBuffer({ resolveWithObject: true });
  assert.equal(info.channels, 3, "Flattened RGB image: " + id);
  for (const [left, top, rectWidth, rectHeight] of masks) {
    assert(
      left >= 0 &&
        top >= 0 &&
        rectWidth > 0 &&
        rectHeight > 0 &&
        left + rectWidth <= width &&
        top + rectHeight <= height,
      "Mask coordinates stay within image: " + id,
    );
    for (let y = top; y < top + rectHeight; y++)
      for (let x = left; x < left + rectWidth; x++) {
        const offset = (y * width + x) * info.channels;
        assert.deepEqual(
          [...data.subarray(offset, offset + 3)],
          maskedColor,
          "Redaction remains opaque in public image: " + id,
        );
      }
  }

  const thumbMetadata = await sharp(thumbPath).metadata();
  assert.equal(thumbMetadata.format, "webp");
  assert.equal(thumbMetadata.width, 240);
  assert.equal(
    thumbMetadata.height,
    Math.round((height * 240) / width),
    "Thumbnail aspect ratio: " + id,
  );
  assert(
    !thumbMetadata.exif && !thumbMetadata.xmp && !thumbMetadata.icc,
    "No embedded private metadata in thumbnail: " + id,
  );

  const { data: thumbData, info: thumbInfo } = await sharp(thumbPath)
    .raw()
    .toBuffer({ resolveWithObject: true });
  const scaleX = thumbInfo.width / width;
  const scaleY = thumbInfo.height / height;
  const inset = 4;
  const allowedCompressionDelta = 40;
  for (const [left, top, rectWidth, rectHeight] of masks) {
    const xStart = Math.ceil((left + inset) * scaleX);
    const xEnd = Math.floor((left + rectWidth - inset) * scaleX);
    const yStart = Math.ceil((top + inset) * scaleY);
    const yEnd = Math.floor((top + rectHeight - inset) * scaleY);
    for (let y = yStart; y < yEnd; y++)
      for (let x = xStart; x < xEnd; x++) {
        const offset = (y * thumbInfo.width + x) * thumbInfo.channels;
        for (let channel = 0; channel < 3; channel++)
          assert(
            Math.abs(thumbData[offset + channel] - maskedColor[channel]) <=
              allowedCompressionDelta,
            "Thumbnail redaction remains visible: " + id,
          );
      }
  }

  const sourceHash = createHash("sha256")
    .update(await readFile(join("public-safe", "showcase", id + ".webp")))
    .digest("hex");
  const builtHash = createHash("sha256")
    .update(await readFile(safePath))
    .digest("hex");
  assert.equal(builtHash, sourceHash, "Public image copied unchanged: " + id);
  const sourceThumbHash = createHash("sha256")
    .update(
      await readFile(join("public-safe", "showcase", id + "-thumb.webp")),
    )
    .digest("hex");
  const builtThumbHash = createHash("sha256")
    .update(await readFile(thumbPath))
    .digest("hex");
  assert.equal(
    builtThumbHash,
    sourceThumbHash,
    "Public thumbnail copied unchanged: " + id,
  );
}
assert.equal(
  (html.match(/data-thumb=/g) || []).length,
  11,
  "Eleven selectable thumbnails",
);
assert.equal(
  (html.match(/data-category=/g) || []).length,
  7,
  "Seven populated categories",
);
console.log(
  JSON.stringify(
    {
      result: "PASS",
      h1: 1,
      localReferences: resources.filter((r) => r.startsWith("/")).length,
      whatsappLinks: resources.filter((r) => r.startsWith("https://wa.me/"))
        .length,
      screens: Object.keys(assets).length,
      outputFiles: files.length,
    },
    null,
    2,
  ),
);
