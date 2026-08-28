import { describe, expect, it } from "vitest";
import { parseDateRange, percent } from "../lib/reporting";

describe("reporting helpers", () => {
  it("calculates display percentages", () => expect(percent(1, 3)).toBe(33.3));
  it("parses custom date ranges with an exclusive end", () => { const range = parseDateRange(new URLSearchParams("range=custom&from=2026-08-01&to=2026-08-03")); expect(range.start.toISOString()).toBe("2026-08-01T00:00:00.000Z"); expect(range.end.toISOString()).toBe("2026-08-04T00:00:00.000Z"); });
  it("rejects incomplete custom date ranges", () => expect(() => parseDateRange(new URLSearchParams("range=custom&from=2026-08-01"))).toThrow());
});
