import { describe, expect, it } from "vitest";
import { validateCPF } from "./index";

describe("validateCPF", () => {
  it("returns false for repeated digits", () => {
    expect(validateCPF("111.111.111-11")).toBe(false);
  });

  it("returns false for invalid CPF", () => {
    expect(validateCPF("123.456.789-00")).toBe(false);
  });

  it("returns true for valid CPF", () => {
    expect(validateCPF("529.982.247-25")).toBe(true);
  });
});