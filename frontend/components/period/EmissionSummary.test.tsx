import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import EmissionSummary from "./EmissionSummary";
import { Summary } from "@/lib/api";

const summary: Summary = {
  scope1_tonnes: 1.5,
  scope2_tonnes: 2.25,
  scope3_tonnes: 0.5,
  total_tonnes: 4.25,
  scope_breakdown: { scope1: 1.5, scope2: 2.25, scope3: 0.5 },
  sources: [],
};

describe("EmissionSummary", () => {
  it("顯示三個範疇與合計的排放量（保留兩位小數）", () => {
    render(<EmissionSummary summary={summary} />);
    expect(screen.getByText("Scope 1")).toBeInTheDocument();
    expect(screen.getByText("Scope 2")).toBeInTheDocument();
    expect(screen.getByText("Scope 3")).toBeInTheDocument();
    expect(screen.getByText("1.50")).toBeInTheDocument();
    expect(screen.getByText("2.25")).toBeInTheDocument();
    expect(screen.getByText("4.25")).toBeInTheDocument();
  });
});
