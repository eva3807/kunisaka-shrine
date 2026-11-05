// 第4回（麻黄剤）専用アプリを作る
// 使い方: node dai4/build4.mjs
//  - 問題データ: dai4/data/*.json と、本体の予想範囲問題（src/data/yosou.json）のうち麻黄剤の分
//  - 出力: dai4/index.html（単体で開ける版）、dai4/artifact.html（公開用）
import fs from "node:fs";
const root = new URL("..", import.meta.url).pathname;
const here = new URL(".", import.meta.url).pathname;
const read = (p) => fs.readFileSync(root + p, "utf8");

// 本体の「麻黄剤(予想)」問題を、専用アプリの分類に振り分けて流用する
const SUBMAP = { "症例": "症例", "生薬": "生薬", "副作用・注意": "副作用・注意", "使い分け": "鑑別・使い分け", "適応": "鑑別・使い分け" };
const reused = JSON.parse(read("src/data/yosou.json"))
  .filter((q) => q.cat === "麻黄剤(予想)")
  .map((q) => ({ ...q, cat: SUBMAP[q.sub] || "鑑別・使い分け" }));
const own = fs.readdirSync(here + "data").filter((f) => f.endsWith(".json")).sort()
  .flatMap((f) => JSON.parse(fs.readFileSync(here + "data/" + f, "utf8")));
const all = reused.concat(own);
const cats = {};
for (const q of all) cats[q.cat] = (cats[q.cat] || 0) + 1;
console.log("questions:", all.length, cats);

const qjs = "window.QBANK = [\n" + all.map((q) => JSON.stringify(q)).join(",\n") + "\n];\n";
const scripts = [read("formulas.js"), read("dai4/formulas4.js"), read("src/ruby.js"), qjs, read("src/engine.js"), read("src/app.js")]
  .map((s) => `<script>\n${s.replace(/<\/script/gi, "<\\/script")}\n</script>`).join("\n");

const formulaOptions = ["麻黄湯", "葛根湯", "葛根湯加川芎辛夷", "小青竜湯", "麻黄附子細辛湯", "麻杏甘石湯", "五虎湯", "神秘湯", "越婢加朮湯", "麻杏薏甘湯", "薏苡仁湯"]
  .map((n) => `<option value="${n}">${n}だけ</option>`).join("");
let page = read("src/page.html")
  .replace("<title>漢方小テスト道場</title>", "<title>麻黄剤マスター</title>")
  .replace("<h1>漢方<span>小テスト</span>道場</h1>", "<h1><span>第4回</span> 麻黄剤マスター</h1>")
  .replace(/<select id="f-onlycat"[\s\S]*?<\/select>/, `<select id="f-onlycat" aria-label="分類をまとめて選ぶ">
          <option value="">— 選んでください —</option>
          <option value="all">全分類</option>
          ${formulaOptions}
          <option value="麻黄剤の横断問題">構成の横断問題だけ</option><option value="症例">症例だけ</option>
          <option value="鑑別・使い分け">鑑別・使い分けだけ</option><option value="副作用・注意">副作用・注意だけ</option>
          <option value="麻黄剤の総論">麻黄剤の総論だけ</option><option value="生薬">生薬だけ</option>
        </select>`)
  .replace(/<div id="tgroup">[\s\S]*?<\/div>/, `<div id="tgroup"><button class="chip" data-g="mao">麻黄剤 11処方</button></div>`)
  .replace(/<p class="disclaimer">[\s\S]*?<\/p>/, `<p class="disclaimer">第4回（麻黄剤）専用。処方構成と1日量はツムラ医療用漢方製剤が基準です。メーカーにより蒼朮/白朮・桂皮/桂枝の表記や量が違うことがあるので、授業資料の表記を優先してください。成績の記録は「漢方小テスト道場」とは別に保存されます。</p>`)
  .replace("<!--SCRIPTS-->", () => scripts);
if (page.includes("小テスト1〜3")) throw new Error("本体向けの文言が残っています");
fs.writeFileSync(here + "artifact.html", page);
fs.writeFileSync(here + "index.html", `<!doctype html>\n<html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"></head><body>\n${page}\n</body></html>\n`);
console.log("built dai4");
