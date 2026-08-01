"use client";
import { useCallback, useEffect, useState, useRef } from "react";
import { api, ActivityRecord, Summary, EmissionFactor, UploadError } from "@/lib/api";
import { useParams } from "next/navigation";
import Link from "next/link";
import EmissionSummary from "@/components/period/EmissionSummary";
import ActivityTable from "@/components/period/ActivityTable";
import AddActivityForm, { ActivityFormState } from "@/components/period/AddActivityForm";
import ExcelUpload from "@/components/period/ExcelUpload";
import ReportSection from "@/components/period/ReportSection";

export default function PeriodPage() {
  const { id } = useParams();
  const periodId = Number(id);

  const [records, setRecords] = useState<ActivityRecord[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [factors, setFactors] = useState<Record<string, EmissionFactor>>({});
  const [step, setStep] = useState<"list" | "add">("list");
  const [tab, setTab] = useState<"manual" | "upload" | "report">("manual");
  const [form, setForm] = useState<ActivityFormState>({ month: 1, source_type: "", amount: "", unit: "" });
  const [adding, setAdding] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [uploadErrors, setUploadErrors] = useState<UploadError[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const loadData = useCallback(async () => {
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
  }, [periodId]);

  useEffect(() => {
    loadData();
    api.getFactors().then(setFactors).catch((err: unknown) => {
      setError(err instanceof Error ? err.message : "排放係數載入失敗");
    });
  }, [loadData]);

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
      {summary && summary.sources.length > 0 && <EmissionSummary summary={summary} />}

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

                {/* 已填數據 + 圖表 */}
                <ActivityTable records={records} summary={summary} onDelete={deleteRecord} />

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
              <AddActivityForm
                form={form}
                setForm={setForm}
                factors={factors}
                adding={adding}
                onSubmit={addRecord}
                onBack={() => setStep("list")}
              />
            )}
          </div>
        )}

        {/* === Excel 批次上傳 === */}
        {tab === "upload" && (
          <ExcelUpload uploading={uploading} fileRef={fileRef} onUpload={uploadExcel} />
        )}

        {/* === 下載報告 === */}
        {tab === "report" && (
          <ReportSection records={records} summary={summary} periodId={periodId} onGoManual={() => setTab("manual")} />
        )}
      </main>
    </div>
  );
}
