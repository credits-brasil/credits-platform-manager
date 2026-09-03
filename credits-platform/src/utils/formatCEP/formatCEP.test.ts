import { describe, expect, it } from "vitest";
import { formatCEP } from "./index";

describe("formatCEP", () => {
  it("returns dash when value is undefined", () => {
    expect(formatCEP()).toBe("-");
  });

  it("formats CEP with 8 digits", () => {
    expect(formatCEP("12345678")).toBe("12345-678");
  });

  it("left-pads CEP with zeros when needed", () => {
    expect(formatCEP("12345")).toBe("00012-345");
  });
});