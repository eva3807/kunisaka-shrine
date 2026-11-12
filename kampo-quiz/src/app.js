// 漢方小テスト対策：画面の動き
(function () {
  const K = window.KAMPO;
  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  // 生薬・処方名にふりがな（読みを答える問題では付けない）
  const rb = (s) => { const h = esc(s); return cur && /読み/.test(cur.q) ? h : window.addRuby(h); };
  const hash = (s) => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return (h >>> 0).toString(36); };

  const KEY = (window.APP_KEY || "kampo") + ":";
  // ---------- 保存（この端末のブラウザ内のみ） ----------
  const store = {
    get(k, d) { try { const v = localStorage.getItem(KEY + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(KEY + k, JSON.stringify(v)); } catch (e) {} },
  };
  let stats = store.get("stats", {}); // id -> {c, w, streak, last}

  // ---------- 問題プール ----------
  const STATIC = (window.QBANK || []).map((q) => ({ ...q, id: "s:" + hash(q.cat + q.q), gen: false }));
  const POOL = STATIC.concat(K.T);
  const CATS = window.APP_CATS || ["過去の小テスト", "総論", "基礎理論", "桂枝湯類", "生薬", "麻黄剤(予想)", "柴胡剤(予想)", "その他処方(予想)"];
  const CAT_NOTE = { "総論": "小テスト1", "基礎理論": "小テスト2", "桂枝湯類": "小テスト3", "生薬": "小テスト3" };
  const TYPES = { single: "1つ選ぶ", multi: "すべて選ぶ", tf: "正誤", input: "記述" };

  const defaults = { cats: CATS.slice(), src: ["static", "gen"], types: Object.keys(TYPES), levels: [1, 2, 3], order: "weak", ruby: true };
  let cfg = Object.assign({}, defaults, store.get("cfg", {}));
  cfg.cats = cfg.cats.filter((c) => CATS.includes(c));

  // ---------- 設定パネル ----------
  function chips(el, items, key, labelOf) {
    el.innerHTML = items.map((v) => {
      const on = cfg[key].includes(v);
      return `<button type="button" class="chip" aria-pressed="${on}" data-key="${key}" data-v="${esc(v)}">${labelOf(v)}</button>`;
    }).join("");
  }
  function countFor(cat) { return POOL.filter((q) => q.cat === cat).length; }
  function renderSettings() {
    chips($("#f-cats"), CATS, "cats", (c) => `${esc(c)}<small>${CAT_NOTE[c] ? CAT_NOTE[c] + "・" : ""}${countFor(c)}</small>`);
    chips($("#f-src"), ["static", "gen"], "src", (v) => (v === "static" ? `知識問題<small>${STATIC.length}</small>` : `処方構成・適応の自動生成<small>${K.T.length}型</small>`));
    chips($("#f-types"), Object.keys(TYPES), "types", (v) => TYPES[v]);
    chips($("#f-levels"), [1, 2, 3], "levels", (v) => ["", "基本", "標準", "重箱の隅"][v]);
    document.querySelectorAll("input[name=order]").forEach((r) => (r.checked = r.value === cfg.order));
    $("#pool-n").textContent = filtered().length;
  }
  document.addEventListener("click", (e) => {
    const b = e.target.closest(".chip[data-key]");
    if (!b) return;
    const key = b.dataset.key; let v = b.dataset.v; if (key === "levels") v = Number(v);
    const a = cfg[key]; const i = a.indexOf(v);
    if (i >= 0) { if (a.length > 1) a.splice(i, 1); } else a.push(v);
    store.set("cfg", cfg); renderSettings();
  });
  $("#f-onlycat").addEventListener("change", (e) => {
    const v = e.target.value; if (!v) return;
    cfg.cats = v === "all" ? CATS.slice() : v === "past" ? ["過去の小テスト", "総論", "基礎理論", "桂枝湯類", "生薬"] : v === "next" ? ["麻黄剤(予想)", "柴胡剤(予想)", "その他処方(予想)"] : [v];
    e.target.value = ""; store.set("cfg", cfg); renderSettings();
  });
  document.querySelectorAll("input[name=order]").forEach((r) => r.addEventListener("change", () => { cfg.order = r.value; store.set("cfg", cfg); renderSettings(); }));

  function filtered() {
    return POOL.filter((q) => cfg.cats.includes(q.cat) && cfg.src.includes(q.gen ? "gen" : "static") && cfg.levels.includes(q.level || 2)
      && (q.gen || cfg.types.includes(q.type))
      && (cfg.order !== "wrong" || (stats[q.id] && stats[q.id].w > 0 && stats[q.id].streak < 2)));
  }

  // ふりがなの表示切り替え（CSSで rt を隠すだけなので、解いている途中でも即反映）
  function applyRuby() { document.body.classList.toggle("noruby", !cfg.ruby); $("#ruby-on").checked = cfg.ruby; }
  $("#ruby-on").addEventListener("change", (e) => { cfg.ruby = e.target.checked; store.set("cfg", cfg); applyRuby(); });

  // ---------- 出題の選び方 ----------
  let recent = [];
  function weight(q) {
    const s = stats[q.id];
    if (cfg.order === "random") return 1;
    if (!s) return 3;
    if (s.streak === 0) return 6;
    return Math.max(0.2, 2.2 - s.streak * 0.7);
  }
  function nextQuestion() {
    const pool = filtered();
    if (!pool.length) return null;
    for (let t = 0; t < 60; t++) {
      const cand = pool.filter((q) => !recent.includes(q.id) || pool.length <= recent.length);
      const list = cand.length ? cand : pool;
      let tot = list.reduce((a, q) => a + weight(q), 0), r = Math.random() * tot, q = list[0];
      for (const x of list) { r -= weight(x); if (r <= 0) { q = x; break; } }
      const made = q.gen ? q.make() : prepStatic(q);
      if (!made) continue;
      if (q.gen && !cfg.types.includes(made.type)) continue;
      recent.push(q.id); if (recent.length > Math.min(25, Math.floor(pool.length / 2))) recent.shift();
      return Object.assign({ id: q.id, cat: q.cat, sub: q.sub, level: q.level || 2 }, made);
    }
    return null;
  }
  function prepStatic(q) {
    if (q.type === "input" || q.type === "tf") return { type: q.type, q: q.q, choices: q.choices || [], answer: q.answer, exp: q.exp };
    const order = K.shuffle(q.choices.map((_, i) => i));
    return { type: q.type, q: q.q, choices: order.map((i) => q.choices[i]), answer: q.answer.map((a) => order.indexOf(a)), exp: q.exp };
  }

  // ---------- 出題画面 ----------
  let cur = null, answered = false, sess = { n: 0, ok: 0, streak: 0 };
  function show() {
    cur = nextQuestion(); answered = false;
    const box = $("#qcard");
    if (!cur) { box.innerHTML = `<p class="empty">条件に合う問題がありません。分類・形式の選択を増やすか、「間違えた問題だけ」を外してください。</p>`; return; }
    const s = stats[cur.id];
    const hist = s ? `これまで ${s.c}正 / ${s.w}誤` : "初出題";
    let body = "";
    if (cur.type === "input") {
      body = `<form id="inp" class="inp" autocomplete="off"><input id="ans" type="text" inputmode="text" autocapitalize="off" autocorrect="off" spellcheck="false" enterkeyhint="done" placeholder="漢字・ひらがな・カタカナ可" aria-label="解答"><button class="btn primary" type="submit">判定</button></form>`;
    } else {
      body = `<ol class="choices ${cur.type}">` + cur.choices.map((c, i) => `<li><button type="button" class="choice" data-i="${i}" aria-pressed="false"><span class="no">${i + 1}</span><span class="tx">${rb(c)}</span></button></li>`).join("") + `</ol>`;
      if (cur.type === "multi") body += `<button id="judge" class="btn primary" type="button">判定（すべて選んだら）</button>`;
    }
    box.innerHTML = `<div class="meta"><span class="tag">${esc(cur.cat)}</span><span class="tag sub">${esc(cur.sub || "")}</span><span class="tag lv${cur.level}">${["", "基本", "標準", "重箱の隅"][cur.level]}</span><span class="hist">${hist}</span></div>
      <p class="qtext">${rb(cur.q).replace(/\n/g, "<br>")}</p>${cur.type === "multi" ? `<p class="hint">正解はいくつあるか分かりません。すべて選んでから判定。</p>` : ""}${body}<div id="result"></div>`;
    if (cur.type === "input") { const f = $("#inp"); f.addEventListener("submit", (e) => { e.preventDefault(); judge(); }); setTimeout(() => $("#ans").focus({ preventScroll: true }), 30); }
    renderSess();
  }
  $("#qcard").addEventListener("click", (e) => {
    if (answered) return;
    const c = e.target.closest(".choice");
    if (c) {
      if (cur.type === "multi") c.setAttribute("aria-pressed", c.getAttribute("aria-pressed") === "true" ? "false" : "true");
      else { c.setAttribute("aria-pressed", "true"); judge(); }
    }
    if (e.target.closest("#judge")) judge();
  });

  function judge() {
    if (answered) return;
    let ok, picked = [];
    if (cur.type === "input") {
      const v = K.norm($("#ans").value); if (!v) return;
      ok = cur.answer.some((a) => K.norm(a) === v);
      $("#ans").disabled = true;
    } else {
      picked = [...document.querySelectorAll(".choice[aria-pressed=true]")].map((b) => +b.dataset.i);
      if (!picked.length) return;
      ok = picked.length === cur.answer.length && picked.every((i) => cur.answer.includes(i));
      document.querySelectorAll(".choice").forEach((b) => {
        const i = +b.dataset.i, right = cur.answer.includes(i), p = picked.includes(i);
        b.classList.add(right ? "right" : p ? "wrong" : "dim");
        if (right && !p && cur.type === "multi") b.classList.add("missed");
        b.disabled = true;
      });
      const j = $("#judge"); if (j) j.remove();
    }
    answered = true;
    const s = stats[cur.id] || { c: 0, w: 0, streak: 0 };
    if (ok) { s.c++; s.streak++; } else { s.w++; s.streak = 0; }
    s.last = Date.now(); s.cat = cur.cat; stats[cur.id] = s; store.set("stats", stats);
    sess.n++; if (ok) { sess.ok++; sess.streak++; } else sess.streak = 0;
    const ansText = cur.type === "input" ? `正解：${rb(cur.answer[0])}` + (cur.answer.length > 1 ? `（${cur.answer.slice(1).map(esc).join("／")} も可）` : "")
      : `正解：${cur.answer.map((i) => i + 1).sort((a, b) => a - b).join("・")}`;
    $("#result").innerHTML = `<div class="verdict ${ok ? "ok" : "ng"}" role="status"><b>${ok ? "正解" : "不正解"}</b><span>${ansText}</span></div>
      <button id="next" class="btn primary next" type="button">次の問題 <kbd>Enter</kbd></button>
      <div class="exp">${rb(cur.exp || "").replace(/\n/g, "<br>")}</div>`;
    $("#next").addEventListener("click", () => { show(); $("#qcard").scrollIntoView({ block: "start" }); });
    $("#next").focus({ preventScroll: true });
    // スマホでは判定と「次の問題」が画面に入るようにスクロール
    const r = $("#result").getBoundingClientRect();
    if (r.top < 60 || r.top > window.innerHeight * 0.6) $("#result").scrollIntoView({ block: "start", behavior: "smooth" });
    renderSess();
  }
  document.addEventListener("keydown", (e) => {
    if ($("#view-quiz").hidden || !cur) return;
    if (e.key === "Enter" && answered && document.activeElement?.id !== "ans") { e.preventDefault(); show(); }
    if (!answered && cur.type !== "input" && /^[1-9]$/.test(e.key)) { const b = document.querySelector(`.choice[data-i="${+e.key - 1}"]`); if (b) b.click(); }
  });
  function renderSess() {
    $("#sess").innerHTML = `今回 <b>${sess.n}</b>問　正解率 <b>${sess.n ? Math.round((sess.ok / sess.n) * 100) : 0}%</b>　連続正解 <b>${sess.streak}</b>`;
  }

  // ---------- 構成表（暗記） ----------
  let hideHerbs = false, tableGroup = window.TABLE_DEFAULT || "keishi";
  function renderTable() {
    const fs = window.FORMULAS.filter((f) => tableGroup === "all" || f.group === tableGroup);
    $("#tbl").innerHTML = fs.map((f) => {
      const hs = K.sortedHerbs(f);
      return `<article class="fcard"><header><h3>${esc(f.name)}</h3><span class="yomi">${esc(f.yomi)}</span><span class="cnt">${hs.length}種</span></header>
        <ul class="herbs ${hideHerbs ? "hide" : ""}">${hs.map((h) => `<li tabindex="0"><span class="hn">${esc(h)}</span><span class="hr">${esc(window.HERB_READING[h])}</span>${f.herbs[h] != null ? `<span class="g">${f.herbs[h]}g</span>` : ""}</li>`).join("")}</ul>
        <p class="use">${esc(f.use)}</p></article>`;
    }).join("");
    document.querySelectorAll("#tgroup button").forEach((b) => b.setAttribute("aria-pressed", b.dataset.g === tableGroup));
    $("#hide").setAttribute("aria-pressed", hideHerbs);
  }
  $("#tgroup").addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) { tableGroup = b.dataset.g; renderTable(); } });
  $("#hide").addEventListener("click", () => { hideHerbs = !hideHerbs; renderTable(); });
  $("#tbl").addEventListener("click", (e) => { const li = e.target.closest(".herbs.hide li"); if (li) li.classList.toggle("open"); });

  // ---------- 成績 ----------
  function renderStats() {
    const rows = CATS.map((c) => {
      const ids = POOL.filter((q) => q.cat === c).map((q) => q.id);
      let n = 0, ok = 0, ng = 0, mastered = 0, seen = 0;
      for (const id of ids) { const s = stats[id]; if (!s) continue; seen++; ok += s.c; ng += s.w; if (s.streak >= 2) mastered++; }
      n = ok + ng;
      const pct = n ? Math.round((ok / n) * 100) : 0;
      return `<tr><th scope="row">${esc(c)}</th><td>${seen}/${ids.length}</td><td>${n}</td><td><div class="bar"><i style="width:${pct}%"></i></div>${n ? pct + "%" : "–"}</td><td>${mastered}</td></tr>`;
    }).join("");
    const weak = Object.values(stats).filter((s) => s.w > 0 && s.streak < 2).length;
    $("#stats").innerHTML = `<p class="lead">苦手（直近で間違えて、まだ2連続正解していない問題）：<b>${weak}</b>問</p>
      <div class="tw"><table><thead><tr><th>分類</th><th>出題済/総数</th><th>解答回数</th><th>正解率</th><th>2連続正解</th></tr></thead><tbody>${rows}</tbody></table></div>
      <p class="note">自動生成の問題は「型」単位で数えています（選択肢は毎回変わります）。記録はこの端末のブラウザにだけ保存されます。</p>`;
  }
  $("#reset").addEventListener("click", () => { $("#reset-confirm").hidden = false; });
  $("#reset-no").addEventListener("click", () => { $("#reset-confirm").hidden = true; });
  $("#reset-yes").addEventListener("click", () => { stats = {}; store.set("stats", stats); $("#reset-confirm").hidden = true; renderStats(); renderSettings(); });

  // ---------- タブ ----------
  function tab(name) {
    ["quiz", "table", "stats"].forEach((n) => { $("#view-" + n).hidden = n !== name; $("#tab-" + n).setAttribute("aria-selected", n === name); });
    if (name === "table") renderTable();
    if (name === "stats") renderStats();
    if (name === "quiz") renderSettings();
  }
  document.querySelectorAll("[role=tab]").forEach((b) => b.addEventListener("click", () => tab(b.id.slice(4))));
  $("#start").addEventListener("click", () => { $("#settings").open = false; sess = { n: 0, ok: 0, streak: 0 }; recent = []; show(); $("#qcard").scrollIntoView({ behavior: "smooth", block: "start" }); });

  $("#total").textContent = `知識問題 ${STATIC.length}問 ＋ 自動生成 ${K.T.length}型（毎回選択肢が変わる）`;
  applyRuby(); renderSettings(); show();
})();
