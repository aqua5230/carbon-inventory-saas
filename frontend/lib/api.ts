const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : "";
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token ?? ""}`
    },
    ...options,
  });
  if (!res.ok) {
    if (res.status === 401 && typeof window !== "undefined") {
      // localStorage.removeItem("token"); // 選擇性登出
    }
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || "API 錯誤");
  }
  return res.json();
}

// Organizations
export const api = {
  // Auth
  register: (email: string, password: string) =>
    request<{message: string}>("/api/auth/register", { method: "POST", body: JSON.stringify({ email, password }) }),
  
  login: async (email: string, password: string) => {
    const formData = new URLSearchParams();
    formData.append("username", email);
    formData.append("password", password);
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      body: formData,
    });
    if (!res.ok) throw new Error("登入失敗");
    const data = await res.json();
    localStorage.setItem("token", data.access_token);
    return data;
  },

  // Organizations
  getOrgs: () => request<Organization[]>("/api/organizations"),
  getOrgSummary: (orgId: number) => request<OrgSummary>(`/api/organizations/${orgId}/summary`),
  createOrg: (data: { name: string; tax_id?: string; industry_type?: string; contact_email?: string }) =>
    request<Organization>("/api/organizations", { method: "POST", body: JSON.stringify(data) }),

  // Facilities
  getFacilities: (orgId: number) => request<Facility[]>(`/api/organizations/${orgId}/facilities`),
  createFacility: (orgId: number, data: { name: string; address?: string }) =>
    request<Facility>(`/api/organizations/${orgId}/facilities`, { method: "POST", body: JSON.stringify(data) }),

  // Periods
  getPeriods: (facilityId: number) => request<Period[]>(`/api/facilities/${facilityId}/periods`),
  createPeriod: (facilityId: number, data: { year: number }) =>
    request<Period>(`/api/facilities/${facilityId}/periods`, { method: "POST", body: JSON.stringify(data) }),
  updatePeriodStatus: (periodId: number, status: "draft" | "submitted") =>
    request<Period>(`/api/periods/${periodId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),

  // Activity
  getFactors: () => request<EmissionFactor[]>("/api/factors").then(list =>
    Object.fromEntries(list.map(f => [f.key, f]))
  ),
  getActivity: (periodId: number) => request<ActivityRecord[]>(`/api/periods/${periodId}/activity`),
  addActivity: (periodId: number, data: ActivityInput) =>
    request<ActivityRecord>(`/api/periods/${periodId}/activity`, { method: "POST", body: JSON.stringify(data) }),
  deleteActivity: (id: number) =>
    request<void>(`/api/activity/${id}`, { method: "DELETE" }),
  getSummary: (periodId: number) => request<Summary>(`/api/periods/${periodId}/summary`),
  uploadExcel: async (periodId: number, file: File): Promise<UploadResult> => {
    const form = new FormData();
    form.append("file", file);
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : "";
    const res = await fetch(`${BASE_URL}/api/periods/${periodId}/upload-excel`, {
      method: "POST",
      body: form,
      headers: { "Authorization": `Bearer ${token ?? ""}` },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || "Excel 上傳失敗");
    }
    return res.json();
  },
  downloadTemplate: () => `${BASE_URL}/api/template/download`,
  getReport: async (periodId: number, format: "pdf" | "html") => {
    const token = typeof window !== "undefined" ? window.localStorage.getItem("token") : "";
    const res = await fetch(`${BASE_URL}/api/periods/${periodId}/report?format=${format}`, {
      headers: { "Authorization": `Bearer ${token ?? ""}` },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || "報告產生失敗");
    }
    return res.blob();
  },
};

// Types
export interface Organization { id: number; name: string; tax_id?: string; industry_type?: string; contact_email?: string; }
export interface OrgSummary {
  scope1_tonnes: number;
  scope2_tonnes: number;
  scope3_tonnes: number;
  total_tonnes: number;
  facility_count: number;
  period_count: number;
}
export interface Facility { id: number; name: string; address?: string; org_id: number; }
export interface Period { id: number; year: number; facility_id: number; status?: string; }
export interface EmissionFactor { key: string; name: string; unit: string; co2e_per_unit: number; scope: number; }
export interface ActivityInput {
  month: number;
  source_type: string;
  amount: number;
  unit: string;
}
export interface ActivityRecord extends ActivityInput {
  id: number;
  co2e_kg: number;
  co2e_tonnes: number;
  scope: number;
  period_id: number;
}
export interface UploadError {
  row: number | string;
  error: string;
}
export interface UploadResult {
  success_count: number;
  error_count: number;
  errors: UploadError[];
  imported: number;
}
export interface Summary {
  scope1_tonnes: number;
  scope2_tonnes: number;
  scope3_tonnes: number;
  total_tonnes: number;
  scope_breakdown: {
    scope1: number;
    scope2: number;
    scope3: number;
  };
  sources: ActivityRecord[];
}
