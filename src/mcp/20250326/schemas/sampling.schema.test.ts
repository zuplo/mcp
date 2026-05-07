import {
  CreateMessageRequestSchema,
  CreateMessageResultSchema,
  ModelPreferencesSchema,
} from "./sampling.schema.js";

describe("ModelPreferencesSchema priority bounds (0..1)", () => {
  it("accepts 0 at the lower bound", () => {
    const r = ModelPreferencesSchema.safeParse({ costPriority: 0 });
    expect(r.success).toBe(true);
  });

  it("accepts 1 at the upper bound", () => {
    const r = ModelPreferencesSchema.safeParse({ costPriority: 1 });
    expect(r.success).toBe(true);
  });

  it("accepts a value in the middle of the range", () => {
    const r = ModelPreferencesSchema.safeParse({ costPriority: 0.5 });
    expect(r.success).toBe(true);
  });

  it("rejects a negative value", () => {
    const r = ModelPreferencesSchema.safeParse({ costPriority: -0.01 });
    expect(r.success).toBe(false);
  });

  it("rejects a value greater than 1", () => {
    const r = ModelPreferencesSchema.safeParse({ costPriority: 1.01 });
    expect(r.success).toBe(false);
  });

  it("applies the same bounds to speedPriority and intelligencePriority", () => {
    expect(ModelPreferencesSchema.safeParse({ speedPriority: 2 }).success).toBe(
      false
    );
    expect(
      ModelPreferencesSchema.safeParse({ intelligencePriority: -1 }).success
    ).toBe(false);
    expect(
      ModelPreferencesSchema.safeParse({
        costPriority: 0.1,
        speedPriority: 0.5,
        intelligencePriority: 0.9,
      }).success
    ).toBe(true);
  });
});

describe("CreateMessageRequestSchema (maxTokens int)", () => {
  const validParams = {
    method: "sampling/createMessage" as const,
    params: {
      messages: [
        {
          role: "user" as const,
          content: { type: "text" as const, text: "Hi" },
        },
      ],
      maxTokens: 100,
    },
  };

  it("accepts an integer maxTokens", () => {
    const r = CreateMessageRequestSchema.safeParse(validParams);
    expect(r.success).toBe(true);
  });

  it("rejects a non-integer maxTokens", () => {
    const r = CreateMessageRequestSchema.safeParse({
      ...validParams,
      params: { ...validParams.params, maxTokens: 1.5 },
    });
    expect(r.success).toBe(false);
  });
});

describe("CreateMessageResultSchema stopReason (.or fallback)", () => {
  const minimal = {
    model: "gpt-4",
    role: "assistant" as const,
    content: { type: "text" as const, text: "ok" },
  };

  it("accepts the standard 'endTurn' value", () => {
    const r = CreateMessageResultSchema.safeParse({
      ...minimal,
      stopReason: "endTurn",
    });
    expect(r.success).toBe(true);
  });

  it("accepts a non-standard string via the .or(z.string()) fallback", () => {
    const r = CreateMessageResultSchema.safeParse({
      ...minimal,
      stopReason: "modelSpecificReason",
    });
    expect(r.success).toBe(true);
  });

  it("rejects a non-string stopReason", () => {
    const r = CreateMessageResultSchema.safeParse({
      ...minimal,
      stopReason: 123,
    });
    expect(r.success).toBe(false);
  });

  it("accepts a missing stopReason (optional)", () => {
    const r = CreateMessageResultSchema.safeParse(minimal);
    expect(r.success).toBe(true);
  });
});
