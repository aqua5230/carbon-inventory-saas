import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import ReportSection from "./ReportSection";

describe("ReportSection", () => {
  it("無數據時顯示空狀態，點擊按鈕會切回填寫分頁", () => {
    const onGoManual = vi.fn();
    render(<ReportSection records={[]} summary={null} periodId={1} onGoManual={onGoManual} />);
    expect(screen.getByText("還沒有數據可以產生報告")).toBeInTheDocument();
    fireEvent.click(screen.getByText("去填寫數據 →"));
    expect(onGoManual).toHaveBeenCalledOnce();
  });
});
