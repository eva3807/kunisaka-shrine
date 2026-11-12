// 第5回（柴胡剤・瀉心湯類）専用アプリを作る
// 使い方: node dai5/build5.mjs
//  - 問題データ: dai5/data/*.json（講義スライドの内容から作成）
//  - 出力: dai5/index.html（単体で開ける版）、dai5/artifact.html（公開用）
import fs from "node:fs";
import { convertAll, loadCtx } from "../src/tochoice.mjs";
const root = new URL("..", import.meta.url).pathname;
const here = new URL(".", import.meta.url).pathname;
const read = (p) => fs.readFileSync(root + p, "utf8");

const all = fs.readdirSync(here + "data").filter((f) => f.endsWith(".json")).sort()
  .flatMap((f) => JSON.parse(fs.readFileSync(here + "data/" + f, "utf8")));
const cats = {};
for (const q of all) cats[q.cat] = (cats[q.cat] || 0) + 1;
console.log("questions:", all.length, cats);

// 記述式は選択式に作り変える
const conv = convertAll(all, loadCtx(read, ["formulas.js", "dai5/formulas5.js"]));
if (process.env.CHOICE_LOG) fs.writeFileSync(process.env.CHOICE_LOG, conv.log.map((r) => r.join(" | ")).join("\n"));
console.log("記述式から変換", conv.log.filter((r) => r[0] !== "DROP").length, "/ 変換できず除外", conv.log.filter((r) => r[0] === "DROP").length);
const qjs = "window.QBANK = [\n" + conv.out.map((q) => JSON.stringify(q)).join(",\n") + "\n];\n";
const scripts = [read("formulas.js"), read("dai5/formulas5.js"), read("src/ruby.js"), qjs, read("src/engine.js"), read("src/oboe.js"), read("src/app.js")]
  .map((s) => `<script>\n${s.replace(/<\/script/gi, "<\\/script")}\n</script>`).join("\n");

const names = ["小柴胡湯", "大柴胡湯", "柴胡桂枝湯", "柴胡加竜骨牡蛎湯", "半夏瀉心湯", "黄連解毒湯"];
const others = ["スライドの症例", "図（病態と生薬の働き）", "総論・定義", "構成表", "構成の横断問題", "症例", "比較・使い分け", "生薬"];
const options = names.concat(others).map((n) => `<option value="${n}">${n}だけ</option>`).join("");
let page = read("src/page.html")
  .replace("<title>漢方小テスト道場</title>", "<title>柴胡剤・瀉心湯類マスター</title>")
  .replace("<h1>漢方<span>小テスト</span>道場</h1>", "<h1><span>第5回</span> 柴胡剤・瀉心湯類マスター</h1>")
  .replace(/<select id="f-onlycat"[\s\S]*?<\/select>/, `<select id="f-onlycat" aria-label="分類をまとめて選ぶ">
          <option value="">— 選んでください —</option>
          <option value="all">全分類</option>
          ${options}
        </select>`)
  .replace(/<div id="tgroup">[\s\S]*?<\/div>/, `<div id="tgroup"><button class="chip" data-g="d5">柴胡剤・瀉心湯類 6処方</button></div>`)
  .replace(/<p class="disclaimer">[\s\S]*?<\/p>/, `<p class="disclaimer">第5回（柴胡剤・瀉心湯類）専用。問題と構成生薬は講義スライド（全19枚）の記載に基づいています。柴胡加竜骨牡蛎湯の大黄はスライドで（大黄）と書かれており、製剤によって入らないものがあります。成績の記録はほかのアプリとは別に保存されます。</p>`)
  .replace("<!--SCRIPTS-->", () => scripts);
if (page.includes("小テスト1〜3")) throw new Error("本体向けの文言が残っています");
fs.writeFileSync(here + "artifact.html", page);
fs.writeFileSync(here + "index.html", `<!doctype html>\n<html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="apple-mobile-web-app-capable" content="yes"><meta name="mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-status-bar-style" content="default"></head><body>\n${page}\n</body></html>\n`);
console.log("built dai5");
