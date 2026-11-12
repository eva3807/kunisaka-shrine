// 記述式（type: "input"）の問題を、5択の選択問題に作り変える（ビルド時に使う）
// 元の問題データは書き換えない。答えの種類（数字・生薬・処方・書名・植物名・成分名）に合わせて
// 同じ種類のひっかけ選択肢を4つ選ぶ。問題文に出てくる語と、別の正解表記は選択肢にしない。
// 個別に選択肢を決めたい問題は OVERRIDE に書く（問題文 → ひっかけ4つ）。

const BOOKS = ["傷寒論", "金匱要略", "外台秘要方", "黄帝内経", "神農本草経", "医心方", "和剤局方"];
const PLANTS = ["ミシマサイコ", "コガネバナ", "オウレン", "カラスビシャク", "ハトムギ", "クズ", "ナツメ", "トリカブト", "マグワ", "ホオノキ", "シソ", "カキ", "チョウセンゴミシ", "センキュウ", "コブシ", "マオウ"];
const COMPOUNDS = ["エフェドリン", "プソイドエフェドリン", "アミグダリン", "グリチルリチン酸", "ペオニフロリン", "サイコサポニン", "バイカリン", "シンナムアルデヒド", "プエラリン", "ホノキオール", "アリストロキア酸", "ジンゲロール", "ヘスペリジン", "マグノロール"];

// 問題文の一部 → ひっかけ選択肢4つ（自動で選ぶと種類が合わない・紛らわしい問題だけ）
export const OVERRIDE = [
  ["竜骨と牡蛎に共通する主な作用", ["発汗", "利水", "瀉下", "補血"]],
  ["「大型〇〇動物の骨」", ["爬虫", "両生", "鳥", "魚"]],
  ["低カリウム血症・浮腫・", ["間質性肺炎", "肝機能障害", "腸間膜静脈硬化症", "無顆粒球症"]],
  ["に抵抗や圧痛を認める腹証", ["心下痞鞕", "腹皮拘急", "小腹急結", "胃内停水"]],
  ["張り感、つかえ感、圧痛を認める腹候", ["心下痞鞕", "腹皮拘急", "小腹急結", "胃内停水"]],
  ["悪寒と発熱が交互", ["潮熱", "悪風", "煩熱", "身熱"]],
  ["発熱と悪寒が交互", ["潮熱", "悪風", "煩熱", "身熱"]],
  ["心窩部（みぞおち）のつかえを何", ["胸脇苦満", "腹皮拘急", "小腹不仁", "胃内停水"]],
  ["インターフェロン製剤の併用で起こり", ["偽アルドステロン症", "肝機能障害", "腸間膜静脈硬化症", "低カリウム血症"]],
  ["六病位", ["太陽病", "少陽病", "陽明病", "太陰病"]],
  ["発汗により邪を除く治療法", ["吐法", "下法", "和法", "温法"]],
  ["麻黄の基原植物が属する科名", ["マメ科", "ナス科", "キク科", "セリ科"]],
  ["石膏の主成分は何か", ["炭酸カルシウム", "酸化マグネシウム", "塩化ナトリウム", "リン酸カルシウム"]],
  ["長引いているかぜ／肝炎、腎炎、（", ["胃炎", "高血圧", "口内炎", "肥満症"]],
  ["およそ（　）疾患に処方される", ["消化器", "出血性", "精神神経", "慢性"]],
  ["目的によって（　）はまちまち", ["投与量", "服用回数", "服用時期", "構成生薬"]],
  ["高血圧や（　）にともなう", ["糖尿病", "喫煙", "ストレス", "加齢"]],
  ["かぜの（　）から後期", ["初期", "急性期", "回復期", "前期"]],
  ["かぜ以外は比較的（　）", ["短期", "頓服", "少量", "高用量"]],
  ["（　）がある動悸、不眠、高血圧", ["胃腸症状", "発熱", "便秘", "冷え"]],
  ["（　）と精神不安が処方意図", ["便秘", "冷え", "食欲不振", "発汗"]],
  ["の遅延性下痢（副作用軽減）」の空欄", ["シスプラチン", "パクリタキセル", "フルオロウラシル", "メトトレキサート"]],
  ["炎症や（　）の強い皮膚炎", ["痛み", "乾燥", "腫れ", "化膿"]],
  ["高血圧は（　）しやすい人", ["疲労", "冷え", "便秘", "動悸"]],
  ["『胃腸に熱がこもった』を動か", ["黄芩", "大棗", "芍薬", "大黄"]],
  ["配合されていない製剤を選ぶべき生薬", ["茯苓", "桂皮", "人参", "半夏"]],
  ["柴胡剤に含まれる生姜ではなく何を含む", ["桂皮", "芍薬", "茯苓", "枳実"]],
];

const norm = (s) => String(s).trim().replace(/[\s　、,。．.]/g, "")
  .replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
  .replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60))
  .replace(/種類?$|種$|つ$|個$/, "");

// 問題ごとに同じ選び方になるよう、問題文から作った種で並べ替える
function seeded(str) { let h = 2166136261; for (const c of str) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return () => ((h = Math.imul(h ^ (h >>> 15), 2246822507) ^ Math.imul(h ^ (h >>> 13), 3266489909)) >>> 0) / 4294967296; }
function shuffle(a, rnd) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

export function kindOf(a, ctx) {
  if (/^\d+$/.test(a)) return "num";
  if (BOOKS.includes(a)) return "book";
  if (ctx.formulas.includes(a) || /^[一-鿿]+(湯|散|丸)$/.test(a)) return "formula";
  if (ctx.herbs.includes(a)) return "herb";
  if (PLANTS.includes(a)) return "plant";
  if (COMPOUNDS.includes(a)) return "compound";
  if (/^[ぁ-ん]+$/.test(a)) return "yomi";
  return "other";
}

export function convertAll(qs, ctx) {
  const inputs = qs.filter((q) => q.type === "input");
  const others = inputs.filter((q) => kindOf(q.answer[0], ctx) === "other");
  const log = [];
  const out = qs.map((q) => {
    if (q.type !== "input") return q;
    const right = q.answer[0], kind = kindOf(right, ctx), rnd = seeded(q.q);
    const ok = new Set(q.answer.map(norm));
    let cands;
    const ov = OVERRIDE.find(([k]) => q.q.includes(k));
    if (ov) cands = ov[1];
    else if (kind === "num") { const n = +right; cands = [n - 2, n - 1, n + 1, n + 2, n + 3, n - 3].filter((x) => x > 0).map(String); }
    else if (kind === "book") cands = shuffle(BOOKS, rnd);
    else if (kind === "formula") cands = shuffle(ctx.formulas, rnd).concat(shuffle(ctx.moreFormulas, rnd));
    else if (kind === "herb") {
      const named = Object.keys(ctx.formulaHerbs).filter((n) => q.q.includes(n));
      cands = shuffle([...new Set(named.flatMap((n) => ctx.formulaHerbs[n]))], rnd).concat(shuffle(ctx.herbs, rnd));
    }
    else if (kind === "plant") cands = shuffle(PLANTS, rnd);
    else if (kind === "compound") cands = shuffle(COMPOUNDS, rnd);
    else if (kind === "yomi") cands = shuffle(ctx.herbYomi, rnd);
    else {
      const same = (f) => others.filter((o) => o !== q && f(o)).map((o) => o.answer[0]);
      cands = shuffle(same((o) => o.cat === q.cat && o.sub === q.sub), rnd)
        .concat(shuffle(same((o) => o.sub === q.sub), rnd), shuffle(same((o) => o.cat === q.cat), rnd), shuffle(same(() => true), rnd));
    }
    const wrong = [...new Set(cands)].filter((c) => !ok.has(norm(c)) && !q.q.includes(c)).slice(0, 4);
    if (wrong.length < 4) { log.push(["DROP", q.q, right]); return null; }
    const ch = shuffle([right, ...wrong], rnd);
    if (kind === "num") ch.sort((a, b) => a - b);
    log.push([kind, q.q, right, wrong.join(" / ")]);
    return { ...q, type: "single", q: q.q.replace(/（数字で答えよ）|数字で答えなさい。|（カタカナ）|（カタカナで）|（漢字）|をカタカナで答えよ|を漢字で答えよ|をひらがなで答えよ/g, (m) => (m.startsWith("を") ? "はどれか" : "")).replace(/答えなさい。$|答えよ。$/, "選べ。"), choices: ch, answer: [ch.indexOf(right)] };
  }).filter(Boolean);
  return { out, log };
}

// formulas.js などブラウザ用のデータを Node で読むための小道具
export function loadCtx(read, files) {
  const window = {};
  for (const f of files) new Function("window", read(f))(window);
  const formulas = window.FORMULAS.map((f) => f.name);
  const herbs = [...new Set(window.FORMULAS.flatMap((f) => Object.keys(f.herbs)))];
  const yomi = window.FORMULAS.map((f) => f.yomi).concat(herbs.map((h) => window.HERB_READING[h]));
  const formulaHerbs = Object.fromEntries(window.FORMULAS.map((f) => [f.name, Object.keys(f.herbs)]));
  const herbYomi = herbs.map((h) => window.HERB_READING[h]);
  return { formulas, herbs, yomi, formulaHerbs, herbYomi, moreFormulas: ["桂枝湯", "葛根湯", "麻黄湯", "小青竜湯", "五苓散", "四物湯", "半夏厚朴湯", "補中益気湯"] };
}
