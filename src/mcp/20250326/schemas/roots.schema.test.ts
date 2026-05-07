import { RootSchema } from "./roots.schema.js";

describe("RootSchema (uri startsWith file://)", () => {
  it("accepts a valid file URI", () => {
    const r = RootSchema.safeParse({ uri: "file:///home/user/project" });
    expect(r.success).toBe(true);
  });

  it("accepts a file URI with an optional name", () => {
    const r = RootSchema.safeParse({
      uri: "file:///workspace",
      name: "my-workspace",
    });
    expect(r.success).toBe(true);
  });

  it("rejects a non-file URI", () => {
    const r = RootSchema.safeParse({ uri: "https://example.com/path" });
    expect(r.success).toBe(false);
  });

  it("rejects a string that does not start with file://", () => {
    const r = RootSchema.safeParse({ uri: "/home/user/project" });
    expect(r.success).toBe(false);
  });

  it("preserves extra properties (loose)", () => {
    const r = RootSchema.safeParse({
      uri: "file:///x",
      custom: "kept",
    });
    expect(r.success).toBe(true);
    if (r.success) {
      expect((r.data as Record<string, unknown>).custom).toBe("kept");
    }
  });
});
