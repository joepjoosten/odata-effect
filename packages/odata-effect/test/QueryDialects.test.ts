import { expect, it } from "@effect/vitest"
import * as BigDecimal from "effect/BigDecimal"
import * as Duration from "effect/Duration"
import { Int64 } from "../src/ODataSchema.js"
import {
  BigDecimalPath,
  CollectionPath,
  DateTimePath,
  DurationPath,
  Int64Path,
  StringPath
} from "../src/QueryBuilder.js"

it("serializes declared V2 and V4 literals and string functions", () => {
  const date = new Date("2024-01-01T00:00:00Z")
  const guid = "01234567-89ab-cdef-0123-456789abcdef"
  expect(new DateTimePath("D", { version: "V4", edmType: "Edm.Date" }).eq(date).toString()).toBe("D eq 2024-01-01")
  expect(new DateTimePath("D", { version: "V4", edmType: "Edm.DateTimeOffset" }).eq(date).toString())
    .toBe("D eq 2024-01-01T00:00:00.000Z")
  expect(new DateTimePath("D", { version: "V2", edmType: "Edm.DateTimeOffset" }).eq(date).toString())
    .toBe("D eq datetimeoffset'2024-01-01T00:00:00.000Z'")
  for (const version of ["V2", "V4"] as const) {
    expect(new StringPath("G", { version, edmType: "Edm.Guid" }).eq(guid).toString())
      .toBe(version === "V2" ? `G eq guid'${guid}'` : `G eq ${guid}`)
    expect(new DurationPath("D", { version }).eq(Duration.seconds(1)).toString())
      .toBe(version === "V2" ? "D eq time'PT1S'" : "D eq duration'PT1S'")
    expect(new BigDecimalPath("N", { version }).eq(BigDecimal.fromNumberUnsafe(12)).toString())
      .toBe(version === "V2" ? "N eq 12M" : "N eq 12")
    expect(new Int64Path("N", { version }).eq(Int64.fromNumber(123)).toString())
      .toBe(version === "V2" ? "N eq 123L" : "N eq 123")
  }
  expect(new StringPath("Name", { version: "V2" }).toLower().contains("O'Neil").toString())
    .toBe("substringof('O''Neil',tolower(Name))")
  expect(new StringPath("Name", { version: "V4" }).contains("x").toString()).toBe("contains(Name,'x')")
})

it("rejects unsupported V2 lambdas and preserves scalar metadata inside V4 lambdas", () => {
  const entity = () => ({ date: new DateTimePath("Date", { version: "V4", edmType: "Edm.Date" }) })
  expect(() => new CollectionPath("Items", entity, { version: "V2" }).any((q) => q.date.isNull())).toThrow("V4")
  expect(
    new CollectionPath("Items", entity, { version: "V4" }).any((q) => q.date.eq(new Date("2024-01-01Z"))).toString()
  )
    .toBe("Items/any(a:a/Date eq 2024-01-01)")
})
