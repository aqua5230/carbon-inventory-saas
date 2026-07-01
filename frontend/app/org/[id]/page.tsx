"use client";
import { useEffect, useState } from "react";
import { api, Organization, Facility, Period } from "@/lib/api";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

export default function OrgPage() {
  const { id } = useParams();
  const router = useRouter();
  const orgId = Number(id);

  const [org, setOrg] = useState<Organization | null>(null);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [periods, setPeriods] = useState<Record<number, Period[]>>({});
  const [showFacForm, setShowFacForm] = useState(false);
  const [facName, setFacName] = useState("");
  const [facAddr, setFacAddr] = useState("");
  const [error, setError] = useState("");
  const [submittingPeriodId, setSubmittingPeriodId] = useState<number | null>(null);

  useEffect(() => {
    Promise.all([api.getOrgs(), api.getFacilities(orgId)])
      .then(([orgs, facs]) => {
        const found = orgs.find(o => o.id === orgId);
        if (!found) { router.push("/"); return; }
        setOrg(found);
        setFacilities(facs);
        return Promise.all(facs.map(f => api.getPeriods(f.id).then(ps => ({ facId: f.id, ps }))));
      })
      .then(results => {
        if (!results) return;
        const map: Record<number, Period[]> = {};
        results.forEach(r => { map[r.facId] = r.ps; });
        setPeriods(map);
      })
      .catch(e => setError(e.message));
  }, [orgId, router]);

  async function addFacility(e: React.FormEvent) {
    e.preventDefault();
    if (!facName.trim()) return;
    try {
      const fac = await api.createFacility(orgId, { name: facName, address: facAddr });
      setFacilities(prev => [...prev, fac]);
      setPeriods(prev => ({ ...prev, [fac.id]: [] }));
      setShowFacForm(false);
      setFacName(""); setFacAddr("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "建立失敗");
    }
  }

  async function addPeriod(facilityId: number, year: number) {
    try {
      const p = await api.createPeriod(facilityId, { year });
      setPeriods(prev => ({ ...prev, [facilityId]: [...(prev[facilityId] || []), p] }));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "建立失敗");
    }
  }

  async function submitPeriod(facilityId: number, periodId: number) {
    setError("");
    setSubmittingPeriodId(periodId);
    try {
      const updated = await api.updatePeriodStatus(periodId, "submitted");
      setPeriods(prev => ({
        ...prev,
        [facilityId]: (prev[facilityId] || []).map(period =>
          period.id === periodId ? { ...period, status: updated.status } : period
        ),
      }));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "提交失敗");
    } finally {
      setSubmittingPeriodId(null);
    }
  }

  function getStatusBadge(status?: string) {
    switch (status) {
      case "submitted":
        return "bg-green-100 text-green-700";
      case "verified":
        return "bg-blue-100 text-blue-700";
      default:
        return "bg-gray-100 text-gray-600";
    }
  }

  function getStatusLabel(status?: string) {
    switch (status) {
      case "submitted":
        return "已提交";
      case "verified":
        return "已驗證";
      default:
        return "草稿";
    }
  }

  if (!org) return <div className="text-center py-20 text-gray-400">載入中...</div>;

  const currentYear = new Date().getFullYear();
  const hasAnyPeriod = facilities.some(f => (periods[f.id] || []).length > 0);
  // 步驟條當前位置：無廠址 → 第 2 步；已有廠址 → 第 3 步（去年度頁填數據）
  const currentStep = facilities.length === 0 ? 2 : 3;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div style={{ background: "#1a5c2a" }} className="text-white px-6 py-5">
        <div className="max-w-3xl mx-auto">
          <Link href="/" className="text-xs opacity-60 hover:opacity-100">← 返回公司列表</Link>
          <h1 className="text-xl font-bold mt-1">🏭 {org.name}</h1>
          <p className="text-sm opacity-75">管理廠址與年度碳排放數據</p>
        </div>
      </div>

      {/* 步驟說明 */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs text-gray-500 mb-3 font-medium">使用流程（共 4 步）</p>
          <div className="flex items-center gap-2 text-sm overflow-x-auto">
            {["建立公司檔案", "新增廠址", "填寫用電/用油數據", "下載碳排放報告"].map((label, i) => {
              const n = i + 1;
              const done = n < currentStep;
              const active = n === currentStep;
              return (
                <div key={i} className="flex items-center gap-2 shrink-0">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${done ? "bg-green-100 text-green-700" : active ? "text-white" : "bg-gray-100 text-gray-400"}`}
                    style={active ? { background: "#1a5c2a" } : {}}>
                    {done ? "✓" : n}
                  </div>
                  <span className={active ? "font-medium text-gray-800" : done ? "text-green-700" : "text-gray-400"}>{label}</span>
                  {i < 3 && <span className="text-gray-300 mx-1">→</span>}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-6 py-8">
        {error && <div className="mb-4 p-3 rounded-lg text-red-700 bg-red-50 border border-red-200 text-sm">⚠️ {error}</div>}

        {/* 說明卡 */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-6 text-sm">
          <p className="font-medium text-blue-800 mb-1">💡 什麼是廠址？</p>
          <p className="text-blue-700">
            廠址是您公司實際用電、用油的地點，例如「台北總部」、「台中工廠」、「桃園倉庫」。
            每個地點的碳排放量會分開計算。如果只有一個地點，直接新增一個就好。
          </p>
        </div>

        {/* 新增廠址彈窗 */}
        {showFacForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.5)" }}>
            <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4">
              <h2 className="text-lg font-bold mb-1">新增廠址</h2>
              <p className="text-sm text-gray-500 mb-5">填寫這個地點的名稱，例如「台北總部」或「一廠」</p>
              <form onSubmit={addFacility} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">廠址名稱 <span className="text-red-500">*</span></label>
                  <input
                    required
                    value={facName}
                    onChange={e => setFacName(e.target.value)}
                    placeholder="例：台北總部、台中廠、桃園倉庫"
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">地址 <span className="text-gray-400 font-normal">（選填）</span></label>
                  <input
                    value={facAddr}
                    onChange={e => setFacAddr(e.target.value)}
                    placeholder="例：台北市信義區..."
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="submit" className="flex-1 py-3 rounded-xl text-white font-medium cursor-pointer hover:opacity-90" style={{ background: "#1a5c2a" }}>建立廠址 →</button>
                  <button type="button" onClick={() => setShowFacForm(false)} className="px-4 py-3 rounded-xl border border-gray-300 text-gray-600 cursor-pointer">取消</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 廠址列表 */}
        {facilities.length === 0 ? (
          <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-10 text-center">
            <div className="text-4xl mb-3">🏗️</div>
            <h3 className="font-bold text-gray-800 mb-2">尚未建立任何廠址</h3>
            <p className="text-sm text-gray-500 mb-5">請新增至少一個廠址（如：總公司、工廠、門市）</p>
            <button onClick={() => setShowFacForm(true)} className="px-6 py-3 rounded-xl text-white font-medium cursor-pointer text-sm" style={{ background: "#1a5c2a" }}>
              + 新增廠址
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {facilities.map(fac => {
              const facPeriods = periods[fac.id] || [];
              const hasThisYear = facPeriods.some(p => p.year === currentYear);
              return (
                <div key={fac.id} className="bg-white rounded-2xl border border-gray-100 p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-gray-900">📍 {fac.name}</h3>
                      {fac.address && <p className="text-xs text-gray-400 mt-0.5">{fac.address}</p>}
                    </div>
                    {!hasThisYear && (
                      <button
                        onClick={() => addPeriod(fac.id, currentYear)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer hover:opacity-90"
                        style={{ background: "#1a5c2a", color: "white" }}
                      >
                        + 建立 {currentYear} 年記錄
                      </button>
                    )}
                  </div>

                  {facPeriods.length === 0 ? (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
                      <p className="font-medium mb-1">⚡ 下一步：建立今年的碳排放記錄</p>
                      <p className="text-xs">點擊右上角「建立 {currentYear} 年記錄」按鈕，就可以開始填寫用電量、用油量等數據。</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-xs text-gray-400 mb-2">點擊年度進入填寫數據</p>
                      <div className="space-y-2">
                        {facPeriods.map(period => (
                          <div key={period.id} className="border border-gray-200 rounded-xl px-4 py-3 hover:border-green-600 hover:bg-green-50 transition-colors">
                            <div className="flex items-center justify-between gap-4">
                              <Link href={`/period/${period.id}`} className="flex min-w-0 flex-1 items-center justify-between gap-4">
                                <div className="flex items-center gap-3 min-w-0">
                                  <span className="text-lg">📅</span>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <p className="font-medium text-sm">{period.year} 年度</p>
                                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${getStatusBadge(period.status)}`}>
                                        {getStatusLabel(period.status)}
                                      </span>
                                    </div>
                                    <p className="text-xs text-gray-400">1月 ～ 12月</p>
                                  </div>
                                </div>
                                <span className="shrink-0 text-xs font-medium" style={{ color: "#1a5c2a" }}>填寫數據 →</span>
                              </Link>
                              {period.status === "draft" && (
                                <button
                                  type="button"
                                  onClick={() => submitPeriod(fac.id, period.id)}
                                  disabled={submittingPeriodId === period.id}
                                  className="shrink-0 rounded-lg bg-green-100 px-3 py-2 text-xs font-medium text-green-800 cursor-pointer hover:bg-green-200 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  {submittingPeriodId === period.id ? "提交中..." : "提交盤查"}
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            <button
              onClick={() => setShowFacForm(true)}
              className="w-full py-3 border-2 border-dashed border-gray-200 rounded-2xl text-sm text-gray-400 hover:border-green-600 hover:text-green-700 cursor-pointer transition-colors"
            >
              + 新增另一個廠址
            </button>
          </div>
        )}

        {/* 引導提示 */}
        {hasAnyPeriod && (
          <div className="mt-6 bg-green-50 border border-green-200 rounded-2xl p-4 text-sm text-green-800">
            ✅ 太好了！已建立年度記錄。<strong>點擊年度</strong>進入後，就可以開始填寫每月的用電量、用油量等數據。
          </div>
        )}
      </main>
    </div>
  );
}
