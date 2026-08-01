import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "./api";

describe("api.getReport", () => {
  beforeEach(() => {
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: { getItem: vi.fn().mockReturnValue("test-token") },
    });
  });

  it("報告請求帶 Bearer token", async () => {
    const blob = new Blob(["report"], { type: "application/pdf" });
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      { ok: true, blob: async () => blob } as Response
    );

    await expect(api.getReport(7, "pdf")).resolves.toBeInstanceOf(Blob);
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8000/api/periods/7/report?format=pdf",
      { headers: { Authorization: "Bearer test-token" } }
    );
  });
});
