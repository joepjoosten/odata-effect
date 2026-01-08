import { describe, expect, it } from "@effect/vitest"
import * as Effect from "effect/Effect"
import * as fs from "node:fs"
import * as path from "node:path"
import { digestMetadata } from "../../src/digester/Digester.js"
import { generateIndex } from "../../src/generator/IndexGenerator.js"
import { generateModels } from "../../src/generator/ModelsGenerator.js"
import { generateQueryModels } from "../../src/generator/QueryModelsGenerator.js"
import { generateServiceFns } from "../../src/generator/ServiceFnGenerator.js"
import { generatePromiseServiceFns } from "../../src/generator/ServiceFnPromiseGenerator.js"
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

      // Generate tree-shakable service functions
      const serviceResult = generateServiceFns(dataModel)
      expect(serviceResult.entityServices.length).toBe(3) // Products, Categories, Suppliers

      // Check ProductService content
      const productService = serviceResult.entityServices.find(
        (s) => s.fileName === "ProductService.ts"
      )!
      expect(productService).toBeDefined()
      expect(productService.content).toContain("import type * as Effect from")
      expect(productService.content).toContain("import { OData,")
      expect(productService.content).toContain("export const getAll")
      expect(productService.content).toContain("export const getById")
      expect(productService.content).toContain("export const create")
      expect(productService.content).toContain("export const update")
      expect(productService.content).toContain("export const del")
      expect(productService.content).toContain("export { del as delete }")

      // Generate Promise-based service functions
      const promiseServiceResult = generatePromiseServiceFns(dataModel)
      expect(promiseServiceResult.entityServices.length).toBe(3)

      // Check ProductServicePromise content
      const productPromiseService = promiseServiceResult.entityServices.find(
        (s) => s.fileName === "ProductServicePromise.ts"
      )!
      expect(productPromiseService).toBeDefined()
      expect(productPromiseService.content).toContain("import { createODataRuntime, type ODataRuntime } from")
      expect(productPromiseService.content).toContain("import * as ProductService from")
      expect(productPromiseService.content).toContain("export const getAll = (")
      expect(productPromiseService.content).toContain("runtime: ODataRuntime")
      expect(productPromiseService.content).toContain("runtime.runPromise(ProductService.getAll")
      expect(productPromiseService.content).toContain("export const getById = (")
      expect(productPromiseService.content).toContain("export const create = (")
      expect(productPromiseService.content).toContain("export const update = (")
      expect(productPromiseService.content).toContain("export const del = (")
      expect(productPromiseService.content).toContain("export { del as delete }")

      // Generate index.ts
      const indexCode = generateIndex(dataModel)
      expect(indexCode).toContain("export {")
      expect(indexCode).toContain("Product")
      expect(indexCode).toContain("EditableProduct")
      expect(indexCode).toContain("export * as ProductService")
      expect(indexCode).toContain("export * as ProductServicePromise")
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
