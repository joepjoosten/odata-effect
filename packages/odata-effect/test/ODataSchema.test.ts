import { describe, expect, it } from "@effect/vitest"
import * as Schema from "effect/Schema"
import {
  ODataBinary,
  ODataGuid,
  ODataV2DateTime,
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
    it("decodes /Date(millis)/ format to Date", () => {
      const result = Schema.decodeSync(ODataV2DateTime)("/Date(1672531199000)/")
      expect(result).toBeInstanceOf(Date)
      expect(result.getTime()).toBe(1672531199000)
    })

    it("decodes /Date(millis+offset)/ format with timezone", () => {
      const result = Schema.decodeSync(ODataV2DateTime)("/Date(1672531199000+0100)/")
      expect(result).toBeInstanceOf(Date)
      expect(result.getTime()).toBe(1672531199000)
    })

    it("encodes Date to /Date(millis)/ format", () => {
      const date = new Date(1672531199000)
      const result = Schema.encodeSync(ODataV2DateTime)(date)
      expect(result).toBe("/Date(1672531199000)/")
    })

    it("handles negative timestamps (dates before 1970)", () => {
      const result = Schema.decodeSync(ODataV2DateTime)("/Date(-86400000)/")
      expect(result).toBeInstanceOf(Date)
      expect(result.getTime()).toBe(-86400000)
    })
  })

  describe("V2 Time", () => {
    it("decodes PT12H30M15S format to HH:MM:SS", () => {
      const result = Schema.decodeSync(ODataV2Time)("PT12H30M15S")
      expect(result).toBe("12:30:15")
    })

    it("decodes PT0S format", () => {
      const result = Schema.decodeSync(ODataV2Time)("PT0S")
      expect(result).toBe("00:00:00")
    })

    it("decodes partial duration (hours only)", () => {
      const result = Schema.decodeSync(ODataV2Time)("PT5H")
      expect(result).toBe("05:00:00")
    })

    it("decodes partial duration (minutes only)", () => {
      const result = Schema.decodeSync(ODataV2Time)("PT30M")
      expect(result).toBe("00:30:00")
    })

    it("encodes HH:MM:SS to duration format", () => {
      const result = Schema.encodeSync(ODataV2Time)("12:30:15")
      expect(result).toBe("PT12H30M15S")
    })

    it("passes through already formatted strings", () => {
      const result = Schema.decodeSync(ODataV2Time)("12:30:15")
      expect(result).toBe("12:30:15")
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
    it("keeps large integers as strings", () => {
      const largeInt = "9007199254740993" // Larger than Number.MAX_SAFE_INTEGER
      const result = Schema.decodeSync(ODataV2Int64)(largeInt)
      expect(result).toBe(largeInt)
    })
  })

  describe("V2 Decimal", () => {
    it("keeps decimal strings as-is", () => {
      const decimal = "123456789.123456789"
      const result = Schema.decodeSync(ODataV2Decimal)(decimal)
      expect(result).toBe(decimal)
    })
  })

  describe("V4 DateTimeOffset", () => {
    it("decodes ISO 8601 format to Date", () => {
      const result = Schema.decodeSync(ODataV4DateTimeOffset)("2022-12-31T23:59:59Z")
      expect(result).toBeInstanceOf(Date)
      expect(result.toISOString()).toBe("2022-12-31T23:59:59.000Z")
    })

    it("decodes ISO 8601 with timezone offset", () => {
      const result = Schema.decodeSync(ODataV4DateTimeOffset)("2022-12-31T23:59:59+01:00")
      expect(result).toBeInstanceOf(Date)
    })

    it("encodes Date to ISO 8601 format", () => {
      const date = new Date("2022-12-31T23:59:59.000Z")
      const result = Schema.encodeSync(ODataV4DateTimeOffset)(date)
      expect(result).toBe("2022-12-31T23:59:59.000Z")
    })
  })

  describe("V4 Date", () => {
    it("decodes date-only format to Date", () => {
      const result = Schema.decodeSync(ODataV4Date)("2022-12-31")
      expect(result).toBeInstanceOf(Date)
      expect(result.toISOString()).toBe("2022-12-31T00:00:00.000Z")
    })

    it("encodes Date to date-only format", () => {
      const date = new Date("2022-12-31T12:00:00.000Z")
      const result = Schema.encodeSync(ODataV4Date)(date)
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
    it("preserves duration format", () => {
      const result = Schema.decodeSync(ODataV4Duration)("PT12H30M15S")
      expect(result).toBe("PT12H30M15S")
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
