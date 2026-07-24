# 共乘帳本

手機優先的共乘車資分攤計算器。把里程成本、油資、ETC、停車與其他費用合併計算，並支援車主保本、全員平均、純油資三種模式。

## 功能

- 三種分攤模式與 5／6／7 元每公里快速設定
- ETC 預估與實際金額覆蓋
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

目前所有手動計算功能不需 API Key。若要串接 Google Routes API，請把 `.env.example` 複製成 `.env.local`，設定伺服器端的 `GOOGLE_ROUTES_API_KEY`，並另外建立 serverless 路由代理請求。不要使用 `NEXT_PUBLIC_` 前綴，也不要把金鑰寫進前端。

Google Maps 路線與通行費服務可能產生費用，且台灣 ETC 最終扣款仍可能受當日累計里程與折扣影響。應以行程結束後的遠通實際扣款覆蓋預估值。

## 部署

專案使用 vinext 與 Cloudflare Worker 相容輸出。執行 `npm run build` 後可部署至 OpenAI Sites。
