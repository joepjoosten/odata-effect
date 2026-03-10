import { describe, expect, it } from "@effect/vitest"
import { generateModels } from "../../src/generator/ModelsGenerator.js"
import type { DataModel, EntityTypeModel, PropertyModel } from "../../src/model/DataModel.js"

describe("ModelsGenerator", () => {
  describe("fromKey generation", () => {
    const createProperty = (
      odataName: string,
      tsName: string,
      isKey = false
    ): PropertyModel => ({
      odataName,
      name: tsName,
      odataType: "Edm.String",
      typeMapping: {
        effectSchema: "Schema.String",
        queryPath: "StringPath",
        tsType: "string"
      },
      isCollection: false,
      isNullable: !isKey,
      isKey
    })

    const createDataModel = (properties: Array<PropertyModel>): DataModel => ({
      version: "V4",
      namespace: "Test",
      serviceName: "TestService",
      entityTypes: new Map<string, EntityTypeModel>([
        [
          "Test.Product",
          {
            fqName: "Test.Product",
            odataName: "Product",
            name: "Product",
            keys: properties.filter((p) => p.isKey),
            properties,
            navigationProperties: [],
            isAbstract: false,
            isOpen: false
          }
        ]
      ]),
      complexTypes: new Map(),
      enumTypes: new Map(),
      entitySets: new Map(),
      singletons: new Map(),
      operations: new Map()
    })

    it("generates simple property when OData name equals TypeScript name", () => {
      const properties = [
        createProperty("name", "name", false)
      ]
      const dataModel = createDataModel(properties)
      const output = generateModels(dataModel)

      expect(output).toContain("name: Schema.NullishOr(Schema.String)")
      expect(output).not.toContain("Schema.encodeKeys({ name:")
    })

    it("generates fromKey when OData name differs from TypeScript name", () => {
      const properties = [
        createProperty("ID", "id", true),
        createProperty("ProductName", "productName", false)
      ]
      const dataModel = createDataModel(properties)
      const output = generateModels(dataModel)

      expect(output).toContain("id: Schema.String")
      expect(output).toContain("productName: Schema.NullishOr(Schema.String)")
      expect(output).toContain(".pipe(Schema.encodeKeys({ id: \"ID\", productName: \"ProductName\" }))")
    })

    it("generates mixed properties correctly", () => {
      const properties = [
        createProperty("ID", "id", true), // Different names
        createProperty("name", "name", false), // Same names
        createProperty("ReleaseDate", "releaseDate", false) // Different names
      ]
      const dataModel = createDataModel(properties)
      const output = generateModels(dataModel)

      expect(output).toContain("id: Schema.String")
      expect(output).toContain("name: Schema.NullishOr(Schema.String)")
      expect(output).toContain("releaseDate: Schema.NullishOr(Schema.String)")
      expect(output).toContain(".pipe(Schema.encodeKeys({ id: \"ID\", releaseDate: \"ReleaseDate\" }))")
    })

    it("generates editable types with fromKey", () => {
      const properties = [
        createProperty("ID", "id", true),
        createProperty("ProductName", "productName", false)
      ]
      const dataModel = createDataModel(properties)
      const output = generateModels(dataModel)

      expect(output).toContain("export const EditableProduct = Schema.Struct({")
      expect(output).not.toContain("EditableProduct = Schema.Struct({\n  id:")
      expect(output).toContain("productName: Schema.NullishOr(Schema.String)")
      expect(output).toContain("}).pipe(Schema.encodeKeys({ productName: \"ProductName\" }))")
    })
  })
})
