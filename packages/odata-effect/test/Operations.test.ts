import { describe, expect, it } from "@effect/vitest"
import * as Effect from "effect/Effect"
import * as Schema from "effect/Schema"
import {
  HttpClient,
  HttpClientRequest,
  HttpClientResponse
} from "@effect/platform"
import {
  buildFunctionImportUrl,
  buildV4FunctionUrl,
  buildV4BoundOperationUrl,
  executeFunctionImportVoid,
  executeFunctionImportEntity,
  executeFunctionImportCollection,
  executeFunctionImportPrimitive,
  executeV4FunctionVoid,
  executeV4FunctionEntity,
  executeV4FunctionCollection,
  executeV4FunctionPrimitive,
  executeV4ActionVoid,
  executeV4ActionEntity,
  executeV4ActionCollection
} from "../src/Operations.js"

// Test schemas
class TestEntity extends Schema.Class<TestEntity>("TestEntity")({
  id: Schema.String,
  name: Schema.String
}) {}

// Test configurations
const v2Config = {
  baseUrl: "https://test-server.com",
  servicePath: "/sap/opu/odata/sap/TEST_SRV/"
}

const v4Config = {
  baseUrl: "https://test-server.com",
  servicePath: "/odata/v4/"
}

// Helper to create mock HTTP client
const createMockClient = (
  handler: (request: HttpClientRequest.HttpClientRequest) => Effect.Effect<HttpClientResponse.HttpClientResponse>
) =>
  HttpClient.make(handler)

describe("Operations", () => {
  describe("buildFunctionImportUrl", () => {
    it("builds URL without parameters", () => {
      const url = buildFunctionImportUrl("GetProducts")
      expect(url).toBe("GetProducts")
    })

    it("builds URL with string parameter", () => {
      const url = buildFunctionImportUrl("GetProduct", { ProductID: "123" })
      expect(url).toBe("GetProduct?ProductID='123'")
    })

    it("builds URL with number parameter", () => {
      const url = buildFunctionImportUrl("GetProduct", { ProductID: 123 })
      expect(url).toBe("GetProduct?ProductID=123")
    })

    it("builds URL with boolean parameter", () => {
      const url = buildFunctionImportUrl("GetProducts", { Active: true })
      expect(url).toBe("GetProducts?Active=true")
    })

    it("builds URL with null parameter", () => {
      const url = buildFunctionImportUrl("GetProducts", { Filter: null })
      expect(url).toBe("GetProducts?Filter=null")
    })

    it("builds URL with Date parameter", () => {
      const date = new Date("2024-01-15T10:30:00.000Z")
      const url = buildFunctionImportUrl("GetOrders", { FromDate: date })
      expect(url).toBe("GetOrders?FromDate=datetime'2024-01-15T10:30:00.000Z'")
    })

    it("builds URL with multiple parameters", () => {
      const url = buildFunctionImportUrl("GetProducts", {
        Category: "Electronics",
        MinPrice: 100,
        InStock: true
      })
      expect(url).toContain("Category='Electronics'")
      expect(url).toContain("MinPrice=100")
      expect(url).toContain("InStock=true")
    })

    it("encodes string parameters", () => {
      const url = buildFunctionImportUrl("Search", { Query: "hello world" })
      expect(url).toBe("Search?Query='hello%20world'")
    })
  })

  describe("buildV4FunctionUrl", () => {
    it("builds URL without parameters", () => {
      const url = buildV4FunctionUrl("GetProducts")
      expect(url).toBe("GetProducts()")
    })

    it("builds URL with string parameter", () => {
      const url = buildV4FunctionUrl("GetProduct", { ProductID: "123" })
      expect(url).toBe("GetProduct(ProductID='123')")
    })

    it("builds URL with number parameter", () => {
      const url = buildV4FunctionUrl("GetProduct", { ProductID: 123 })
      expect(url).toBe("GetProduct(ProductID=123)")
    })

    it("builds URL with Date parameter (ISO format for V4)", () => {
      const date = new Date("2024-01-15T10:30:00.000Z")
      const url = buildV4FunctionUrl("GetOrders", { FromDate: date })
      expect(url).toBe("GetOrders(FromDate=2024-01-15T10:30:00.000Z)")
    })

    it("builds URL with multiple parameters", () => {
      const url = buildV4FunctionUrl("GetProducts", {
        Category: "Electronics",
        MinPrice: 100
      })
      expect(url).toContain("Category='Electronics'")
      expect(url).toContain("MinPrice=100")
    })
  })

  describe("buildV4BoundOperationUrl", () => {
    it("builds bound operation URL without parameters", () => {
      const url = buildV4BoundOperationUrl("Products(1)", "NS", "GetRelated")
      expect(url).toBe("Products(1)/NS.GetRelated()")
    })

    it("builds bound operation URL with parameters", () => {
      const url = buildV4BoundOperationUrl("Products(1)", "NS", "DoSomething", {
        Count: 5
      })
      expect(url).toBe("Products(1)/NS.DoSomething(Count=5)")
    })
  })

  describe("V2 Function Imports", () => {
    describe("executeFunctionImportVoid", () => {
      it.effect("executes a void function import", () =>
        Effect.gen(function* () {
          let capturedRequest: HttpClientRequest.HttpClientRequest | null = null

          const mockClient = createMockClient((request) => {
            capturedRequest = request
            return Effect.succeed(
              HttpClientResponse.fromWeb(
                request,
                new Response(null, { status: 204 })
              )
            )
          })

          yield* executeFunctionImportVoid(
            mockClient,
            v2Config,
            "DoAction",
            { Param: "value" },
            { method: "POST" }
          )

          expect(capturedRequest).not.toBeNull()
          expect(capturedRequest!.method).toBe("POST")
          expect(capturedRequest!.url).toContain("DoAction")
        })
      )
    })

    describe("executeFunctionImportEntity", () => {
      it.effect("executes a function import returning an entity", () =>
        Effect.gen(function* () {
          const mockClient = createMockClient((request) =>
            Effect.succeed(
              HttpClientResponse.fromWeb(
                request,
                new Response(
                  JSON.stringify({
                    d: { id: "123", name: "Test" }
                  }),
                  { status: 200, headers: { "Content-Type": "application/json" } }
                )
              )
            )
          )

          const result = yield* executeFunctionImportEntity(
            mockClient,
            v2Config,
            "GetProduct",
            TestEntity,
            { ProductID: "123" }
          )

          expect(result.id).toBe("123")
          expect(result.name).toBe("Test")
        })
      )
    })

    describe("executeFunctionImportCollection", () => {
      it.effect("executes a function import returning a collection", () =>
        Effect.gen(function* () {
          const mockClient = createMockClient((request) =>
            Effect.succeed(
              HttpClientResponse.fromWeb(
                request,
                new Response(
                  JSON.stringify({
                    d: {
                      results: [
                        { id: "1", name: "First" },
                        { id: "2", name: "Second" }
                      ]
                    }
                  }),
                  { status: 200, headers: { "Content-Type": "application/json" } }
                )
              )
            )
          )

          const result = yield* executeFunctionImportCollection(
            mockClient,
            v2Config,
            "GetProducts",
            TestEntity
          )

          expect(result).toHaveLength(2)
          expect(result[0].id).toBe("1")
          expect(result[1].id).toBe("2")
        })
      )
    })

    describe("executeFunctionImportPrimitive", () => {
      it.effect("executes a function import returning a primitive", () =>
        Effect.gen(function* () {
          const mockClient = createMockClient((request) =>
            Effect.succeed(
              HttpClientResponse.fromWeb(
                request,
                new Response(
                  JSON.stringify({
                    d: { Count: 42 }
                  }),
                  { status: 200, headers: { "Content-Type": "application/json" } }
                )
              )
            )
          )

          const result = yield* executeFunctionImportPrimitive(
            mockClient,
            v2Config,
            "GetProductCount",
            "Count",
            Schema.Number
          )

          expect(result).toBe(42)
        })
      )
    })
  })

  describe("V4 Functions", () => {
    describe("executeV4FunctionVoid", () => {
      it.effect("executes a void V4 function", () =>
        Effect.gen(function* () {
          let capturedRequest: HttpClientRequest.HttpClientRequest | null = null

          const mockClient = createMockClient((request) => {
            capturedRequest = request
            return Effect.succeed(
              HttpClientResponse.fromWeb(
                request,
                new Response(null, { status: 204 })
              )
            )
          })

          yield* executeV4FunctionVoid(mockClient, v4Config, "DoSomething()")

          expect(capturedRequest).not.toBeNull()
          expect(capturedRequest!.method).toBe("GET")
        })
      )
    })

    describe("executeV4FunctionEntity", () => {
      it.effect("executes a V4 function returning an entity", () =>
        Effect.gen(function* () {
          const mockClient = createMockClient((request) =>
            Effect.succeed(
              HttpClientResponse.fromWeb(
                request,
                new Response(
                  JSON.stringify({ id: "123", name: "Test" }),
                  { status: 200, headers: { "Content-Type": "application/json" } }
                )
              )
            )
          )

          const result = yield* executeV4FunctionEntity(
            mockClient,
            v4Config,
            "GetProduct(ProductID=123)",
            TestEntity
          )

          expect(result.id).toBe("123")
          expect(result.name).toBe("Test")
        })
      )
    })

    describe("executeV4FunctionCollection", () => {
      it.effect("executes a V4 function returning a collection", () =>
        Effect.gen(function* () {
          const mockClient = createMockClient((request) =>
            Effect.succeed(
              HttpClientResponse.fromWeb(
                request,
                new Response(
                  JSON.stringify({
                    value: [
                      { id: "1", name: "First" },
                      { id: "2", name: "Second" }
                    ]
                  }),
                  { status: 200, headers: { "Content-Type": "application/json" } }
                )
              )
            )
          )

          const result = yield* executeV4FunctionCollection(
            mockClient,
            v4Config,
            "GetProducts()",
            TestEntity
          )

          expect(result).toHaveLength(2)
          expect(result[0].id).toBe("1")
        })
      )
    })

    describe("executeV4FunctionPrimitive", () => {
      it.effect("executes a V4 function returning a primitive", () =>
        Effect.gen(function* () {
          const mockClient = createMockClient((request) =>
            Effect.succeed(
              HttpClientResponse.fromWeb(
                request,
                new Response(
                  JSON.stringify({ value: 42 }),
                  { status: 200, headers: { "Content-Type": "application/json" } }
                )
              )
            )
          )

          const result = yield* executeV4FunctionPrimitive(
            mockClient,
            v4Config,
            "GetCount()",
            Schema.Number
          )

          expect(result).toBe(42)
        })
      )
    })
  })

  describe("V4 Actions", () => {
    describe("executeV4ActionVoid", () => {
      it.effect("executes a void V4 action", () =>
        Effect.gen(function* () {
          let capturedRequest: HttpClientRequest.HttpClientRequest | null = null

          const mockClient = createMockClient((request) => {
            capturedRequest = request
            return Effect.succeed(
              HttpClientResponse.fromWeb(
                request,
                new Response(null, { status: 204 })
              )
            )
          })

          yield* executeV4ActionVoid(mockClient, v4Config, "DoAction")

          expect(capturedRequest).not.toBeNull()
          expect(capturedRequest!.method).toBe("POST")
        })
      )

      it.effect("executes a V4 action with body", () =>
        Effect.gen(function* () {
          const mockClient = createMockClient((request) =>
            Effect.succeed(
              HttpClientResponse.fromWeb(
                request,
                new Response(null, { status: 204 })
              )
            )
          )

          const bodySchema = Schema.Struct({ param: Schema.String })

          yield* executeV4ActionVoid(
            mockClient,
            v4Config,
            "DoAction",
            { param: "value" },
            bodySchema
          )
        })
      )
    })

    describe("executeV4ActionEntity", () => {
      it.effect("executes a V4 action returning an entity", () =>
        Effect.gen(function* () {
          const mockClient = createMockClient((request) =>
            Effect.succeed(
              HttpClientResponse.fromWeb(
                request,
                new Response(
                  JSON.stringify({ id: "new-id", name: "Created" }),
                  { status: 201, headers: { "Content-Type": "application/json" } }
                )
              )
            )
          )

          const result = yield* executeV4ActionEntity(
            mockClient,
            v4Config,
            "CreateProduct",
            TestEntity
          )

          expect(result.id).toBe("new-id")
          expect(result.name).toBe("Created")
        })
      )
    })

    describe("executeV4ActionCollection", () => {
      it.effect("executes a V4 action returning a collection", () =>
        Effect.gen(function* () {
          const mockClient = createMockClient((request) =>
            Effect.succeed(
              HttpClientResponse.fromWeb(
                request,
                new Response(
                  JSON.stringify({
                    value: [
                      { id: "1", name: "First" },
                      { id: "2", name: "Second" }
                    ]
                  }),
                  { status: 200, headers: { "Content-Type": "application/json" } }
                )
              )
            )
          )

          const result = yield* executeV4ActionCollection(
            mockClient,
            v4Config,
            "GetMultiple",
            TestEntity
          )

          expect(result).toHaveLength(2)
        })
      )
    })
  })
})
