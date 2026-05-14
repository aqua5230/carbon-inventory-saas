# 碳排放盤查 SaaS 平台

一套面向台灣中小企業的溫室氣體盤查平台，依循 **ISO 14064-1** 精神設計。
企業可建立組織與設施、依盤查期間登錄活動數據、自動計算碳排放量並產出
Scope 分類報告與 PDF 文件。

> 個人獨立開發專案，採規格驅動（spec-driven）流程，並大量運用 AI 工具輔助開發。

---

## 功能特色

- **多租戶資料隔離** — 每個使用者的組織／設施／盤查資料以 `owner_id` 嚴格隔離，越權存取一律回 404，不洩漏資源是否存在。
- **排放量自動計算** — 依 `emission_factors.json` 排放係數計算，並彙總 Scope 1 / 2 / 3 breakdown，未分類數據獨立計入。
- **Excel 批次匯入** — 活動數據可由 Excel 匯入，逐行解析、回傳錯誤清單，單行錯誤不影響整批。
- **PDF / HTML 報告產生** — 以 WeasyPrint + Jinja2 套版產出盤查報告。
- **JWT 認證** — python-jose + passlib bcrypt，所有受保護端點統一經由 `get_current_user` 驗證。

---

## 技術棧

| 層 | 技術 |
|---|---|
| 後端 | Python · FastAPI · SQLAlchemy · SQLite |
| 前端 | Next.js · React · Tailwind CSS |
| 報告 | WeasyPrint · Jinja2 |
| 認證 | JWT（python-jose）· passlib bcrypt |
| 部署 | Docker Compose |

---

## 系統架構

```
前端 (Next.js)  ──REST──►  後端 (FastAPI)
                            │
                routers/   ── 只做 HTTP 綁定與輸入驗證
                services/  ── 商業邏輯：排放計算 / Excel 解析 / 報告產生
                            │
                          SQLite
```

**資料模型**

```
User → Organization (owner_id) → Facility → InventoryPeriod → ActivityData
```

**後端分層原則**：`routers/` 不寫商業邏輯，所有計算與解析邏輯集中在 `services/`。

---

## 快速啟動

### 方式一：Docker（推薦）

```bash
cp .env.example .env        # 填入 SECRET_KEY
docker compose up --build
```

### 方式二：本機分別啟動

後端（port 8000）：

```bash
cd backend
pip install -r requirements.txt
cp ../.env.example ../.env  # 填入 SECRET_KEY
uvicorn app.main:app --reload
```

前端（port 3000）：

```bash
cd frontend
npm install
npm run dev
```

---

## 專案結構

```
碳排放/
├── backend/          FastAPI 後端
│   └── app/
│       ├── routers/      HTTP 端點
│       ├── services/     排放計算 / Excel 解析 / 報告產生
│       ├── data/         排放係數來源
│       └── models.py     資料模型
├── frontend/         Next.js 前端
├── specs/            規格文件（mission / tech-stack / roadmap / features）
└── docker-compose.yml
```

---

## 安全性說明

- `SECRET_KEY` 一律由環境變數提供，正式環境不得使用預設值。
- `.env` 與資料庫檔（`*.db`）不納入版本控制。
