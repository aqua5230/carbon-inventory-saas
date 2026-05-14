# SESSION.md — 當前專案狀態

更新時間：2026-04-17

## 專案階段
**Phase 1（基礎功能）— 已完成**
**Phase 2（完整使用流程）— 已完成**
**Phase 3（穩定化與部署）— 已完成**

## 規格驅動狀態

2026-04-17 已開始導入規格驅動開發：
- 新增 `AGENTS.md` 作為跨 agent 專案規則。
- 新增 `specs/mission.md`、`specs/tech-stack.md`、`specs/roadmap.md`。
- 新增 `specs/backlog.md` 與 feature spec 範本。
- 後續大型功能需先建立 feature spec，再實作。

## 已完成功能
| # | 功能 | 狀態 |
|---|------|------|
| 1 | JWT 身分驗證（register / login） | ✅ 完成 |
| 2 | 多租戶隔離（Organization + owner_id） | ✅ 完成 |
| 3 | Scope 3 排放係數（7 項）+ scope_breakdown 計算 | ✅ 完成 |
| 4 | Excel 解析錯誤處理（逐行 try-except，回傳 errors list） | ✅ 完成 |
| 5 | 前端圖表（Recharts 圓餅圖 + 長條圖） | ✅ 完成 |

## 已知問題（待修）
- [x] `organizations` router：重複 tax_id → 已修，回 400
- [x] `calculator.py`：`scope=None` → 已修，計入 unclassified_tonnes
- [ ] SECRET_KEY 仍是預設值 `"dev-secret-key"`，上線前必須設定環境變數

## 目前環境
- DB：`backend/carbon_saas.db`（SQLite）
- Frontend port：預設 3000
- Backend port：預設 8000
- 無 Docker，本地開發環境

## Step 2 執行結果（已完成）
1. **Gemini 驗收** ✅ — 5✅ 1⚠️（scope=None 預設 scope1，低風險）
2. **Codex 驗收** ✅ — 無超範圍改動；發現 DB schema 未同步（已手動修復）
3. **啟動 backend** ✅ — 修復 `bcrypt==4.0.1` 相容性問題
4. **build frontend** ✅ — 修復 Recharts Tooltip formatter 型別錯誤（2 處）
5. **多租戶隔離驗證** ✅ — 10/10 通過（Copilot CLI 生成測試腳本）

## Phase 2 執行計畫

| Step | 內容 | 狀態 |
|------|------|------|
| Step 3 | 登入/登出 UI + 環境變數管理（.env + SECRET_KEY） | ✅ 完成 |
| Step 4 | PDF 報告更新（加入 scope3 顯示、unclassified 欄位） | ✅ 完成 |
| Step 5 | Dashboard 首頁（排放趨勢、各 org 總覽） | ✅ 完成 |

**每步流程：Codex 實作 → Gemini 驗收 → Codex 範圍驗收 → 啟動測試**

## Phase 3 執行計畫

| Step | 內容 | 狀態 |
|------|------|------|
| Step 6 | 盤查期間狀態管理（draft → submitted → verified UI + API） | ✅ 完成 |
| Step 7 | Excel 模板加入 Scope 3 欄位（後端 + 前端提示） | ✅ 完成 |
| Step 8 | 生產部署準備（Dockerfile + docker-compose + .env 文件） | ✅ 完成 |

## 下一步建議

| Phase | 內容 | 狀態 |
|-------|------|------|
| Phase 0 | 規格驅動整理 | ✅ 完成 |
| Phase 4 | 安全與部署基線：SECRET_KEY、API URL、CORS | 待開始 |
| Phase 5 | 測試基線整理：後端、前端、多租戶、報告 | 待開始 |
| Phase 6 | DB schema / migration 策略 | 待排程 |
