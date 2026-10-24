import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import assert from "node:assert/strict";
import ts from "typescript";
// Pass a temporary jsdom installation's lib/api.js path. No browser is launched.
const { JSDOM } = await import(pathToFileURL(process.argv[2]).href);
const html = await readFile("dist/index.html", "utf8");
const dom = new JSDOM(html, {
  url: "https://www.trimmos.com/",
  runScripts: "outside-only",
});
const { window } = dom;
const doc = window.document;
window.matchMedia = () => ({ matches: false, addEventListener() {} });
window.HTMLDialogElement.prototype.showModal = function () {
  this.open = true;
};
window.HTMLDialogElement.prototype.close = function () {
  this.open = false;
  this.dispatchEvent(new window.Event("close"));
};
const transpile = (s) =>
  ts.transpile(s, {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.None,
  });
const assets = JSON.parse(
  await readFile("src/data/assets.generated.json", "utf8"),
);
let data = (await readFile("src/data/showcase.ts", "utf8"))
  .replace(/^import .*;$/m, "")
  .replace(/export /g, "");
window.eval(
  "const assets=" +
    JSON.stringify(assets) +
    ";" +
    transpile(data) +
    ";window.__screens=screens;",
);
for (const name of ["Header", "Gallery"]) {
  const source = await readFile("src/components/" + name + ".astro", "utf8");
  const script = source
    .match(/<script>([\s\S]*?)<\/script>/)[1]
    .replace(/^\s*import .*;$/gm, "");
  window.eval("const screens=window.__screens;" + transpile(script));
}
const click = (s) => doc.querySelector(s).click();
const key = (target, key, shiftKey = false) =>
  target.dispatchEvent(
    new window.KeyboardEvent("keydown", {
      key,
      shiftKey,
      bubbles: true,
      cancelable: true,
    }),
  );
const title = () => doc.querySelector("[data-screen-title]").textContent;
const first = title();
click("[data-next]");
assert.notEqual(title(), first);
click("[data-prev]");
assert.equal(title(), first);
key(doc.querySelector(".screen-open"), "ArrowLeft");
assert.match(title(), /agenda/i);
click('[data-category="Beauty"]');
assert.equal(doc.querySelector("[data-screen-category]").textContent, "Beauty");
assert.equal(
  [...doc.querySelectorAll("[data-thumb]")].filter((b) => !b.hidden).length,
  2,
);
click('[data-thumb="10-dashboard-beauty-king"]');
assert.match(title(), /Belleza/);
click('[data-category="Agenda"]');
assert(doc.querySelector("[data-next]").disabled);
click('[data-category="Vista general"]');
const opener = doc.querySelector(".screen-open");
opener.focus();
opener.click();
const dialog = doc.querySelector("dialog");
assert(dialog.open);
assert.equal(doc.body.style.overflow, "hidden");
const close = doc.querySelector("[data-close]");
assert.equal(doc.activeElement, close);
const last = dialog.querySelector("[data-next]");
key(close, "Tab", true);
assert.equal(doc.activeElement, last);
key(last, "Tab");
assert.equal(doc.activeElement, close);
key(close, "ArrowRight");
assert.match(doc.querySelector("#lightbox-title").textContent, /salón/);
close.click();
assert(!dialog.open);
assert.equal(doc.activeElement, opener);
assert.equal(doc.body.style.overflow, "");
click(".menu-toggle");
assert.equal(
  doc.querySelector(".menu-toggle").getAttribute("aria-expanded"),
  "true",
);
key(doc.querySelector(".menu-toggle"), "Escape");
assert(doc.querySelector("#mobile-nav").hidden);
click(".menu-toggle");
click("#mobile-nav a");
assert(doc.querySelector("#mobile-nav").hidden);
const stage = doc.querySelector(".theater-stage");
const touch = (type, x) => {
  const event = new window.Event(type, { bubbles: true });
  Object.defineProperty(event, "changedTouches", {
    value: [{ clientX: x, clientY: 100 }],
  });
  stage.dispatchEvent(event);
};
const before = title();
touch("touchstart", 300);
touch("touchend", 100);
assert.notEqual(title(), before);
opener.click();
assert(!dialog.open, "Swipe must not also open dialog");
dom.window.close();
console.log(
  "PASS: DOM simulation — filters, thumbnails, arrows, dialog close/focus, Tab containment, menu Escape/link close, swipe/click suppression. Native dialog Escape, layout and browser rendering are not simulated.",
);
