// 第4回（麻黄剤）専用：処方データ（ツムラ医療用エキス製剤の構成・1日量g を基準）
// formulas.js の後に読み込み、FORMULAS を麻黄剤だけに差し替える
(function () {
  window.HERB_READING["桑白皮"] = "そうはくひ";
  const base = window.FORMULAS.filter((f) => f.group === "mao");
  const more = [
    {name:"薏苡仁湯",yomi:"よくいにんとう",no:52,group:"mao",herbs:{"薏苡仁":8,"蒼朮":4,"当帰":4,"麻黄":4,"桂皮":3,"芍薬":3,"甘草":2},
     use:"関節痛、筋肉痛"},
    {name:"五虎湯",yomi:"ごことう",no:95,group:"mao",herbs:{"石膏":10,"杏仁":4,"麻黄":4,"桑白皮":3,"甘草":2},
     use:"せき、気管支ぜんそく"},
    {name:"神秘湯",yomi:"しんぴとう",no:85,group:"mao",herbs:{"麻黄":5,"杏仁":4,"厚朴":3,"陳皮":2.5,"甘草":2,"柴胡":2,"蘇葉":1.5},
     use:"小児ぜんそく、気管支ぜんそく、気管支炎"},
  ];
  window.FORMULAS = base.concat(more).map((f) => Object.assign({}, f, { cat: f.name }));
  window.GROUP_CAT = { mao: "麻黄剤の横断問題" };
})();

// アプリ設定（記録は「漢方小テスト道場」と別に保存）
window.APP_KEY = "kampo-dai4";
window.TABLE_DEFAULT = "mao";
window.APP_CATS = ["麻黄湯", "葛根湯", "葛根湯加川芎辛夷", "小青竜湯", "麻黄附子細辛湯", "麻杏甘石湯", "五虎湯", "神秘湯",
  "越婢加朮湯", "麻杏薏甘湯", "薏苡仁湯", "麻黄剤の横断問題", "症例", "鑑別・使い分け", "副作用・注意", "麻黄剤の総論", "生薬"];
