import { CursorSchema } from "./cursor.js";

describe("CursorSchema", () => {
  describe("happy path", () => {
    it("validates valid cursor strings", () => {
      const validCursors = ["abc123", "page_token_12345"];

      validCursors.forEach((cursor) => {
        const result = CursorSchema.safeParse(cursor);
        expect(result.success).toBe(true);
      });
    });

    it("returns the parsed value unchanged for valid strings", () => {
      const cursor = "test_cursor_value";
      const parsed = CursorSchema.parse(cursor);
      expect(parsed).toBe(cursor);
    });
  });

  describe("error path", () => {
    it("rejects non-string values", () => {
      const invalidValues = [123, true, null, undefined, {}, []];

      invalidValues.forEach((value) => {
        const result = CursorSchema.safeParse(value);
        expect(result.success).toBe(false);
      });
    });

    it("throws an error when using parse with invalid values", () => {
      expect(() => CursorSchema.parse(123)).toThrow();
    });
  });
});
