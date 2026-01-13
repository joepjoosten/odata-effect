import { describe, expect, it } from "@effect/vitest"
import * as Effect from "effect/Effect"
import * as fs from "node:fs"
import * as path from "node:path"
import { digestMetadata } from "../../src/digester/Digester.js"
import { generateModels } from "../../src/generator/ModelsGenerator.js"
import { generateQueryModels } from "../../src/generator/QueryModelsGenerator.js"
import type { NamingOverrides } from "../../src/model/GeneratorConfig.js"
import { parseODataMetadata } from "../../src/parser/XmlParser.js"

const resourceDir = path.resolve(__dirname, "../resource")

describe("NamingOverrides Integration", () => {
  it("flows through to Models generation with fromKey mapping", () =>
    Effect.gen(function*() {
      const xmlContent = fs.readFileSync(
        path.join(resourceDir, "odata-v2.xml"),
        "utf-8"
      )
      const overrides: NamingOverrides = {
        properties: {
          ID: "id" // Override ID -> id (not iD)
        },
        entities: {
          Product: {
            properties: {
              ReleaseDate: "releaseDate"
            }
          }
        }
      }

      const edmx = yield* parseODataMetadata(xmlContent)
      const dataModel = yield* digestMetadata(edmx, overrides)
      const modelsOutput = generateModels(dataModel)

      // Should use fromKey for ID -> id mapping
      expect(modelsOutput).toContain("id: Schema.propertySignature(Schema.Number).pipe(Schema.fromKey(\"ID\"))")

      // Should use fromKey for ReleaseDate -> releaseDate mapping
      expect(modelsOutput).toContain("Schema.fromKey(\"ReleaseDate\")")
    }))

  it("flows through to QueryModels generation", () =>
    Effect.gen(function*() {
      const xmlContent = fs.readFileSync(
        path.join(resourceDir, "odata-v2.xml"),
        "utf-8"
      )
      const overrides: NamingOverrides = {
        properties: {
          ID: "id"
        }
      }

      const edmx = yield* parseODataMetadata(xmlContent)
      const dataModel = yield* digestMetadata(edmx, overrides)
      const queryModelsOutput = generateQueryModels(dataModel, { esmExtensions: false })

      // Interface should use TypeScript name (id)
      expect(queryModelsOutput).toContain("readonly id:")

      // Instance should use TypeScript name as key but OData name in path
      expect(queryModelsOutput).toContain("id: new NumberPath(\"ID\")")
    }))

  it("preserves OData names in query paths while using TypeScript names for keys", () =>
    Effect.gen(function*() {
      const xmlContent = fs.readFileSync(
        path.join(resourceDir, "odata-v2.xml"),
        "utf-8"
      )
      const overrides: NamingOverrides = {
        entities: {
          Product: {
            properties: {
              Name: "productName",
              Description: "productDescription"
            }
          }
        }
      }

      const edmx = yield* parseODataMetadata(xmlContent)
      const dataModel = yield* digestMetadata(edmx, overrides)
      const queryModelsOutput = generateQueryModels(dataModel, { esmExtensions: false })

      // Interface should use overridden TypeScript names
      expect(queryModelsOutput).toContain("readonly productName:")
      expect(queryModelsOutput).toContain("readonly productDescription:")

      // Instance should use TypeScript names as keys but original OData names in paths
      expect(queryModelsOutput).toContain("productName: new StringPath(\"Name\")")
      expect(queryModelsOutput).toContain("productDescription: new StringPath(\"Description\")")
    }))
})
