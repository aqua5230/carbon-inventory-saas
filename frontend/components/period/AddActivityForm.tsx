import { Dispatch, SetStateAction } from "react";
import { EmissionFactor } from "@/lib/api";
import { MONTHS, SOURCE_INFO } from "@/lib/sourceInfo";

export interface ActivityFormState {
  month: number;
  source_type: string;
  amount: string;
  unit: string;
}

// 逐筆新增用能數據的表單（選月份 → 選能源 → 填數量，含即時 CO₂ 預覽）
export default function AddActivityForm({
  form,
  setForm,
  factors,
  adding,
  onSubmit,
  onBack,
}: {
  form: ActivityFormState;
  setForm: Dispatch<SetStateAction<ActivityFormState>>;
  factors: Record<string, EmissionFactor>;
  adding: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onBack: () => void;
}) {
  function onSourceChange(src: string) {
    const factor = factors[src];
    setForm(p => ({ ...p, source_type: src, unit: factor?.unit || "" }));
  }

  const selectedFactor = form.source_type ? factors[form.source_type] : null;
  const selectedInfo = form.source_type ? SOURCE_INFO[form.source_type] : null;
  const estimatedCO2 = selectedFactor && form.amount && !isNaN(parseFloat(form.amount))
    ? parseFloat(form.amount) * selectedFactor.co2e_per_unit / 1000
    : null;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6">
      <button onClick={onBack} className="text-sm text-gray-400 hover:text-gray-700 mb-4 cursor-pointer">
        ← 返回列表
      </button>
      <h3 className="font-bold text-gray-800 mb-1">新增用能數據</h3>
      <p className="text-xs text-gray-400 mb-5">每張帳單填一筆，請對照實際帳單數字填寫</p>

      <form onSubmit={onSubmit} className="space-y-5">
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
  );
}
