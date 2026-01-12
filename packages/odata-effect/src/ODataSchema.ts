/**
 * OData-specific Effect Schema types for proper encoding/decoding of OData wire formats.
 *
 * OData V2 and V4 have different wire formats for dates, times, and numbers.
 * These schemas handle the transformation between wire format and JavaScript types.
 *
 * @since 1.0.0
 * @see https://odata2ts.github.io/docs/odata/odata-types
 */
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
 * OData V2 DateTime schema.
 *
 * Decodes the OData V2 `/Date(milliseconds)/` format to a JavaScript Date.
 * Encodes JavaScript Dates back to the `/Date(milliseconds)/` format.
 *
 * @example
 * ```typescript
 * // Wire format: "/Date(1672531199000)/"
 * // Decoded: Date object representing 2022-12-31T23:59:59.000Z
 * ```
 *
 * @since 1.0.0
 * @category V2 schemas
 */
export const ODataV2DateTime = Schema.transform(
  Schema.String,
  Schema.DateFromSelf,
  {
    strict: true,
    decode: (s) => {
      const match = s.match(V2_DATE_PATTERN)
      if (!match) {
        throw new Error(`Invalid OData V2 DateTime format: ${s}`)
      }
      const millis = parseInt(match[1], 10)
      return new Date(millis)
    },
    encode: (d) => `/Date(${d.getTime()})/`
  }
)

/**
 * OData V2 DateTimeOffset schema.
 *
 * Same as DateTime for JSON responses, but may include timezone offset.
 * Decodes `/Date(milliseconds+offset)/` format to a JavaScript Date.
 *
 * @since 1.0.0
 * @category V2 schemas
 */
export const ODataV2DateTimeOffset = ODataV2DateTime

/**
 * OData V2 Time schema.
 *
 * OData V2 Time uses ISO 8601 duration format: PT12H30M15S
 * Decodes to a string representation of the time.
 *
 * @example
 * ```typescript
 * // Wire format: "PT12H30M15S" (12 hours, 30 minutes, 15 seconds)
 * // Decoded: "12:30:15"
 * ```
 *
 * @since 1.0.0
 * @category V2 schemas
 */
export const ODataV2Time = Schema.transform(
  Schema.String,
  Schema.String,
  {
    strict: true,
    decode: (s) => {
      // Parse PT12H30M15S format
      const match = s.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?$/)
      if (!match) {
        // Already in HH:MM:SS format or other format, return as-is
        return s
      }
      const hours = match[1] ? match[1].padStart(2, "0") : "00"
      const minutes = match[2] ? match[2].padStart(2, "0") : "00"
      const seconds = match[3] ? parseFloat(match[3]).toFixed(0).padStart(2, "0") : "00"
      return `${hours}:${minutes}:${seconds}`
    },
    encode: (s) => {
      // Parse HH:MM:SS format
      const match = s.match(/^(\d{2}):(\d{2}):(\d{2})$/)
      if (!match) {
        // Already in duration format or other format, return as-is
        return s
      }
      const hours = parseInt(match[1], 10)
      const minutes = parseInt(match[2], 10)
      const seconds = parseInt(match[3], 10)
      let result = "PT"
      if (hours > 0) result += `${hours}H`
      if (minutes > 0) result += `${minutes}M`
      if (seconds > 0) result += `${seconds}S`
      return result || "PT0S"
    }
  }
)

// ============================================================================
// V2 Numeric Schemas (string on wire, number in TypeScript)
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
export const ODataV2Number = Schema.transform(
  Schema.String,
  Schema.Number,
  {
    strict: true,
    decode: (s) => {
      const n = parseFloat(s)
      if (isNaN(n)) {
        throw new Error(`Invalid number format: ${s}`)
      }
      return n
    },
    encode: (n) => String(n)
  }
)

/**
 * OData V2 Int64 schema.
 *
 * Int64 values are sent as strings in OData V2 JSON to preserve precision.
 * This schema keeps them as strings to avoid JavaScript number precision issues.
 *
 * @since 1.0.0
 * @category V2 schemas
 */
export const ODataV2Int64 = Schema.String

/**
 * OData V2 Decimal schema.
 *
 * Decimal values are sent as strings in OData V2 JSON to preserve precision.
 * This schema keeps them as strings to avoid JavaScript number precision issues.
 *
 * @since 1.0.0
 * @category V2 schemas
 */
export const ODataV2Decimal = Schema.String

// ============================================================================
// V4 Date/Time Schemas
// ============================================================================

/**
 * OData V4 DateTimeOffset schema.
 *
 * Decodes ISO 8601 format (e.g., "2022-12-31T23:59:59Z") to a JavaScript Date.
 *
 * @since 1.0.0
 * @category V4 schemas
 */
export const ODataV4DateTimeOffset = Schema.transform(
  Schema.String,
  Schema.DateFromSelf,
  {
    strict: true,
    decode: (s) => new Date(s),
    encode: (d) => d.toISOString()
  }
)

/**
 * OData V4 Date schema.
 *
 * Handles date-only format (e.g., "2022-12-31").
 * Decodes to a Date object set to midnight UTC.
 *
 * @since 1.0.0
 * @category V4 schemas
 */
export const ODataV4Date = Schema.transform(
  Schema.String,
  Schema.DateFromSelf,
  {
    strict: true,
    decode: (s) => new Date(`${s}T00:00:00Z`),
    encode: (d) => d.toISOString().split("T")[0]
  }
)

/**
 * OData V4 TimeOfDay schema.
 *
 * Handles time-only format (e.g., "12:30:15").
 * Kept as string since there's no native JavaScript time-only type.
 *
 * @since 1.0.0
 * @category V4 schemas
 */
export const ODataV4TimeOfDay = Schema.String

/**
 * OData V4 Duration schema.
 *
 * Handles ISO 8601 duration format (e.g., "PT12H30M15S").
 * Kept as string for flexibility.
 *
 * @since 1.0.0
 * @category V4 schemas
 */
export const ODataV4Duration = Schema.String

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
