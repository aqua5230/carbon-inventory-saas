import { useState } from "react";
import { ActivityRecord, Summary, api } from "@/lib/api";

// 下載報告分頁：報告內容說明 + 排放量統計 + PDF/HTML 下載
export default function ReportSection({
  records,
  summary,
  periodId,
  onGoManual,
}: {
  records: ActivityRecord[];
  summary: Summary | null;
  periodId: number;
  onGoManual: () => void;
}) {
  const [downloadError, setDownloadError] = useState("");
  const [downloading, setDownloading] = useState<"pdf" | "html" | null>(null);

  async function openReport(format: "pdf" | "html") {
    const previewWindow = format === "html" ? window.open("", "_blank") : null;
    if (format === "html" && !previewWindow) {
      setDownloadError("瀏覽器已阻擋新視窗，請允許彈出式視窗後重試");
      return;
    }
    setDownloading(format);
    setDownloadError("");
    try {
      const blob = await api.getReport(periodId, format);
      const url = URL.createObjectURL(blob);
      if (format === "html" && previewWindow) {
        previewWindow.location.href = url;
      } else {
        const link = document.createElement("a");
        link.href = url;
        link.download = `碳盤查報告_${periodId}.pdf`;
        link.click();
      }
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (err: unknown) {
      previewWindow?.close();
      setDownloadError(err instanceof Error ? err.message : "報告產生失敗");
    } finally {
      setDownloading(null);
    }
  }

  if (records.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
        <div className="text-4xl mb-3">📭</div>
        <p className="font-medium text-gray-700 mb-1">還沒有數據可以產生報告</p>
        <p className="text-sm text-gray-400 mb-5">請先到「逐筆填寫」或「批次上傳」分頁填入數據</p>
        <button onClick={onGoManual} className="px-5 py-2.5 rounded-xl text-white text-sm font-medium cursor-pointer" style={{ background: "#1a5c2a" }}>
          去填寫數據 →
        </button>
      </div>
    );
  }

  const statCards = [
    { label: "直接排放", sub: "Scope 1", value: summary?.scope1_tonnes ?? 0, color: "#ef4444" },
    { label: "電力排放", sub: "Scope 2", value: summary?.scope2_tonnes ?? 0, color: "#f97316" },
    { label: "其他間接", sub: "Scope 3", value: summary?.scope3_tonnes || 0, color: "#3b82f6" },
    { label: "總計", sub: "合計", value: summary?.total_tonnes ?? 0, color: "#1a5c2a" },
  ];

  return (
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
            {statCards.map(card => (
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
        <button type="button" onClick={() => openReport("pdf")} disabled={downloading !== null}
          className="flex items-center justify-center gap-2 py-4 rounded-2xl text-white font-medium text-sm hover:opacity-90"
          style={{ background: "#1a5c2a" }}>
          {downloading === "pdf" ? "產生中…" : "📄 下載 PDF 報告（正式文件）"}
        </button>
        <button type="button" onClick={() => openReport("html")} disabled={downloading !== null}
          className="flex items-center justify-center gap-2 py-4 rounded-2xl font-medium text-sm border-2 hover:bg-green-50"
          style={{ borderColor: "#1a5c2a", color: "#1a5c2a" }}>
          {downloading === "html" ? "產生中…" : "🌐 線上預覽報告內容"}
        </button>
      </div>

      {downloadError && <p role="alert" className="text-sm text-center text-red-600">{downloadError}</p>}

      <p className="text-xs text-center text-gray-400">
        報告符合 ISO 14064-1 國際標準，可提交給客戶、ESG 評估機構或主管機關
      </p>
    </div>
  );
}
