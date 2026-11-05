# 漢方小テスト道場

漢方医学の小テスト対策アプリ。`index.html` をブラウザで開けばそのまま使える（ネット接続はフォント読み込みのみ）。

- 知識問題：`src/data/*.json`（過去の小テスト・総論・基礎理論・桂枝湯類・生薬・第4回予想範囲）
- 自動生成問題：`formulas.js` の処方構成データから、構成生薬・生薬数・五十音順・適応などを毎回作る
- 作り直し：`node build.mjs src/data/kako.json src/data/soron.json src/data/kiso.json src/data/keishi.json src/data/yosou.json`
