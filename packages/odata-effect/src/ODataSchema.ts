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
import * as Option from "effect/Option"
import * as ParseResult from "effect/ParseResult"
import * as Schema from "effect/Schema"

// ============================================================================
// V2 Date/Time Schemas
// ============================================================================

/**
 * Regex pattern for OData V2 DateTime format: /Date(millis)/
 * Also handles optional timezone offset: /Date(millis+0000)/ or /Date(millis-0000)/
 */
const V2_DATE_PATTERN = /^\/Date\((-?\d+)([+-]\d{4})?\)\/$/

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

/**
 * OData V2 DateTime schema.
 *
 * Decodes the OData V2 `/Date(milliseconds)/` format to a DateTime.Utc.
 * Encodes DateTime.Utc back to the `/Date(milliseconds)/` format.
 *
 * @example
 * ```typescript
 * // Wire format: "/Date(1672531199000)/"
 * // Decoded: DateTime.Utc representing 2022-12-31T23:59:59.000Z
 * ```
 *
 * @since 1.0.0
 * @category V2 schemas
 */
export const ODataV2DateTime = Schema.transformOrFail(
  Schema.String,
  Schema.DateTimeUtcFromSelf,
  {
    strict: true,
    decode: (s, _, ast) => {
      const match = s.match(V2_DATE_PATTERN)
      if (!match) {
        return ParseResult.fail(new ParseResult.Type(ast, s, `Invalid OData V2 DateTime format: ${s}`))
      }
      const millis = parseInt(match[1], 10)
      return ParseResult.succeed(DateTime.unsafeMake(millis))
    },
    encode: (dt) => ParseResult.succeed(`/Date(${DateTime.toEpochMillis(dt)})/`)
  }
)

/**
 * OData V2 DateTimeOffset schema.
 *
 * Decodes `/Date(milliseconds+offset)/` format to a DateTime.Zoned.
 * The offset represents the timezone offset from UTC.
 *
 * @since 1.0.0
 * @category V2 schemas
 */
export const ODataV2DateTimeOffset = Schema.transformOrFail(
  Schema.String,
  Schema.DateTimeZonedFromSelf,
  {
    strict: true,
    decode: (s, _, ast) => {
      const match = s.match(V2_DATE_PATTERN)
      if (!match) {
        return ParseResult.fail(new ParseResult.Type(ast, s, `Invalid OData V2 DateTimeOffset format: ${s}`))
      }
      const millis = parseInt(match[1], 10)
      const offsetMs = match[2] ? parseTimezoneOffset(match[2]) : 0
      const utc = DateTime.unsafeMake(millis)
      const zoned = DateTime.setZone(utc, DateTime.zoneMakeOffset(offsetMs))
      return ParseResult.succeed(zoned)
    },
    encode: (dt) => {
      const millis = DateTime.toEpochMillis(dt)
      const offset = DateTime.zonedOffset(dt)
      if (offset === 0) {
        return ParseResult.succeed(`/Date(${millis})/`)
      }
      return ParseResult.succeed(`/Date(${millis}${formatTimezoneOffset(offset)})/`)
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
export const ODataV2Time = Schema.transformOrFail(
  Schema.String,
  Schema.DurationFromSelf,
  {
    strict: true,
    decode: (s, _, ast) => {
      const duration = Duration.fromIso(s)
      if (Option.isNone(duration)) {
        return ParseResult.fail(new ParseResult.Type(ast, s, `Invalid OData V2 Time format: ${s}`))
      }
      return ParseResult.succeed(duration.value)
    },
    encode: (d) => {
      const iso = Duration.formatIso(d)
      if (Option.isNone(iso)) {
        // Infinite duration - return a reasonable fallback
        return ParseResult.succeed("PT0S")
      }
      return ParseResult.succeed(iso.value)
    }
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
export const ODataV2Number = Schema.transformOrFail(
  Schema.String,
  Schema.Number,
  {
    strict: true,
    decode: (s, _, ast) => {
      const n = parseFloat(s)
      if (isNaN(n)) {
        return ParseResult.fail(new ParseResult.Type(ast, s, `Invalid number format: ${s}`))
      }
      return ParseResult.succeed(n)
    },
    encode: (n) => ParseResult.succeed(String(n))
  }
)

/**
 * OData V2 Int64 schema.
 *
 * Int64 values are sent as strings in OData V2 JSON to preserve precision.
 * This schema decodes to Effect's BigDecimal for precise arithmetic.
 *
 * @since 1.0.0
 * @category V2 schemas
 */
export const ODataV2Int64 = Schema.transformOrFail(
  Schema.String,
  Schema.BigDecimalFromSelf,
  {
    strict: true,
    decode: (s, _, ast) => {
      const bd = BigDecimal.fromString(s)
      if (Option.isNone(bd)) {
        return ParseResult.fail(new ParseResult.Type(ast, s, `Invalid Int64 format: ${s}`))
      }
      return ParseResult.succeed(bd.value)
    },
    encode: (bd) => ParseResult.succeed(BigDecimal.format(bd))
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
export const ODataV2Decimal = Schema.transformOrFail(
  Schema.String,
  Schema.BigDecimalFromSelf,
  {
    strict: true,
    decode: (s, _, ast) => {
      const bd = BigDecimal.fromString(s)
      if (Option.isNone(bd)) {
        return ParseResult.fail(new ParseResult.Type(ast, s, `Invalid Decimal format: ${s}`))
      }
      return ParseResult.succeed(bd.value)
    },
    encode: (bd) => ParseResult.succeed(BigDecimal.format(bd))
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
export const ODataV4DateTimeOffset = Schema.transformOrFail(
  Schema.String,
  Schema.DateTimeZonedFromSelf,
  {
    strict: true,
    decode: (s, _, ast) => {
      // Try parsing as zoned first (with timezone info)
      const zoned = DateTime.makeZonedFromString(s)
      if (Option.isSome(zoned)) {
        return ParseResult.succeed(zoned.value)
      }

      // Fall back to parsing as UTC and creating a zoned with UTC offset
      const utc = DateTime.make(s)
      if (Option.isNone(utc)) {
        return ParseResult.fail(new ParseResult.Type(ast, s, `Invalid OData V4 DateTimeOffset format: ${s}`))
      }
      // Convert to zoned with UTC offset
      const zonedUtc = DateTime.setZone(utc.value, DateTime.zoneMakeOffset(0))
      return ParseResult.succeed(zonedUtc)
    },
    encode: (dt) => {
      // Format as ISO with offset
      return ParseResult.succeed(DateTime.formatIsoOffset(dt))
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
export const ODataV4Date = Schema.transformOrFail(
  Schema.String,
  Schema.DateTimeUtcFromSelf,
  {
    strict: true,
    decode: (s, _, ast) => {
      const dt = DateTime.make(`${s}T00:00:00Z`)
      if (Option.isNone(dt)) {
        return ParseResult.fail(new ParseResult.Type(ast, s, `Invalid OData V4 Date format: ${s}`))
      }
      return ParseResult.succeed(dt.value)
    },
    encode: (dt) => ParseResult.succeed(DateTime.formatIsoDate(dt))
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
export const ODataV4Duration = Schema.transformOrFail(
  Schema.String,
  Schema.DurationFromSelf,
  {
    strict: true,
    decode: (s, _, ast) => {
      const duration = Duration.fromIso(s)
      if (Option.isNone(duration)) {
        return ParseResult.fail(new ParseResult.Type(ast, s, `Invalid OData V4 Duration format: ${s}`))
      }
      return ParseResult.succeed(duration.value)
    },
    encode: (d) => {
      const iso = Duration.formatIso(d)
      if (Option.isNone(iso)) {
        return ParseResult.succeed("PT0S")
      }
      return ParseResult.succeed(iso.value)
    }
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
