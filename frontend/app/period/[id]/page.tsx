"use client";
import { useEffect, useState, useRef } from "react";
import { api, ActivityRecord, Summary, EmissionFactor, UploadError } from "@/lib/api";
import { useParams } from "next/navigation";
import Link from "next/link";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";

const MONTHS = ["1月","2月","3月","4月","5月","6月","7月","8月","9月","10月","11月","12月"];

// 排放源的中文說明
const SOURCE_INFO: Record<string, { icon: string; label: string; hint: string }> = {
  electricity: { icon: "⚡", label: "電費（外購電力）", hint: "對照台電電費單上的「用電度數（kWh）」" },
  diesel:      { icon: "🛢️", label: "柴油（車輛/鍋爐）", hint: "加油紀錄或發票上的公升數" },
  gasoline:    { icon: "⛽", label: "汽油（公務車）", hint: "加油紀錄或發票上的公升數" },
  natural_gas: { icon: "🔥", label: "天然氣（瓦斯）", hint: "瓦斯帳單上的立方公尺數" },
  lpg:         { icon: "🫙", label: "液化石油氣（桶裝瓦斯）", hint: "採購紀錄上的公斤數" },
  heavy_oil:   { icon: "🏭", label: "重油（鍋爐燃料）", hint: "採購紀錄上的公升數" },
  commute_car: { icon: "🚗", label: "員工通勤-轎車", hint: "公里數" },
  commute_public_transport: { icon: "🚌", label: "員工通勤-大眾運輸", hint: "公里數" },
  waste_general: { icon: "🗑️", label: "一般廢棄物", hint: "公斤數" },
  waste_recycling: { icon: "♻️", label: "資源回收物", hint: "公斤數" },
  water_supply: { icon: "💧", label: "自來水", hint: "立方公尺數" },
  business_travel_air_domestic: { icon: "✈️", label: "商務差旅-國內航空", hint: "公里數" },
  business_travel_air_international: { icon: "🌐", label: "商務差旅-國際航空", hint: "公里數" },
};

export default function PeriodPage() {
  const { id } = useParams();
  const periodId = Number(id);

  const [records, setRecords] = useState<ActivityRecord[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [factors, setFactors] = useState<Record<string, EmissionFactor>>({});
  const [step, setStep] = useState<"list" | "add">("list");
  const [tab, setTab] = useState<"manual" | "upload" | "report">("manual");
  const [form, setForm] = useState({ month: 1, source_type: "", amount: "", unit: "" });
  const [adding, setAdding] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [uploadErrors, setUploadErrors] = useState<UploadError[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadData();
    api.getFactors().then(setFactors).catch(() => {});
  }, [periodId]);

  async function loadData() {
    try {
      const [recs, sum] = await Promise.all([
        api.getActivity(periodId),
        api.getSummary(periodId).catch(() => null),
      ]);
      setRecords(recs);
      setSummary(sum);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "載入失敗");
    }
  }

  function onSourceChange(src: string) {
    const factor = factors[src];
    setForm(p => ({ ...p, source_type: src, unit: factor?.unit || "" }));
  }

  async function addRecord(e: React.FormEvent) {
    e.preventDefault();
    if (!form.source_type || !form.amount) return;
    setAdding(true);
    setError("");
    try {
      await api.addActivity(periodId, {
        month: form.month,
        source_type: form.source_type,
        amount: parseFloat(form.amount),
        unit: form.unit,
      });
      setForm(p => ({ ...p, amount: "", source_type: "", unit: "" }));
      await loadData();
      setSuccess("已新增！");
      setStep("list");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "新增失敗");
    } finally {
      setAdding(false);
    }
  }

  async function deleteRecord(recId: number) {
    if (!confirm("確定要刪除這筆記錄嗎？")) return;
    try {
      await api.deleteActivity(recId);
      await loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "刪除失敗");
    }
  }

  async function uploadExcel(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    setSuccess("");
    setUploadErrors([]);
    try {
      const result = await api.uploadExcel(periodId, file);
      setUploadErrors(result.errors ?? []);
      if (result.error_count > 0) {
        setSuccess(
          `匯入完成：成功 ${result.success_count} 筆，失敗 ${result.error_count} 筆（詳見下方清單）`
        );
      } else {
        setSuccess(`✅ 成功匯入 ${result.success_count} 筆數據！`);
        setTimeout(() => setSuccess(""), 4000);
      }
      await loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "上傳失敗");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  const selectedFactor = form.source_type ? factors[form.source_type] : null;
  const selectedInfo = form.source_type ? SOURCE_INFO[form.source_type] : null;
  const estimatedCO2 = selectedFactor && form.amount && !isNaN(parseFloat(form.amount))
    ? parseFloat(form.amount) * selectedFactor.co2e_per_unit / 1000
    : null;

  // 依月份分組顯示
  const byMonth: Record<number, ActivityRecord[]> = {};
  records.forEach(r => {
    if (!byMonth[r.month]) byMonth[r.month] = [];
    byMonth[r.month].push(r);
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div style={{ background: "#1a5c2a" }} className="text-white px-6 py-5">
        <div className="max-w-3xl mx-auto">
          <Link href="/" className="text-xs opacity-60 hover:opacity-100">← 返回首頁</Link>
          <h1 className="text-xl font-bold mt-1">📊 碳排放數據填寫</h1>
          <p className="text-sm opacity-75">記錄每個月的用電、用油等數據，系統自動計算排放量</p>
        </div>
      </div>

      {/* 步驟說明 */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs text-gray-500 mb-3 font-medium">使用流程（共 4 步）</p>
          <div className="flex items-center gap-2 text-sm overflow-x-auto">
            {[
              { n: "1", label: "建立公司檔案", done: true },
              { n: "2", label: "新增廠址", done: true },
              { n: "3", label: "填寫用電/用油數據", active: true },
              { n: "4", label: "下載碳排放報告" },
            ].map((s, i) => (
              <div key={i} className="flex items-center gap-2 shrink-0">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${s.done ? "bg-green-100 text-green-700" : s.active ? "text-white" : "bg-gray-100 text-gray-400"}`}
                  style={s.active ? { background: "#1a5c2a" } : {}}>
                  {s.done ? "✓" : s.n}
                </div>
                <span className={s.active ? "font-medium text-gray-800" : s.done ? "text-green-700" : "text-gray-400"}>{s.label}</span>
                {i < 3 && <span className="text-gray-300 mx-1">→</span>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 排放量總覽 */}
      {summary && summary.sources.length > 0 && (
        <div style={{ background: "#1a5c2a" }} className="px-6 pb-5">
          <div className="max-w-3xl mx-auto">
            <p className="text-white text-xs opacity-60 mb-3 pt-1">目前累計排放量</p>
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: "直接排放", sublabel: "Scope 1", value: summary.scope1_tonnes, color: "#ef4444" },
                { label: "能源間接", sublabel: "Scope 2", value: summary.scope2_tonnes, color: "#f97316" },
                { label: "其他間接", sublabel: "Scope 3", value: summary.scope3_tonnes || 0, color: "#3b82f6" },
                { label: "總排放量", sublabel: "合計", value: summary.total_tonnes, color: "white" },
              ].map(card => (
                <div key={card.label} className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.12)" }}>
                  <p className="text-xs text-white opacity-70">{card.label}</p>
                  <p className="text-xs text-white opacity-50">{card.sublabel}</p>
                  <p className="text-xl font-bold mt-1" style={{ color: card.color }}>
                    {card.value.toFixed(2)}
                  </p>
                  <p className="text-xs text-white opacity-50">公噸 CO₂e</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <main className="max-w-3xl mx-auto px-6 py-6">
        {error && <div className="mb-4 p-3 rounded-xl text-red-700 bg-red-50 border border-red-200 text-sm">⚠️ {error}</div>}
        {success && <div className="mb-4 p-3 rounded-xl text-green-700 bg-green-50 border border-green-200 text-sm font-medium">{success}</div>}

        {/* Excel 匯入失敗明細 */}
        {uploadErrors.length > 0 && (
          <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-amber-800">
                ⚠️ 有 {uploadErrors.length} 筆資料未匯入，請修正 Excel 後重新上傳
              </p>
              <button
                type="button"
                onClick={() => setUploadErrors([])}
                className="text-xs text-amber-500 hover:text-amber-700 cursor-pointer"
              >
                關閉
              </button>
            </div>
            <ul className="space-y-1 text-xs text-amber-700">
              {uploadErrors.map((ue, i) => (
                <li key={i} className="flex gap-2">
                  <span className="shrink-0 font-medium">
                    {typeof ue.row === "number" ? `第 ${ue.row} 列` : ue.row}：
                  </span>
                  <span>{ue.error}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 功能分頁 */}
        <div className="flex gap-1 bg-white rounded-2xl p-1 shadow-sm border border-gray-100 mb-6">
          {[
            { key: "manual", label: "📝 逐筆填寫", desc: "一筆一筆輸入" },
            { key: "upload", label: "📤 批次上傳", desc: "用 Excel 大量匯入" },
            { key: "report", label: "📄 下載報告", desc: "產生正式文件" },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key as typeof tab)}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer text-center"
              style={tab === t.key ? { background: "#1a5c2a", color: "#fff" } : { color: "#555" }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* === 手動填寫 === */}
        {tab === "manual" && (
          <div className="space-y-4">
            {step === "list" && (
              <>
                {/* 說明 */}
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-sm text-blue-800">
                  <p className="font-medium mb-1">📋 怎麼填？</p>
                  <ol className="list-decimal list-inside space-y-1 text-xs text-blue-700">
                    <li>找出電費單、加油單、瓦斯帳單</li>
                    <li>點「新增一筆數據」，選擇月份和類型</li>
                    <li>填入帳單上的數量（系統自動算 CO₂）</li>
                    <li>每個月、每種能源分別填一筆</li>
                  </ol>
                </div>

                {/* 新增按鈕 */}
                <button
                  onClick={() => setStep("add")}
                  className="w-full py-4 rounded-2xl text-white font-medium cursor-pointer hover:opacity-90 text-sm flex items-center justify-center gap-2"
                  style={{ background: "#1a5c2a" }}
                >
                  <span className="text-xl">+</span> 新增一筆用電/用油數據
                </button>

                {/* 已填數據 */}
                {records.length === 0 ? (
                  <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-8 text-center">
                    <p className="text-gray-400 text-sm">尚未填寫任何數據</p>
                    <p className="text-gray-300 text-xs mt-1">點擊上方按鈕開始填寫</p>
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
                      <div>
                        <h3 className="font-bold text-gray-800">已填寫的數據</h3>
                        <p className="text-xs text-gray-400 mt-0.5">共 {records.length} 筆</p>
                      </div>
                    </div>
                    <div className="divide-y divide-gray-50">
                      {Object.keys(byMonth).sort((a,b) => Number(a)-Number(b)).map(m => (
                        <div key={m} className="px-5 py-3">
                          <p className="text-xs font-semibold text-gray-400 mb-2">{m} 月</p>
                          {byMonth[Number(m)].map(rec => {
                            const info = SOURCE_INFO[rec.source_type];
                            return (
                              <div key={rec.id} className="flex items-center justify-between py-2">
                                <div className="flex items-center gap-3">
                                  <span className="text-xl">{info?.icon || "📌"}</span>
                                  <div>
                                    <p className="text-sm font-medium text-gray-800">{info?.label || rec.source_type}</p>
                                    <p className="text-xs text-gray-400">
                                      {rec.amount.toLocaleString()} {rec.unit}
                                      　→　<span className="font-semibold text-gray-600">{rec.co2e_tonnes.toFixed(4)} 公噸 CO₂e</span>
                                    </p>
                                  </div>
                                </div>
                                <button onClick={() => deleteRecord(rec.id)} className="text-xs text-gray-300 hover:text-red-400 cursor-pointer px-2 py-1">
                                  刪除
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 圖表分析 */}
                {summary && records.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                    {/* 圓餅圖 */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-5">
                      <h4 className="text-xs font-bold text-gray-400 mb-4 uppercase">範疇佔比 (Scope)</h4>
                      <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={[
                                { name: "Scope 1", value: summary.scope_breakdown?.scope1 || 0 },
                                { name: "Scope 2", value: summary.scope_breakdown?.scope2 || 0 },
                                { name: "Scope 3", value: summary.scope_breakdown?.scope3 || 0 },
                              ].filter(d => d.value > 0)}
                              innerRadius={40} outerRadius={60} paddingAngle={5} dataKey="value"
                            >
                              <Cell fill="#ef4444" />
                              <Cell fill="#f97316" />
                              <Cell fill="#3b82f6" />
                            </Pie>
                            <Tooltip formatter={(v) => typeof v === 'number' ? `${v.toFixed(3)} tCO₂e` : ''} />
                            <Legend wrapperStyle={{ fontSize: "10px" }} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* 長條圖 */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-5">
                      <h4 className="text-xs font-bold text-gray-400 mb-4 uppercase">排放源分析 (Sources)</h4>
                      <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={
                            Object.entries(
                              records.reduce((acc, curr) => {
                                const label = SOURCE_INFO[curr.source_type]?.label || curr.source_type;
                                acc[label] = (acc[label] || 0) + curr.co2e_tonnes;
                                return acc;
                              }, {} as Record<string, number>)
                            ).map(([name, value]) => ({ name, value }))
                          }>
                            <XAxis dataKey="name" fontSize={9} />
                            <YAxis fontSize={9} />
                            <Tooltip formatter={(v) => typeof v === 'number' ? `${v.toFixed(3)} tCO₂e` : ''} />
                            <Bar dataKey="value" fill="#1a5c2a" radius={[2, 2, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                )}

                {/* 完成提示 */}
                {records.length > 0 && (
                  <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-sm">
                    <p className="font-medium text-green-800 mb-2">✅ 填寫完畢後，可以下載正式報告</p>
                    <button
                      onClick={() => setTab("report")}
                      className="px-4 py-2 rounded-lg text-white text-xs font-medium cursor-pointer hover:opacity-90"
                      style={{ background: "#1a5c2a" }}
                    >
                      前往下載報告 →
                    </button>
                  </div>
                )}
              </>
            )}

            {step === "add" && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <button onClick={() => setStep("list")} className="text-sm text-gray-400 hover:text-gray-700 mb-4 cursor-pointer">
                  ← 返回列表
                </button>
                <h3 className="font-bold text-gray-800 mb-1">新增用能數據</h3>
                <p className="text-xs text-gray-400 mb-5">每張帳單填一筆，請對照實際帳單數字填寫</p>

                <form onSubmit={addRecord} className="space-y-5">
                  {/* 月份 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">這是哪個月的帳單？</label>
                    <div className="grid grid-cols-6 gap-2">
                      {MONTHS.map((m, i) => (
                        <button
                          key={i} type="button"
                          onClick={() => setForm(p => ({ ...p, month: i + 1 }))}
                          className={`py-2 rounded-lg text-sm font-medium cursor-pointer transition-all ${form.month === i+1 ? "text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                          style={form.month === i+1 ? { background: "#1a5c2a" } : {}}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 能源種類 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">這是什麼帳單？</label>
                    <div className="space-y-2">
                      {Object.entries(SOURCE_INFO).map(([key, info]) => (
                        <button
                          key={key} type="button"
                          onClick={() => onSourceChange(key)}
                          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 cursor-pointer transition-all text-left ${form.source_type === key ? "border-green-600 bg-green-50" : "border-gray-100 hover:border-gray-300"}`}
                        >
                          <span className="text-2xl">{info.icon}</span>
                          <div>
                            <p className={`text-sm font-medium ${form.source_type === key ? "text-green-800" : "text-gray-800"}`}>{info.label}</p>
                            <p className="text-xs text-gray-400">{info.hint}</p>
                          </div>
                          {form.source_type === key && <span className="ml-auto text-green-600">✓</span>}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 數量 */}
                  {form.source_type && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        數量（{selectedFactor?.unit || "單位"}）
                      </label>
                      <p className="text-xs text-gray-400 mb-2">{selectedInfo?.hint}</p>
                      <input
                        type="number" min="0" step="any" required
                        value={form.amount}
                        onChange={e => setForm(p => ({ ...p, amount: e.target.value }))}
                        placeholder={`帳單上的數字，例：${form.source_type === "electricity" ? "1500" : "200"}`}
                        className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-lg font-semibold focus:outline-none focus:border-green-600"
                      />

                      {/* 即時預覽 */}
                      {estimatedCO2 !== null && (
                        <div className="mt-3 p-3 rounded-xl text-sm" style={{ background: "#f0f7f1" }}>
                          <p className="text-xs text-gray-500">預計碳排放量</p>
                          <p className="text-2xl font-bold mt-1" style={{ color: "#1a5c2a" }}>
                            {estimatedCO2.toFixed(4)} <span className="text-sm font-normal">公噸 CO₂e</span>
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            計算式：{form.amount} {selectedFactor?.unit} × {selectedFactor?.co2e_per_unit} kgCO₂e/{selectedFactor?.unit} ÷ 1000
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={adding || !form.source_type || !form.amount}
                    className="w-full py-4 rounded-xl text-white font-medium cursor-pointer hover:opacity-90 disabled:opacity-40 text-sm"
                    style={{ background: "#1a5c2a" }}
                  >
                    {adding ? "儲存中..." : "儲存這筆數據 →"}
                  </button>
                </form>
              </div>
            )}
          </div>
        )}

        {/* === Excel 批次上傳 === */}
        {tab === "upload" && (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-sm text-blue-800">
              <p className="font-medium mb-2">📊 適合情況：一次要填很多筆數據</p>
              <p className="text-xs text-blue-700">如果您有多個月份、多種能源的數據，用 Excel 一次填完再上傳會比較快速。</p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
              {/* 步驟 1 */}
              <div>
                <p className="text-sm font-bold text-gray-800 mb-2">第 1 步：下載範本</p>
                <a href={api.downloadTemplate()}
                  className="inline-flex items-center gap-2 px-4 py-3 rounded-xl border-2 text-sm font-medium hover:bg-gray-50 transition-colors"
                  style={{ borderColor: "#1a5c2a", color: "#1a5c2a" }}>
                  📥 下載 Excel 範本
                </a>
                <p className="text-xs text-gray-400 mt-2">打開後，按照範本格式填入數據（月份、能源種類、數量）</p>
              </div>

              <hr className="border-gray-100" />

              {/* 步驟 2 */}
              <div>
                <p className="text-sm font-bold text-gray-800 mb-2">第 2 步：上傳填好的 Excel</p>
                <input ref={fileRef} type="file" accept=".xlsx,.xls" onChange={uploadExcel} className="hidden" id="excel-upload" />
                <label htmlFor="excel-upload">
                  <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-green-600 cursor-pointer transition-colors">
                    <div className="text-4xl mb-2">📊</div>
                    <p className="text-sm font-medium text-gray-700">點擊選擇 Excel 檔案</p>
                    <p className="text-xs text-gray-400 mt-1">支援 .xlsx / .xls 格式</p>
                    {uploading && <p className="text-green-700 text-sm mt-3 font-medium">上傳並分析中...</p>}
                  </div>
                </label>
              </div>

              {/* 欄位說明 */}
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs font-semibold text-gray-600 mb-2">Excel 欄位對照表</p>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-gray-400">
                      <th className="text-left py-1">欄位名稱</th>
                      <th className="text-left py-1">填寫範例</th>
                      <th className="text-left py-1">說明</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-600 divide-y divide-gray-100">
                    <tr><td className="py-1.5 font-medium">月份</td><td>1, 2, 3 ... 12</td><td>數字即可</td></tr>
                    <tr><td className="py-1.5 font-medium">排放源</td><td>electricity</td><td>見下方代碼表</td></tr>
                    <tr><td className="py-1.5 font-medium">數量</td><td>1500</td><td>帳單上的數字</td></tr>
                    <tr><td className="py-1.5 font-medium">單位</td><td>kWh</td><td>對應能源單位</td></tr>
                  </tbody>
                </table>
                <div className="mt-3 grid grid-cols-2 gap-1 text-xs text-gray-500">
                  <p>electricity = 電費</p>
                  <p>diesel = 柴油</p>
                  <p>gasoline = 汽油</p>
                  <p>natural_gas = 天然氣</p>
                  <p>lpg = 液化石油氣</p>
                  <p>heavy_oil = 重油</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* === 下載報告 === */}
        {tab === "report" && (
          <div className="space-y-4">
            {records.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
                <div className="text-4xl mb-3">📭</div>
                <p className="font-medium text-gray-700 mb-1">還沒有數據可以產生報告</p>
                <p className="text-sm text-gray-400 mb-5">請先到「逐筆填寫」或「批次上傳」分頁填入數據</p>
                <button onClick={() => setTab("manual")} className="px-5 py-2.5 rounded-xl text-white text-sm font-medium cursor-pointer" style={{ background: "#1a5c2a" }}>
                  去填寫數據 →
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* 報告內容說明 */}
                <div className="bg-white rounded-2xl border border-gray-100 p-5">
                  <h3 className="font-bold text-gray-800 mb-3">📄 報告內容包含</h3>
                  <ul className="space-y-2 text-sm text-gray-600">
                    {[
                      "公司基本資料與盤查期間",
                      "範疇一（直接）、範疇二（電力）、範疇三（其他間接）排放量",
                      "每月、每種能源的詳細排放明細表",
                      "計算方法說明、係數版本與產出時間（符合 ISO 14064-1）",
                      "可交給客戶或查驗機構的正式文件",
                    ].map(item => (
                      <li key={item} className="flex items-center gap-2">
                        <span className="text-green-600">✓</span> {item}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* 排放量預覽 */}
                {summary && (
                  <div className="bg-white rounded-2xl border border-gray-100 p-5">
                    <h3 className="font-bold text-gray-800 mb-3">📊 目前排放量統計</h3>
                    <div className="grid grid-cols-4 gap-3 text-center">
                      {[
                        { label: "直接排放", sub: "Scope 1", value: summary.scope1_tonnes, color: "#ef4444" },
                        { label: "電力排放", sub: "Scope 2", value: summary.scope2_tonnes, color: "#f97316" },
                        { label: "其他間接", sub: "Scope 3", value: summary.scope3_tonnes || 0, color: "#3b82f6" },
                        { label: "總計", sub: "合計", value: summary.total_tonnes, color: "#1a5c2a" },
                      ].map(card => (
                        <div key={card.label} className="rounded-xl p-3 bg-gray-50">
                          <p className="text-xs text-gray-500">{card.label}</p>
                          <p className="text-xs text-gray-400">{card.sub}</p>
                          <p className="text-xl font-bold mt-1" style={{ color: card.color }}>
                            {card.value.toFixed(3)}
                          </p>
                          <p className="text-xs text-gray-400">公噸 CO₂e</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 下載按鈕 */}
                <div className="grid grid-cols-1 gap-3">
                  <a href={api.reportUrl(periodId, "pdf")} target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 py-4 rounded-2xl text-white font-medium text-sm hover:opacity-90"
                    style={{ background: "#1a5c2a" }}>
                    📄 下載 PDF 報告（正式文件）
                  </a>
                  <a href={api.reportUrl(periodId, "html")} target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 py-4 rounded-2xl font-medium text-sm border-2 hover:bg-green-50"
                    style={{ borderColor: "#1a5c2a", color: "#1a5c2a" }}>
                    🌐 線上預覽報告內容
                  </a>
                </div>

                <p className="text-xs text-center text-gray-400">
                  報告符合 ISO 14064-1 國際標準，可提交給客戶、ESG 評估機構或主管機關
                </p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
