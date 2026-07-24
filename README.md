# 共乘帳本

手機優先的共乘車資分攤計算器。把里程成本、油資、ETC、停車與其他費用合併計算，並支援車主保本、全員平均、純油資三種模式。

## 功能

- 三種分攤模式與 5／6／7 元每公里快速設定
- ETC 預估與實際金額覆蓋
- 依上下交流道試算單程或原路來回 ETC
- 起點、途經點、終點的路線里程與分段時間計算
- 保本緩衝與 10／50／100 元進位
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

## Google Routes API

目前所有手動計算與 ETC 試算不需 API Key。若要啟用地點搜尋和自動路線，請把 `.env.example` 複製成 `.env.local`，設定伺服器端的 `GOOGLE_ROUTES_API_KEY`。Google Cloud 專案需啟用：

- Routes API
- Places API (New)

金鑰只由 `/api/route` 與 `/api/places` 伺服器端路由使用。不要使用 `NEXT_PUBLIC_` 前綴，也不要把金鑰寫進前端。

Google Maps 路線與通行費服務可能產生費用，且台灣 ETC 最終扣款仍可能受當日累計里程與折扣影響。應以行程結束後的遠通實際扣款覆蓋預估值。

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
