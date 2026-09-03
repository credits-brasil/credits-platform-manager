import { describe, expect, it } from "vitest";
import { detectDocTypeByInput } from "./index";

describe("detectDocTypeByInput", () => {
  it("returns CPF for 11 or fewer digits", () => {
    expect(detectDocTypeByInput("12345678901")).toBe("CPF");
  });

  it("returns CNPJ for more than 11 digits", () => {
    expect(detectDocTypeByInput("123456789012")).toBe("CNPJ");
  });

  it("returns CNPJ when letters are present", () => {
    expect(detectDocTypeByInput("AB.CDE.FGH/0001-00")).toBe("CNPJ");
  });
});