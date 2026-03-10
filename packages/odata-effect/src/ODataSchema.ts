/**
 * OData-specific Effect Schema types for proper encoding/decoding of OData wire formats.
 *
 * OData V2 and V4 have different wire formats for dates, times, and numbers.
 * These schemas handle the transformation between wire format and Effect types.
 *
 * Uses Effect's built-in types for proper handling:
 * - DateTime.Utc / DateTime.Zoned for date/time values
 * - BigDecimal for precise decimal numbers (Int64, Decimal)
 * - Duration for time durations
 *
 * @since 1.0.0
 * @see https://odata2ts.github.io/docs/odata/odata-types
 */
import * as BigDecimal from "effect/BigDecimal"
import * as DateTime from "effect/DateTime"
import * as Duration from "effect/Duration"
import * as Effect from "effect/Effect"
import * as Option from "effect/Option"
import * as SchemaIssue from "effect/SchemaIssue"
import * as SchemaTransformation from "effect/SchemaTransformation"
import * as Schema from "effect/Schema"

// ============================================================================
// V2 Date/Time Schemas
// ============================================================================

/**
 * Regex pattern for OData V2 DateTime format: /Date(millis)/
 * Also handles optional timezone offset: /Date(millis+0000)/ or /Date(millis-0000)/
 */
const V2_DATE_PATTERN = /^\/Date\((-?\d+)([+-]\d{4})?\)\/$/
const ODATA_DURATION_PATTERN =
  /^(-)?P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?)?$/
const DAY_IN_MILLIS = 24 * 60 * 60 * 1000
const HOUR_IN_MILLIS = 60 * 60 * 1000
const MINUTE_IN_MILLIS = 60 * 1000
const SECOND_IN_MILLIS = 1000

/**
 * Parse timezone offset string (+0530 or -0800) to milliseconds.
 */
const parseTimezoneOffset = (offsetStr: string): number => {
  const sign = offsetStr[0] === "-" ? -1 : 1
  const hours = parseInt(offsetStr.slice(1, 3), 10)
  const minutes = parseInt(offsetStr.slice(3, 5), 10)
  return sign * (hours * 60 + minutes) * 60 * 1000
}

/**
 * Format timezone offset in milliseconds to +HHMM format.
 */
const formatTimezoneOffset = (offsetMs: number): string => {
  const sign = offsetMs >= 0 ? "+" : "-"
  const absMs = Math.abs(offsetMs)
  const hours = Math.floor(absMs / (60 * 60 * 1000))
  const minutes = Math.floor((absMs % (60 * 60 * 1000)) / (60 * 1000))
  return `${sign}${hours.toString().padStart(2, "0")}${minutes.toString().padStart(2, "0")}`
}

const invalidValue = (input: unknown, message: string) =>
  Effect.fail(new SchemaIssue.InvalidValue(Option.some(input), { message }))

const isDefined = <A>(value: A | undefined): value is A => value !== undefined

const parseODataDuration = (input: string): Duration.Duration | undefined => {
  const match = input.match(ODATA_DURATION_PATTERN)
  if (!match) {
    return undefined
  }

  const [, sign = "", days = "0", hours = "0", minutes = "0", seconds = "0"] = match
  if (days === "0" && hours === "0" && minutes === "0" && seconds === "0" && input !== "PT0S") {
    return undefined
  }

  const totalMillis =
    Number(days) * DAY_IN_MILLIS +
    Number(hours) * HOUR_IN_MILLIS +
    Number(minutes) * MINUTE_IN_MILLIS +
    Number(seconds) * SECOND_IN_MILLIS

  if (!Number.isFinite(totalMillis)) {
    return undefined
  }

  return Duration.millis(sign === "-" ? -totalMillis : totalMillis)
}

export const formatODataDuration = (duration: Duration.Duration): string => {
  const totalMillis = Duration.toMillis(duration)
  if (!Number.isFinite(totalMillis)) {
    return "PT0S"
  }

  let remainder = Math.abs(totalMillis)
  const days = Math.floor(remainder / DAY_IN_MILLIS)
  remainder -= days * DAY_IN_MILLIS
  const hours = Math.floor(remainder / HOUR_IN_MILLIS)
  remainder -= hours * HOUR_IN_MILLIS
  const minutes = Math.floor(remainder / MINUTE_IN_MILLIS)
  remainder -= minutes * MINUTE_IN_MILLIS
  const seconds = remainder / SECOND_IN_MILLIS

  const sign = totalMillis < 0 ? "-" : ""
  const datePart = days > 0 ? `${days}D` : ""
  const timeParts: Array<string> = []

  if (hours > 0) {
    timeParts.push(`${hours}H`)
  }
  if (minutes > 0) {
    timeParts.push(`${minutes}M`)
  }
  if (seconds > 0 || (days === 0 && hours === 0 && minutes === 0)) {
    const formattedSeconds = Number.isInteger(seconds)
      ? String(seconds)
      : seconds.toFixed(3).replace(/\.?0+$/, "")
    timeParts.push(`${formattedSeconds}S`)
  }

  return `${sign}P${datePart}${timeParts.length > 0 ? `T${timeParts.join("")}` : ""}`
}

const transformOrFail = <From extends Schema.Top, To extends Schema.Top>(
  from: From,
  to: To,
  options: Parameters<typeof SchemaTransformation.transformOrFail<To["Type"], From["Type"]>>[0]
) => from.pipe(Schema.decodeTo(to, SchemaTransformation.transformOrFail(options)))

/**
 * OData V2 DateTime schema.
 *
 * Decodes both OData V2 `/Date(milliseconds)/` format and ISO 8601 format (V3/V4)
 * to a DateTime.Utc. This allows the same generated code to work with V2 and V3 services.
 * Encodes DateTime.Utc back to the `/Date(milliseconds)/` format for V2 compatibility.
 *
 * @example
 * ```typescript
 * // V2 wire format: "/Date(1672531199000)/"
 * // V3 wire format: "2022-12-31T23:59:59"
 * // Decoded: DateTime.Utc representing 2022-12-31T23:59:59.000Z
 * ```
 *
 * @since 1.0.0
 * @category V2 schemas
 */
export const ODataV2DateTime = transformOrFail(
  Schema.String,
  Schema.DateTimeUtc,
  {
    decode: (s) => {
      // Try V2 format first: /Date(millis)/
      const match = s.match(V2_DATE_PATTERN)
      if (match) {
        const millis = parseInt(match[1], 10)
        return Effect.succeed(DateTime.makeUnsafe(millis))
      }

      // Try ISO 8601 format (V3/V4): 2022-12-31T23:59:59 or 2022-12-31T23:59:59Z
      const isoDate = DateTime.make(s.endsWith("Z") ? s : `${s}Z`)
      if (isDefined(isoDate)) {
        return Effect.succeed(isoDate)
      }

      return invalidValue(s, `Invalid OData DateTime format: ${s}`)
    },
    encode: (dt) => Effect.succeed(`/Date(${DateTime.toEpochMillis(dt)})/`)
  }
)

/**
 * OData V2 DateTimeOffset schema.
 *
 * Decodes both `/Date(milliseconds+offset)/` format (V2) and ISO 8601 format (V3/V4)
 * to a DateTime.Zoned. This allows the same generated code to work with V2 and V3 services.
 * The offset represents the timezone offset from UTC.
 *
 * @since 1.0.0
 * @category V2 schemas
 */
export const ODataV2DateTimeOffset = transformOrFail(
  Schema.String,
  Schema.DateTimeZoned,
  {
    decode: (s) => {
      // Try V2 format first: /Date(millis+offset)/
      const match = s.match(V2_DATE_PATTERN)
      if (match) {
        const millis = parseInt(match[1], 10)
        const offsetMs = match[2] ? parseTimezoneOffset(match[2]) : 0
        const utc = DateTime.makeUnsafe(millis)
        const zoned = DateTime.setZone(utc, DateTime.zoneMakeOffset(offsetMs))
        return Effect.succeed(zoned)
      }

      // Try ISO 8601 format (V3/V4): 2022-12-31T23:59:59+01:00 or 2022-12-31T23:59:59Z
      const zoned = DateTime.makeZonedFromString(s)
      if (isDefined(zoned)) {
        return Effect.succeed(zoned)
      }

      // Try as UTC if no timezone specified
      const utc = DateTime.make(s.endsWith("Z") ? s : `${s}Z`)
      if (isDefined(utc)) {
        const zonedUtc = DateTime.setZone(utc, DateTime.zoneMakeOffset(0))
        return Effect.succeed(zonedUtc)
      }

      return invalidValue(s, `Invalid OData DateTimeOffset format: ${s}`)
    },
    encode: (dt) => {
      const millis = DateTime.toEpochMillis(dt)
      const offset = DateTime.zonedOffset(dt)
      if (offset === 0) {
        return Effect.succeed(`/Date(${millis})/`)
      }
      return Effect.succeed(`/Date(${millis}${formatTimezoneOffset(offset)})/`)
    }
  }
)

/**
 * OData V2 Time schema.
 *
 * OData V2 Time uses ISO 8601 duration format: PT12H30M15S
 * Decodes to an Effect Duration type.
 *
 * @example
 * ```typescript
 * // Wire format: "PT12H30M15S" (12 hours, 30 minutes, 15 seconds)
 * // Decoded: Duration representing 12h 30m 15s
 * ```
 *
 * @since 1.0.0
 * @category V2 schemas
 */
export const ODataV2Time = transformOrFail(
  Schema.String,
  Schema.Duration,
  {
    decode: (s) => {
      const duration = parseODataDuration(s)
      if (!isDefined(duration)) {
        return invalidValue(s, `Invalid OData V2 Time format: ${s}`)
      }
      return Effect.succeed(duration)
    },
    encode: (d) => Effect.succeed(formatODataDuration(d))
  }
)

// ============================================================================
// V2 Numeric Schemas
// ============================================================================

/**
 * OData V2 numeric schema for Byte, SByte, Single, Double.
 *
 * In OData V2, these numeric types are sent as strings in JSON.
 * This schema decodes them to JavaScript numbers.
 *
 * @since 1.0.0
 * @category V2 schemas
 */
export const ODataV2Number = transformOrFail(
  Schema.String,
  Schema.Number,
  {
    decode: (s) => {
      const n = parseFloat(s)
      if (isNaN(n)) {
        return invalidValue(s, `Invalid number format: ${s}`)
      }
      return Effect.succeed(n)
    },
    encode: (n) => Effect.succeed(String(n))
  }
)

// ============================================================================
// Int64 Branded Type
// ============================================================================

/**
 * Branded Int64 type that wraps BigDecimal.
 *
 * This allows distinguishing Int64 from Decimal at runtime for proper
 * URL serialization (Int64 uses 'L' suffix, Decimal uses 'M' suffix in V2).
 *
 * @since 1.0.0
 * @category models
 */
export interface Int64 {
  readonly _tag: "Int64"
  readonly value: BigDecimal.BigDecimal
}

/**
 * Int64 module for creating and checking Int64 values.
 *
 * @since 1.0.0
 * @category constructors
 */
export const Int64 = {
  /**
   * Create an Int64 from a BigDecimal value.
   */
  make: (value: BigDecimal.BigDecimal): Int64 => ({ _tag: "Int64", value }),

  /**
   * Check if a value is an Int64.
   */
  isInt64: (u: unknown): u is Int64 =>
    typeof u === "object" && u !== null && "_tag" in u && (u as { _tag: unknown })._tag === "Int64",

  /**
   * Create an Int64 from a number.
   */
  fromNumber: (n: number): Int64 => Int64.make(BigDecimal.fromNumberUnsafe(n)),

  /**
   * Create an Int64 from a string.
   */
  fromString: (s: string): Option.Option<Int64> => Option.fromNullishOr(BigDecimal.fromString(s)).pipe(Option.map(Int64.make)),

  /**
   * Create an Int64 from a bigint.
   */
  fromBigInt: (n: bigint): Int64 => Int64.make(BigDecimal.fromBigInt(n)),

  /**
   * Format an Int64 as a string.
   */
  format: (i: Int64): string => BigDecimal.format(i.value)
}

/**
 * Schema for Int64 branded type.
 *
 * @since 1.0.0
 * @category schemas
 */
const Int64Schema: Schema.Codec<Int64, Int64> = Schema.declare(Int64.isInt64)

/**
 * OData V2 Int64 schema.
 *
 * Int64 values are sent as strings in OData V2 JSON to preserve precision.
 * This schema decodes to a branded Int64 type (wrapping BigDecimal) to allow
 * proper URL serialization with the 'L' suffix.
 *
 * @since 1.0.0
 * @category V2 schemas
 */
export const ODataV2Int64 = transformOrFail(
  Schema.String,
  Int64Schema,
  {
    decode: (s) => {
      const bd = BigDecimal.fromString(s)
      if (!isDefined(bd)) {
        return invalidValue(s, `Invalid Int64 format: ${s}`)
      }
      return Effect.succeed(Int64.make(bd))
    },
    encode: (i) => Effect.succeed(BigDecimal.format(i.value))
  }
)

/**
 * OData V2 Decimal schema.
 *
 * Decimal values are sent as strings in OData V2 JSON to preserve precision.
 * This schema decodes to Effect's BigDecimal for precise arithmetic.
 *
 * @since 1.0.0
 * @category V2 schemas
 */
export const ODataV2Decimal = transformOrFail(
  Schema.String,
  Schema.BigDecimal,
  {
    decode: (s) => {
      const bd = BigDecimal.fromString(s)
      if (!isDefined(bd)) {
        return invalidValue(s, `Invalid Decimal format: ${s}`)
      }
      return Effect.succeed(bd)
    },
    encode: (bd) => Effect.succeed(BigDecimal.format(bd))
  }
)

// ============================================================================
// V4 Date/Time Schemas
// ============================================================================

/**
 * OData V4 DateTimeOffset schema.
 *
 * Decodes ISO 8601 format with timezone (e.g., "2022-12-31T23:59:59+01:00") to DateTime.Zoned.
 * For UTC times (ending in Z), creates a DateTime.Zoned with UTC offset.
 *
 * @since 1.0.0
 * @category V4 schemas
 */
export const ODataV4DateTimeOffset = transformOrFail(
  Schema.String,
  Schema.DateTimeZoned,
  {
    decode: (s) => {
      // Try parsing as zoned first (with timezone info)
      const zoned = DateTime.makeZonedFromString(s)
      if (isDefined(zoned)) {
        return Effect.succeed(zoned)
      }

      // Fall back to parsing as UTC and creating a zoned with UTC offset
      const utc = DateTime.make(s)
      if (!isDefined(utc)) {
        return invalidValue(s, `Invalid OData V4 DateTimeOffset format: ${s}`)
      }
      // Convert to zoned with UTC offset
      const zonedUtc = DateTime.setZone(utc, DateTime.zoneMakeOffset(0))
      return Effect.succeed(zonedUtc)
    },
    encode: (dt) => {
      // Format as ISO with offset
      return Effect.succeed(DateTime.formatIsoOffset(dt))
    }
  }
)

/**
 * OData V4 Date schema.
 *
 * Handles date-only format (e.g., "2022-12-31").
 * Decodes to a DateTime.Utc set to midnight UTC.
 *
 * @since 1.0.0
 * @category V4 schemas
 */
export const ODataV4Date = transformOrFail(
  Schema.String,
  Schema.DateTimeUtc,
  {
    decode: (s) => {
      const dt = DateTime.make(`${s}T00:00:00Z`)
      if (!isDefined(dt)) {
        return invalidValue(s, `Invalid OData V4 Date format: ${s}`)
      }
      return Effect.succeed(dt)
    },
    encode: (dt) => Effect.succeed(DateTime.formatIsoDate(dt))
  }
)

/**
 * OData V4 TimeOfDay schema.
 *
 * Handles time-only format (e.g., "12:30:15").
 * Kept as string since there's no native JavaScript time-only type,
 * but could be converted to Duration if needed.
 *
 * @since 1.0.0
 * @category V4 schemas
 */
export const ODataV4TimeOfDay = Schema.String

/**
 * OData V4 Duration schema.
 *
 * Handles ISO 8601 duration format (e.g., "PT12H30M15S").
 * Decodes to an Effect Duration type.
 *
 * @since 1.0.0
 * @category V4 schemas
 */
export const ODataV4Duration = transformOrFail(
  Schema.String,
  Schema.Duration,
  {
    decode: (s) => {
      const duration = parseODataDuration(s)
      if (!isDefined(duration)) {
        return invalidValue(s, `Invalid OData V4 Duration format: ${s}`)
      }
      return Effect.succeed(duration)
    },
    encode: (d) => Effect.succeed(formatODataDuration(d))
  }
)

// ============================================================================
// Common Schemas
// ============================================================================

/**
 * OData Guid schema.
 *
 * GUIDs are strings in both V2 and V4.
 *
 * @since 1.0.0
 * @category common schemas
 */
export const ODataGuid = Schema.String

/**
 * OData Binary schema.
 *
 * Binary data is base64-encoded in both V2 and V4.
 *
 * @since 1.0.0
 * @category common schemas
 */
export const ODataBinary = Schema.String
