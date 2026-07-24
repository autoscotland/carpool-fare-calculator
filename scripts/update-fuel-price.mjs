import { readFile, writeFile } from "node:fs/promises";

const sourceUrl = "https://www.cpc.com.tw/historyprice.aspx?n=2890";
const outputUrl = new URL("../public/data/fuel-price.json", import.meta.url);

const response = await fetch(sourceUrl, {
  headers: { "user-agent": "carpool-fare-calculator/1.0" },
  signal: AbortSignal.timeout(20_000),
});
if (!response.ok) throw new Error(`中油牌價下載失敗：HTTP ${response.status}`);

const html = await response.text();
const seriesMatch = html.match(/var pieSeries = (\[.*\]);\s*$/m);
if (!seriesMatch) throw new Error("找不到中油歷史價格資料，官方頁面格式可能已變更");

const series = JSON.parse(seriesMatch[1]);
const entries = series
  .filter((entry) => entry.data?.[0]?.name === "95 無鉛汽油")
  .map((entry) => ({
    rocDate: entry.name,
    price: Number(entry.data[0].y),
  }));
if (entries.length === 0) throw new Error("找不到 95 無鉛汽油牌價");

const latest = entries.at(-1);
if (!Number.isFinite(latest.price) || latest.price < 10 || latest.price > 60) {
  throw new Error(`95 無鉛牌價不合理：${latest.price}`);
}

const [rocYear, month, day] = latest.rocDate.split("/").map(Number);
const effectiveDate = `${rocYear + 1911}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
const previous = JSON.parse(await readFile(outputUrl, "utf8"));

if (previous.price === latest.price && previous.effectiveDate === effectiveDate) {
  console.log(`牌價未變：95 無鉛 ${latest.price} 元／L（${effectiveDate}）`);
  process.exit(0);
}

const next = {
  source: "台灣中油",
  fuelType: "95無鉛汽油",
  price: latest.price,
  effectiveDate,
  updatedAt: new Date().toISOString(),
};
await writeFile(outputUrl, `${JSON.stringify(next, null, 2)}\n`);
console.log(`已更新：95 無鉛 ${latest.price} 元／L（${effectiveDate}）`);
