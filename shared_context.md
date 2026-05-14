## 規格驅動狀態

2026-04-17 已在 `/Users/lollapalooza/Desktop/碳排放` 根目錄建立規格驅動文件：
- `AGENTS.md`
- `specs/mission.md`
- `specs/tech-stack.md`
- `specs/roadmap.md`
- `specs/backlog.md`
- `specs/features/TEMPLATE.md`

後續大型功能需先讀根目錄 `AGENTS.md` 與 `specs/`。

---

# Phase 3 Step 8 — 驗收任務

## 原始任務範圍
新增 Docker 相關檔案（不改程式邏輯）：
1. backend/Dockerfile
2. frontend/Dockerfile（需 standalone output）
3. docker-compose.yml
4. .env.example（根目錄）
5. .gitignore（根目錄）
6. frontend/next.config.ts 加入 output: "standalone"

## Codex 回報的改動 ✓
全部 6 項完成，next.config.ts 已加 standalone ✓

## docker-compose.yml 摘要
- backend: port 8000，SECRET_KEY 從環境變數讀，DB volume 掛載
- frontend: port 3000，NEXT_PUBLIC_API_URL=http://localhost:8000，depends_on backend

---

## Gemini 審查任務
請用繁體中文審查 Step 8 正確性：
1. backend/Dockerfile 是否正確（工作目錄、安裝套件、啟動指令）？
2. frontend/Dockerfile 是否正確使用 multi-stage build + standalone？
3. docker-compose.yml 的 volume 掛載、環境變數、depends_on 是否正確？
4. next.config.ts 加入 standalone 後是否可能影響現有開發流程？
5. 有無其他問題？

格式：✅ 正常 / ⚠️ 有疑慮 / ❌ 有 bug，完成後加上：
## Gemini 結果
1. **backend/Dockerfile 是否正確？**
   ✅ 正常。Dockerfile 結構良好，使用 slim image，正確複製檔案、安裝套件並設定啟動指令。

2. **frontend/Dockerfile 是否正確使用 multi-stage build + standalone？**
   ✅ 正常。正確利用 multi-stage build，在 builder stage 編譯，並在 runner stage 只複製必要的 `standalone`、`static` 和 `public` 產物，有效縮減最終 image 大小。

3. **docker-compose.yml 的 volume 掛載、環境變數、depends_on 是否正確？**
   ⚠️ 有疑慮。
   - `depends_on`: ✅ 正確設定，確保 `backend` 先於 `frontend` 啟動。
   - `volumes`: ✅ `backend` 的資料庫 volume 掛載 `backend/carbon_saas.db:/app/carbon_saas.db` 在本機開發情境下可行。
   - `environment`: ❌ `frontend` 的 `NEXT_PUBLIC_API_URL=http://localhost:8000` 設定有問題。這個 URL 是在前端瀏覽器環境執行，雖然在本機開發時 `localhost:8000` 能正確對應到 `backend` 服務，但這不是一個穩健的設定。如果 Next.js App 內有任何伺服器端（SSR/ISR/API Routes）需要呼叫 API，它會嘗試連線到 `frontend` 容器自己的 `localhost`，導致失敗。理想的設定應改為 `http://backend:8000` 以利用 Docker 的內部 DNS，並處理好客戶端與伺服器端環境的差異。

4. **next.config.ts 加入 standalone 後是否可能影響現有開發流程？**
   ✅ 正常。`output: "standalone"` 選項主要影響生產環境的 build (`npm run build`)，產生一個自包含的目錄以便部署。它不會影響日常使用的 `npm run dev` 開發伺服器。

5. **有無其他問題？**
   ✅ 無其他重大問題。主要的潛在風險在於 `docker-compose.yml` 中 `NEXT_PUBLIC_API_URL` 的設定不夠穩健，可能在特定情境下（如 SSR）或將來到非本機環境部署時導致問題。

[結論]
狀態：完成。審查發現 docker-compose.yml 中有一處設定（NEXT_PUBLIC_API_URL）不夠穩健，可能在未來導致問題，建議修正。其餘部分皆符合預期。

---

## Codex 範圍審查任務
請用繁體中文確認：
1. 哪些檔案被新增或修改？
2. 有無超出任務範圍（只能新增 Docker 相關檔案 + next.config.ts）？

完成後加上：
## Codex 範圍結果
[結論]
狀態：完成
