// 使い方: node build.mjs
//  src/questions.js を作り直し、index.html（単体で開ける版）と artifact.html を書き出す
import fs from "node:fs";
const dir = new URL(".", import.meta.url).pathname;
import { convertAll, loadCtx } from "./src/tochoice.mjs";
// 問題データ（src/data）を読み、記述式は選択式に作り変えて src/questions.js に書き出す
const DATA = ["kako", "soron", "kiso", "keishi", "yosou"];
const raw = DATA.flatMap((n) => JSON.parse(fs.readFileSync(dir + "src/data/" + n + ".json", "utf8")));
const conv = convertAll(raw, loadCtx((p) => fs.readFileSync(dir + p, "utf8"), ["formulas.js"]));
if (process.env.CHOICE_LOG) fs.writeFileSync(process.env.CHOICE_LOG, conv.log.map((r) => r.join(" | ")).join("\n"));
fs.writeFileSync(dir + "src/questions.js", "window.QBANK = [\n" + conv.out.map((q) => JSON.stringify(q)).join(",\n") + "\n];\n");
console.log("questions:", conv.out.length, "(記述式から変換", conv.log.filter((r) => r[0] !== "DROP").length, "/ 変換できず除外", conv.log.filter((r) => r[0] === "DROP").length, ")");
// 覚え方（src/data/oboe_*.json）をまとめて src/oboe.js にする（第4回・第5回アプリもこれを読む）
const oboe = fs.readdirSync(dir + "src/data").filter((f) => /^oboe_.*\.json$/.test(f)).sort()
  .flatMap((f) => JSON.parse(fs.readFileSync(dir + "src/data/" + f, "utf8")));
fs.writeFileSync(dir + "src/oboe.js", "window.OBOE = [\n" + oboe.map((o) => JSON.stringify(o)).join(",\n") + "\n];\n");
console.log("覚え方:", oboe.length);
const read = (p) => fs.readFileSync(dir + p, "utf8");
const scripts = ["formulas.js", "src/ruby.js", "src/questions.js", "src/engine.js", "src/oboe.js", "src/app.js"]
  .map((p) => `<script>\n${read(p).replace(/<\/script/gi, "<\\/script")}\n</script>`).join("\n");
const page = read("src/page.html").replace("<!--SCRIPTS-->", () => scripts);
fs.writeFileSync(dir + "artifact.html", page);
fs.writeFileSync(dir + "index.html", `<!doctype html>\n<html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="apple-mobile-web-app-capable" content="yes"><meta name="mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-status-bar-style" content="default"></head><body>\n${page}\n</body></html>\n`);
console.log("built");
