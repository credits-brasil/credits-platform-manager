import { describe, expect, it } from "vitest";
import { formatPhone } from "./index";

describe("formatPhone", () => {
  it("returns dash when value is undefined", () => {
    expect(formatPhone()).toBe("-");
  });

  it("formats 11-digit phone", () => {
    expect(formatPhone("11987654321")).toBe("(11) 98765-4321");
  });

  it("formats 10-digit phone", () => {
    expect(formatPhone("1132654321")).toBe("(11) 3265-4321");
  });

  it("returns original value when length is not 10 or 11", () => {
    expect(formatPhone("123")).toBe("123");
  });
});