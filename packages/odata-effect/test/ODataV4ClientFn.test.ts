import { describe, expect, it } from "@effect/vitest"
import * as Effect from "effect/Effect"
import * as Layer from "effect/Layer"
import * as Schema from "effect/Schema"
import {
  HttpClient,
  HttpClientRequest,
  HttpClientResponse
} from "@effect/platform"
import { ODataV4ClientConfig } from "../src/ODataV4Client.js"
import * as ODataV4 from "../src/ODataV4ClientFn.js"

// Test schema
class TestEntity extends Schema.Class<TestEntity>("TestEntity")({
  id: Schema.Number,
  name: Schema.String,
  value: Schema.Number
}) {}

const EditableTestEntity = Schema.Struct({
  name: Schema.String,
  value: Schema.Number
})

// Test configuration layer
const testConfig = Layer.succeed(ODataV4ClientConfig, {
  baseUrl: "https://test-server.com",
  servicePath: "/odata/v4/"
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

describe("ODataV4ClientFn", () => {
  describe("get", () => {
    it.effect("fetches a single entity (V4 format)", () =>
      Effect.gen(function* () {
        const result = yield* ODataV4.get("Products(1)", TestEntity)

        expect(result.id).toBe(1)
        expect(result.name).toBe("Test Product")
        expect(result.value).toBe(100)
      }).pipe(
        Effect.provide(
          createTestLayer((request) =>
            Effect.succeed(
              HttpClientResponse.fromWeb(
                request,
                new Response(
                  JSON.stringify({ id: 1, name: "Test Product", value: 100 }),
                  { status: 200, headers: { "Content-Type": "application/json" } }
                )
              )
            )
          )
        )
      )
    )

    it.effect("includes query options in URL", () =>
      Effect.gen(function* () {
        yield* ODataV4.get("Products(1)", TestEntity, {
          $select: "id,name",
          $expand: "category"
        })
      }).pipe(
        Effect.provide(
          createTestLayer((request) => {
            expect(request.url).toContain("$select=id%2Cname")
            expect(request.url).toContain("$expand=category")
            return Effect.succeed(
              HttpClientResponse.fromWeb(
                request,
                new Response(
                  JSON.stringify({ id: 1, name: "Test", value: 0 }),
                  { status: 200, headers: { "Content-Type": "application/json" } }
                )
              )
            )
          })
        )
      )
    )

    it.effect("sets OData-Version header", () =>
      Effect.gen(function* () {
        yield* ODataV4.get("Products(1)", TestEntity)
      }).pipe(
        Effect.provide(
          createTestLayer((request) => {
            expect(request.headers["odata-version"]).toBe("4.0")
            return Effect.succeed(
              HttpClientResponse.fromWeb(
                request,
                new Response(
                  JSON.stringify({ id: 1, name: "Test", value: 0 }),
                  { status: 200, headers: { "Content-Type": "application/json" } }
                )
              )
            )
          })
        )
      )
    )
  })

  describe("getCollection", () => {
    it.effect("fetches a collection (V4 format)", () =>
      Effect.gen(function* () {
        const results = yield* ODataV4.getCollection("Products", TestEntity)

        expect(results).toHaveLength(3)
        expect(results[0].id).toBe(1)
        expect(results[1].id).toBe(2)
        expect(results[2].id).toBe(3)
      }).pipe(
        Effect.provide(
          createTestLayer((request) =>
            Effect.succeed(
              HttpClientResponse.fromWeb(
                request,
                new Response(
                  JSON.stringify({
                    value: [
                      { id: 1, name: "Product 1", value: 10 },
                      { id: 2, name: "Product 2", value: 20 },
                      { id: 3, name: "Product 3", value: 30 }
                    ]
                  }),
                  { status: 200, headers: { "Content-Type": "application/json" } }
                )
              )
            )
          )
        )
      )
    )

    it.effect("handles empty collection", () =>
      Effect.gen(function* () {
        const results = yield* ODataV4.getCollection("Products", TestEntity)
        expect(results).toHaveLength(0)
      }).pipe(
        Effect.provide(
          createTestLayer((request) =>
            Effect.succeed(
              HttpClientResponse.fromWeb(
                request,
                new Response(
                  JSON.stringify({ value: [] }),
                  { status: 200, headers: { "Content-Type": "application/json" } }
                )
              )
            )
          )
        )
      )
    )

    it.effect("supports V4-specific query options", () =>
      Effect.gen(function* () {
        yield* ODataV4.getCollection("Products", TestEntity, {
          $count: true,
          $search: "widget",
          $apply: "groupby(category)"
        })
      }).pipe(
        Effect.provide(
          createTestLayer((request) => {
            expect(request.url).toContain("$count=true")
            expect(request.url).toContain("$search=widget")
            expect(request.url).toContain("$apply=groupby")
            return Effect.succeed(
              HttpClientResponse.fromWeb(
                request,
                new Response(
                  JSON.stringify({ value: [] }),
                  { status: 200, headers: { "Content-Type": "application/json" } }
                )
              )
            )
          })
        )
      )
    )
  })

  describe("getCollectionPaged", () => {
    it.effect("returns pagination metadata", () =>
      Effect.gen(function* () {
        const result = yield* ODataV4.getCollectionPaged("Products", TestEntity, {
          $count: true,
          $top: 2
        })

        expect(result.value).toHaveLength(2)
        expect(result.count).toBe(10)
        expect(result.nextLink).toBe("Products?$skip=2&$top=2")
        expect(result.context).toBe("$metadata#Products")
      }).pipe(
        Effect.provide(
          createTestLayer((request) =>
            Effect.succeed(
              HttpClientResponse.fromWeb(
                request,
                new Response(
                  JSON.stringify({
                    "@odata.context": "$metadata#Products",
                    "@odata.count": 10,
                    "@odata.nextLink": "Products?$skip=2&$top=2",
                    value: [
                      { id: 1, name: "Product 1", value: 10 },
                      { id: 2, name: "Product 2", value: 20 }
                    ]
                  }),
                  { status: 200, headers: { "Content-Type": "application/json" } }
                )
              )
            )
          )
        )
      )
    )

    it.effect("handles missing optional metadata", () =>
      Effect.gen(function* () {
        const result = yield* ODataV4.getCollectionPaged("Products", TestEntity)

        expect(result.count).toBeUndefined()
        expect(result.nextLink).toBeUndefined()
      }).pipe(
        Effect.provide(
          createTestLayer((request) =>
            Effect.succeed(
              HttpClientResponse.fromWeb(
                request,
                new Response(
                  JSON.stringify({ value: [] }),
                  { status: 200, headers: { "Content-Type": "application/json" } }
                )
              )
            )
          )
        )
      )
    )
  })

  describe("getValue", () => {
    it.effect("fetches a single value (V4 format)", () =>
      Effect.gen(function* () {
        const result = yield* ODataV4.getValue("Products(1)/name", Schema.String)
        expect(result).toBe("Widget")
      }).pipe(
        Effect.provide(
          createTestLayer((request) =>
            Effect.succeed(
              HttpClientResponse.fromWeb(
                request,
                new Response(
                  JSON.stringify({ value: "Widget" }),
                  { status: 200, headers: { "Content-Type": "application/json" } }
                )
              )
            )
          )
        )
      )
    )
  })

  describe("post", () => {
    it.effect("creates an entity (V4 format)", () =>
      Effect.gen(function* () {
        const result = yield* ODataV4.post(
          "Products",
          { name: "New Product", value: 50 },
          EditableTestEntity,
          TestEntity
        )

        expect(result.id).toBe(999)
        expect(result.name).toBe("New Product")
      }).pipe(
        Effect.provide(
          createTestLayer((request) => {
            expect(request.method).toBe("POST")
            return Effect.succeed(
              HttpClientResponse.fromWeb(
                request,
                new Response(
                  JSON.stringify({ id: 999, name: "New Product", value: 50 }),
                  { status: 201, headers: { "Content-Type": "application/json" } }
                )
              )
            )
          })
        )
      )
    )

    it.effect("applies request options", () =>
      Effect.gen(function* () {
        yield* ODataV4.post(
          "Products",
          { name: "Test", value: 1 },
          EditableTestEntity,
          TestEntity,
          { prefer: { return: "representation" } }
        )
      }).pipe(
        Effect.provide(
          createTestLayer((request) => {
            expect(request.headers["prefer"]).toBe("return=representation")
            return Effect.succeed(
              HttpClientResponse.fromWeb(
                request,
                new Response(
                  JSON.stringify({ id: 1, name: "Test", value: 1 }),
                  { status: 201, headers: { "Content-Type": "application/json" } }
                )
              )
            )
          })
        )
      )
    )
  })

  describe("patch", () => {
    it.effect("uses native PATCH method (V4)", () =>
      Effect.gen(function* () {
        yield* ODataV4.patch(
          "Products(1)",
          { name: "Updated" },
          Schema.partial(EditableTestEntity)
        )
      }).pipe(
        Effect.provide(
          createTestLayer((request) => {
            expect(request.method).toBe("PATCH")
            return Effect.succeed(
              HttpClientResponse.fromWeb(
                request,
                new Response(null, { status: 204 })
              )
            )
          })
        )
      )
    )

    it.effect("includes If-Match header with ETag", () =>
      Effect.gen(function* () {
        yield* ODataV4.patch(
          "Products(1)",
          { name: "Updated" },
          Schema.partial(EditableTestEntity),
          { etag: 'W/"abc123"' }
        )
      }).pipe(
        Effect.provide(
          createTestLayer((request) => {
            expect(request.headers["if-match"]).toBe('W/"abc123"')
            return Effect.succeed(
              HttpClientResponse.fromWeb(
                request,
                new Response(null, { status: 204 })
              )
            )
          })
        )
      )
    )

    it.effect("uses If-Match: * with forceUpdate", () =>
      Effect.gen(function* () {
        yield* ODataV4.patch(
          "Products(1)",
          { name: "Updated" },
          Schema.partial(EditableTestEntity),
          { forceUpdate: true }
        )
      }).pipe(
        Effect.provide(
          createTestLayer((request) => {
            expect(request.headers["if-match"]).toBe("*")
            return Effect.succeed(
              HttpClientResponse.fromWeb(
                request,
                new Response(null, { status: 204 })
              )
            )
          })
        )
      )
    )
  })

  describe("put", () => {
    it.effect("uses PUT method for full replacement", () =>
      Effect.gen(function* () {
        yield* ODataV4.put(
          "Products(1)",
          { name: "Replaced", value: 999 },
          EditableTestEntity
        )
      }).pipe(
        Effect.provide(
          createTestLayer((request) => {
            expect(request.method).toBe("PUT")
            return Effect.succeed(
              HttpClientResponse.fromWeb(
                request,
                new Response(null, { status: 204 })
              )
            )
          })
        )
      )
    )
  })

  describe("del", () => {
    it.effect("deletes an entity", () =>
      Effect.gen(function* () {
        const result = yield* ODataV4.del("Products(1)")
        expect(result).toBeUndefined()
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
      )
    )

    it.effect("includes If-Match header", () =>
      Effect.gen(function* () {
        yield* ODataV4.del("Products(1)", { etag: 'W/"xyz"' })
      }).pipe(
        Effect.provide(
          createTestLayer((request) => {
            expect(request.headers["if-match"]).toBe('W/"xyz"')
            return Effect.succeed(
              HttpClientResponse.fromWeb(
                request,
                new Response(null, { status: 204 })
              )
            )
          })
        )
      )
    )
  })

  describe("error handling", () => {
    it.effect("wraps HTTP errors in ODataError", () =>
      Effect.gen(function* () {
        const result = yield* ODataV4.get("Products(999)", TestEntity).pipe(Effect.flip)
        expect(result._tag).toBe("ODataError")
      }).pipe(
        Effect.provide(
          createTestLayer((request) =>
            Effect.succeed(
              HttpClientResponse.fromWeb(
                request,
                new Response(
                  JSON.stringify({ error: { code: "404", message: "Not found" } }),
                  { status: 404 }
                )
              )
            )
          )
        )
      )
    )
  })

  describe("URL construction", () => {
    it.effect("prepends base URL and service path", () =>
      Effect.gen(function* () {
        yield* ODataV4.get("Products(1)", TestEntity)
      }).pipe(
        Effect.provide(
          createTestLayer((request) => {
            expect(request.url).toContain("https://test-server.com")
            expect(request.url).toContain("/odata/v4/")
            expect(request.url).toContain("Products(1)")
            return Effect.succeed(
              HttpClientResponse.fromWeb(
                request,
                new Response(
                  JSON.stringify({ id: 1, name: "Test", value: 0 }),
                  { status: 200, headers: { "Content-Type": "application/json" } }
                )
              )
            )
          })
        )
      )
    )
  })

  describe("delete alias", () => {
    it("exports del as delete", () => {
      expect(ODataV4.delete).toBe(ODataV4.del)
    })
  })
})
