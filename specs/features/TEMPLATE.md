# Feature Spec Template

## Feature

名稱：

## 背景

這個功能為什麼需要做？

它對 `mission.md` 的哪一部分有幫助？

## Feature Plan

1. 
2. 
3. 

## Requirements

- 必須：
- 必須：
- 暫時不做：
- 暫時不做：

## API / Data Contract

若涉及 API 或資料，請寫清楚：

- Endpoint：
- Request：
- Response：
- DB model：
- 權限規則：
- 錯誤處理：

## Constraints

- 不改無關檔案。
- 不擴大功能範圍。
- 不破壞多租戶隔離。
- 不 hardcode SECRET_KEY。
- 不在 router 層新增商業邏輯。
- 修改 DB schema 時，必須同步 `models.py` 與 migration / schema 流程。

## Validation

後端：

```bash
cd /Users/lollapalooza/Desktop/碳排放/backend
python3 -c "from app.main import app; print(app.title)"
```

前端：

```bash
cd /Users/lollapalooza/Desktop/碳排放/frontend
npm run build
```

多租戶：

```bash
cd /Users/lollapalooza/Desktop/碳排放
./test_multitenant.sh
```

人工驗證：

- 

## Done Criteria

- 符合 requirements。
- 通過 validation。
- 更新必要文件。
- 回報改了哪些檔案與如何驗證。
