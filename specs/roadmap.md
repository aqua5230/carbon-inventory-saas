# Roadmap

## 原則

- 每次只做一個清楚階段。
- 規格階段和實作階段分開。
- 大改動先寫 feature spec。
- 完成功能後同步檢查 spec、SESSION、TASK_LOG。
- 多租戶、安全、DB schema、報告格式屬於高風險區，一次只做一組。

## Phase 0：專案憲法補齊

狀態：進行中。

目標：

- 建立 `AGENTS.md`。
- 建立 `specs/mission.md`。
- 建立 `specs/tech-stack.md`。
- 建立 `specs/roadmap.md`。
- 建立 `specs/backlog.md`。
- 建立 feature spec 範本。

驗收：

- 新 session 可先讀 `AGENTS.md`、`SESSION.md` 與 `specs/` 了解專案。
- 可清楚分辨前端、後端、計算、報告、部署的責任邊界。

## Phase 1：安全與部署基線

狀態：待開始。

目標：

- 確認 `SECRET_KEY` 只由環境變數提供。
- 檢查 Docker / local / production 的 `NEXT_PUBLIC_API_URL` 策略。
- 收斂正式部署 CORS。

驗收：

- 沒有 production 使用 `dev-secret-key`。
- Docker compose 可啟動。
- 前端在 Docker 與 local 都能正確呼叫 API。

## Phase 2：測試基線整理

狀態：待開始。

目標：

- 建立後端載入、auth、多租戶、計算、Excel、報告的最小測試清單。
- 建立前端 build 與關鍵頁面 smoke test。
- 記錄哪些測試會動到 SQLite DB。

驗收：

- 測試指令可重複執行。
- 測試失敗時能分辨是環境、資料、schema 或程式問題。

## Phase 3：DB schema 與 migration 策略

狀態：待排程。

目標：

- 評估是否需要 Alembic。
- 記錄目前 `models.py` 與 `carbon_saas.db` schema 的同步方式。
- 避免手動修 DB 成為常態。

驗收：

- schema 變更有固定流程。
- 開發者知道何時要更新 DB。

## Phase 4：報告與稽核可信度

狀態：待排程。

目標：

- 補強報告中的盤查期間狀態、Scope breakdown、unclassified 說明。
- 明確標示資料來源、係數版本與生成時間。

驗收：

- PDF 報告可用於人工審查。
- 報告數字與 Dashboard 一致。

## Phase 5：使用流程改善

狀態：待排程。

目標：

- 改善登入、建立組織、建立期間、上傳 Excel、查看報告的連續流程。
- 減少使用者不知道下一步的情況。

驗收：

- 新使用者可完成基本盤查流程。
- 錯誤訊息清楚。

## Phase 6：正式部署評估

狀態：待排程。

目標：

- 評估 SQLite 是否升級 PostgreSQL。
- 設定 production env。
- 設定備份策略。

驗收：

- 有正式部署 checklist。
- 有資料備份與回復策略。
