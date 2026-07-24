# 共乘帳本

手機優先的共乘車資分攤計算器。把里程成本、油資、ETC、停車與其他費用合併計算，並支援車主保本、全員平均、純油資三種模式。

## 功能

- 三種分攤模式；預設全員平均
- 單一「每公里費用」欄位，預設 6 元/km
- ETC 預估與實際金額覆蓋
- 依上下交流道試算單程或原路來回 ETC
- 手動輸入 Google 地圖查得的總公里數
- 10／50／100 元進位
- 成人、兒童與中途搭乘的個別權重
- LINE 簡潔版／明細版分享文字
- 本機歷史紀錄、深色模式、JSON 匯出與匯入
- PWA，可加入手機主畫面；資料只存在目前瀏覽器

## 本機使用

需要 Node.js 22.13 以上。

```bash
npm install
npm run dev
```

開啟終端顯示的本機網址。

## 驗證與建置

```bash
npm run build
npm test
```

## 公里數

網站不使用 Google Cloud、Google Routes API 或 Places API，也不需要綁定付款方式。請先用 Google 地圖查詢行程總公里數，再手動輸入網站。

## ETC 官方資料

內建資料來自交通部高速公路局：

- [國道計費門架座標及里程牌價表](https://data.gov.tw/dataset/21165)
- [高速公路交流道座標](https://data.gov.tw/dataset/166496)

重新下載並產生離線資料：

```bash
npm run data:update-etc
```

產出的 `public/data/etc-network.json` 會記錄下載時間與來源。ETC 試算採有方向路網，支援免費國道路段銜接收費國道；結果是單趟路線預估，實際扣款仍以遠通紀錄為準。

## 部署

專案使用 vinext 與 Cloudflare Worker 相容輸出。執行 `npm run build` 後可部署至 OpenAI Sites。
