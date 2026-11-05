// 使い方: node build.mjs [問題JSON...]
//  引数があれば src/questions.js を作り直し、index.html（単体で開ける版）と artifact.html を書き出す
import fs from "node:fs";
const dir = new URL(".", import.meta.url).pathname;
const inputs = process.argv.slice(2);
if (inputs.length) {
  const all = [];
  for (const f of inputs) for (const q of JSON.parse(fs.readFileSync(f, "utf8"))) all.push(q);
  fs.writeFileSync(dir + "src/questions.js", "window.QBANK = [\n" + all.map((q) => JSON.stringify(q)).join(",\n") + "\n];\n");
  console.log("questions:", all.length);
}
const read = (p) => fs.readFileSync(dir + p, "utf8");
const scripts = ["formulas.js", "src/questions.js", "src/engine.js", "src/app.js"]
  .map((p) => `<script>\n${read(p).replace(/<\/script/gi, "<\\/script")}\n</script>`).join("\n");
const page = read("src/page.html").replace("<!--SCRIPTS-->", () => scripts);
fs.writeFileSync(dir + "artifact.html", page);
fs.writeFileSync(dir + "index.html", `<!doctype html>\n<html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"></head><body>\n${page}\n</body></html>\n`);
console.log("built");
