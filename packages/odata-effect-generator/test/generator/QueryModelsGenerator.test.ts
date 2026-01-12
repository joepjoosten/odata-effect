import { describe, expect, it } from "@effect/vitest"
import { generateQueryModels } from "../../src/generator/QueryModelsGenerator.js"
import type { DataModel, EntityTypeModel, PropertyModel } from "../../src/model/DataModel.js"

describe("QueryModelsGenerator", () => {
  describe("property name mapping", () => {
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
      entitySets: new Map([
        [
          "Products",
          {
            name: "Products",
            entityTypeFqName: "Test.Product",
            entityTypeName: "Product"
          }
        ]
      ]),
      singletons: new Map(),
      operations: new Map()
    })

    it("uses TypeScript name for interface property and OData name for path string", () => {
      const properties = [
        createProperty("ID", "id", true),
        createProperty("ProductName", "productName", false)
      ]
      const dataModel = createDataModel(properties)
      const output = generateQueryModels(dataModel)

      // Interface should use TypeScript property names
      expect(output).toContain("export interface QProduct {")
      expect(output).toContain("readonly id: StringPath")
      expect(output).toContain("readonly productName: StringPath")

      // Instance should use TypeScript names as keys but OData names in path constructors
      expect(output).toContain("export const qProduct: QProduct = {")
      expect(output).toContain("id: new StringPath(\"ID\")")
      expect(output).toContain("productName: new StringPath(\"ProductName\")")
    })

    it("handles properties where OData name equals TypeScript name", () => {
      const properties = [
        createProperty("name", "name", false)
      ]
      const dataModel = createDataModel(properties)
      const output = generateQueryModels(dataModel)

      // When names are the same, both should use that name
      expect(output).toContain("readonly name: StringPath")
      expect(output).toContain("name: new StringPath(\"name\")")
    })

    it("generates correct query factory", () => {
      const properties = [
        createProperty("ID", "id", true)
      ]
      const dataModel = createDataModel(properties)
      const output = generateQueryModels(dataModel)

      // Query factory should be generated
      expect(output).toContain("export const productQuery = (): QueryBuilder<Product, QProduct> =>")
      expect(output).toContain("createQueryBuilder<Product, QProduct>(qProduct)")
    })
  })
})
