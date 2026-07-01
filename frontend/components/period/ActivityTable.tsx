import { ActivityRecord, Summary } from "@/lib/api";
import { SOURCE_INFO } from "@/lib/sourceInfo";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";

// 已填數據列表（依月份分組）+ 範疇佔比圓餅圖 + 排放源長條圖
export default function ActivityTable({
  records,
  summary,
  onDelete,
}: {
  records: ActivityRecord[];
  summary: Summary | null;
  onDelete: (recId: number) => void;
}) {
  // 依月份分組顯示
  const byMonth: Record<number, ActivityRecord[]> = {};
  records.forEach(r => {
    if (!byMonth[r.month]) byMonth[r.month] = [];
    byMonth[r.month].push(r);
  });

  return (
    <>
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
                      <button onClick={() => onDelete(rec.id)} className="text-xs text-gray-300 hover:text-red-400 cursor-pointer px-2 py-1">
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
    </>
  );
}
