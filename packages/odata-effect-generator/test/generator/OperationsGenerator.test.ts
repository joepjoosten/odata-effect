import { describe, expect, it } from "@effect/vitest"
import { generateOperations } from "../../src/generator/OperationsGenerator.js"
import type { DataModel, OperationModel } from "../../src/model/DataModel.js"

describe("OperationsGenerator", () => {
  describe("import generation", () => {
    const createDataModel = (operations: Array<OperationModel>): DataModel => ({
      version: "V2",
      namespace: "Test",
      serviceName: "TestService",
      entityTypes: new Map(),
      complexTypes: new Map(),
      enumTypes: new Map(),
      entitySets: new Map(),
      singletons: new Map(),
      operations: new Map(operations.map((op) => [op.odataName, op]))
    })

    it("includes Schema import when operation returns primitive type", () => {
      const operation: OperationModel = {
        fqName: "Test.GetCount",
        odataName: "GetCount",
        name: "getCount",
        type: "Function",
        isBound: false,
        parameters: [],
        returnType: {
          odataType: "Edm.Int32",
          typeMapping: {
            effectSchema: "Schema.Number",
            queryPath: "NumberPath",
            tsType: "number"
          },
          isCollection: false,
          isNullable: false
        }
      }

      const result = generateOperations(createDataModel([operation]), { esmExtensions: false })

      expect(result.operationsFile).toBeDefined()
      expect(result.operationsFile!.content).toContain("import * as Schema from \"effect/Schema\"")
    })

    it("includes ODataSchema and DateTime imports when operation returns DateTime", () => {
      const operation: OperationModel = {
        fqName: "Test.GetCurrentDate",
        odataName: "GetCurrentDate",
        name: "getCurrentDate",
        type: "Function",
        isBound: false,
        parameters: [],
        returnType: {
          odataType: "Edm.DateTime",
          typeMapping: {
            effectSchema: "ODataSchema.ODataV2DateTime",
            queryPath: "DateTimePath",
            tsType: "DateTime.DateTime.Utc"
          },
          isCollection: false,
          isNullable: false
        }
      }

      const result = generateOperations(createDataModel([operation]), { esmExtensions: false })

      expect(result.operationsFile).toBeDefined()
      expect(result.operationsFile!.content).toContain("import { ODataSchema } from \"@odata-effect/odata-effect\"")
      expect(result.operationsFile!.content).toContain("import * as DateTime from \"effect/DateTime\"")
    })

    it("includes DateTime import (but not ODataSchema) when parameter uses DateTime type", () => {
      const operation: OperationModel = {
        fqName: "Test.GetProductsAfterDate",
        odataName: "GetProductsAfterDate",
        name: "getProductsAfterDate",
        type: "Function",
        isBound: false,
        parameters: [{
          odataName: "date",
          name: "date",
          odataType: "Edm.DateTime",
          typeMapping: {
            effectSchema: "ODataSchema.ODataV2DateTime",
            queryPath: "DateTimePath",
            tsType: "DateTime.DateTime.Utc"
          },
          isCollection: false,
          isNullable: false
        }]
      }

      const result = generateOperations(createDataModel([operation]), { esmExtensions: false })

      expect(result.operationsFile).toBeDefined()
      // DateTime is needed for the parameter interface (uses tsType)
      expect(result.operationsFile!.content).toContain("import * as DateTime from \"effect/DateTime\"")
      // ODataSchema is NOT needed - parameters only use tsType, not effectSchema
      expect(result.operationsFile!.content).not.toContain("import { ODataSchema }")
    })

    it("does not include Schema import when only model types are used", () => {
      const dataModel: DataModel = {
        version: "V2",
        namespace: "Test",
        serviceName: "TestService",
        entityTypes: new Map([
          ["Test.Product", {
            fqName: "Test.Product",
            odataName: "Product",
            name: "Product",
            keys: [],
            properties: [],
            navigationProperties: [],
            isAbstract: false,
            isOpen: false
          }]
        ]),
        complexTypes: new Map(),
        enumTypes: new Map(),
        entitySets: new Map(),
        singletons: new Map(),
        operations: new Map([
          ["GetProducts", {
            fqName: "Test.GetProducts",
            odataName: "GetProducts",
            name: "getProducts",
            type: "Function",
            isBound: false,
            parameters: [],
            returnType: {
              odataType: "Collection(Test.Product)",
              typeMapping: {
                effectSchema: "Product",
                queryPath: "EntityPath<QProduct>",
                tsType: "Product"
              },
              isCollection: true,
              isNullable: false
            }
          }]
        ])
      }

      const result = generateOperations(dataModel, { esmExtensions: false })

      expect(result.operationsFile).toBeDefined()
      // Should NOT have Schema import since we're using model types
      expect(result.operationsFile!.content).not.toContain("import * as Schema from \"effect/Schema\"")
      expect(result.operationsFile!.content).not.toContain("import { ODataSchema }")
    })

    it("includes both Schema and ODataSchema imports when both are needed", () => {
      const operations: Array<OperationModel> = [
        {
          fqName: "Test.GetCount",
          odataName: "GetCount",
          name: "getCount",
          type: "Function",
          isBound: false,
          parameters: [],
          returnType: {
            odataType: "Edm.Int32",
            typeMapping: {
              effectSchema: "Schema.Number",
              queryPath: "NumberPath",
              tsType: "number"
            },
            isCollection: false,
            isNullable: false
          }
        },
        {
          fqName: "Test.GetCurrentDate",
          odataName: "GetCurrentDate",
          name: "getCurrentDate",
          type: "Function",
          isBound: false,
          parameters: [],
          returnType: {
            odataType: "Edm.DateTime",
            typeMapping: {
              effectSchema: "ODataSchema.ODataV2DateTime",
              queryPath: "DateTimePath",
              tsType: "DateTime.DateTime.Utc"
            },
            isCollection: false,
            isNullable: false
          }
        }
      ]

      const result = generateOperations(createDataModel(operations), { esmExtensions: false })

      expect(result.operationsFile).toBeDefined()
      expect(result.operationsFile!.content).toContain("import * as Schema from \"effect/Schema\"")
      expect(result.operationsFile!.content).toContain("import { ODataSchema } from \"@odata-effect/odata-effect\"")
    })
  })
})
