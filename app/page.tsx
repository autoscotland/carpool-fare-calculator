"use client";

import { useEffect, useMemo, useState } from "react";
import { findEtcRoute, type EtcNetwork, type EtcRoute } from "../lib/etc";

type Mode = "owner" | "everyone" | "fuel";
type RoundTo = 0 | 10 | 50 | 100;
type Passenger = { id: string; name: string; weight: number };
type Trip = {
  id: string;
  name: string;
  route: string;
  distance: number;
  mode: Mode;
  rate: number;
  efficiency: number;
  fuelPrice: number;
  etcEstimate: number;
  etcActual: number | "";
  parking: number;
  other: number;
  roundTo: RoundTo;
  totalPeople: number;
  freePassengers: number;
  passengers: Passenger[];
  savedAt?: string;
};

const demo: Trip = {
  id: "current",
  name: "高雄・白河一日行程",
  route: "高雄 → 火山碧雲寺 → 東山孚佑宮 → 高雄",
  distance: 227,
  mode: "everyone",
  rate: 6,
  efficiency: 9,
  fuelPrice: 31.3,
  etcEstimate: 120,
  etcActual: "",
  parking: 0,
  other: 0,
  roundTo: 50,
  totalPeople: 4,
  freePassengers: 0,
  passengers: [
    { id: "p1", name: "乘客 A", weight: 100 },
    { id: "p2", name: "乘客 B", weight: 100 },
    { id: "p3", name: "乘客 C", weight: 100 },
  ],
};

const money = (value: number) =>
  new Intl.NumberFormat("zh-TW", {
    style: "currency",
    currency: "TWD",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0);

const ceilTo = (value: number, unit: RoundTo) =>
  unit ? Math.ceil(value / unit) * unit : Math.ceil(value);

export function calculateTrip(trip: Trip) {
  const etc = trip.etcActual === "" ? trip.etcEstimate : trip.etcActual;
  const mileage =
    trip.mode === "fuel"
      ? (trip.distance / Math.max(trip.efficiency, 0.1)) * trip.fuelPrice
      : trip.distance * trip.rate;
  const subtotal = mileage + etc + trip.parking + trip.other;
  const total = subtotal;
  const eligible =
    trip.mode === "everyone"
      ? Math.max(1, trip.totalPeople - trip.freePassengers)
      : Math.max(1, trip.totalPeople - 1 - trip.freePassengers);
  const payingPassengerCount = trip.mode === "everyone" ? Math.max(0, eligible - 1) : eligible;
  const weights =
    trip.passengers.length > 0
      ? trip.passengers.slice(0, payingPassengerCount)
      : Array.from({ length: payingPassengerCount }, (_, index) => ({
          id: `auto-${index}`,
          name: `乘客 ${index + 1}`,
          weight: 100,
        }));
  const driverWeight = trip.mode === "everyone" ? 100 : 0;
  const weightTotal = weights.reduce((sum, person) => sum + Math.max(0, person.weight), driverWeight) || eligible * 100;
  const shares = weights.map((person) => {
    const raw = total * (Math.max(0, person.weight) / weightTotal);
    return { ...person, raw, suggested: ceilTo(raw, trip.roundTo) };
  });
  const collected = shares.reduce((sum, person) => sum + person.suggested, 0);
  const driverShare = trip.mode === "everyone" ? total * (driverWeight / weightTotal) : Math.max(0, total - collected);
  const driverSuggested = trip.mode === "everyone" ? ceilTo(driverShare, trip.roundTo) : 0;
  return { etc, mileage, subtotal, total, eligible, shares, collected, driverShare, driverSuggested, margin: collected + driverSuggested - total };
}

function NumberField({
  label,
  value,
  onChange,
  suffix,
  min = 0,
  step = 1,
}: {
  label: string;
  value: number | "";
  onChange: (value: number | "") => void;
  suffix?: string;
  min?: number;
  step?: number;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <div className="input-wrap">
        <input
          type="number"
          min={min}
          step={step}
          value={value}
          onChange={(event) => onChange(event.target.value === "" ? "" : Math.max(min, Number(event.target.value)))}
        />
        {suffix && <em>{suffix}</em>}
      </div>
    </label>
  );
}

export default function Home() {
  const [trip, setTrip] = useState<Trip>(demo);
  const [history, setHistory] = useState<Trip[]>([]);
  const [tab, setTab] = useState<"calculator" | "history" | "settings">("calculator");
  const [detail, setDetail] = useState(false);
  const [toast, setToast] = useState("");
  const [theme, setTheme] = useState<"system" | "light" | "dark">("system");
  const [etcNetwork, setEtcNetwork] = useState<EtcNetwork | null>(null);
  const [etcStartRoad, setEtcStartRoad] = useState("國道十號");
  const [etcEndRoad, setEtcEndRoad] = useState("國道三號");
  const [etcStart, setEtcStart] = useState("");
  const [etcEnd, setEtcEnd] = useState("");
  const [etcRoundTrip, setEtcRoundTrip] = useState(true);
  const [etcRoute, setEtcRoute] = useState<EtcRoute | null>(null);
  const result = useMemo(() => calculateTrip(trip), [trip]);

  useEffect(() => {
    const saved = localStorage.getItem("carpool-state");
    const savedHistory = localStorage.getItem("carpool-history");
    const savedTheme = localStorage.getItem("carpool-theme") as typeof theme | null;
    queueMicrotask(() => {
      if (saved) setTrip({ ...demo, ...JSON.parse(saved), id: "current" });
      if (savedHistory) setHistory(JSON.parse(savedHistory));
      if (savedTheme) setTheme(savedTheme);
    });
    fetch("/data/etc-network.json").then((response) => response.json()).then(setEtcNetwork).catch(() => undefined);
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => undefined);
  }, []);

  useEffect(() => {
    localStorage.setItem("carpool-state", JSON.stringify(trip));
  }, [trip]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("carpool-theme", theme);
  }, [theme]);

  const update = <K extends keyof Trip>(key: K, value: Trip[K]) =>
    setTrip((current) => ({ ...current, [key]: value }));

  const roads = useMemo(
    () => [...new Set((etcNetwork?.nodes ?? []).map((node) => node.road))],
    [etcNetwork],
  );
  const nodesForRoad = (road: string) =>
    (etcNetwork?.nodes ?? []).filter((node) => node.road === road);

  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2200);
  };

  const calculateEtc = () => {
    if (!etcNetwork || !etcStart || !etcEnd) return notify("請選擇上下交流道");
    const outbound = findEtcRoute(etcNetwork, etcStart, etcEnd);
    if (!outbound) return notify("目前資料找不到可銜接的國道路線");
    let totalToll = outbound.toll;
    let totalDistance = outbound.distance;
    if (etcRoundTrip) {
      const inbound = findEtcRoute(etcNetwork, etcEnd, etcStart);
      if (!inbound) return notify("找不到回程方向，請關閉原路來回並手動填寫");
      totalToll += inbound.toll;
      totalDistance += inbound.distance;
    }
    const rounded = Math.round(totalToll);
    setEtcRoute({ ...outbound, toll: rounded, distance: totalDistance });
    update("etcEstimate", rounded);
    notify("ETC 預估已帶入費用明細");
  };

  const shareText = (full = false) => {
    const lines = [
      "🚗 共乘車資分攤",
      `行程：${trip.name || trip.route || "本次行程"}`,
      `總里程：${trip.distance} 公里`,
      `ETC：${money(Number(result.etc))}`,
      `停車：${money(trip.parking)}`,
      `付費乘客：${result.eligible} 人`,
      "",
      `本次每位乘客：${money(result.shares[0]?.suggested || 0)} 起`,
    ];
    if (full) {
      lines.splice(3, 0, `里程費：${money(result.mileage)}`, `總交通成本：${money(result.total)}`);
      if (result.shares.some((person) => person.weight !== 100)) {
        lines.push("", ...result.shares.map((person) => `${person.name}：${money(person.suggested)}`));
      }
    }
    return lines.join("\n");
  };

  const copyShare = async (full = false) => {
    await navigator.clipboard.writeText(shareText(full));
    notify("已複製，可直接貼到 LINE");
  };

  const saveTrip = () => {
    const saved = { ...trip, id: crypto.randomUUID(), savedAt: new Date().toISOString() };
    const next = [saved, ...history].slice(0, 30);
    setHistory(next);
    localStorage.setItem("carpool-history", JSON.stringify(next));
    notify("行程已儲存");
  };

  const exportData = () => {
    const blob = new Blob([JSON.stringify({ trip, history }, null, 2)], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `共乘車資備份-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  return (
    <main>
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">行</span>
          <div><strong>共乘帳本</strong><small>每趟都算得剛剛好</small></div>
        </div>
        <button className="icon-button" onClick={() => setTab("settings")} aria-label="開啟設定">⚙</button>
      </header>

      <nav className="tabs" aria-label="主要功能">
        <button className={tab === "calculator" ? "active" : ""} onClick={() => setTab("calculator")}>計算器</button>
        <button className={tab === "history" ? "active" : ""} onClick={() => setTab("history")}>歷史紀錄</button>
        <button className={tab === "settings" ? "active" : ""} onClick={() => setTab("settings")}>設定</button>
      </nav>

      {tab === "calculator" && (
        <>
          <section className="hero-card">
            <div className="hero-label"><span className="pulse" /> 建議每位乘客收費</div>
            <div className="price">{money(result.shares[0]?.suggested || 0)}<small>起</small></div>
            <div className="hero-meta">
              <span>{result.eligible} 位付費乘客</span><i />
              <span>{trip.mode === "everyone" ? `全員總分攤 ${money(result.collected + result.driverSuggested)}` : `預估收款 ${money(result.collected)}`}</span>
            </div>
            <div className={`coverage ${result.margin >= 0 ? "safe" : "warn"}`}>
              {result.margin >= 0 ? "✓ 已涵蓋本趟成本" : `尚差 ${money(Math.abs(result.margin))}`}
              <b>{result.margin >= 0 ? `進位餘額 ${money(result.margin)}` : "請調高費率"}</b>
            </div>
          </section>

          <section className="card">
            <div className="section-heading"><div><small>STEP 01</small><h2>這趟去哪裡？</h2></div><span className="step-icon">⌖</span></div>
            <label className="field full"><span>行程名稱</span><input value={trip.name} onChange={(e) => update("name", e.target.value)} placeholder="例如：高雄・白河一日遊" /></label>
            <NumberField label="總公里數" value={trip.distance} onChange={(v) => update("distance", Number(v))} suffix="km" step={0.1} />
            <div className="api-note">請先使用 Google 地圖查詢行程總公里數，再填入此處。支援小數，例如 227.5 km。</div>
          </section>

          <section className="card">
            <div className="section-heading"><div><small>ETC</small><h2>上下交流道試算</h2></div><span className="step-icon">道</span></div>
            <div className="two-col">
              <label className="field"><span>上交流道國道</span><select value={etcStartRoad} onChange={(event) => { setEtcStartRoad(event.target.value); setEtcStart(""); }}>{roads.map((road) => <option key={road}>{road}</option>)}</select></label>
              <label className="field"><span>去程上交流道</span><select value={etcStart} onChange={(event) => setEtcStart(event.target.value)}><option value="">請選擇</option>{nodesForRoad(etcStartRoad).map((node) => <option key={node.id} value={node.id}>{node.name}</option>)}</select></label>
              <label className="field"><span>下交流道國道</span><select value={etcEndRoad} onChange={(event) => { setEtcEndRoad(event.target.value); setEtcEnd(""); }}>{roads.map((road) => <option key={road}>{road}</option>)}</select></label>
              <label className="field"><span>去程下交流道</span><select value={etcEnd} onChange={(event) => setEtcEnd(event.target.value)}><option value="">請選擇</option>{nodesForRoad(etcEndRoad).map((node) => <option key={node.id} value={node.id}>{node.name}</option>)}</select></label>
            </div>
            <div className="route-tools etc-tools">
              <label><input type="checkbox" checked={etcRoundTrip} onChange={(event) => setEtcRoundTrip(event.target.checked)} /> 原路來回</label>
              <span>車種：小型車</span>
              <span>{new Date().toLocaleDateString("zh-TW")}</span>
            </div>
            <button className="primary route-action" onClick={calculateEtc}>試算 ETC 並帶入</button>
            {etcRoute && <div className="etc-result">
              <span>本行程 ETC 預估</span><strong>{money(etcRoute.toll)}</strong>
              <p>{etcRoute.roads.join(" → ")} · 約 {etcRoute.distance.toFixed(1)} 公里{etcRoundTrip ? "（含來回）" : ""}</p>
            </div>}
            <div className="api-note">資料來源：交通部高速公路局官方牌價與交流道資料。這是單趟路線預估；每日優惠里程、長途折扣、連假差別費率與當日其他國道路程可能使實際扣款不同，行程後請在下方填入實際金額覆蓋。</div>
          </section>

          <section className="card">
            <div className="section-heading"><div><small>STEP 02</small><h2>怎麼分攤？</h2></div><span className="step-icon">◎</span></div>
            <div className="mode-grid">
              {([
                ["owner", "車主保本", "乘客分攤全部成本"],
                ["everyone", "全員平均", "駕駛也一起分攤"],
                ["fuel", "純油資", "只算油錢與雜費"],
              ] as const).map(([value, title, description]) => (
                <button key={value} className={trip.mode === value ? "selected" : ""} onClick={() => update("mode", value)}>
                  <b>{title}</b><small>{description}</small>
                </button>
              ))}
            </div>
            <div className="two-col">
              <NumberField label="車上總人數" value={trip.totalPeople} onChange={(v) => update("totalPeople", Math.max(2, Number(v)))} suffix="人" min={2} />
              <NumberField label="免費乘客" value={trip.freePassengers} onChange={(v) => update("freePassengers", Math.min(trip.totalPeople - 1, Number(v)))} suffix="人" />
            </div>
            <div className="count-strip"><span>付費乘客</span><b>{result.eligible} 人</b></div>
          </section>

          <section className="card">
            <div className="section-heading"><div><small>STEP 03</small><h2>費用明細</h2></div><span className="step-icon">＄</span></div>
            {trip.mode !== "fuel" ? (
              <NumberField label="每公里費用" value={trip.rate} onChange={(v) => update("rate", Number(v))} suffix="元/km" step={0.1} />
            ) : (
              <div className="two-col">
                <NumberField label="平均油耗" value={trip.efficiency} onChange={(v) => update("efficiency", Number(v))} suffix="km/L" step={0.1} min={0.1} />
                <NumberField label="每公升油價" value={trip.fuelPrice} onChange={(v) => update("fuelPrice", Number(v))} suffix="元" step={0.1} />
              </div>
            )}
            <div className="two-col">
              <NumberField label="ETC 預估" value={trip.etcEstimate} onChange={(v) => update("etcEstimate", Number(v))} suffix="元" />
              <NumberField label="ETC 實際" value={trip.etcActual} onChange={(v) => update("etcActual", v)} suffix="元" />
              <NumberField label="停車費" value={trip.parking} onChange={(v) => update("parking", Number(v))} suffix="元" />
              <NumberField label="其他費用" value={trip.other} onChange={(v) => update("other", Number(v))} suffix="元" />
            </div>
            <label className="field full"><span>收費進位</span><select value={trip.roundTo} onChange={(e) => update("roundTo", Number(e.target.value) as RoundTo)}><option value={0}>不進位</option><option value={10}>進位至 10 元</option><option value={50}>進位至 50 元</option><option value={100}>進位至 100 元</option></select></label>
          </section>

          <section className="card">
            <div className="section-heading"><div><small>OPTIONAL</small><h2>個別乘客權重</h2></div><button className="text-button" onClick={() => update("passengers", [...trip.passengers, { id: crypto.randomUUID(), name: `乘客 ${trip.passengers.length + 1}`, weight: 100 }])}>＋ 新增</button></div>
            <p className="helper">成人填 100%，兒童可填 50%，中途搭乘可依里程比例調整。</p>
            <div className="passenger-list">
              {trip.passengers.slice(0, result.shares.length).map((person, index) => (
                <div className="passenger" key={person.id}>
                  <span>{index + 1}</span>
                  <input value={person.name} onChange={(e) => update("passengers", trip.passengers.map((p) => p.id === person.id ? { ...p, name: e.target.value } : p))} aria-label={`乘客 ${index + 1} 姓名`} />
                  <div className="weight"><input type="number" min="0" value={person.weight} onChange={(e) => update("passengers", trip.passengers.map((p) => p.id === person.id ? { ...p, weight: Math.max(0, Number(e.target.value)) } : p))} aria-label={`${person.name} 權重`} /><em>%</em></div>
                  <b>{money(result.shares[index]?.suggested || 0)}</b>
                </div>
              ))}
            </div>
          </section>

          <section className="summary-card">
            <button className="summary-toggle" onClick={() => setDetail(!detail)}><span>本趟計算明細</span><b>{detail ? "收起 −" : "展開 ＋"}</b></button>
            {detail && <div className="breakdown">
              <div><span>{trip.mode === "fuel" ? "推估油資" : `里程成本（${trip.distance} × ${trip.rate}）`}</span><b>{money(result.mileage)}</b></div>
              <div><span>ETC（{trip.etcActual === "" ? "預估" : "實際"}）</span><b>{money(Number(result.etc))}</b></div>
              <div><span>停車與其他</span><b>{money(trip.parking + trip.other)}</b></div>
              <div className="total"><span>總交通成本</span><b>{money(result.total)}</b></div>
              {trip.mode === "everyone" && <div><span>駕駛分攤</span><b>{money(result.driverSuggested)}</b></div>}
              {result.shares.map((person) => <div key={person.id}><span>{person.name}（{person.weight}%）</span><b>{money(person.suggested)}</b></div>)}
            </div>}
          </section>

          <div className="actions">
            <button className="secondary" onClick={() => { setTrip({ ...demo }); setEtcRoute(null); setEtcStart(""); setEtcEnd(""); notify("已重設為全員平均"); }}>重設</button>
            <button className="secondary" onClick={saveTrip}>儲存這趟</button>
            <button className="primary" onClick={() => copyShare(false)}>複製 LINE 簡潔版</button>
            <button className="secondary wide" onClick={() => copyShare(true)}>複製明細版</button>
          </div>
        </>
      )}

      {tab === "history" && (
        <section className="card standalone">
          <div className="section-heading"><div><small>TRIPS</small><h2>歷史行程</h2></div><span className="step-icon">↻</span></div>
          {history.length === 0 ? <div className="empty"><b>還沒有儲存的行程</b><p>算完一趟後按「儲存這趟」，下次就能快速套用。</p></div> :
            <div className="history-list">{history.map((item) => <article key={item.id}><div><b>{item.name || "未命名行程"}</b><small>{item.distance} km · {item.savedAt ? new Date(item.savedAt).toLocaleDateString("zh-TW") : ""}</small></div><div><button onClick={() => { setTrip({ ...item, id: "current" }); setTab("calculator"); }}>載入</button><button className="danger" onClick={() => { const next = history.filter((h) => h.id !== item.id); setHistory(next); localStorage.setItem("carpool-history", JSON.stringify(next)); }}>刪除</button></div></article>)}</div>}
        </section>
      )}

      {tab === "settings" && (
        <section className="card standalone">
          <div className="section-heading"><div><small>PREFERENCES</small><h2>偏好與資料</h2></div><span className="step-icon">⚙</span></div>
          <label className="field full"><span>顯示主題</span><select value={theme} onChange={(e) => setTheme(e.target.value as typeof theme)}><option value="system">跟隨系統</option><option value="light">淺色</option><option value="dark">深色</option></select></label>
          <div className="settings-block"><h3>備份資料</h3><p>所有行程只儲存在目前裝置，不會上傳到伺服器。</p><button className="secondary" onClick={exportData}>匯出 JSON 備份</button><label className="import-button">匯入 JSON<input type="file" accept=".json,application/json" onChange={async (e) => { const file = e.target.files?.[0]; if (!file) return; try { const data = JSON.parse(await file.text()); if (data.trip) setTrip({ ...demo, ...data.trip, id: "current" }); if (Array.isArray(data.history)) { setHistory(data.history); localStorage.setItem("carpool-history", JSON.stringify(data.history)); } notify("備份已匯入"); } catch { notify("備份格式不正確"); } }} /></label></div>
          <div className="settings-block"><h3>ETC 官方資料</h3><p>交流道與牌價資料內建於網站，可離線使用，不需要 Google API 或任何付費服務。行程後仍可用遠通實際扣款覆蓋預估值。</p></div>
        </section>
      )}

      <footer>資料只留在你的裝置 · 行程費用由你掌握</footer>
      {toast && <div className="toast" role="status">{toast}</div>}
    </main>
  );
}
