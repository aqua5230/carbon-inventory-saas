# SKILL.md — 碳排放 SaaS 專案規則（最高優先）

## 專案概述
碳排放盤查 SaaS 平台，提供企業多租戶碳排放記錄、計算與報告功能。

## 技術棧
| 層級 | 技術 |
|------|------|
| Frontend | Next.js 16 + React 19 + TypeScript + Tailwind CSS 4 |
| 圖表 | Recharts ^3.8.1 |
| Backend | FastAPI + SQLAlchemy 2 + SQLite (carbon_saas.db) |
| 認證 | JWT (python-jose) + passlib bcrypt |
| 套件管理 | bun（前端）/ pip（後端） |

## 目錄結構規則
```
/碳排放
├── backend/app/
│   ├── routers/       # API 端點（auth, organizations, activity, reports）
│   ├── services/      # 商業邏輯（calculator, excel_parser）
│   ├── data/          # 靜態資料（emission_factors.json）
│   ├── models.py      # SQLAlchemy models（User, Organization, ...）
│   ├── auth_utils.py  # JWT 工具函數
│   └── main.py        # FastAPI 入口
├── frontend/app/      # Next.js App Router 頁面
├── frontend/lib/      # API 工具函數（api.ts）
└── shared_context.md  # 多代理協作暫存（任務結束後可清空）
```

## 開發規則

### 後端
- 所有 protected endpoint 必須加 `Depends(get_current_user)`
- 多租戶隔離：Organization 操作必須驗證 `owner_id == current_user.id`
- Scope 分類依據 `emission_factors.json` 中的 `scope` 欄位，缺省為 scope1
- 排放量計算邏輯集中在 `services/calculator.py`，不分散在 router

### 前端
- API 呼叫統一透過 `frontend/lib/api.ts`，不在 component 內直接 fetch
- Token 存在 `localStorage.getItem("token")`，Authorization Header 由 api.ts 統一注入
- 圖表使用 Recharts，顏色規範：Scope 1 = `#ef4444`，Scope 2 = `#f97316`，Scope 3 = `#3b82f6`

### 通用
- 改動精準，不動無關邏輯
- 新功能不刪除既有功能
- 每次改完後執行對應測試或 build 確認無損壞

## AI 分工（本專案適用）
| 任務類型 | 負責 | 呼叫方式 |
|----------|------|----------|
| 寫程式 / 改 bug / 新增功能 | Codex | `codex exec --full-auto --skip-git-repo-check "..."` |
| 查 emission factor 標準 / 研究法規 | Gemini | `gemini -p "..." --model gemini-2.5-pro --yolo` |
| 報告文案 / 說明文字優化 | ChatGPT | `chatgpt -p "..."` |
| 小型測試 / API 快速驗證 / 指令建議 | Copilot CLI | `gh copilot -p "..."` |
| 審查架構 / 最終決策 | Claude（主代理） | — |

### Copilot CLI 適用場景
- 快速測試單一 API endpoint（`curl` 指令建議）
- 驗證某段邏輯輸出是否符合預期
- 生成小型測試腳本（pytest / shell）
- Codex 改完後的 smoke test 確認

## 禁止行為
- 禁止直接刪除 User / Organization 資料（需軟刪除或由使用者確認）
- 禁止在 router 層寫商業邏輯，務必放 services 層
- 禁止 hardcode SECRET_KEY，必須從環境變數讀取
- 禁止修改 `carbon_saas.db` schema 而不同步更新 `models.py`
