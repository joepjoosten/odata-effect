import { describe, expect, it } from "@effect/vitest"
import { generateModels } from "../../src/generator/ModelsGenerator.js"
import type {
  DataModel,
  EntityTypeModel,
  NavigationPropertyModel,
  PropertyModel
} from "../../src/model/DataModel.js"
import type { ODataVersion } from "../../src/parser/EdmxSchema.js"

describe("ModelsGenerator", () => {
  describe("encoded key generation", () => {
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

      // Should use simple format for matching OData and TypeScript names
      expect(output).toContain("name: Schema.optional(Schema.NullOr(Schema.String))")
      expect(output).not.toContain("Schema.fromKey(\"name\")")
    })

    it("generates encodeKeys when OData name differs from TypeScript name", () => {
      const properties = [
        createProperty("ID", "id", true),
        createProperty("ProductName", "productName", false)
      ]
      const dataModel = createDataModel(properties)
      const output = generateModels(dataModel)

      // Renamed fields are mapped with encodeKeys at the struct level
      expect(output).toContain("id: Schema.String")
      expect(output).toContain(
        "productName: Schema.optional(Schema.NullOr(Schema.String))"
      )
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

      // ID (required key) should use the field schema and encodeKeys
      expect(output).toContain("id: Schema.String")
      // name should use simple format (same OData and TS names)
      expect(output).toContain("name: Schema.optional(Schema.NullOr(Schema.String))")
      expect(output).not.toContain("Schema.fromKey(\"name\")")
      // ReleaseDate (optional) should use optional nullable schema and encodeKeys
      expect(output).toContain(
        "releaseDate: Schema.optional(Schema.NullOr(Schema.String))"
      )
      expect(output).toContain(".pipe(Schema.encodeKeys({ id: \"ID\", releaseDate: \"ReleaseDate\" }))")
    })

    it("generates editable types with encodeKeys", () => {
      const properties = [
        createProperty("ID", "id", true),
        createProperty("ProductName", "productName", false)
      ]
      const dataModel = createDataModel(properties)
      const output = generateModels(dataModel)

      // Editable type should not include key field
      expect(output).toContain("export const EditableProduct = Schema.Struct({")
      expect(output).toContain("export const PartialEditableProduct = Schema.Struct({")
      // Optional fields use optional nullable schema and encodeKeys
      expect(output).toContain(
        "productName: Schema.optional(Schema.NullOr(Schema.String))"
      )
      expect(output).toContain(".pipe(Schema.encodeKeys({ productName: \"ProductName\" }))")
    })
  })

  describe("expanded navigation schema generation", () => {
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

    const createNavigation = (
      odataName: string,
      tsName: string,
      targetType: string,
      isCollection: boolean
    ): NavigationPropertyModel => ({
      odataName,
      name: tsName,
      targetType,
      isCollection,
      isNullable: true
    })

    const createNavigationDataModel = (version: ODataVersion): DataModel => {
      const productId = createProperty("ID", "id", true)
      const productName = createProperty("ProductName", "productName")
      const categoryId = createProperty("ID", "id", true)
      const categoryName = createProperty("Name", "name")
      const categoryNav = createNavigation("Category", "category", "Category", false)
      const productsNav = createNavigation("Products", "products", "Product", true)

      return {
        version,
        namespace: "Test",
        serviceName: "TestService",
        entityTypes: new Map<string, EntityTypeModel>([
          [
            "Test.Product",
            {
              fqName: "Test.Product",
              odataName: "Product",
              name: "Product",
              keys: [productId],
              properties: [productId, productName],
              navigationProperties: [categoryNav],
              isAbstract: false,
              isOpen: false
            }
          ],
          [
            "Test.Category",
            {
              fqName: "Test.Category",
              odataName: "Category",
              name: "Category",
              keys: [categoryId],
              properties: [categoryId, categoryName],
              navigationProperties: [productsNav],
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
      }
    }

    it("generates optional lazy V4 navigation fields on exposed schemas", () => {
      const output = generateModels(createNavigationDataModel("V4"))

      expect(output).toContain("export interface Product {")
      expect(output).toContain("readonly category?: Category | null | undefined")
      expect(output).toContain("readonly products?: ReadonlyArray<Product> | null | undefined")
      expect(output).toContain(
        "category: Schema.optional(Schema.NullOr(Schema.suspend((): Schema.Codec<Category, unknown, never, never> => Category)))"
      )
      expect(output).toContain(
        "products: Schema.optional(Schema.NullOr(Schema.Array(Schema.suspend((): Schema.Codec<Product, unknown, never, never> => Product))))"
      )
      expect(output).toContain("satisfies Schema.Codec<Product, unknown, never, never>")
      expect(output).toContain("satisfies Schema.Codec<Category, unknown, never, never>")
      expect(output).toContain("Schema.encodeKeys({ id: \"ID\", productName: \"ProductName\", category: \"Category\" })")
      expect(output).not.toContain("OData.DeferredContent")
    })

    it("generates V2 navigation fields that also accept deferred links", () => {
      const output = generateModels(createNavigationDataModel("V2"))

      expect(output).toContain("import * as SchemaGetter from \"effect/SchemaGetter\"")
      expect(output).toContain("import { OData } from \"@odata-effect/odata-effect\"")
      expect(output).toContain("const v2NavigationCollection = <A>(")
      expect(output).toContain("readonly category?: Category | OData.DeferredContent | null | undefined")
      expect(output).toContain("readonly products?: ReadonlyArray<Product> | OData.DeferredContent | null | undefined")
      expect(output).toContain(
        "category: Schema.optional(Schema.NullOr(Schema.Union([Schema.suspend((): Schema.Codec<Category, unknown, never, never> => Category), OData.DeferredContent])))"
      )
      expect(output).toContain(
        "products: Schema.optional(Schema.NullOr(Schema.Union([v2NavigationCollection(Schema.suspend((): Schema.Codec<Product, unknown, never, never> => Product)), OData.DeferredContent])))"
      )
    })
  })
})
