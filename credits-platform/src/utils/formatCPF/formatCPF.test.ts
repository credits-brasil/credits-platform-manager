import { describe, expect, it } from "vitest";
import { formatCPF, formatCpf } from "./index";

describe("formatCPF", () => {
  it("returns dash when value is undefined", () => {
    expect(formatCPF()).toBe("-");
  });

  it("formats numeric CPF", () => {
    expect(formatCPF("12345678901")).toBe("123.456.789-01");
  });

  it("removes non-digit characters before formatting", () => {
    expect(formatCPF("123.456.789-01")).toBe("123.456.789-01");
  });
});

describe("formatCpf", () => {
  it("formats progressively in input mode", () => {
    expect(formatCpf("123", "input")).toBe("123");
    expect(formatCpf("1234", "input")).toBe("123.4");
    expect(formatCpf("1234567", "input")).toBe("123.456.7");
  });

  it("limits input mode to 11 digits", () => {
    expect(formatCpf("123.456.789-01abc999", "input")).toBe("123.456.789-01");
  });
});