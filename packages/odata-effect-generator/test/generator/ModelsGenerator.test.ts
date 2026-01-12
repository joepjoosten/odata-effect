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

    const createDataModel = (properties: PropertyModel[]): DataModel => ({
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

      // Should use simple format: name: Schema.optionalWith(...)
      expect(output).toContain("name: Schema.optionalWith(Schema.String, { nullable: true })")
      expect(output).not.toContain('Schema.fromKey("name")')
    })

    it("generates fromKey when OData name differs from TypeScript name", () => {
      const properties = [
        createProperty("ID", "id", true),
        createProperty("ProductName", "productName", false)
      ]
      const dataModel = createDataModel(properties)
      const output = generateModels(dataModel)

      // Should use propertySignature with fromKey
      expect(output).toContain('id: Schema.propertySignature(Schema.String).pipe(Schema.fromKey("ID"))')
      expect(output).toContain(
        'productName: Schema.propertySignature(Schema.optionalWith(Schema.String, { nullable: true })).pipe(Schema.fromKey("ProductName"))'
      )
    })

    it("generates mixed properties correctly", () => {
      const properties = [
        createProperty("ID", "id", true), // Different names
        createProperty("name", "name", false), // Same names
        createProperty("ReleaseDate", "releaseDate", false) // Different names
      ]
      const dataModel = createDataModel(properties)
      const output = generateModels(dataModel)

      // ID should use fromKey
      expect(output).toContain('id: Schema.propertySignature(Schema.String).pipe(Schema.fromKey("ID"))')
      // name should use simple format
      expect(output).toContain("name: Schema.optionalWith(Schema.String, { nullable: true })")
      expect(output).not.toContain('Schema.fromKey("name")')
      // ReleaseDate should use fromKey
      expect(output).toContain('releaseDate: Schema.propertySignature')
      expect(output).toContain('Schema.fromKey("ReleaseDate")')
    })

    it("generates editable types with fromKey", () => {
      const properties = [
        createProperty("ID", "id", true),
        createProperty("ProductName", "productName", false)
      ]
      const dataModel = createDataModel(properties)
      const output = generateModels(dataModel)

      // Editable type should not include key field
      expect(output).toContain("export const EditableProduct = Schema.Struct({")
      // But should use fromKey for non-key properties with different names
      expect(output).toContain(
        'productName: Schema.propertySignature(Schema.optionalWith(Schema.String, { nullable: true })).pipe(Schema.fromKey("ProductName"))'
      )
    })
  })
})
