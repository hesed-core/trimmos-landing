import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";

const regions = JSON.parse(
  (
    await readFile("scripts/privacy-regions.json", "utf8")
  ).replace(/^\uFEFF/, ""),
);
assert.equal(regions.length, 11, "All eleven reviewed screenshots are required");

for (const [id, , , expectedHash] of regions) {
  const original = await readFile(`public/images/showcase/${id}.png`);
  assert.equal(
    createHash("sha256").update(original).digest("hex").toUpperCase(),
    expectedHash,
    "Original preserved: " + id,
  );
}

console.log("Private screenshot source integrity: PASS");
