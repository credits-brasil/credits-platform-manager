import { describe, expect, it } from "vitest";
import { validateCNPJ } from "./index";

describe("validateCNPJ", () => {
  it("returns false for invalid CNPJ", () => {
    expect(validateCNPJ("12.345.678/0001-00")).toBe(false);
  });

  it("returns false for repeated values", () => {
    expect(validateCNPJ("11.111.111/1111-11")).toBe(false);
  });

  it("returns true for valid CNPJ", () => {
    expect(validateCNPJ("45.723.174/0001-10")).toBe(true);
  });
});