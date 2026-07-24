import { mkdir, writeFile } from "node:fs/promises";

const PRICE_URL =
  "https://www.freeway.gov.tw/Download_File_Direct.ashx?FileConditionsID=1&id=112";
const FREE_ROADS = {
  國道二號:
    "https://www.freeway.gov.tw/Upload/DownloadFiles/%e5%9c%8b%e9%81%932%e8%99%9f_554336.csv",
  國道二甲:
    "https://www.freeway.gov.tw/Upload/DownloadFiles/%e5%9c%8b%e9%81%932%e7%94%b2_562622.csv",
  國道四號:
    "https://www.freeway.gov.tw/Upload/DownloadFiles/%e5%9c%8b%e9%81%934%e8%99%9f_112696.csv",
  國道六號:
    "https://www.freeway.gov.tw/Upload/DownloadFiles/%e5%9c%8b%e9%81%936%e8%99%9f_160056.csv",
  國道八號:
    "https://www.freeway.gov.tw/Upload/DownloadFiles/%e5%9c%8b%e9%81%938%e8%99%9f_164410.csv",
  國道十號:
    "https://www.freeway.gov.tw/Upload/DownloadFiles/%e5%9c%8b%e9%81%9310%e8%99%9f_172464.csv",
};

const clean = (value = "") =>
  value
    .replace(/^\uFEFF/, "")
    .replace(/交流道/g, "")
    .replace(/^國道/, "國道")
    .replace(/台/g, "臺")
    .trim();

const parseCsv = (text) =>
  text
    .replace(/^\uFEFF/, "")
    .trim()
    .split(/\r?\n/)
    .slice(1)
    .map((line) => line.split(",").map((cell) => cell.trim()));

const priceResponse = await fetch(PRICE_URL);
if (!priceResponse.ok) throw new Error(`ETC 牌價下載失敗：${priceResponse.status}`);
const priceRows = parseCsv(await priceResponse.text());
const nodes = new Map();
const edges = [];

const addNode = (road, name, km = null) => {
  const id = `${road}|${clean(name)}`;
  if (!nodes.has(id)) nodes.set(id, { id, road, name: clean(name), km });
  return id;
};

for (const row of priceRows) {
  const [road, direction, , , fromName, toName, distance, smallCar] = row;
  const normalizedRoad = clean(road);
  const from = addNode(normalizedRoad, fromName);
  const to = addNode(normalizedRoad, toName);
  edges.push({
    from,
    to,
    road: normalizedRoad,
    direction,
    distance: Number(distance),
    toll: Number(smallCar),
  });
}

for (const [road, url] of Object.entries(FREE_ROADS)) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${road}交流道下載失敗：${response.status}`);
  const rows = parseCsv(new TextDecoder("big5").decode(await response.arrayBuffer()))
    .map(([name, km]) => ({ name: clean(name), km: Number(km) }))
    .filter((row) => row.name && Number.isFinite(row.km))
    .sort((a, b) => a.km - b.km);
  rows.forEach((row) => addNode(road, row.name, row.km));
  for (let index = 0; index < rows.length - 1; index += 1) {
    const from = addNode(road, rows[index].name, rows[index].km);
    const to = addNode(road, rows[index + 1].name, rows[index + 1].km);
    const distance = Math.abs(rows[index + 1].km - rows[index].km);
    edges.push({ from, to, road, direction: "E/S", distance, toll: 0 });
    edges.push({ from: to, to: from, road, direction: "W/N", distance, toll: 0 });
  }
}

const systemGroups = new Map();
for (const node of nodes.values()) {
  if (!node.name.includes("系統")) continue;
  const key = node.name.replace(/[（(].*?[）)]/g, "");
  const group = systemGroups.get(key) ?? [];
  group.push(node);
  systemGroups.set(key, group);
}

for (const group of systemGroups.values()) {
  for (const from of group) {
    for (const to of group) {
      if (from.id === to.id || from.road === to.road) continue;
      edges.push({ from: from.id, to: to.id, road: "系統轉接", direction: "X", distance: 0, toll: 0 });
    }
  }
}

const data = {
  meta: {
    source: "交通部高速公路局政府開放資料",
    priceDataset: "https://data.gov.tw/dataset/21165",
    interchangeDataset: "https://data.gov.tw/dataset/166496",
    downloadedAt: new Date().toISOString(),
    note: "本資料供單趟 ETC 預估；實際扣款受每日優惠里程、長途折扣與差別費率影響。",
  },
  nodes: [...nodes.values()].sort((a, b) => a.road.localeCompare(b.road, "zh-Hant") || (a.km ?? 0) - (b.km ?? 0)),
  edges,
};

await mkdir(new URL("../public/data/", import.meta.url), { recursive: true });
await writeFile(new URL("../public/data/etc-network.json", import.meta.url), JSON.stringify(data));
console.log(`已產生 ${data.nodes.length} 個交流道、${data.edges.length} 條有向路段`);
