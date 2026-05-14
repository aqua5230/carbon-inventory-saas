# Mission

## 專案定位

本專案是「碳排放盤查 SaaS 平台」。

它協助企業建立組織、盤查期間、活動數據、排放量計算、Scope breakdown、Excel 匯入、PDF 報告與 Dashboard。

目標是提供一個可部署、可驗證、支援多租戶隔離的碳盤查基礎系統。

## 使用者

- 企業管理者：建立公司資料、查看總排放與趨勢。
- 盤查人員：建立盤查期間、上傳 Excel、管理活動數據。
- 稽核或顧問：查看報告、確認 Scope 分類與狀態。
- 開發者：維護 API、計算邏輯、前端流程與部署。

## 要解決的問題

- 中小企業缺少簡單可用的碳盤查工具。
- 手動 Excel 彙整容易錯。
- Scope 1 / 2 / 3 分類需要一致的排放係數與計算邏輯。
- 多企業資料必須隔離，不能互相讀取。
- 報告需要能輸出、審查與追溯。
- 部署時不能使用開發用密鑰與不安全設定。

## 目前已完成能力

- JWT 註冊 / 登入。
- 多租戶隔離：User、Organization、owner_id。
- Organization / Period / Activity 基礎流程。
- Scope 3 排放係數與 `scope_breakdown`。
- Excel 解析錯誤處理與逐行 errors list。
- Recharts 圖表：Scope 佔比與排放源。
- PDF 報告：包含 Scope 3 與 unclassified。
- Dashboard：各組織總覽。
- 盤查期間狀態管理：draft / submitted / verified。
- Excel 模板加入 Scope 3 欄位。
- Dockerfile、docker-compose、環境變數範例。

## 暫時不做

- 不做正式碳權交易。
- 不做金流。
- 不做完整審計簽核流程。
- 不做多角色 RBAC 細分，除非先寫 feature spec。
- 不接外部政府 API，除非先確認標準與資料格式。
- 不在沒有 migration 策略下大改 DB schema。

## 成功標準

- 使用者可以完成登入、建立組織、建立盤查期間、上傳或輸入活動資料、查看圖表、輸出報告。
- 不同使用者無法讀寫彼此的組織資料。
- 排放計算可追溯到 `emission_factors.json`。
- 報告資料和 Dashboard 資料一致。
- 部署時可透過環境變數設定密鑰與 API URL。
- 下一個 AI session 可以讀 `AGENTS.md`、`SESSION.md` 與 `specs/` 接續工作。
