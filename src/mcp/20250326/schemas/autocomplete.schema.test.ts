import { CompleteResultSchema } from "./autocomplete.schema.js";

describe("CompleteResultSchema completion.values maxLength (100)", () => {
  it("accepts an empty values array", () => {
    const r = CompleteResultSchema.safeParse({
      completion: { values: [] },
    });
    expect(r.success).toBe(true);
  });

  it("accepts exactly 100 values", () => {
    const values = Array.from({ length: 100 }, (_, i) => `v${i}`);
    const r = CompleteResultSchema.safeParse({ completion: { values } });
    expect(r.success).toBe(true);
  });

  it("rejects 101 values", () => {
    const values = Array.from({ length: 101 }, (_, i) => `v${i}`);
    const r = CompleteResultSchema.safeParse({ completion: { values } });
    expect(r.success).toBe(false);
  });

  it("accepts an integer total", () => {
    const r = CompleteResultSchema.safeParse({
      completion: { values: ["a"], total: 42 },
    });
    expect(r.success).toBe(true);
  });

  it("rejects a non-integer total", () => {
    const r = CompleteResultSchema.safeParse({
      completion: { values: ["a"], total: 1.5 },
    });
    expect(r.success).toBe(false);
  });

  it("accepts an optional hasMore boolean", () => {
    const r = CompleteResultSchema.safeParse({
      completion: { values: ["a"], hasMore: true },
    });
    expect(r.success).toBe(true);
  });
});
