import type { AnyZodObject, z } from "zod";
import zodToJsonSchema from "zod-to-json-schema";
import type {
  InputParamValidator,
  InputParamValidatorReturn,
} from "../server/types.js";

/**
 * ZodValidator is a input JSON params validator class which uses Zod and
 * @implements {InputParamValidator}
 *
 * @param S - the Zod schema object. This is used to "parse" and provide
 * validated params to tool calls.
 */

export class ZodValidator<S extends AnyZodObject>
  implements InputParamValidator<z.infer<S>>
{
  readonly jsonSchema: object;
  readonly zodSchema: S;

  constructor(schema: S) {
    this.jsonSchema = zodToJsonSchema(schema);
    this.zodSchema = schema;
  }

  parse(input: unknown): InputParamValidatorReturn<z.infer<S>> {
    const parsed = this.zodSchema.safeParse(input);
    return parsed.success
      ? { success: true, data: parsed.data, error: null }
      : { success: false, data: null, error: parsed.error.message };
  }
}
