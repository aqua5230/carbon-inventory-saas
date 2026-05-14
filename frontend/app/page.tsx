"use client";
import { useEffect, useState } from "react";
import { api, Organization, OrgSummary } from "@/lib/api";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [summaries, setSummaries] = useState<Record<number, OrgSummary>>({});
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", tax_id: "", industry: "", contact_email: "" });
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadOrgs() {
      try {
        const organizations = await api.getOrgs();
        setOrgs(organizations);

        if (organizations.length === 0) {
          setSummaries({});
          return;
        }

        const summaryEntries = await Promise.all(
          organizations.map(async (org) => {
            try {
              const summary = await api.getOrgSummary(org.id);
              return [org.id, summary] as const;
            } catch {
              return null;
            }
          })
        );

        setSummaries(
          Object.fromEntries(
            summaryEntries.filter((entry): entry is readonly [number, OrgSummary] => entry !== null)
          )
        );
      } catch (err: unknown) {
        if (err instanceof Error && err.message.toLowerCase().includes("credentials")) {
          localStorage.removeItem("token");
          router.replace("/login");
          return;
        }
        setError(err instanceof Error ? err.message : "無法連接伺服器");
      } finally {
        setLoading(false);
      }
    }

    const token = localStorage.getItem("token");
    if (!token) {
      router.replace("/login");
      return;
    }

    loadOrgs();
  }, [router]);

  const totalEmissions = orgs.reduce(
    (sum, org) => sum + (summaries[org.id]?.total_tonnes ?? 0),
    0
  );

  function handleLogout() {
    localStorage.removeItem("token");
    router.push("/login");
  }

  async function createOrg(e: React.FormEvent) {
    e.preventDefault();
    try {
      const org = await api.createOrg(form);
      setOrgs(prev => [...prev, org]);
      setSummaries(prev => ({
        ...prev,
        [org.id]: {
          scope1_tonnes: 0,
          scope2_tonnes: 0,
          scope3_tonnes: 0,
          total_tonnes: 0,
          facility_count: 0,
          period_count: 0,
        },
      }));
      setShowForm(false);
      setForm({ name: "", tax_id: "", industry: "", contact_email: "" });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "建立失敗");
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 頂部說明橫幅 */}
      <div style={{ background: "#1a5c2a" }} className="text-white px-6 py-5">
        <div className="max-w-3xl mx-auto flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">🌿 碳盤查系統</h1>
            <p className="text-sm opacity-80 mt-1">幫助您記錄公司每年的碳排放，產生符合政府規範的報告</p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-xl border border-white/30 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
          >
            登出
          </button>
        </div>
      </div>

      {orgs.length > 0 && (
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="max-w-3xl mx-auto flex flex-wrap gap-3">
            <div className="rounded-xl border border-gray-200 bg-white px-4 py-3">
              <p className="text-xs text-gray-500">共 {orgs.length} 間公司</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white px-4 py-3">
              <p className="text-xs text-gray-500">總排放 {totalEmissions.toFixed(2)} tCO₂e</p>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-3xl mx-auto px-6 py-8">
        {error && <div className="mb-4 p-3 rounded-lg text-red-700 bg-red-50 border border-red-200 text-sm">⚠️ {error}</div>}

        {/* 新增企業彈窗 */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.5)" }}>
            <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4">
              <h2 className="text-lg font-bold mb-1">建立公司檔案</h2>
              <p className="text-sm text-gray-500 mb-5">只需填寫公司名稱即可開始，其他資料可以之後再補</p>
              <form onSubmit={createOrg} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">公司名稱 <span className="text-red-500">*</span></label>
                  <input
                    required
                    value={form.name}
                    onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                    placeholder="例：台灣製造股份有限公司"
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">統一編號 <span className="text-gray-400 font-normal">（選填）</span></label>
                  <input
                    value={form.tax_id}
                    onChange={e => setForm(p => ({ ...p, tax_id: e.target.value }))}
                    placeholder="12345678"
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">產業類別 <span className="text-gray-400 font-normal">（選填）</span></label>
                  <select
                    value={form.industry}
                    onChange={e => setForm(p => ({ ...p, industry: e.target.value }))}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
                  >
                    <option value="">請選擇...</option>
                    <option>製造業</option><option>電子業</option><option>食品業</option>
                    <option>紡織業</option><option>化工業</option><option>服務業</option>
                    <option>零售業</option><option>物流業</option><option>其他</option>
                  </select>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="submit" className="flex-1 py-3 rounded-xl text-white font-medium cursor-pointer hover:opacity-90" style={{ background: "#1a5c2a" }}>
                    開始建立 →
                  </button>
                  <button type="button" onClick={() => setShowForm(false)} className="px-4 py-3 rounded-xl border border-gray-300 text-gray-600 cursor-pointer hover:bg-gray-50">
                    取消
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 主內容 */}
        {loading ? (
          <div className="text-center py-20 text-gray-400">載入中...</div>
        ) : orgs.length === 0 ? (
          /* 第一次使用引導 */
          <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-10 text-center">
            <div className="text-5xl mb-4">🏢</div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">從建立公司檔案開始</h2>
            <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">
              建立公司資料後，就可以開始記錄用電量、用油量，系統會自動計算碳排放量並產生報告。
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="px-8 py-3 rounded-xl text-white font-medium cursor-pointer hover:opacity-90 text-sm"
              style={{ background: "#1a5c2a" }}
            >
              + 建立公司檔案
            </button>
            <div className="mt-8 grid grid-cols-3 gap-4 text-left">
              {[
                { icon: "📋", title: "記錄用電/用油", desc: "每月填入帳單數據，系統自動換算 CO₂" },
                { icon: "📊", title: "即時看排放量", desc: "Scope 1（直接）和 Scope 2（電力）分開顯示" },
                { icon: "📄", title: "一鍵產生報告", desc: "符合 ISO 14064-1 國際標準的正式報告" },
              ].map(f => (
                <div key={f.title} className="bg-gray-50 rounded-xl p-4">
                  <div className="text-2xl mb-2">{f.icon}</div>
                  <p className="text-xs font-semibold text-gray-700">{f.title}</p>
                  <p className="text-xs text-gray-400 mt-1">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-bold text-gray-800">您的公司</h2>
                <p className="text-xs text-gray-400 mt-0.5">點擊公司名稱進入，開始填寫碳排放數據</p>
              </div>
              <button
                onClick={() => setShowForm(true)}
                className="px-4 py-2 rounded-xl text-sm font-medium cursor-pointer hover:opacity-90 text-white"
                style={{ background: "#1a5c2a" }}
              >
                + 新增公司
              </button>
            </div>
            <div className="space-y-3">
              {orgs.map(org => {
                const summary = summaries[org.id];
                const totalTonnes = summary?.total_tonnes ?? 0;

                return (
                  <Link key={org.id} href={`/org/${org.id}`}>
                    <div className="bg-white rounded-2xl border border-gray-100 p-5 hover:border-green-600 hover:shadow-md transition-all cursor-pointer group">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: "#f0f7f1" }}>
                            🏭
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{org.name}</h3>
                            <p className="text-xs text-gray-400">{org.industry || "點擊進入 →"}</p>
                          </div>
                        </div>
                        <span className="text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "#1a5c2a" }}>
                          進入 →
                        </span>
                      </div>
                      <p className={`mt-3 text-xs font-medium ${totalTonnes > 0 ? "text-green-700" : "text-gray-400"}`}>
                        {totalTonnes > 0 ? `總排放 ${totalTonnes.toFixed(2)} tCO₂e` : "尚未填寫數據"}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
