export type Result<A> =
  | { readonly _tag: "Success"; readonly value: A }
  | { readonly _tag: "Failure"; readonly error: unknown }

export class Type extends Error {
  constructor(
    readonly ast: unknown,
    readonly input: unknown,
    message?: string
  ) {
    super(message ?? "Parse error")
  }
}

export const succeed = <A>(value: A): Result<A> => ({ _tag: "Success", value })

export const fail = (error: unknown): Result<never> => ({ _tag: "Failure", error })
