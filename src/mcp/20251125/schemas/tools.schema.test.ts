import { ToolSchema } from "./tools.schema.js";

// The 20251125 ToolSchema is built via:
//   BaseMetadataSchema.merge(IconsSchema).extend({ ... })
// which exercises the .merge() pattern that gets rewritten on the
// upgrade branch.

describe("ToolSchema (20251125, merge + extend)", () => {
  const minimal = {
    name: "echo",
    inputSchema: { type: "object" as const },
  };

  it("accepts the BaseMetadataSchema fields (name, title)", () => {
    const r = ToolSchema.safeParse({ ...minimal, title: "Echo" });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.name).toBe("echo");
      expect(r.data.title).toBe("Echo");
    }
  });

  it("accepts the IconsSchema 'icons' field merged in", () => {
    const r = ToolSchema.safeParse({
      ...minimal,
      icons: [{ src: "data:image/png;base64,abcd" }],
    });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.icons?.[0].src).toBe("data:image/png;base64,abcd");
    }
  });

  it("accepts ToolSchema-extended fields (description, execution)", () => {
    const r = ToolSchema.safeParse({
      ...minimal,
      description: "An echo tool",
      execution: { taskSupport: "optional" },
    });
    expect(r.success).toBe(true);
  });

  it("preserves arbitrary extra top-level fields (loose mode survives merge+extend)", () => {
    const r = ToolSchema.safeParse({ ...minimal, custom: "kept" });
    expect(r.success).toBe(true);
    if (r.success) {
      expect((r.data as Record<string, unknown>).custom).toBe("kept");
    }
  });

  it("accepts an outputSchema with $schema, type, properties, required", () => {
    const r = ToolSchema.safeParse({
      ...minimal,
      outputSchema: {
        $schema: "https://json-schema.org/draft/2020-12/schema",
        type: "object",
        properties: { x: {} },
        required: ["x"],
      },
    });
    expect(r.success).toBe(true);
  });

  it("rejects missing name (required from BaseMetadataSchema)", () => {
    const r = ToolSchema.safeParse({
      inputSchema: { type: "object" },
    });
    expect(r.success).toBe(false);
  });

  it("rejects taskSupport outside the allowed enum", () => {
    const r = ToolSchema.safeParse({
      ...minimal,
      execution: { taskSupport: "always" },
    });
    expect(r.success).toBe(false);
  });
});
