# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 啟動前必讀

本專案使用規格驅動開發，新 session 必須依此順序讀取：

1. 本檔（CLAUDE.md）
2. `AGENTS.md`：跨 agent 工作規則與不可違反條款
3. `SESSION.md`：當前 phase / 已完成 / 待修問題
4. `specs/mission.md`、`specs/tech-stack.md`、`specs/roadmap.md`
5. 單一功能才讀 `specs/features/*.md` 與相關程式碼

大型變更必須先建立 `specs/features/*.md`（範本在 `specs/features/TEMPLATE.md`），規格階段與實作階段分開。

## 專案定位

碳排放盤查 SaaS 平台（ISO 14064-1 導向，台灣中小企業），提供組織／設施／盤查期間／活動數據／排放計算／Scope breakdown／Excel 匯入／PDF 報告／Dashboard。多租戶以 `owner_id` 隔離。

## 架構心智模型

單一 monorepo，**根目錄非 git repo，只有 `frontend/` 是 git repo**（修改前端前先 `git status` 確認既有未提交變更）。前後端分離，都走 REST。

```
碳排放/
├── backend/      FastAPI + SQLAlchemy + SQLite
├── frontend/     Next.js 16 + React 19 + Tailwind 4
├── specs/        mission / tech-stack / roadmap / backlog / features/
├── AGENTS.md     跨 agent 規則
├── SESSION.md    當前狀態
├── TASK_LOG.md   任務歷程
└── docker-compose.yml
```

### 資料模型（`backend/app/models.py`）

`User → Organization(owner_id) → Facility → InventoryPeriod → ActivityData`

所有查詢必須從 `owner_id == current_user.id` 出發做租戶隔離，不能只靠前端隱藏。越權操作回 404（不是 403，避免洩漏資源是否存在）。

### 後端分層（嚴格遵守）

- `routers/`：只做 HTTP 綁定、驗證輸入、呼叫 service。**不得寫商業邏輯**。
- `services/calculator.py`：排放計算與 `scope_breakdown` 彙總。`scope=None` 會計入 `unclassified_tonnes`。
- `services/excel_parser.py`：Excel 匯入，逐行 try-except，回傳 `errors` list 而非整批失敗。
- `services/report_generator.py` + `templates/report.html`：PDF/HTML 報告（WeasyPrint + Jinja2）。
- `data/emission_factors.json`：所有係數唯一來源，Scope 分類由其 `scope` 欄位決定。

### 認證

JWT（python-jose）+ passlib bcrypt。`auth_utils.get_current_user` 是所有 protected endpoint 的 `Depends`。`SECRET_KEY` 從環境變數讀，正式環境不得使用預設 `dev-secret-key`。

### 前端

Next.js App Router。所有 API 呼叫統一走 `frontend/lib/api.ts`，**component 內不得直接 fetch**。Token 存 `localStorage["token"]`，Authorization header 由 `api.ts` 統一注入。

Scope 圖表顏色固定：Scope 1 `#ef4444`、Scope 2 `#f97316`、Scope 3 `#3b82f6`。

### DB Schema

目前用 `Base.metadata.create_all` 自動建表，**沒有 migration**。修改 `models.py` 後，既有 `backend/carbon_saas.db` 不會自動更新 schema，需手動處理（導入 Alembic 在 backlog）。

## 常用指令

### Backend

```bash
# 安裝
cd backend && pip install -r requirements.txt

# 啟動（port 8000）
cd backend && uvicorn app.main:app --reload

# 載入驗證（不啟動 server）
cd backend && python3 -c "from app.main import app; print(app.title)"
```

### Frontend

```bash
# 套件管理目前 repo 用 npm（package-lock.json）。全域偏好 bun，但此專案保持 npm 以免 lockfile 衝突。
cd frontend && npm install
cd frontend && npm run dev      # port 3000
cd frontend && npm run build
cd frontend && npm run lint
```

### 多租戶 smoke test

需要 backend 先啟動於 `localhost:8000`：

```bash
./test_multitenant.sh
```

腳本會註冊 A/B 兩使用者，驗證組織列表隔離、越權回 404、無 token 回 401。

### Docker

```bash
docker compose up --build
```

注意 `NEXT_PUBLIC_API_URL=http://localhost:8000` 只對 client-side 正確；若未來加 SSR 呼叫 API，需改用 `http://backend:8000` 並區分 server/client 環境。

## 不可違反的規則（摘自 AGENTS.md / SKILL.md）

- 所有 protected endpoint 必須 `Depends(get_current_user)`。
- Organization / Period / Activity 查詢必須驗證 `owner_id`。
- 排放計算 / Excel 解析 / 報告生成邏輯**只能**在 `backend/app/services/` 對應檔案。
- 前端 API 呼叫**只能**透過 `frontend/lib/api.ts`。
- 禁止 hardcode `SECRET_KEY`。
- 禁止改 DB schema 而不同步 `models.py`。
- 禁止直接刪使用者 / 組織 / 盤查資料，除非使用者明確要求。
- 根目錄不是 git repo，不自動 push；前端 repo 有既有未提交變更，修改前先確認範圍。

## 工作完成後同步

完成一個功能後檢查是否需要更新：`SESSION.md`、`TASK_LOG.md`、`shared_context.md`、`specs/roadmap.md`、對應 `specs/features/*.md`。回報格式：改了哪些檔案 + 如何驗證。
