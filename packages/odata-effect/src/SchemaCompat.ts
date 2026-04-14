import * as Effect from "effect/Effect"
import * as Option from "effect/Option"
import * as S from "effect/Schema"
import * as SchemaIssue from "effect/SchemaIssue"
import * as SchemaTransformation from "effect/SchemaTransformation"
import * as Struct from "effect/Struct"
import type * as ParseResult from "./ParseResultCompat.js"

export * from "effect/Schema"

export interface Schema<T, E = T, RD = never> extends S.Codec<T, E, RD, never> {}

export namespace Schema {
  export type Type<S0> = S.Schema.Type<S0>
}

export const DateTimeUtcFromSelf = S.DateTimeUtc
export const DateTimeZonedFromSelf = S.DateTimeZoned
export const DurationFromSelf = S.Duration
export const BigDecimalFromSelf = S.BigDecimal

export const decodeUnknown = S.decodeUnknownEffect

export const Union = <Members extends ReadonlyArray<S.Top>>(
  ...members: Members | [Members]
): S.Union<Members> => {
  const values = (members.length === 1 && Array.isArray(members[0]) ? members[0] : members) as Members
  return S.Union(values)
}

export const optionalWith = <A, E = A, RD = never>(
  schema: S.Codec<A, E, RD>,
  options: {
    readonly nullable?: boolean
    readonly exact?: boolean
    readonly default?: () => A
  }
) => {
  const withNullability = options.nullable ? S.NullOr(schema) : schema

  if (options.default) {
    const defaultValue = Effect.succeed(options.default()) as Effect.Effect<any>
    return options.exact
      ? withNullability.pipe(S.withDecodingDefaultKey(defaultValue))
      : withNullability.pipe(S.withDecodingDefault(defaultValue))
  }

  return options.exact ? S.optionalKey(withNullability) : S.optional(withNullability)
}

export const partial = <S0 extends S.Top>(schema: S0): any =>
  (schema as any).mapFields(Struct.map(S.optional))

const toSchemaIssue = (input: unknown, error: unknown) =>
  error instanceof Error
    ? new SchemaIssue.InvalidValue(Option.some(input), { message: error.message })
    : new SchemaIssue.InvalidValue(Option.some(input), { message: String(error) })

const fromCompatResult = <A>(input: unknown, result: ParseResult.Result<A>) =>
  result._tag === "Success" ? Effect.succeed(result.value) : Effect.fail(toSchemaIssue(input, result.error))

export const transformOrFail = <
  A,
  E,
  RD,
  B,
  BRD = never
>(
  from: S.Codec<A, E, RD>,
  to: S.Codec<B, B, BRD>,
  options: {
    readonly strict?: boolean
    readonly decode: (input: A, options?: unknown, ast?: unknown) => ParseResult.Result<B>
    readonly encode: (input: B, options?: unknown, ast?: unknown) => ParseResult.Result<A>
  }
) =>
  from.pipe(
    S.decodeTo(
      to,
      SchemaTransformation.transformOrFail({
        decode: (input) => fromCompatResult(input, options.decode(input)),
        encode: (input) => fromCompatResult(input, options.encode(input))
      })
    )
  )
