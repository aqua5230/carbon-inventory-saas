import { Summary } from "@/lib/api";

// 頁面頂部綠色排放量總覽卡片（Scope 1/2/3 + 合計）
export default function EmissionSummary({ summary }: { summary: Summary }) {
  const cards = [
    { label: "直接排放", sublabel: "Scope 1", value: summary.scope1_tonnes, color: "#ef4444" },
    { label: "能源間接", sublabel: "Scope 2", value: summary.scope2_tonnes, color: "#f97316" },
    { label: "其他間接", sublabel: "Scope 3", value: summary.scope3_tonnes || 0, color: "#3b82f6" },
    { label: "總排放量", sublabel: "合計", value: summary.total_tonnes, color: "white" },
  ];
  return (
    <div style={{ background: "#1a5c2a" }} className="px-6 pb-5">
      <div className="max-w-3xl mx-auto">
        <p className="text-white text-xs opacity-60 mb-3 pt-1">目前累計排放量</p>
        <div className="grid grid-cols-4 gap-3">
          {cards.map(card => (
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
  );
}
