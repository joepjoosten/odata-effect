import { describe, expect, it } from "@effect/vitest"
import * as Effect from "effect/Effect"
import * as fs from "node:fs"
import * as path from "node:path"
import { parseODataMetadata } from "../../src/parser/XmlParser.js"
import { detectODataVersion } from "../../src/parser/EdmxSchema.js"

const resourceDir = path.resolve(__dirname, "../resource")

describe("XmlParser", () => {
  describe("parseODataMetadata", () => {
    it("parses V2 metadata successfully", () =>
      Effect.gen(function* () {
        const xmlContent = fs.readFileSync(
          path.join(resourceDir, "odata-v2.xml"),
          "utf-8"
        )
        const result = yield* parseODataMetadata(xmlContent)

        expect(result["edmx:Edmx"]).toBeDefined()
        expect(result["edmx:Edmx"].$.Version).toBe("1.0")
        expect(detectODataVersion(result)).toBe("V2")

        const schema = result["edmx:Edmx"]["edmx:DataServices"][0].Schema[0]
        expect(schema.$.Namespace).toBe("ODataDemo")
        expect(schema.EntityType).toHaveLength(3)
        expect(schema.ComplexType).toHaveLength(1)
      }))

    it("parses V4 metadata successfully", () =>
      Effect.gen(function* () {
        const xmlContent = fs.readFileSync(
          path.join(resourceDir, "trippin.xml"),
          "utf-8"
        )
        const result = yield* parseODataMetadata(xmlContent)

        expect(result["edmx:Edmx"]).toBeDefined()
        expect(result["edmx:Edmx"].$.Version).toBe("4.0")
        expect(detectODataVersion(result)).toBe("V4")

        const schema = result["edmx:Edmx"]["edmx:DataServices"][0].Schema[0]
        expect(schema.$.Namespace).toBe("Trippin")
        expect(schema.EnumType).toHaveLength(2)
        expect(schema.Function).toBeDefined()
        expect(schema.Action).toBeDefined()
      }))

    it("fails on invalid XML", () =>
      Effect.gen(function* () {
        const result = yield* parseODataMetadata("not valid xml").pipe(
          Effect.flip
        )

        expect(result._tag).toBe("XmlParseError")
      }))
  })
})
