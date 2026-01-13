/**
 * Shared OData URL value formatting for V2 and V4.
 *
 * Used by both QueryBuilder (for $filter expressions) and Operations (for function parameters).
 * Ensures consistent formatting of values in OData URLs.
 *
 * @since 1.0.0
 */
import * as BigDecimal from "effect/BigDecimal"
import * as DateTime from "effect/DateTime"
import * as Duration from "effect/Duration"
import * as Option from "effect/Option"
import { Int64 } from "./ODataSchema.js"

// ============================================================================
// URL Value Types
// ============================================================================

/**
 * Values that can be formatted for OData URLs.
 *
 * @since 1.0.0
 * @category models
 */
export type UrlValue =
  | string
  | number
  | boolean
  | Date
  | DateTime.DateTime
  | Duration.Duration
  | Int64
  | BigDecimal.BigDecimal
  | null

// ============================================================================
// V2 URL Formatting
// ============================================================================

/**
 * Format a value for OData V2 URL (filters, function parameters).
 *
 * V2 URL formatting rules (from OData V2 spec):
 * - Edm.String: quoted → 'value'
 * - Edm.Int64: suffix "L" → 123L
 * - Edm.Single: suffix "f" → 1.1f (not commonly used, numbers work)
 * - Edm.Double: suffix "d" → 1.2d (not commonly used, numbers work)
 * - Edm.Decimal: suffix "M" → 12.22M
 * - Edm.Guid: prefix "guid" → guid'xxx...'
 * - Edm.Time: prefix "time" → time'PT12H59M10S'
 * - Edm.DateTime: prefix "datetime" → datetime'2022-12-31T23:59:59'
 * - Edm.DateTimeOffset: prefix "datetimeoffset" → datetimeoffset'2022-12-31T23:59:59Z'
 *
 * @since 1.0.0
 * @category V2
 */
export const formatV2UrlValue = (value: UrlValue): string => {
  if (value === null) {
    return "null"
  }
  if (typeof value === "string") {
    return `'${escapeString(value)}'`
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value)
  }
  if (value instanceof Date) {
    // V2 datetime format: datetime'2022-12-31T23:59:59' (no Z suffix)
    return `datetime'${value.toISOString().replace("Z", "")}'`
  }
  // Effect DateTime types
  if (DateTime.isDateTime(value)) {
    if (DateTime.isZoned(value)) {
      // DateTimeOffset uses datetimeoffset prefix with ISO format including timezone
      return `datetimeoffset'${DateTime.formatIsoOffset(value)}'`
    }
    // DateTime uses datetime prefix with ISO format without timezone
    return `datetime'${DateTime.formatIso(value).replace("Z", "")}'`
  }
  // Effect Duration type - V2 uses time prefix
  if (Duration.isDuration(value)) {
    const iso = Duration.formatIso(value)
    const formatted = Option.isSome(iso) ? iso.value : "PT0S"
    return `time'${formatted}'`
  }
  // Int64 type - uses L suffix
  if (Int64.isInt64(value)) {
    return `${Int64.format(value)}L`
  }
  // Effect BigDecimal type - uses M suffix (Decimal format)
  if (BigDecimal.isBigDecimal(value)) {
    return `${BigDecimal.format(value)}M`
  }
  return String(value)
}

/**
 * Format a GUID value for OData V2 URL.
 *
 * @since 1.0.0
 * @category V2
 */
export const formatV2Guid = (value: string): string => {
  return `guid'${value}'`
}

// ============================================================================
// V4 URL Formatting
// ============================================================================

/**
 * Format a value for OData V4 URL (filters, function parameters).
 *
 * V4 URL formatting rules (all use literal format without prefixes):
 * - Edm.String: quoted → 'value'
 * - Edm.Int64: literal → 123
 * - Edm.Decimal: literal → 12.22
 * - Edm.Duration: literal → PT12H59M10S
 * - Edm.DateTimeOffset: literal → 2022-12-31T23:59:59Z
 * - Edm.Date: literal → 2022-12-31
 *
 * @since 1.0.0
 * @category V4
 */
export const formatV4UrlValue = (value: UrlValue): string => {
  if (value === null) {
    return "null"
  }
  if (typeof value === "string") {
    return `'${escapeString(value)}'`
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value)
  }
  if (value instanceof Date) {
    return value.toISOString()
  }
  // Effect DateTime types - V4 uses ISO 8601 literal format
  if (DateTime.isDateTime(value)) {
    if (DateTime.isZoned(value)) {
      return DateTime.formatIsoOffset(value)
    }
    return DateTime.formatIso(value)
  }
  // Effect Duration type - V4 uses literal ISO 8601 duration format (no prefix)
  if (Duration.isDuration(value)) {
    const iso = Duration.formatIso(value)
    return Option.isSome(iso) ? iso.value : "PT0S"
  }
  // Int64 type - V4 uses literal format (no suffix)
  if (Int64.isInt64(value)) {
    return Int64.format(value)
  }
  // Effect BigDecimal type - V4 uses literal format (no suffix)
  if (BigDecimal.isBigDecimal(value)) {
    return BigDecimal.format(value)
  }
  return String(value)
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Escape a string for use in OData URL.
 * Single quotes are escaped by doubling them.
 *
 * @since 1.0.0
 * @category utils
 */
export const escapeString = (value: string): string => {
  return value.replace(/'/g, "''")
}

/**
 * URL encode a string value (for query parameters).
 *
 * @since 1.0.0
 * @category utils
 */
export const encodeUrlValue = (value: string): string => {
  return encodeURIComponent(value)
}
