import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

// 前端單元測試設定：jsdom 環境 + React plugin + @ 路徑別名（對齊 tsconfig）
export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["**/*.test.{ts,tsx}"],
  },
  resolve: {
    alias: { "@": resolve(__dirname, ".") },
  },
});
