import type {
  InputParamValidator,
  InputParamValidatorReturn,
} from "../server/types.js";

/**
 * CustomValidator is a hands-off, “bring-your-own-validator” which
 * @implements {InputParamValidator} and is expected that the caller provide a custom
 * "parse" function.
 *
 * @param T - the runtime type produced by the validator
 * @param S - the raw JSON Schema object
 *
 * The caller provides a "parseFn" that returns a @type InputParamValidatorReturn
 * which is used to infer the type of the JSON schema in a tool's handler
 * callback.
 *
 * This implementation matches the contract of "InputValidator<T>.parse".
 */
export class CustomValidator<T, S extends object = object>
  implements InputParamValidator<T>
{
  constructor(
    public readonly jsonSchema: S,
    private readonly parseFn: (input: unknown) => InputParamValidatorReturn<T>
  ) {}

  parse(input: unknown): InputParamValidatorReturn<T> {
    return this.parseFn(input);
  }
}
