import { describe, expect, it } from "vitest";
import { formatDate } from "./index";

describe("formatDate", () => {
  it("returns dash when value is undefined", () => {
    expect(formatDate()).toBe("-");
  });

  it("formats yyyy-mm-dd date", () => {
    expect(formatDate("2026-08-12")).toBe("12/08/2026");
  });

  it("formats ISO date with time", () => {
    expect(formatDate("2026-08-12T13:45:00Z")).toBe("12/08/2026");
  });
});