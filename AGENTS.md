# 碳排放 SaaS 專案 Agent 規則

## 啟動順序

1. 先讀本檔。
2. 再讀 `SESSION.md`。
3. 再讀 `specs/mission.md`、`specs/tech-stack.md`、`specs/roadmap.md`。
4. 若要做單一功能，先建立或讀取 `specs/features/*.md`。
5. 最後才讀相關前後端程式碼。

## 工作規則

- 使用繁體中文回報。
- 先理解規格，再改程式。
- 不碰無關檔案。
- 不自動刪檔。
- 不自動 push。
- 大改動先寫 feature spec。
- 規格階段和實作階段分開。
- 每次改完要回報改了哪些檔案與如何驗證。

## 專案核心

- 專案目標：碳排放盤查 SaaS 平台。
- 前端：Next.js + React + TypeScript + Tailwind CSS。
- 後端：FastAPI + SQLAlchemy + SQLite。
- 認證：JWT。
- 核心風險：多租戶隔離、排放計算正確性、報告可信度、部署安全。

## 不可違反的規則

- 所有 protected endpoint 必須使用 `Depends(get_current_user)`。
- Organization / Period / Activity 操作必須驗證租戶權限。
- 排放計算邏輯集中在 `backend/app/services/calculator.py`。
- Excel 解析邏輯集中在 `backend/app/services/excel_parser.py`。
- 報告生成邏輯集中在 `backend/app/services/report_generator.py`。
- 前端 API 呼叫統一經過 `frontend/lib/api.ts`。
- 禁止 hardcode `SECRET_KEY`，正式環境必須使用環境變數。
- 禁止修改 DB schema 卻不同步更新 `backend/app/models.py`。
- 禁止直接刪除使用者、組織或盤查資料，除非使用者明確要求。

## 目前狀態注意

- 根目錄目前不是 git repo。
- `frontend/` 是 git repo，且已有未提交變更。
- 修改前端檔案前，必須先確認範圍，避免混入既有工作。

## 文件同步

完成一個功能後，檢查是否需要更新：

- `SESSION.md`
- `TASK_LOG.md`
- `shared_context.md`
- `specs/roadmap.md`
- 對應 `specs/features/*.md`
- README / 部署文件 / API 文件
