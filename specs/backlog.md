# Backlog

此檔放暫時不進 roadmap 的想法。

避免臨時研究污染當前功能。

## 待整理

- 為 API endpoints 建立 OpenAPI 摘要文件。
- 導入 Alembic migration。
- 將 SQLite 升級 PostgreSQL 的評估。
- 為 `emission_factors.json` 加版本欄位。
- 報告加入係數版本與生成時間。
- 替 Docker / local / production 分開 API URL 策略。
- 收斂 CORS allow origins。
- 為 Excel parser 增加更多錯誤案例測試。
- 將多租戶測試改成 pytest 或保留 shell smoke test。
- 建立正式部署 checklist。

## 暫不做

- 碳權交易。
- 金流。
- 完整 RBAC。
- 政府 API 串接。
- 多資料庫支援。
- 跨國法規自動判定。
