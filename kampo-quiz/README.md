# 漢方小テスト道場

漢方医学の小テスト対策アプリ。`index.html` をブラウザで開けばそのまま使える（ネット接続はフォント読み込みのみ）。

- 知識問題：`src/data/*.json`（過去の小テスト・総論・基礎理論・桂枝湯類・生薬・第4回予想範囲）
- 自動生成問題：`formulas.js` の処方構成データから、構成生薬・生薬数・五十音順・適応などを毎回作る
- 作り直し：`node build.mjs src/data/kako.json src/data/soron.json src/data/kiso.json src/data/keishi.json src/data/yosou.json`

## 第4回専用：麻黄剤マスター（`dai4/`）

麻黄剤11処方（葛根湯・葛根湯加川芎辛夷・麻黄湯・小青竜湯・麻黄附子細辛湯・麻杏甘石湯・五虎湯・神秘湯・越婢加朮湯・麻杏薏甘湯・薏苡仁湯）だけを扱う別アプリ。`dai4/index.html` を開けば使える。

- 処方データ：`dai4/formulas4.js`、問題：`dai4/data/*.json`（＋本体 `src/data/yosou.json` の麻黄剤分）
- 作り直し：`node dai4/build4.mjs`
