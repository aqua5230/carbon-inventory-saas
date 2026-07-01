// 排放源中文說明與月份標籤，period 頁與其子 component 共用
export const MONTHS = ["1月","2月","3月","4月","5月","6月","7月","8月","9月","10月","11月","12月"];

export interface SourceInfo {
  icon: string;
  label: string;
  hint: string;
}

export const SOURCE_INFO: Record<string, SourceInfo> = {
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
