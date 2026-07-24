# 共乘帳本

手機優先的共乘車資分攤計算器。把里程成本、油資、ETC、停車與其他費用合併計算，並支援車主保本、全員平均、純油資三種模式。

## 功能

- 三種分攤模式；預設全員平均
- 依台灣中油 95 無鉛牌價自動套用 5／6／7／8 元每公里費率
- 可關閉油價連動，改用手動每公里費用（預設 6 元/km）
- ETC 預估與實際金額覆蓋
- 依上下交流道試算單程或原路來回 ETC
- 手動輸入 Google 地圖查得的總公里數
- 10／50／100 元進位
- 新行程預設無條件進位至 10 元
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

## 中油 95 油價連動

內建油價來自[台灣中油汽柴油歷史價格](https://www.cpc.com.tw/historyprice.aspx?n=2890)。費率採有狀態的升降級規則：

- 5 元費率遇油價高於 24 元，升為 6 元；6 元費率遇油價低於 22 元，降為 5 元
- 6 元費率遇油價高於 29 元，升為 7 元；7 元費率遇油價低於 27 元，降為 6 元
- 7 元費率遇油價高於 34 元，升為 8 元；8 元費率遇油價低於 32 元，降為 7 元

剛好等於門檻時維持原費率。網站會保存上一期費率，避免油價在門檻附近波動時頻繁切換。手動更新資料：

```bash
npm run fuel:update
```

`.github/workflows/update-fuel-price.yml` 會在每週一台灣時間上午 8 點自動檢查；資料有變化才更新 `public/data/fuel-price.json` 並觸發網站部署。

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

### GitHub Pages

公開網站：

https://autoscotland.github.io/carpool-fare-calculator/

推送到 `main` 後，`.github/workflows/deploy-pages.yml` 會自動執行測試、建置
GitHub Pages 專用的靜態輸出，並發布網站。也可以在 GitHub 的 Actions 頁面手動執行。

本機檢查 Pages 靜態輸出：

```bash
npm run pages:build
```

輸出位於 `pages-output/`，不會提交到 repository。ETC 資料與 PWA 路徑會自動調整為
`/carpool-fare-calculator/` 子路徑。
