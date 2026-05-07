import { JSONRPCErrorSchema } from "./error.js";

describe("JSONRPCErrorSchema", () => {
  const valid = {
    jsonrpc: "2.0" as const,
    id: 1,
    error: {
      code: -32600,
      message: "Invalid Request",
    },
  };

  it("accepts a minimal valid error", () => {
    const result = JSONRPCErrorSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("accepts an error with optional data", () => {
    const result = JSONRPCErrorSchema.safeParse({
      ...valid,
      error: { ...valid.error, data: { foo: "bar" } },
    });
    expect(result.success).toBe(true);
  });

  it("accepts a null id (parse-error case)", () => {
    const result = JSONRPCErrorSchema.safeParse({ ...valid, id: null });
    expect(result.success).toBe(true);
  });

  it("accepts a string id", () => {
    const result = JSONRPCErrorSchema.safeParse({ ...valid, id: "req-1" });
    expect(result.success).toBe(true);
  });

  it("rejects extra top-level properties (strict)", () => {
    const result = JSONRPCErrorSchema.safeParse({ ...valid, extra: "no" });
    expect(result.success).toBe(false);
  });

  it("rejects non-integer error.code", () => {
    const result = JSONRPCErrorSchema.safeParse({
      ...valid,
      error: { ...valid.error, code: 1.5 },
    });
    expect(result.success).toBe(false);
  });

  it("rejects wrong jsonrpc version literal", () => {
    const result = JSONRPCErrorSchema.safeParse({ ...valid, jsonrpc: "1.0" });
    expect(result.success).toBe(false);
  });

  it("rejects missing error.message", () => {
    const result = JSONRPCErrorSchema.safeParse({
      ...valid,
      error: { code: -32600 },
    });
    expect(result.success).toBe(false);
  });
});
