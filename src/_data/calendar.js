// 年中行事（毎年）と 予定・連絡（単発）をひとつの配列にまとめ、
// テンプレートからカレンダー用のデータとして埋め込むためのファイル。
// ※このファイルは管理画面の編集対象ではありません（編集するのは gyoji.json / yotei.json）。

import fs from "node:fs";

const read = (name) =>
  JSON.parse(fs.readFileSync(new URL(`./${name}`, import.meta.url), "utf8"));

export default function () {
  const gyoji = read("gyoji.json");
  const yotei = read("yotei.json");
  const events = [];

  // 毎年繰り返す行事（月が入力されているものだけカレンダーに載せる）
  for (const g of gyoji.items ?? []) {
    if (g.published === false) continue;
    if (!g.month) continue; // 「伝承」など日付が定まらないものは除外
    events.push({
      kind: "annual",
      month: Number(g.month),
      day: g.day ? Number(g.day) : null,
      name: g.name,
      reading: g.reading ?? "",
      body: g.body ?? "",
      when: g.when ?? "",
      category: "祭典",
    });
  }

  // 日付が決まっている単発の予定・連絡
  for (const y of yotei.items ?? []) {
    if (y.published === false) continue;
    if (!y.date) continue;
    const m = String(y.date).match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!m) continue;
    events.push({
      kind: "once",
      year: Number(m[1]),
      month: Number(m[2]),
      day: Number(m[3]),
      name: y.title,
      body: y.body ?? "",
      time: y.time ?? "",
      place: y.place ?? "",
      category: y.category ?? "お知らせ",
    });
  }

  return events;
}
