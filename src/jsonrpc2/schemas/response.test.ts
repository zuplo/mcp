import {
  EmptyResultSchema,
  JSONRPCResponseSchema,
  ResultSchema,
} from "./response.js";

describe("ResultSchema (loose)", () => {
  it("accepts an empty object", () => {
    const r = ResultSchema.safeParse({});
    expect(r.success).toBe(true);
  });

  it("accepts arbitrary extra fields (loose mode)", () => {
    const r = ResultSchema.safeParse({ foo: "bar", n: 1 });
    expect(r.success).toBe(true);
    if (r.success) {
      const data = r.data as Record<string, unknown>;
      expect(data.foo).toBe("bar");
      expect(data.n).toBe(1);
    }
  });

  it("accepts a _meta object with arbitrary fields (loose)", () => {
    const r = ResultSchema.safeParse({ _meta: { customMeta: "ok" } });
    expect(r.success).toBe(true);
  });
});

describe("EmptyResultSchema (strict)", () => {
  it("accepts a fully empty result", () => {
    const r = EmptyResultSchema.safeParse({});
    expect(r.success).toBe(true);
  });

  it("accepts a result with only _meta", () => {
    const r = EmptyResultSchema.safeParse({ _meta: {} });
    expect(r.success).toBe(true);
  });

  it("rejects extra top-level fields (strict)", () => {
    const r = EmptyResultSchema.safeParse({ extra: "nope" });
    expect(r.success).toBe(false);
  });
});

describe("JSONRPCResponseSchema (strict)", () => {
  const valid = { jsonrpc: "2.0" as const, id: 1, result: {} };

  it("accepts a minimal valid response", () => {
    const r = JSONRPCResponseSchema.safeParse(valid);
    expect(r.success).toBe(true);
  });

  it("rejects extra top-level fields (strict)", () => {
    const r = JSONRPCResponseSchema.safeParse({ ...valid, extra: 1 });
    expect(r.success).toBe(false);
  });

  it("rejects missing result", () => {
    const r = JSONRPCResponseSchema.safeParse({ jsonrpc: "2.0", id: 1 });
    expect(r.success).toBe(false);
  });

  it("accepts arbitrary fields inside result (loose ResultSchema)", () => {
    const r = JSONRPCResponseSchema.safeParse({
      ...valid,
      result: { extra: 1 },
    });
    expect(r.success).toBe(true);
  });
});
