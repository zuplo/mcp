import {
  BaseRequestParamsSchema,
  JSONRPCRequestSchema,
  RequestMetaSchema,
} from "./request.js";

describe("RequestMetaSchema (loose)", () => {
  it("accepts an empty object", () => {
    const r = RequestMetaSchema.safeParse({});
    expect(r.success).toBe(true);
  });

  it("accepts a string progressToken", () => {
    const r = RequestMetaSchema.safeParse({ progressToken: "abc" });
    expect(r.success).toBe(true);
  });

  it("accepts an integer progressToken", () => {
    const r = RequestMetaSchema.safeParse({ progressToken: 42 });
    expect(r.success).toBe(true);
  });

  it("rejects a non-integer progressToken number", () => {
    const r = RequestMetaSchema.safeParse({ progressToken: 1.5 });
    expect(r.success).toBe(false);
  });

  it("preserves unknown properties (loose mode)", () => {
    const r = RequestMetaSchema.safeParse({
      progressToken: "tok",
      custom: "value",
      another: 123,
    });
    expect(r.success).toBe(true);
    if (r.success) {
      const data = r.data as Record<string, unknown>;
      expect(data.custom).toBe("value");
      expect(data.another).toBe(123);
    }
  });
});

describe("BaseRequestParamsSchema (loose)", () => {
  it("accepts empty params", () => {
    const r = BaseRequestParamsSchema.safeParse({});
    expect(r.success).toBe(true);
  });

  it("preserves unknown properties (loose mode)", () => {
    const r = BaseRequestParamsSchema.safeParse({ extra: "kept" });
    expect(r.success).toBe(true);
    if (r.success) {
      expect((r.data as Record<string, unknown>).extra).toBe("kept");
    }
  });

  it("validates _meta when present", () => {
    const r = BaseRequestParamsSchema.safeParse({
      _meta: { progressToken: "x" },
    });
    expect(r.success).toBe(true);
  });
});

describe("JSONRPCRequestSchema (strict)", () => {
  const valid = { jsonrpc: "2.0" as const, id: 1, method: "ping" };

  it("accepts a minimal valid request", () => {
    const r = JSONRPCRequestSchema.safeParse(valid);
    expect(r.success).toBe(true);
  });

  it("accepts a request with params", () => {
    const r = JSONRPCRequestSchema.safeParse({ ...valid, params: {} });
    expect(r.success).toBe(true);
  });

  it("rejects extra top-level properties (strict)", () => {
    const r = JSONRPCRequestSchema.safeParse({ ...valid, extra: "nope" });
    expect(r.success).toBe(false);
  });

  it("rejects missing method", () => {
    const r = JSONRPCRequestSchema.safeParse({ jsonrpc: "2.0", id: 1 });
    expect(r.success).toBe(false);
  });
});
