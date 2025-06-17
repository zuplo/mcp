import Ajv, {
  AnySchema,
  type JSONSchemaType,
  type ValidateFunction,
} from "ajv";
import type {
  InputParamValidator,
  InputParamValidatorReturn,
} from "../server/types.js";

/**
 * Runtime-safe JSON-Schema validator backed by Ajv.
 *
 * @template T  The validated TypeScript type.
 * @template S  The actual schema object (inferred; must be an object).
 */
export class AjvValidator<
  T,
  S extends JSONSchemaType<T> | object = JSONSchemaType<T>,
> implements InputParamValidator<T>
{
  /** Raw schema sent over the wire. */
  readonly jsonSchema: S;

  /** Compiled Ajv validation function. */
  private readonly validate: ValidateFunction<T>;

  /** Ajv instance kept for `errorsText`. */
  private readonly ajv: Ajv;

  constructor(schema: S, ajv: Ajv = new Ajv()) {
    this.jsonSchema = schema;
    this.ajv = ajv;
    this.validate = this.ajv.compile<T>(schema as JSONSchemaType<T>);
  }

  /** Validate unknown input, returning the MCP-style result object. */
  parse(input: unknown): InputParamValidatorReturn<T> {
    return this.validate(input)
      ? { success: true, data: input, error: null }
      : {
          success: false,
          data: null,
          error: this.ajv.errorsText(this.validate.errors),
        };
  }
}
