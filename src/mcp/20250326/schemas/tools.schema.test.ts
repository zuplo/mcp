import {
  CallToolRequestSchema,
  CallToolResultSchema,
  CompatibilityCallToolResultSchema,
  ToolSchema,
} from "./tools.schema.js";

describe("ToolSchema (loose)", () => {
  const minimal = {
    name: "echo",
    inputSchema: { type: "object" as const },
  };

  it("accepts a minimal tool definition", () => {
    const r = ToolSchema.safeParse(minimal);
    expect(r.success).toBe(true);
  });

  it("accepts a tool with description and annotations", () => {
    const r = ToolSchema.safeParse({
      ...minimal,
      description: "An echo tool",
      annotations: {
        title: "Echo",
        readOnlyHint: true,
      },
    });
    expect(r.success).toBe(true);
  });

  it("preserves extra top-level fields (loose)", () => {
    const r = ToolSchema.safeParse({ ...minimal, custom: "kept" });
    expect(r.success).toBe(true);
    if (r.success) {
      expect((r.data as Record<string, unknown>).custom).toBe("kept");
    }
  });

  it("preserves extra fields inside inputSchema (loose)", () => {
    const r = ToolSchema.safeParse({
      ...minimal,
      inputSchema: {
        type: "object",
        required: ["x"],
        additionalProperties: false,
      },
    });
    expect(r.success).toBe(true);
    if (r.success) {
      const is = r.data.inputSchema as Record<string, unknown>;
      expect(is.required).toEqual(["x"]);
      expect(is.additionalProperties).toBe(false);
    }
  });

  it("rejects inputSchema with type other than 'object'", () => {
    const r = ToolSchema.safeParse({
      ...minimal,
      inputSchema: { type: "array" },
    });
    expect(r.success).toBe(false);
  });

  it("rejects missing name", () => {
    const r = ToolSchema.safeParse({ inputSchema: { type: "object" } });
    expect(r.success).toBe(false);
  });
});

describe("CallToolResultSchema isError default", () => {
  const minimal = {
    content: [{ type: "text" as const, text: "hi" }],
  };

  // The schema is `z.boolean().default(false).optional()` (chainable
  // form) — wrapping a default in optional means the default does NOT
  // kick in when the field is missing; the value is left as undefined.
  // Locking that behavior in here so the upgrade branch has to match.
  it("leaves isError undefined when the field is missing", () => {
    const r = CallToolResultSchema.safeParse(minimal);
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.isError).toBeUndefined();
    }
  });

  it("accepts a result with isError: true", () => {
    const r = CallToolResultSchema.safeParse({ ...minimal, isError: true });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.isError).toBe(true);
    }
  });

  it("accepts a result with isError: false", () => {
    const r = CallToolResultSchema.safeParse({ ...minimal, isError: false });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.isError).toBe(false);
    }
  });

  it("rejects non-boolean isError", () => {
    const r = CallToolResultSchema.safeParse({ ...minimal, isError: "yes" });
    expect(r.success).toBe(false);
  });
});

describe("CompatibilityCallToolResultSchema (.or fallback)", () => {
  it("accepts a CallToolResult shape", () => {
    const r = CompatibilityCallToolResultSchema.safeParse({
      content: [{ type: "text", text: "ok" }],
    });
    expect(r.success).toBe(true);
  });

  it("accepts a legacy toolResult shape", () => {
    const r = CompatibilityCallToolResultSchema.safeParse({
      toolResult: { anything: "goes" },
    });
    expect(r.success).toBe(true);
  });
});

describe("CallToolRequestSchema (extends RequestSchema)", () => {
  const valid = {
    method: "tools/call" as const,
    params: { name: "echo", arguments: { msg: "hi" } },
  };

  it("accepts a valid call", () => {
    const r = CallToolRequestSchema.safeParse(valid);
    expect(r.success).toBe(true);
  });

  it("rejects wrong method literal", () => {
    const r = CallToolRequestSchema.safeParse({
      ...valid,
      method: "tools/list",
    });
    expect(r.success).toBe(false);
  });

  it("rejects missing params.name", () => {
    const r = CallToolRequestSchema.safeParse({
      method: "tools/call",
      params: { arguments: {} },
    });
    expect(r.success).toBe(false);
  });

  it("accepts a call without arguments", () => {
    const r = CallToolRequestSchema.safeParse({
      method: "tools/call",
      params: { name: "ping" },
    });
    expect(r.success).toBe(true);
  });
});
