# TASK_LOG.md — 任務歷史紀錄

---

## Step 0 — 專案初始化
- 日期：2026-03-28
- 執行者：Claude（主代理）
- 狀態：✅ 完成
- 內容：建立 SKILL.md、SESSION.md、TASK_LOG.md，確立專案規則與當前狀態

---

## Step 1 — Phase 1 四項基礎功能（Codex 執行）
- 日期：2026-03-28（估計）
- 執行者：Codex
- 狀態：✅ 完成（Gemini 雙驗收待補）
- 任務清單：
  1. 身分驗證與多租戶隔離
     - 新增 `auth_utils.py`（JWT + passlib）
     - 新增 `User` model，`Organization` 加 `owner_id`
     - 新增 `routers/auth.py`（/api/auth/register, /api/auth/login）
     - 所有 routers 加入 `get_current_user` 保護
     - 前端 `lib/api.ts` 加入 Authorization Header、login()、register()
  2. Scope 3 排放係數
     - 在 `emission_factors.json` 加入 7 項 Scope 3 係數
     - `calculator.py` 的 `get_period_summary` 加入 `scope_breakdown`
  3. Excel 解析錯誤處理
     - `excel_parser.py` 改為逐行 try-except，收集 errors list
     - `upload-excel` endpoint 回傳 success_count / error_count / errors
  4. 前端圖表
     - 安裝 `recharts ^3.8.1`
     - `app/period/[id]/page.tsx` 加入 PieChart（Scope 佔比）+ BarChart（排放源）
- 備註：shared_context.md 記錄了完整任務規格與 Codex 回報

---

## Step 2 — Phase 1 驗收與測試
- 日期：2026-03-28
- 執行者：Claude + Gemini + Codex + Copilot CLI
- 狀態：✅ 完成
- 執行結果：
  1. Gemini 正確性審查 — 5✅ 1⚠️（scope=None 問題）
  2. Codex 範圍審查 — 通過；發現 DB schema 未同步（已手動修復）
  3. Backend 啟動 — 修復 bcrypt 相容性（降版至 4.0.1）
  4. Frontend build — 修復 Recharts Tooltip formatter 型別（2 處）
  5. 多租戶隔離驗證 — 10/10 PASS（test_multitenant.sh）
- 殘留 bug（未修）：
  - 重複 tax_id 回 500 而非 400
  - scope=None 靜默計入 Scope 1

---

## Step 3 — Phase 2：登入/登出 UI + 環境變數管理
- 日期：2026-03-28
- 執行者：Codex（實作）+ Gemini + Codex（驗收）+ Claude（修正）
- 狀態：✅ 完成
- 新增/修改：
  - frontend/app/login/page.tsx（新增）
  - frontend/app/register/page.tsx（新增）
  - frontend/app/page.tsx（加 token 檢查 + 登出）
  - backend/.env、backend/.env.example（新增）
- 修正項目：
  - 註冊後自動登入失敗 → 改為跳轉 /login?registered=1 顯示成功訊息
  - useSearchParams 加 Suspense 解決 Next.js build 錯誤

---

## Step 4 — Phase 2：PDF 報告更新（scope3 + unclassified）
- 日期：2026-03-28
- 執行者：Codex（實作）+ Gemini + Codex（驗收）
- 狀態：✅ 完成
- 修改：
  - backend/app/services/report_generator.py（加 scope3_tonnes、unclassified_tonnes、scope_breakdown）
  - backend/templates/report.html（加 scope3/unclassified 摘要卡片、資料表格範疇欄）
- 驗收：Gemini 4✅、Codex 範圍 ✅

---

## Step 5 — Phase 2：Dashboard（各 org 排放總覽）
- 日期：2026-03-28
- 執行者：Codex（實作）+ Gemini + Codex（驗收）
- 狀態：✅ 完成
- 新增/修改：
  - backend/app/routers/organizations.py（新增 GET /api/organizations/{org_id}/summary）
  - frontend/lib/api.ts（新增 getOrgSummary + OrgSummary interface）
  - frontend/app/page.tsx（summaries state、頂部統計列、org 卡片排放數字）
- 驗收：Gemini 3✅ 2⚠️（N+1 疑慮已排除、UX 低優先）、Codex 範圍 ✅、build ✅

## Phase 2 完成摘要
- Step 3：登入/登出 UI + .env ✅
- Step 4：PDF 報告 scope3 + unclassified ✅
- Step 5：Dashboard org 排放總覽 ✅

---

## Step 6 — Phase 3：盤查期間狀態管理
- 日期：2026-03-28
- 執行者：Codex（實作）+ Gemini + Codex（驗收）
- 狀態：✅ 完成
- 新增/修改：
  - backend/app/routers/organizations.py（PATCH /api/periods/{period_id}/status）
  - frontend/lib/api.ts（updatePeriodStatus + Period.status）
  - frontend/app/org/[id]/page.tsx（狀態標籤 + 提交盤查按鈕）
- 驗收：Gemini 4✅、Codex 範圍 ✅、build ✅

---

## Step 7 — Phase 3：Excel 模板加入 Scope 3 欄位
- 日期：2026-03-28
- 執行者：Codex（實作）+ Gemini + Codex（驗收）+ Claude（修正）
- 狀態：✅ 完成
- 修改：backend/app/services/excel_parser.py（COLUMN_ALIASES + source_units + template 加 7 項 Scope 3）
- 修正：Gemini 發現模板欄位 `用電度數(kWh)` 不在 electricity 別名清單 → 已補入，14 欄全可識別

---

## Step 8 — Phase 3：生產部署準備
- 日期：2026-03-28
- 執行者：Codex（實作）+ Gemini + Codex（驗收）+ Claude（修正）
- 狀態：✅ 完成
- 新增：backend/Dockerfile、frontend/Dockerfile（multi-stage standalone）、docker-compose.yml、.env.example、.gitignore、frontend/next.config.ts（standalone）
- 驗收：Gemini 4✅ 1⚠️（NEXT_PUBLIC_API_URL 已確認 client-side 無問題）、Codex 範圍 ✅、build ✅

---

## Phase 0 — 規格驅動整理

- 日期：2026-04-17
- 執行者：Codex
- 狀態：✅ 完成
- 新增/修改：
  - AGENTS.md（新建）
  - specs/mission.md（新建）
  - specs/tech-stack.md（新建）
  - specs/roadmap.md（新建）
  - specs/backlog.md（新建）
  - specs/features/TEMPLATE.md（新建）
  - SESSION.md（更新規格驅動狀態與下一步建議）
  - TASK_LOG.md（記錄本階段）
  - shared_context.md（補上根目錄規格入口）
- 備註：本階段只整理文件，未修改前後端程式邏輯。
