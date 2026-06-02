import { describe, expect, it } from "@effect/vitest"
import * as Effect from "effect/Effect"
import * as fs from "node:fs"
import * as path from "node:path"
import { digestMetadata } from "../../src/digester/Digester.js"
import { generateNavigations } from "../../src/generator/NavigationGenerator.js"
import { parseODataMetadata } from "../../src/parser/XmlParser.js"

const resourceDir = path.resolve(__dirname, "../resource")

describe("V4 Navigation Generation", () => {
  it("generates tree-shakable PathBuilders", () =>
    Effect.gen(function*() {
      const xmlContent = fs.readFileSync(
        path.join(resourceDir, "trippin.xml"),
        "utf-8"
      )
      const edmx = yield* parseODataMetadata(xmlContent)
      const dataModel = yield* digestMetadata(edmx)

      // Generate navigation builders
      const navResult = generateNavigations(dataModel, { esmExtensions: false })

      // Should generate a single PathBuilders.ts file
      expect(navResult.navigationFiles.length).toBe(1)
      expect(navResult.navigationFiles[0].fileName).toBe("PathBuilders.ts")

      const content = navResult.navigationFiles[0].content

      // Check Path branded type
      expect(content).toContain("export type Path<TEntity, IsCollection extends boolean = false>")
      expect(content).toContain("readonly _entity: TEntity")
      expect(content).toContain("readonly _collection: IsCollection")
      expect(content).toContain("export interface PathWithQueryOptions<TEntity, IsCollection extends boolean = false>")
      expect(content).toContain("export type PathInput<TEntity, IsCollection extends boolean = false>")

      // Check entity set roots (PascalCase, types use Model suffix)
      expect(content).toContain("export const People: Path<PersonModel, true> = \"People\"")
      expect(content).toContain("export const Airlines: Path<AirlineModel, true> = \"Airlines\"")
      expect(content).toContain("export const Airports: Path<AirportModel, true> = \"Airports\"")

      // Check byKey function
      expect(content).toContain("export const byKey = <T>(key: string | number)")
      expect(content).toContain("(base: Path<T, true>): Path<T, false>")
      expect(content).toContain("export const withQueryOptions = (")
      expect(content).toContain("<T, IsCollection extends boolean>(path: Path<T, IsCollection>)")

      // Check navigation property functions (flat exports with Model suffix)
      expect(content).toContain("export const trips = (base: Path<PersonModel, false>): Path<TripModel, true>")
      expect(content).toContain("export const bestFriend = (base: Path<PersonModel, false>): Path<PersonModel, false>")
      expect(content).toContain("export const friends = (base: Path<PersonModel, false>): Path<PersonModel, true>")
      expect(content).toContain("export const planItems = (base: Path<TripModel, false>): Path<PlanItemModel, true>")

      // Check type casting functions (with Model suffix)
      expect(content).toContain("export const asFlight = (base: Path<PlanItemModel, true>): Path<FlightModel, true>")
      expect(content).toContain("export const asEvent = (base: Path<PlanItemModel, true>): Path<EventModel, true>")

      // Check terminal operations
      expect(content).toContain("export const fetchCollection = <T, I, R = never>(schema: Schema.Codec<T, I, R>)")
      expect(content).toContain("export const fetchOne = <T, I, R = never>(schema: Schema.Codec<T, I, R>)")
      expect(content).toContain("(input: PathInput<T, true>, options?: ODataV4.ODataV4QueryOptions)")
      expect(content).toContain("(input: PathInput<T, false>, options?: ODataV4.ODataV4QueryOptions)")
      expect(content).toContain(
        "return ODataV4.getCollection(resolved.path, schema, mergeQueryOptions(resolved.options, options))"
      )
      expect(content).toContain(
        "return ODataV4.get(resolved.path, schema, mergeQueryOptions(resolved.options, options))"
      )

      // Check Model suffix imports to avoid collision with entity set names
      expect(content).toContain("Person as PersonModel")
      expect(content).toContain("Trip as TripModel")
      expect(content).toContain("Flight as FlightModel")

      // Write generated code for inspection
      const outputPath = "/tmp/generated-PathBuilders.ts"
      fs.writeFileSync(outputPath, content)
      console.log(`Wrote generated file to: ${outputPath}`)
    }))

  it("handles derived types and type casting correctly", () =>
    Effect.gen(function*() {
      const xmlContent = fs.readFileSync(
        path.join(resourceDir, "trippin.xml"),
        "utf-8"
      )
      const edmx = yield* parseODataMetadata(xmlContent)
      const dataModel = yield* digestMetadata(edmx)

      const navResult = generateNavigations(dataModel, { esmExtensions: false })
      const content = navResult.navigationFiles[0].content

      // Flight derives from PublicTransportation which derives from PlanItem
      // Should have type casting methods for the hierarchy
      expect(content).toContain("asFlight")
      expect(content).toContain("asEvent")
      expect(content).toContain("asPublicTransportation")

      // Employee and Manager derive from Person
      expect(content).toContain("asEmployee")
      expect(content).toContain("asManager")

      // Check the cast path format
      expect(content).toContain("Trippin.Flight")
      expect(content).toContain("Trippin.Employee")
    }))

  it("detects and handles navigation property name collisions", () =>
    Effect.gen(function*() {
      const xmlContent = fs.readFileSync(
        path.join(resourceDir, "trippin.xml"),
        "utf-8"
      )
      const edmx = yield* parseODataMetadata(xmlContent)
      const dataModel = yield* digestMetadata(edmx)

      const navResult = generateNavigations(dataModel, { esmExtensions: false })
      const content = navResult.navigationFiles[0].content

      // Navigation properties should be flat exports
      // No collisions in TripPin, so names should be simple
      expect(content).toContain("export const trips =")
      expect(content).toContain("export const planItems =")
      expect(content).toContain("export const airline =")
    }))
})
