/**
 * Error types for OData services.
 *
 * @since 1.0.0
 */
import * as Data from "effect/Data"
import * as Effect from "effect/Effect"
import * as Schema from "effect/Schema"
import * as HttpClientError from "effect/unstable/http/HttpClientError"

/**
 * SAP error detail schema.
 *
 * @since 1.0.0
 * @category errors
 */
export class SapErrorDetail extends Schema.Class<SapErrorDetail>("SapErrorDetail")({
  code: Schema.String,
  message: Schema.String,
  propertyref: Schema.String,
  severity: Schema.String,
  target: Schema.String
}) {}

/**
 * SAP error resolution information.
 *
 * @since 1.0.0
 * @category errors
 */
export class SapErrorResolution extends Schema.Class<SapErrorResolution>("SapErrorResolution")({
  SAP_Transaction: Schema.String,
  SAP_Note: Schema.String
}) {}

/**
 * SAP application information.
 *
 * @since 1.0.0
 * @category errors
 */
export class SapApplication extends Schema.Class<SapApplication>("SapApplication")({
  component_id: Schema.String,
  service_namespace: Schema.String,
  service_id: Schema.String,
  service_version: Schema.String
}) {}

/**
 * SAP inner error schema.
 *
 * @since 1.0.0
 * @category errors
 */
export class SapInnerError extends Schema.Class<SapInnerError>("SapInnerError")({
  application: SapApplication,
  transactionid: Schema.String,
  timestamp: Schema.String,
  Error_Resolution: SapErrorResolution,
  errordetails: Schema.Array(SapErrorDetail)
}) {}

/**
 * SAP error message schema.
 *
 * @since 1.0.0
 * @category errors
 */
export class SapErrorMessage extends Schema.Class<SapErrorMessage>("SapErrorMessage")({
  lang: Schema.String,
  value: Schema.String
}) {}

/**
 * SAP error body schema.
 *
 * @since 1.0.0
 * @category errors
 */
export class SapErrorBody extends Schema.Class<SapErrorBody>("SapErrorBody")({
  code: Schema.String,
  message: SapErrorMessage,
  innererror: Schema.optional(SapInnerError)
}) {}

/**
 * SAP error response schema.
 *
 * @since 1.0.0
 * @category errors
 */
export const SapErrorResponse = Schema.Struct({
  error: SapErrorBody
})
export type SapErrorResponse = Schema.Schema.Type<typeof SapErrorResponse>

/**
 * OData client error - base error class for all OData-related errors.
 *
 * @since 1.0.0
 * @category errors
 */
export class ODataError extends Data.TaggedError("ODataError")<{
  readonly message: string
  readonly cause?: unknown
  readonly responseBody?: string
  readonly status?: number
}> {}

const findHttpClientError = (cause: unknown): HttpClientError.HttpClientError | undefined => {
  let current: unknown = cause

  for (let depth = 0; depth < 8; depth++) {
    if (HttpClientError.isHttpClientError(current)) {
      return current
    }

    if (typeof current !== "object" || current === null || !("cause" in current)) {
      return undefined
    }

    current = (current as { readonly cause?: unknown }).cause
  }

  return undefined
}

export const makeODataError = (
  message: string,
  cause?: unknown
): Effect.Effect<ODataError> => {
  const httpError = findHttpClientError(cause)
  const response = httpError?.response

  if (response === undefined) {
    return Effect.succeed(new ODataError({ message, cause }))
  }

  return response.text.pipe(
    Effect.match({
      onFailure: () => new ODataError({ message, cause, status: response.status }),
      onSuccess: (responseBody) => {
        const hasBody = responseBody.trim() !== ""
        return new ODataError({
          message: hasBody ? `${message}: ${responseBody}` : message,
          cause,
          ...(hasBody ? { responseBody } : {}),
          status: response.status
        })
      }
    })
  )
}

export const catchODataError =
  (message: string) => <A, E, R>(effect: Effect.Effect<A, E, R>): Effect.Effect<A, ODataError, R> =>
    Effect.catch(effect, (cause) =>
      makeODataError(message, cause).pipe(
        Effect.flatMap((error) => Effect.fail(error))
      ))

/**
 * SAP-specific error returned by the OData service.
 *
 * @since 1.0.0
 * @category errors
 */
export class SapError extends Data.TaggedError("SapError")<{
  readonly code: string
  readonly message: string
  readonly details?: ReadonlyArray<SapErrorDetail>
  readonly innererror?: SapInnerError
}> {}

/**
 * Error when a requested entity is not found.
 *
 * @since 1.0.0
 * @category errors
 */
export class EntityNotFoundError extends Data.TaggedError("EntityNotFoundError")<{
  readonly entityType: string
  readonly id: string
}> {}

/**
 * Error when parsing/decoding response data fails.
 *
 * @since 1.0.0
 * @category errors
 */
export class ParseError extends Data.TaggedError("ParseError")<{
  readonly message: string
  readonly cause?: unknown
}> {}
