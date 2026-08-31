// Eleventy 設定ファイル
// - src/ 配下を入力とし、_site/ に静的サイトを書き出す
// - _data/*.json の内容を index.njk のテンプレートに流し込む
// - 画像・favicon・robots・sitemap・管理画面(admin) はそのままコピー

export default function (eleventyConfig) {
  // --- そのままコピーするファイル群 ---
  eleventyConfig.addPassthroughCopy("src/images");
  eleventyConfig.addPassthroughCopy("src/admin");
  // 管理画面はテンプレート処理せず、そのままコピーのみ行う
  eleventyConfig.ignores.add("src/admin/**");
  eleventyConfig.addPassthroughCopy("src/favicon.svg");
  eleventyConfig.addPassthroughCopy("src/robots.txt");
  eleventyConfig.addPassthroughCopy("src/sitemap.xml");

  // --- 画像パス用フィルタ ---
  // http(s) で始まる外部URLはそのまま、それ以外はサイトのベースパスを付与する
  const BASE_PATH = "/kunisaka-shrine";
  eleventyConfig.addFilter("asset", (value) => {
    if (!value) return "";
    if (/^https?:\/\//.test(value) || value.startsWith("data:")) return value;
    const path = value.startsWith("/") ? value : `/${value}`;
    return `${BASE_PATH}${path}`.replace(/([^:])\/\/+/g, "$1/");
  });

  // --- 日付表示フィルタ（"2026-01-01" → "2026年1月1日"） ---
  eleventyConfig.addFilter("date_ja", (value) => {
    if (!value) return "";
    const m = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!m) return value;
    return `${Number(m[1])}年${Number(m[2])}月${Number(m[3])}日`;
  });

  // --- 公開フラグと表示順で整える汎用フィルタ ---
  eleventyConfig.addFilter("visible", (arr) => {
    if (!Array.isArray(arr)) return [];
    return arr
      .filter((x) => x && x.published !== false)
      .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
  });

  // --- 新しい日付順（お知らせ用） ---
  eleventyConfig.addFilter("recent", (arr) => {
    if (!Array.isArray(arr)) return [];
    return arr
      .filter((x) => x && x.published !== false)
      .sort((a, b) => String(b.date).localeCompare(String(a.date)));
  });

  return {
    dir: {
      input: "src",
      output: "_site",
      data: "_data",
      includes: "_includes",
    },
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk",
  };
}
