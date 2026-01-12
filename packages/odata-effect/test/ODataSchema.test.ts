import { describe, expect, it } from "@effect/vitest"
import * as BigDecimal from "effect/BigDecimal"
import * as DateTime from "effect/DateTime"
import * as Duration from "effect/Duration"
import * as Schema from "effect/Schema"
import {
  ODataBinary,
  ODataGuid,
  ODataV2DateTime,
  ODataV2DateTimeOffset,
  ODataV2Decimal,
  ODataV2Int64,
  ODataV2Number,
  ODataV2Time,
  ODataV4Date,
  ODataV4DateTimeOffset,
  ODataV4Duration,
  ODataV4TimeOfDay
} from "../src/ODataSchema.js"

describe("ODataSchema", () => {
  describe("V2 DateTime", () => {
    it("decodes /Date(millis)/ format to DateTime.Utc", () => {
      const result = Schema.decodeSync(ODataV2DateTime)("/Date(1672531199000)/")
      expect(DateTime.isDateTime(result)).toBe(true)
      expect(DateTime.toEpochMillis(result)).toBe(1672531199000)
    })

    it("decodes /Date(millis+offset)/ format with timezone", () => {
      const result = Schema.decodeSync(ODataV2DateTime)("/Date(1672531199000+0100)/")
      expect(DateTime.isDateTime(result)).toBe(true)
      expect(DateTime.toEpochMillis(result)).toBe(1672531199000)
    })

    it("encodes DateTime.Utc to /Date(millis)/ format", () => {
      const dt = DateTime.unsafeMake(1672531199000)
      const result = Schema.encodeSync(ODataV2DateTime)(dt)
      expect(result).toBe("/Date(1672531199000)/")
    })

    it("handles negative timestamps (dates before 1970)", () => {
      const result = Schema.decodeSync(ODataV2DateTime)("/Date(-86400000)/")
      expect(DateTime.isDateTime(result)).toBe(true)
      expect(DateTime.toEpochMillis(result)).toBe(-86400000)
    })
  })

  describe("V2 DateTimeOffset", () => {
    it("decodes /Date(millis+offset)/ format to DateTime.Zoned", () => {
      const result = Schema.decodeSync(ODataV2DateTimeOffset)("/Date(1672531199000+0530)/")
      expect(DateTime.isDateTime(result)).toBe(true)
      expect(DateTime.isZoned(result)).toBe(true)
    })

    it("encodes DateTime.Zoned to /Date(millis+offset)/ format", () => {
      const utc = DateTime.unsafeMake(1672531199000)
      const zoned = DateTime.setZone(utc, DateTime.zoneMakeOffset(5.5 * 60 * 60 * 1000))
      const result = Schema.encodeSync(ODataV2DateTimeOffset)(zoned)
      expect(result).toBe("/Date(1672531199000+0530)/")
    })
  })

  describe("V2 Time", () => {
    it("decodes PT12H30M15S format to Duration", () => {
      const result = Schema.decodeSync(ODataV2Time)("PT12H30M15S")
      expect(Duration.isDuration(result)).toBe(true)
      expect(Duration.toMillis(result)).toBe((12 * 60 + 30) * 60 * 1000 + 15 * 1000)
    })

    it("decodes PT0S format", () => {
      const result = Schema.decodeSync(ODataV2Time)("PT0S")
      expect(Duration.isDuration(result)).toBe(true)
      expect(Duration.toMillis(result)).toBe(0)
    })

    it("decodes partial duration (hours only)", () => {
      const result = Schema.decodeSync(ODataV2Time)("PT5H")
      expect(Duration.isDuration(result)).toBe(true)
      expect(Duration.toMillis(result)).toBe(5 * 60 * 60 * 1000)
    })

    it("encodes Duration to ISO format", () => {
      const duration = Duration.hours(12)
      const result = Schema.encodeSync(ODataV2Time)(duration)
      expect(result).toBe("PT12H")
    })
  })

  describe("V2 Number", () => {
    it("decodes string to number", () => {
      const result = Schema.decodeSync(ODataV2Number)("123.45")
      expect(result).toBe(123.45)
    })

    it("decodes integer string to number", () => {
      const result = Schema.decodeSync(ODataV2Number)("42")
      expect(result).toBe(42)
    })

    it("encodes number to string", () => {
      const result = Schema.encodeSync(ODataV2Number)(123.45)
      expect(result).toBe("123.45")
    })

    it("handles negative numbers", () => {
      const result = Schema.decodeSync(ODataV2Number)("-99.5")
      expect(result).toBe(-99.5)
    })
  })

  describe("V2 Int64", () => {
    it("decodes to BigDecimal for precision", () => {
      const largeInt = "9007199254740993" // Larger than Number.MAX_SAFE_INTEGER
      const result = Schema.decodeSync(ODataV2Int64)(largeInt)
      expect(BigDecimal.isBigDecimal(result)).toBe(true)
      expect(BigDecimal.format(result)).toBe("9007199254740993")
    })

    it("encodes BigDecimal to string", () => {
      const bd = BigDecimal.unsafeFromString("9007199254740993")
      const result = Schema.encodeSync(ODataV2Int64)(bd)
      expect(result).toBe("9007199254740993")
    })
  })

  describe("V2 Decimal", () => {
    it("decodes to BigDecimal for precision", () => {
      const decimal = "123456789.123456789"
      const result = Schema.decodeSync(ODataV2Decimal)(decimal)
      expect(BigDecimal.isBigDecimal(result)).toBe(true)
    })

    it("encodes BigDecimal to string", () => {
      const bd = BigDecimal.unsafeFromString("123.456")
      const result = Schema.encodeSync(ODataV2Decimal)(bd)
      expect(result).toBe("123.456")
    })
  })

  describe("V4 DateTimeOffset", () => {
    it("decodes ISO 8601 format to DateTime.Zoned", () => {
      const result = Schema.decodeSync(ODataV4DateTimeOffset)("2022-12-31T23:59:59Z")
      expect(DateTime.isDateTime(result)).toBe(true)
      expect(DateTime.isZoned(result)).toBe(true)
    })

    it("decodes ISO 8601 with timezone offset", () => {
      const result = Schema.decodeSync(ODataV4DateTimeOffset)("2022-12-31T23:59:59+01:00")
      expect(DateTime.isDateTime(result)).toBe(true)
      expect(DateTime.isZoned(result)).toBe(true)
    })

    it("encodes DateTime.Zoned to ISO 8601 format", () => {
      const utc = DateTime.unsafeMake("2022-12-31T23:59:59Z")
      const zoned = DateTime.setZone(utc, DateTime.zoneMakeOffset(0))
      const result = Schema.encodeSync(ODataV4DateTimeOffset)(zoned)
      expect(result).toContain("2022-12-31")
    })
  })

  describe("V4 Date", () => {
    it("decodes date-only format to DateTime.Utc", () => {
      const result = Schema.decodeSync(ODataV4Date)("2022-12-31")
      expect(DateTime.isDateTime(result)).toBe(true)
      expect(DateTime.formatIsoDate(result)).toBe("2022-12-31")
    })

    it("encodes DateTime.Utc to date-only format", () => {
      const dt = DateTime.unsafeMake("2022-12-31T12:00:00Z")
      const result = Schema.encodeSync(ODataV4Date)(dt)
      expect(result).toBe("2022-12-31")
    })
  })

  describe("V4 TimeOfDay", () => {
    it("preserves time-only format", () => {
      const result = Schema.decodeSync(ODataV4TimeOfDay)("12:30:15")
      expect(result).toBe("12:30:15")
    })
  })

  describe("V4 Duration", () => {
    it("decodes ISO duration to Effect Duration", () => {
      const result = Schema.decodeSync(ODataV4Duration)("PT12H30M15S")
      expect(Duration.isDuration(result)).toBe(true)
      expect(Duration.toMillis(result)).toBe((12 * 60 + 30) * 60 * 1000 + 15 * 1000)
    })

    it("encodes Duration to ISO format", () => {
      const duration = Duration.minutes(90)
      const result = Schema.encodeSync(ODataV4Duration)(duration)
      // Duration.formatIso returns "PT1H30M" for 90 minutes (T is time designator)
      expect(result).toBe("PT1H30M")
    })
  })

  describe("Common schemas", () => {
    it("ODataGuid preserves GUID strings", () => {
      const guid = "550e8400-e29b-41d4-a716-446655440000"
      const result = Schema.decodeSync(ODataGuid)(guid)
      expect(result).toBe(guid)
    })

    it("ODataBinary preserves base64 strings", () => {
      const binary = "SGVsbG8gV29ybGQ="
      const result = Schema.decodeSync(ODataBinary)(binary)
      expect(result).toBe(binary)
    })
  })
})
