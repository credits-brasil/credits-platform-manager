import { describe, expect, it } from "vitest";
import { formatCNPJ, formatCnpj } from "./index";

describe("formatCNPJ", () => {
  it("returns dash when value is undefined", () => {
    expect(formatCNPJ()).toBe("-");
  });

  it("formats numeric CNPJ", () => {
    expect(formatCNPJ("12345678000195")).toBe("12.345.678/0001-95");
  });

  it("removes non-digit characters before formatting", () => {
    expect(formatCNPJ("12.345.678/0001-95")).toBe("12.345.678/0001-95");
  });
});

describe("formatCnpj", () => {
  it("formats progressively in input mode", () => {
    expect(formatCnpj("12", "input")).toBe("12");
    expect(formatCnpj("123", "input")).toBe("12.3");
    expect(formatCnpj("123456789", "input")).toBe("12.345.678/9");
  });

  it("keeps alphanumeric chars, uppercases and limits to 14 in input mode", () => {
    expect(formatCnpj("ab.cde.fgh/0001-00xyz", "input")).toBe("AB.CDE.FGH/0001-00");
  });
});