import {
  BaseNotificationParamsSchema,
  JSONRPCNotificationSchema,
  NotificationSchema,
} from "./notifications.js";

describe("BaseNotificationParamsSchema (loose)", () => {
  it("accepts an empty object", () => {
    const r = BaseNotificationParamsSchema.safeParse({});
    expect(r.success).toBe(true);
  });

  it("preserves unknown properties (loose)", () => {
    const r = BaseNotificationParamsSchema.safeParse({ extra: 1 });
    expect(r.success).toBe(true);
  });

  it("accepts a _meta object with arbitrary content", () => {
    const r = BaseNotificationParamsSchema.safeParse({
      _meta: { custom: "ok" },
    });
    expect(r.success).toBe(true);
  });
});

describe("NotificationSchema", () => {
  it("accepts method only", () => {
    const r = NotificationSchema.safeParse({ method: "x" });
    expect(r.success).toBe(true);
  });

  it("accepts method and params", () => {
    const r = NotificationSchema.safeParse({
      method: "x",
      params: { foo: "bar" },
    });
    expect(r.success).toBe(true);
  });
});

describe("JSONRPCNotificationSchema (strict)", () => {
  const valid = { jsonrpc: "2.0" as const, method: "notifications/foo" };

  it("accepts a minimal notification", () => {
    const r = JSONRPCNotificationSchema.safeParse(valid);
    expect(r.success).toBe(true);
  });

  it("does NOT include id (notifications)", () => {
    const r = JSONRPCNotificationSchema.safeParse({ ...valid, id: 1 });
    expect(r.success).toBe(false);
  });

  it("rejects extra top-level fields (strict)", () => {
    const r = JSONRPCNotificationSchema.safeParse({ ...valid, extra: 1 });
    expect(r.success).toBe(false);
  });

  it("rejects wrong jsonrpc literal", () => {
    const r = JSONRPCNotificationSchema.safeParse({ ...valid, jsonrpc: "1.0" });
    expect(r.success).toBe(false);
  });
});
