import { HttpClient, HttpClientResponse } from "@effect/platform"
import type { HttpClientRequest, HttpClientRequest } from "@effect/platform"
import { describe, expect, it } from "@effect/vitest"
import * as Effect from "effect/Effect"
import * as Layer from "effect/Layer"
import * as Schema from "effect/Schema"
import {
  DEFAULT_HEADERS,
  HttpClient,
  MERGE_HEADERS,
  ODataClientConfig,
  ODataCollectionResponse,
  ODataSingleResponse
} from "../src/ODataClient.js"
import * as OData from "../src/ODataClientFn.js"

// Test schema
class TestEntity extends Schema.Class<TestEntity>("TestEntity")({
  id: Schema.String,
  name: Schema.String,
  value: Schema.Number
}) {}

const EditableTestEntity = Schema.Struct({
  name: Schema.String,
  value: Schema.Number
})

// Test configuration layer
const testConfig = Layer.succeed(ODataClientConfig, {
  baseUrl: "https://test-server.com",
  servicePath: "/sap/opu/odata/sap/TEST_SRV/"
})

// Helper to create a complete test layer with mock HTTP client
const createTestLayer = (
  handler: (request: HttpClientRequest.HttpClientRequest) => Effect.Effect<HttpClientResponse.HttpClientResponse>
) => {
  const mockHttpClient = Layer.succeed(
    HttpClient.HttpClient,
    HttpClient.make(handler)
  )
  return Layer.merge(testConfig, mockHttpClient)
}

describe("ODataClient", () => {
  describe("buildEntityPath", () => {
    it("builds path with string ID", () => {
      const path = buildEntityPath("sessions", "123")
      expect(path).toBe("sessions('123')")
    })

    it("builds path with single-key object ID", () => {
      const path = buildEntityPath("sessions", { sessionId: "abc" })
      expect(path).toBe("sessions('abc')")
    })

    it("builds path with composite key object ID", () => {
      const path = buildEntityPath("items", { orderId: "O1", itemId: "I1" })
      expect(path).toBe("items(orderId='O1',itemId='I1')")
    })
  })

  describe("ODataSingleResponse", () => {
    it("wraps schema in OData V2 single response format", () =>
      Effect.gen(function*() {
        const responseSchema = ODataSingleResponse(TestEntity)
        const data = {
          d: {
            id: "1",
            name: "Test",
            value: 42
          }
        }
        const result = yield* Schema.decodeUnknown(responseSchema)(data)
        expect(result.d.id).toBe("1")
        expect(result.d.name).toBe("Test")
        expect(result.d.value).toBe(42)
      }).pipe(Effect.runPromise))
  })

  describe("ODataCollectionResponse", () => {
    it("wraps schema in OData V2 collection response format", () =>
      Effect.gen(function*() {
        const responseSchema = ODataCollectionResponse(TestEntity)
        const data = {
          d: {
            results: [
              { id: "1", name: "Test1", value: 10 },
              { id: "2", name: "Test2", value: 20 }
            ]
          }
        }
        const result = yield* Schema.decodeUnknown(responseSchema)(data)
        expect(result.d.results).toHaveLength(2)
        expect(result.d.results[0].id).toBe("1")
        expect(result.d.results[1].id).toBe("2")
      }).pipe(Effect.runPromise))
  })

  describe("constants", () => {
    it("DEFAULT_HEADERS has correct values", () => {
      expect(DEFAULT_HEADERS.Accept).toBe("application/json")
      expect(DEFAULT_HEADERS["Content-Type"]).toBe("application/json")
    })

    it("MERGE_HEADERS has X-Http-Method: MERGE", () => {
      expect(MERGE_HEADERS["X-Http-Method"]).toBe("MERGE")
    })
  })

  describe("Tree-Shakable OData Functions", () => {
    describe("get", () => {
      it.effect("fetches a single entity", () =>
        Effect.gen(function*() {
          const result = yield* OData.get("entities('123')", TestEntity)

          expect(result.id).toBe("123")
          expect(result.name).toBe("Test Entity")
          expect(result.value).toBe(100)
        }).pipe(
          Effect.provide(
            createTestLayer((request) =>
              Effect.succeed(
                HttpClientResponse.fromWeb(
                  request,
                  new Response(
                    JSON.stringify({
                      d: { id: "123", name: "Test Entity", value: 100 }
                    }),
                    { status: 200, headers: { "Content-Type": "application/json" } }
                  )
                )
              )
            )
          )
        ))

      it.effect("includes query options in URL", () =>
        Effect.gen(function*() {
          yield* OData.get("entities('1')", TestEntity, {
            $select: "id,name",
            $expand: "details",
            $filter: "value gt 10"
          })
        }).pipe(
          Effect.provide(
            createTestLayer((request) => {
              // Verify URL contains expected query parameters
              expect(request.url).toContain("$select=id%2Cname")
              expect(request.url).toContain("$expand=details")
              expect(request.url).toContain("$filter=value%20gt%2010")
              return Effect.succeed(
                HttpClientResponse.fromWeb(
                  request,
                  new Response(
                    JSON.stringify({ d: { id: "1", name: "Test", value: 0 } }),
                    { status: 200, headers: { "Content-Type": "application/json" } }
                  )
                )
              )
            })
          )
        ))
    })

    describe("getCollection", () => {
      it.effect("fetches a collection of entities", () =>
        Effect.gen(function*() {
          const results = yield* OData.getCollection("entities", TestEntity)

          expect(results).toHaveLength(3)
          expect(results[0].id).toBe("1")
          expect(results[1].id).toBe("2")
          expect(results[2].id).toBe("3")
        }).pipe(
          Effect.provide(
            createTestLayer((request) =>
              Effect.succeed(
                HttpClientResponse.fromWeb(
                  request,
                  new Response(
                    JSON.stringify({
                      d: {
                        results: [
                          { id: "1", name: "Entity 1", value: 10 },
                          { id: "2", name: "Entity 2", value: 20 },
                          { id: "3", name: "Entity 3", value: 30 }
                        ]
                      }
                    }),
                    { status: 200, headers: { "Content-Type": "application/json" } }
                  )
                )
              )
            )
          )
        ))

      it.effect("handles empty collection", () =>
        Effect.gen(function*() {
          const results = yield* OData.getCollection("entities", TestEntity)

          expect(results).toHaveLength(0)
        }).pipe(
          Effect.provide(
            createTestLayer((request) =>
              Effect.succeed(
                HttpClientResponse.fromWeb(
                  request,
                  new Response(
                    JSON.stringify({ d: { results: [] } }),
                    { status: 200, headers: { "Content-Type": "application/json" } }
                  )
                )
              )
            )
          )
        ))
    })

    describe("post", () => {
      it.effect("creates an entity", () =>
        Effect.gen(function*() {
          const result = yield* OData.post(
            "entities",
            { name: "New Entity", value: 50 },
            EditableTestEntity,
            TestEntity
          )

          expect(result.id).toBe("new-id")
          expect(result.name).toBe("New Entity")
        }).pipe(
          Effect.provide(
            createTestLayer((request) =>
              Effect.succeed(
                HttpClientResponse.fromWeb(
                  request,
                  new Response(
                    JSON.stringify({
                      d: { id: "new-id", name: "New Entity", value: 50 }
                    }),
                    { status: 201, headers: { "Content-Type": "application/json" } }
                  )
                )
              )
            )
          )
        ))
    })

    describe("patch", () => {
      it.effect("uses POST with X-Http-Method: MERGE header for OData V2", () =>
        Effect.gen(function*() {
          yield* OData.patch(
            "entities('123')",
            { name: "Updated Name" },
            Schema.partial(EditableTestEntity)
          )
        }).pipe(
          Effect.provide(
            createTestLayer((request) => {
              // Verify POST method with MERGE header
              expect(request.method).toBe("POST")
              expect(request.headers["x-http-method"]).toBe("MERGE")
              return Effect.succeed(
                HttpClientResponse.fromWeb(
                  request,
                  new Response(null, { status: 204 })
                )
              )
            })
          )
        ))

      it.effect("returns void on successful patch", () =>
        Effect.gen(function*() {
          const result = yield* OData.patch(
            "entities('123')",
            { value: 999 },
            Schema.partial(EditableTestEntity)
          )

          expect(result).toBeUndefined()
        }).pipe(
          Effect.provide(
            createTestLayer((request) =>
              Effect.succeed(
                HttpClientResponse.fromWeb(
                  request,
                  new Response(null, { status: 204 })
                )
              )
            )
          )
        ))
    })

    describe("delete", () => {
      it.effect("deletes an entity and returns void", () =>
        Effect.gen(function*() {
          const result = yield* OData.del("entities('123')")

          expect(result).toBeUndefined()
        }).pipe(
          Effect.provide(
            createTestLayer((request) =>
              Effect.succeed(
                HttpClientResponse.fromWeb(
                  request,
                  new Response(null, { status: 204 })
                )
              )
            )
          )
        ))

      it.effect("uses DELETE method", () =>
        Effect.gen(function*() {
          yield* OData.del("entities('456')")
        }).pipe(
          Effect.provide(
            createTestLayer((request) => {
              expect(request.method).toBe("DELETE")
              return Effect.succeed(
                HttpClientResponse.fromWeb(
                  request,
                  new Response(null, { status: 204 })
                )
              )
            })
          )
        ))
    })

    describe("error handling", () => {
      it.effect("wraps HTTP errors in ODataError", () =>
        Effect.gen(function*() {
          const result = yield* OData.get("entities('not-found')", TestEntity).pipe(Effect.flip)

          expect(result._tag).toBe("ODataError")
        }).pipe(
          Effect.provide(
            createTestLayer((request) =>
              Effect.succeed(
                HttpClientResponse.fromWeb(
                  request,
                  new Response(
                    JSON.stringify({ error: { code: "404", message: { value: "Not found" } } }),
                    { status: 404 }
                  )
                )
              )
            )
          )
        ))
    })

    describe("URL construction", () => {
      it.effect("prepends base URL and service path", () =>
        Effect.gen(function*() {
          yield* OData.get("entities('1')", TestEntity)
        }).pipe(
          Effect.provide(
            createTestLayer((request) => {
              expect(request.url).toContain("https://test-server.com")
              expect(request.url).toContain("/sap/opu/odata/sap/TEST_SRV/")
              expect(request.url).toContain("entities('1')")
              return Effect.succeed(
                HttpClientResponse.fromWeb(
                  request,
                  new Response(
                    JSON.stringify({ d: { id: "1", name: "Test", value: 0 } }),
                    { status: 200, headers: { "Content-Type": "application/json" } }
                  )
                )
              )
            })
          )
        ))
    })
  })
})
