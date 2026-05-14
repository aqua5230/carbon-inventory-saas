# Tech Stack

## 專案結構

```text
碳排放/
├── backend/      FastAPI 後端
├── frontend/     Next.js 前端
├── docker-compose.yml
├── SESSION.md
├── SKILL.md
├── TASK_LOG.md
└── shared_context.md
```

## Frontend

- Next.js 16。
- React 19。
- TypeScript。
- Tailwind CSS 4。
- Recharts。
- 套件管理目前有 `package-lock.json`，實際執行需依專案現況使用 npm；歷史規則曾提到 bun。

主要檔案：

- `frontend/app/page.tsx`：Dashboard / 首頁。
- `frontend/app/login/page.tsx`：登入。
- `frontend/app/register/page.tsx`：註冊。
- `frontend/app/org/[id]/page.tsx`：組織頁。
- `frontend/app/period/[id]/page.tsx`：盤查期間頁。
- `frontend/lib/api.ts`：前端 API 呼叫集中處。

前端規則：

- Component 內不要直接散落 fetch。
- Token 從 `localStorage.getItem("token")` 讀取。
- Authorization Header 由 `frontend/lib/api.ts` 統一處理。
- Scope 顏色：
  - Scope 1：`#ef4444`
  - Scope 2：`#f97316`
  - Scope 3：`#3b82f6`

## Backend

- FastAPI。
- SQLAlchemy 2。
- SQLite：`backend/carbon_saas.db`。
- JWT：python-jose。
- 密碼雜湊：passlib bcrypt。
- PDF / HTML report：`backend/templates/report.html` 與 report generator。

主要檔案：

- `backend/app/main.py`：FastAPI 入口。
- `backend/app/models.py`：SQLAlchemy models。
- `backend/app/database.py`：DB 設定。
- `backend/app/auth_utils.py`：JWT / 密碼工具。
- `backend/app/routers/auth.py`：登入註冊。
- `backend/app/routers/organizations.py`：組織與期間。
- `backend/app/routers/activity.py`：活動資料與 Excel 匯入。
- `backend/app/routers/reports.py`：報告。
- `backend/app/services/calculator.py`：排放計算。
- `backend/app/services/excel_parser.py`：Excel 解析。
- `backend/app/services/report_generator.py`：報告生成。
- `backend/app/data/emission_factors.json`：排放係數。

## Deployment

- `backend/Dockerfile`
- `frontend/Dockerfile`
- `docker-compose.yml`
- `.env.example`
- `backend/.env.example`

部署注意：

- `SECRET_KEY` 不可使用預設值。
- `NEXT_PUBLIC_API_URL` 在 Docker / local / production 場景可能不同。
- SQLite volume 掛載要避免誤刪資料。

## API 邊界

- `/api/auth/register`
- `/api/auth/login`
- Organizations / Periods / Activities / Reports routers。

所有 protected API 必須驗證目前使用者。

租戶隔離必須在查詢層或 service 層落實，不可只靠前端隱藏。

## 驗證

後端基本載入：

```bash
cd /Users/lollapalooza/Desktop/碳排放/backend
python3 -c "from app.main import app; print(app.title)"
```

前端 build：

```bash
cd /Users/lollapalooza/Desktop/碳排放/frontend
npm run build
```

多租戶驗證：

```bash
cd /Users/lollapalooza/Desktop/碳排放
./test_multitenant.sh
```

Docker 驗證需另行確認 `.env` 與本機 port。

## 技術債與風險

- 根目錄不是 git repo，前端才有 git，容易造成跨層變更追蹤不完整。
- SQLite 適合本地與 MVP，正式多租戶部署需評估 PostgreSQL。
- CORS 目前允許所有來源，正式部署前需收斂。
- SECRET_KEY 必須由環境變數提供。
- DB schema 若持續演進，需導入 migration 策略。
