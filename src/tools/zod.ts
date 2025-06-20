import { type ZodObject, z } from "zod/v4";
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

export class ZodValidator<S extends ZodObject>
  implements InputParamValidator<z.infer<S>>
{
  readonly jsonSchema: object;
  readonly schema: S;

  constructor(schema: S) {
    this.jsonSchema = z.toJSONSchema(schema);
    this.schema = schema;
  }

  parse(input: unknown): InputParamValidatorReturn<z.infer<S>> {
    const parsed = this.schema.safeParse(input);
    return parsed.success
      ? { success: true, data: parsed.data, errorData: null }
      : {
          success: false,
          data: null,
          errorData: z.treeifyError(parsed.error),
          errorMessage: z.prettifyError(parsed.error),
        };
  }
}
