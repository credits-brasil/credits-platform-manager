import { describe, expect, it, vi } from "vitest";
import { getCompanyAge } from "./index";

describe("getCompanyAge", () => {
  it("returns dash when date is undefined", () => {
    expect(getCompanyAge()).toBe("-");
  });

  it("returns dash for invalid date", () => {
    expect(getCompanyAge("invalid-date")).toBe("-");
  });

  it("calculates age based on current date", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-12T00:00:00.000Z"));

    expect(getCompanyAge("2020-08-11")).toBe(6);
    expect(getCompanyAge("2020-08-13")).toBe(5);

    vi.useRealTimers();
  });
});