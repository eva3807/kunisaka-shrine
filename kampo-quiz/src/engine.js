// 漢方小テスト対策：出題エンジン
// - 静的問題（QBANK）と、処方構成データ（FORMULAS）から自動生成する問題を合わせて出題する
// - 自動生成問題は毎回 選択肢・ひっかけ生薬が変わるので、終わりなく解ける
(function () {
  const F = window.FORMULAS;
  const R = window.HERB_READING;
  const BYNAME = Object.fromEntries(F.map((f) => [f.name, f]));
  const GROUP_CAT = window.GROUP_CAT || { keishi: "桂枝湯類", mao: "麻黄剤(予想)", saiko: "柴胡剤(予想)", other: "その他処方(予想)" };
  // 別表記として受け付ける名前（記述問題用）
  const ALIAS = { "桂皮": ["桂枝", "けいし", "ケイシ"], "蒼朮": ["朮", "白朮"], "生姜": ["しょうが", "ショウガ"], "牡蛎": ["牡蠣"], "竜骨": ["龍骨"], "釣藤鈎": ["釣藤鉤", "釣藤"], "栝楼根": ["瓜呂根"] };

  // ---------- 小道具 ----------
  const rnd = (n) => Math.floor(Math.random() * n);
  const pick = (a) => a[rnd(a.length)];
  const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const sample = (a, n) => shuffle(a).slice(0, n);
  const herbsOf = (f) => Object.keys(f.herbs);
  const uniq = (a) => [...new Set(a)];
  const catOf = (f) => f.cat || GROUP_CAT[f.group];
  const groupOf = (g) => F.filter((f) => f.group === g);
  const ALL_HERBS = Object.keys(R);

  // 五十音順の比較（濁点・半濁点を外して比べ、同じなら清音を先に）
  const seion = (s) => s.normalize("NFD").replace(/[゙゚]/g, "").normalize("NFC");
  const gojuon = (a, b) => {
    const x = seion(R[a]), y = seion(R[b]);
    if (x !== y) return x < y ? -1 : 1;
    return R[a] < R[b] ? -1 : 1;
  };
  const sortedHerbs = (f) => herbsOf(f).sort(gojuon);

  // 回答の正規化：空白除去・全角数字→半角・カタカナ→ひらがな
  function norm(s) {
    return String(s).trim().replace(/[\s　、,。．.]/g, "")
      .replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
      .replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60))
      .replace(/種類?$|種$|つ$|個$/, "");
  }
  function herbAnswers(h) { return [h, R[h], ...(ALIAS[h] || [])]; }

  function compText(f) {
    return sortedHerbs(f).map((h) => `${h}(${R[h]}) ${f.herbs[h]}g`).join("、");
  }
  function compNote(f) {
    return `【${f.name}（${f.yomi}）】${herbsOf(f).length}種：${compText(f)}（五十音順・ツムラ1日量）`;
  }

  // ひっかけ用の生薬：同グループの処方に出てくる生薬を優先
  function distractHerbs(exclude, group, n) {
    const ex = new Set(exclude);
    const near = uniq(groupOf(group).flatMap(herbsOf)).filter((h) => !ex.has(h));
    const far = ALL_HERBS.filter((h) => !ex.has(h) && !near.includes(h));
    const a = sample(near, Math.min(n, Math.ceil(n * 0.7), near.length));
    return a.concat(sample(far, n - a.length));
  }

  // ---------- 自動生成問題の型 ----------
  // 各テンプレートは make() を呼ぶたびに新しい選択肢で問題を作る
  const T = [];
  function add(id, cat, sub, level, make) { T.push({ id, cat, sub, level, gen: true, make }); }

  for (const f of F) {
    const cat = catOf(f);
    const hs = herbsOf(f);

    add(`g:all:${f.name}`, cat, "構成生薬（すべて選べ）", 1, () => {
      const total = Math.min(12, Math.max(8, hs.length + 4));
      const ch = shuffle(hs.concat(distractHerbs(hs, f.group, total - hs.length)));
      return { type: "multi", q: `${f.name}の構成生薬をすべて選べ。`, choices: ch, answer: ch.map((h, i) => (hs.includes(h) ? i : -1)).filter((i) => i >= 0), exp: compNote(f), formula: f.name };
    });

    add(`g:count:${f.name}`, cat, "構成生薬数", 1, () => ({
      type: "input", q: `${f.name}の構成生薬は何種類か。数字で答えなさい。`, answer: [String(hs.length)], exp: compNote(f), formula: f.name,
    }));

    if (hs.length >= 3) add(`g:goju:${f.name}`, cat, "五十音順", 2, () => {
      const s = sortedHerbs(f), n = 1 + rnd(s.length), h = s[n - 1];
      return { type: "input", q: `${f.name}の構成生薬のうち、五十音順で${n}番目にくる生薬を答えなさい。`, answer: herbAnswers(h),
        exp: `五十音順：${s.map((x, i) => `${i + 1}.${x}(${R[x]})`).join(" → ")}`, formula: f.name };
    });

    if (hs.length >= 4) add(`g:not:${f.name}`, cat, "構成生薬でないもの", 1, () => {
      const right = sample(hs, 4), wrong = distractHerbs(hs, f.group, 1)[0];
      const ch = shuffle(right.concat(wrong));
      return { type: "single", q: `${f.name}の構成生薬に含まれないのはどれか。1つ選べ。`, choices: ch, answer: [ch.indexOf(wrong)], exp: `${wrong}は含まれない。` + compNote(f), formula: f.name };
    });

    add(`g:which:${f.name}`, cat, "構成から処方名", 2, () => {
      const others = sample(groupOf(f.group).filter((x) => x !== f), 4);
      const ch = shuffle([f, ...others].map((x) => x.name));
      return { type: "single", q: `次の生薬で構成される処方はどれか。1つ選べ。\n${sortedHerbs(f).join("・")}`, choices: ch, answer: [ch.indexOf(f.name)], exp: compNote(f), formula: f.name };
    });

    add(`g:use2f:${f.name}`, cat, "適応→処方", 1, () => {
      const others = sample(groupOf(f.group).filter((x) => x !== f), 4);
      const ch = shuffle([f, ...others].map((x) => x.name));
      return { type: "single", q: `「${f.use}」に最も適した漢方薬はどれか。1つ選べ。`, choices: ch, answer: [ch.indexOf(f.name)],
        exp: `${f.name}：${f.use}\n` + others.map((o) => `・${o.name}：${o.use}`).join("\n"), formula: f.name };
    });

    add(`g:f2use:${f.name}`, cat, "処方→適応", 1, () => {
      const others = sample(groupOf(f.group).filter((x) => x !== f), 4);
      const ch = shuffle([f, ...others].map((x) => x.use));
      return { type: "single", q: `${f.name}の適応として最も適切なのはどれか。1つ選べ。`, choices: ch, answer: [ch.indexOf(f.use)],
        exp: others.map((o) => `・${o.name}：${o.use}`).join("\n"), formula: f.name };
    });

    add(`g:yomi:${f.name}`, cat, "読み方", 1, () => ({
      type: "input", q: `「${f.name}」の読みをひらがなで答えなさい。`, answer: [f.yomi], exp: `${f.name}＝${f.yomi}`, formula: f.name,
    }));

    // 1日量が最も多い生薬（同量1位が複数あるときは出さない）
    const amounts = hs.map((h) => f.herbs[h]), mx = Math.max(...amounts);
    if (amounts.filter((a) => a === mx).length === 1) {
      const top = hs.find((h) => f.herbs[h] === mx);
      add(`g:max:${f.name}`, cat, "配合量（重箱の隅）", 3, () => {
        const ch = shuffle([top, ...sample(hs.filter((h) => h !== top), Math.min(4, hs.length - 1))]);
        return { type: "single", q: `${f.name}（ツムラ医療用）で1日量が最も多い生薬はどれか。1つ選べ。`, choices: ch, answer: [ch.indexOf(top)],
          exp: compNote(f) + "\n※配合量はメーカーで異なることがある。", formula: f.name };
      });
    }
  }

  // グループ内で「この処方だけに配合される生薬」（小テスト3 問6型）
  for (const g of Object.keys(GROUP_CAT)) {
    const fs = groupOf(g);
    add(`g:only:${g}`, GROUP_CAT[g], "この処方のみに配合", 2, () => {
      for (let t = 0; t < 30; t++) {
        const set = g === "keishi" ? fs : sample(fs, Math.min(5, fs.length));
        const target = pick(set);
        const others = new Set(set.filter((x) => x !== target).flatMap(herbsOf));
        const only = herbsOf(target).filter((h) => !others.has(h));
        if (!only.length) continue;
        const names = set.map((x) => x.name).join("、");
        const exp = `${target.name}のみ：${only.join("・")}\n` + set.map(compNote).join("\n");
        if (only.length === 1) return { type: "input", q: `${names}の構成生薬のうち、${target.name}のみに配合されている生薬を答えなさい。`, answer: herbAnswers(only[0]), exp, formula: target.name };
        const ch = shuffle(uniq(set.flatMap(herbsOf)));
        return { type: "multi", q: `${names}の構成生薬のうち、${target.name}のみに配合されている生薬をすべて選べ。`, choices: ch, answer: only.map((h) => ch.indexOf(h)), exp, formula: target.name };
      }
      return null;
    });

    // 生薬Xを含む処方をすべて選べ
    add(`g:contain:${g}`, GROUP_CAT[g], "生薬を含む処方（すべて選べ）", 2, () => {
      for (let t = 0; t < 30; t++) {
        const set = sample(fs, Math.min(6, fs.length));
        const h = pick(uniq(set.flatMap(herbsOf)));
        const yes = set.filter((x) => x.herbs[h] != null);
        if (!yes.length || yes.length === set.length) continue;
        const ch = set.map((x) => x.name);
        return { type: "multi", q: `次の処方のうち、${h}（${R[h]}）を含むものをすべて選べ。`, choices: ch, answer: yes.map((x) => ch.indexOf(x.name)),
          exp: `${h}を含む：${yes.map((x) => x.name).join("、")}\n含まない：${set.filter((x) => !yes.includes(x)).map((x) => x.name).join("、") || "なし"}` };
      }
      return null;
    });
  }

  // 「B に何を加えた処方か」：構成生薬の集合として B ⊂ A の組
  for (const a of F) for (const b of F) {
    if (a === b) continue;
    const ha = herbsOf(a), hb = herbsOf(b);
    if (hb.length < 3 || !hb.every((h) => ha.includes(h)) || ha.length === hb.length) continue;
    const added = ha.filter((h) => !hb.includes(h));
    if (added.length > 3) continue;
    add(`g:add:${a.name}:${b.name}`, catOf(a), "加味（何を加えたか）", 2, () => {
      if (added.length === 1) return { type: "input", q: `${a.name}の構成生薬を${b.name}と比べたとき、${b.name}にない生薬（加えられている生薬）を答えなさい。`, answer: herbAnswers(added[0]), exp: compNote(a) + "\n" + compNote(b), formula: a.name };
      const ch = shuffle(added.concat(distractHerbs(ha, a.group, 6 - added.length)));
      return { type: "multi", q: `${a.name}の構成生薬を${b.name}と比べたとき、${b.name}にない生薬（加えられている生薬）をすべて選べ。`, choices: ch, answer: added.map((h) => ch.indexOf(h)), exp: compNote(a) + "\n" + compNote(b), formula: a.name };
    });
  }

  // 増量（講義で扱う定番の組だけに限定）
  for (const [a, b, h] of [["桂枝加芍薬湯", "桂枝湯", "芍薬"], ["小建中湯", "桂枝湯", "芍薬"]]) {
    if (!BYNAME[a] || !BYNAME[b]) continue;
    add(`g:inc:${a}`, "桂枝湯類", "増量されている生薬", 1, () => ({
      type: "input", q: `${a}で、${b}と比べて増量されている生薬を答えなさい。`, answer: herbAnswers(h),
      exp: `${h}：${b} ${BYNAME[b].herbs[h]}g → ${a} ${BYNAME[a].herbs[h]}g（ツムラ1日量）\n` + compNote(BYNAME[a]) + "\n" + compNote(BYNAME[b]), formula: a,
    }));
  }

  // 生薬の読み
  for (const h of uniq(F.flatMap(herbsOf))) add(`g:hyomi:${h}`, "生薬", "読み方", 1, () => ({ type: "input", q: `生薬「${h}」の読みをひらがなで答えなさい。`, answer: [R[h], ...(ALIAS[h] || []).filter((x) => /^[ぁ-ん]+$/.test(x))], exp: `${h}＝${R[h]}` }));

  window.KAMPO = { T, norm, shuffle, compNote, BYNAME, GROUP_CAT, sortedHerbs, herbAnswers };
})();
