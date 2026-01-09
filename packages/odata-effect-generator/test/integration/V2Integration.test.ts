import { describe, expect, it } from "@effect/vitest"
import * as Effect from "effect/Effect"
import * as fs from "node:fs"
import * as path from "node:path"
import { digestMetadata } from "../../src/digester/Digester.js"
import { generateIndex } from "../../src/generator/IndexGenerator.js"
import { generateModels } from "../../src/generator/ModelsGenerator.js"
import { generateOperations } from "../../src/generator/OperationsGenerator.js"
import { generateQueryModels } from "../../src/generator/QueryModelsGenerator.js"
import { generateServiceFns } from "../../src/generator/ServiceFnGenerator.js"
import { parseODataMetadata } from "../../src/parser/XmlParser.js"

const resourceDir = path.resolve(__dirname, "../resource")

describe("V2 Integration", () => {
  it("generates complete code from V2 metadata", () =>
    Effect.gen(function*() {
      const xmlContent = fs.readFileSync(
        path.join(resourceDir, "odata-v2.xml"),
        "utf-8"
      )
      const edmx = yield* parseODataMetadata(xmlContent)
      const dataModel = yield* digestMetadata(edmx)

      // Generate Models.ts
      const modelsCode = generateModels(dataModel)
      expect(modelsCode).toContain("import * as Schema from")
      expect(modelsCode).toContain("export class Product extends Schema.Class")
      expect(modelsCode).toContain("export class Category extends Schema.Class")
      expect(modelsCode).toContain("export class Supplier extends Schema.Class")
      expect(modelsCode).toContain("export class Address extends Schema.Class")
      expect(modelsCode).toContain("export const ProductId = Schema.Union")
      expect(modelsCode).toContain("export const EditableProduct = Schema.Struct")

      // Check properties
      expect(modelsCode).toContain("id: Schema.Number")
      expect(modelsCode).toContain("name:")
      expect(modelsCode).toContain("price:")
      expect(modelsCode).toContain("releaseDate:")

      // Generate QueryModels.ts
      const queryModelsCode = generateQueryModels(dataModel)
      expect(queryModelsCode).toContain("import {")
      expect(queryModelsCode).toContain("StringPath")
      expect(queryModelsCode).toContain("NumberPath")
      expect(queryModelsCode).toContain("DateTimePath")
      expect(queryModelsCode).toContain("EntityPath")
      expect(queryModelsCode).toContain("export interface QProduct")
      expect(queryModelsCode).toContain("export const qProduct: QProduct")
      expect(queryModelsCode).toContain("export const productQuery = ()")

      // Generate Services.ts (single file with crud factory)
      const serviceResult = generateServiceFns(dataModel)
      expect(serviceResult.servicesFile.fileName).toBe("Services.ts")

      // Check Services.ts content
      const servicesContent = serviceResult.servicesFile.content
      expect(servicesContent).toContain("import { crud } from \"@odata-effect/odata-effect/Crud\"")
      expect(servicesContent).toContain("export const ProductService = crud({")
      expect(servicesContent).toContain("export const CategoryService = crud({")
      expect(servicesContent).toContain("export const SupplierService = crud({")
      expect(servicesContent).toContain("path: \"Products\"")
      expect(servicesContent).toContain("schema: Product,")
      expect(servicesContent).toContain("editableSchema: EditableProduct,")
      expect(servicesContent).toContain("idToKey:")

      // Generate Operations.ts (FunctionImports)
      const operationsResult = generateOperations(dataModel)
      expect(operationsResult.operationsFile).toBeDefined()
      expect(operationsResult.operationsFile!.fileName).toBe("Operations.ts")
      expect(operationsResult.operationsFile!.content).toContain("getProductsByRating")
      expect(operationsResult.operationsFile!.content).toContain("GetProductsByRatingParams")
      expect(operationsResult.operationsFile!.content).toContain("rating:")
      expect(operationsResult.operationsFile!.content).toContain("ODataOps.executeFunctionImportCollection")
      expect(operationsResult.operationsFile!.content).toContain("Effect.gen")

      // Generate index.ts
      const indexCode = generateIndex(dataModel)
      expect(indexCode).toContain("export {")
      expect(indexCode).toContain("Product")
      expect(indexCode).toContain("EditableProduct")
      expect(indexCode).toContain("ProductService")
      expect(indexCode).toContain("} from \"./Services\"")
      expect(indexCode).toContain("export * as Operations")
      expect(indexCode).toContain("qProduct")
      expect(indexCode).toContain("productQuery")
    }))

  it("handles nullable properties correctly", () =>
    Effect.gen(function*() {
      const xmlContent = fs.readFileSync(
        path.join(resourceDir, "odata-v2.xml"),
        "utf-8"
      )
      const edmx = yield* parseODataMetadata(xmlContent)
      const dataModel = yield* digestMetadata(edmx)

      const product = dataModel.entityTypes.get("ODataDemo.Product")!

      // ID should not be nullable (it's a key)
      const idProp = product.properties.find((p) => p.odataName === "ID")!
      expect(idProp.isNullable).toBe(false)
      expect(idProp.isKey).toBe(true)

      // Name should be nullable
      const nameProp = product.properties.find((p) => p.odataName === "Name")!
      expect(nameProp.isNullable).toBe(true)

      // ReleaseDate should not be nullable
      const releaseDateProp = product.properties.find(
        (p) => p.odataName === "ReleaseDate"
      )!
      expect(releaseDateProp.isNullable).toBe(false)

      // DiscontinuedDate should be nullable
      const discontinuedDateProp = product.properties.find(
        (p) => p.odataName === "DiscontinuedDate"
      )!
      expect(discontinuedDateProp.isNullable).toBe(true)
    }))

  it("handles V2 associations correctly", () =>
    Effect.gen(function*() {
      const xmlContent = fs.readFileSync(
        path.join(resourceDir, "odata-v2.xml"),
        "utf-8"
      )
      const edmx = yield* parseODataMetadata(xmlContent)
      const dataModel = yield* digestMetadata(edmx)

      const product = dataModel.entityTypes.get("ODataDemo.Product")!

      // Product -> Category (many-to-one)
      const categoryNav = product.navigationProperties.find(
        (np) => np.odataName === "Category"
      )!
      expect(categoryNav.isCollection).toBe(false)
      expect(categoryNav.targetType).toBe("Category")

      const category = dataModel.entityTypes.get("ODataDemo.Category")!

      // Category -> Products (one-to-many)
      const productsNav = category.navigationProperties.find(
        (np) => np.odataName === "Products"
      )!
      expect(productsNav.isCollection).toBe(true)
      expect(productsNav.targetType).toBe("Product")
    }))
})
