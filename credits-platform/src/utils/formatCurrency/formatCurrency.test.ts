import { describe, expect, it } from "vitest";
import { formatCurrency } from "./index";

describe("formatCurrency", () => {
  it("returns R$ 0 for undefined value", () => {
    expect(formatCurrency()).toBe("R$ 0");
  });

  it("returns R$ 0 for zero value", () => {
    expect(formatCurrency(0)).toBe("R$ 0");
  });

  it("formats positive values in BRL", () => {
    expect(formatCurrency(1234.56)).toBe("R$ 1.234,56");
  });

  it("accepts numeric string values", () => {
    expect(formatCurrency("10")).toBe("R$ 10,00");
  });
});