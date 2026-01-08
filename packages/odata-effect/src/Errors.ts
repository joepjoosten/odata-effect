/**
 * Error types for CI EMOB SMCH Customer OData service.
 *
 * @since 1.0.0
 */
import * as Data from "effect/Data"
import * as Schema from "effect/Schema"

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
}> {}

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
