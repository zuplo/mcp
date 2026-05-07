import { z } from "zod/v4";
import { ZodValidator } from "./zod.js";

describe("ZodValidator", () => {
  describe("happy path", () => {
    it("parses a valid object", () => {
      const v = new ZodValidator(z.object({ name: z.string() }));
      const r = v.parse({ name: "Alice" });
      expect(r.success).toBe(true);
      expect(r.data).toEqual({ name: "Alice" });
      expect(r.errorData).toBeNull();
    });

    it("parses a valid empty object", () => {
      const v = new ZodValidator(z.object({}));
      const r = v.parse({});
      expect(r.success).toBe(true);
      expect(r.errorData).toBeNull();
    });

    it("parses nested objects with optional fields", () => {
      const v = new ZodValidator(
        z.object({
          required: z.string(),
          optional: z.optional(z.number()),
          nested: z.object({ x: z.string() }),
        })
      );
      const r = v.parse({ required: "ok", nested: { x: "y" } });
      expect(r.success).toBe(true);
    });

    it("parses with arrays and unions", () => {
      const v = new ZodValidator(
        z.object({
          values: z.array(z.union([z.string(), z.number()])),
        })
      );
      const r = v.parse({ values: ["a", 1, "b", 2] });
      expect(r.success).toBe(true);
    });
  });

  describe("error path", () => {
    it("returns success=false for the wrong type", () => {
      const v = new ZodValidator(z.object({ name: z.string() }));
      const r = v.parse({ name: 123 });
      expect(r.success).toBe(false);
      expect(r.data).toBeNull();
      expect(r.errorData).not.toBeNull();
    });

    it("returns a non-empty errorMessage on failure", () => {
      const v = new ZodValidator(z.object({ name: z.string() }));
      const r = v.parse({ name: 123 });
      expect(r.success).toBe(false);
      expect(typeof r.errorMessage).toBe("string");
      expect(r.errorMessage?.length ?? 0).toBeGreaterThan(0);
    });

    it("returns success=false for completely wrong shape", () => {
      const v = new ZodValidator(z.object({ name: z.string() }));
      const r = v.parse("not an object");
      expect(r.success).toBe(false);
      expect(r.data).toBeNull();
    });

    it("returns success=false for null input", () => {
      const v = new ZodValidator(z.object({ name: z.string() }));
      const r = v.parse(null);
      expect(r.success).toBe(false);
    });

    it("reports missing required fields", () => {
      const v = new ZodValidator(z.object({ name: z.string() }));
      const r = v.parse({});
      expect(r.success).toBe(false);
      expect(r.errorData).not.toBeNull();
    });
  });

  describe("jsonSchema generation", () => {
    it("generates a JSON Schema with type 'object'", () => {
      const v = new ZodValidator(z.object({ name: z.string() }));
      expect(v.jsonSchema).toMatchObject({ type: "object" });
    });

    it("includes properties in the JSON Schema", () => {
      const v = new ZodValidator(
        z.object({ name: z.string(), age: z.number() })
      );
      const js = v.jsonSchema as {
        type: string;
        properties: Record<string, { type: string }>;
      };
      expect(js.properties.name.type).toBe("string");
      expect(js.properties.age.type).toBe("number");
    });

    it("marks required fields", () => {
      const v = new ZodValidator(
        z.object({
          required: z.string(),
          opt: z.optional(z.string()),
        })
      );
      const js = v.jsonSchema as { required?: string[] };
      expect(js.required).toContain("required");
      expect(js.required).not.toContain("opt");
    });

    it("preserves the schema reference on the instance", () => {
      const schema = z.object({ name: z.string() });
      const v = new ZodValidator(schema);
      expect(v.schema).toBe(schema);
    });
  });
});
