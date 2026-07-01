import { RefObject } from "react";
import { api } from "@/lib/api";

// Excel 批次上傳分頁：下載範本 + 上傳檔案 + 欄位對照說明
export default function ExcelUpload({
  uploading,
  fileRef,
  onUpload,
}: {
  uploading: boolean;
  fileRef: RefObject<HTMLInputElement | null>;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
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
          <input ref={fileRef} type="file" accept=".xlsx,.xls" onChange={onUpload} className="hidden" id="excel-upload" />
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
  );
}
