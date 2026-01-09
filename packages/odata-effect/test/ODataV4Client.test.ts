import { describe, expect, it } from "@effect/vitest"
import * as Effect from "effect/Effect"
import * as Schema from "effect/Schema"
import {
  buildEntityPathV4,
  ODataV4Annotations,
  ODataV4ClientConfig,
  ODataV4CollectionResponse,
  ODataV4ValueResponse
} from "../src/ODataV4.js"

describe("ODataV4Client", () => {
  describe("ODataV4Annotations", () => {
    it.effect("decodes empty annotations object", () =>
      Effect.gen(function*() {
        const result = yield* Schema.decodeUnknown(ODataV4Annotations)({})
        expect(result).toEqual({})
      }))

    it.effect("decodes all annotation fields", () =>
      Effect.gen(function*() {
        const data = {
          "@odata.context": "$metadata#Products",
          "@odata.type": "#Namespace.Product",
          "@odata.etag": "W/\"abc123\"",
          "@odata.id": "Products(1)",
          "@odata.editLink": "Products(1)",
          "@odata.readLink": "Products(1)",
          "@odata.metadataEtag": "W/\"meta123\""
        }
        const result = yield* Schema.decodeUnknown(ODataV4Annotations)(data)
        expect(result["@odata.context"]).toBe("$metadata#Products")
        expect(result["@odata.type"]).toBe("#Namespace.Product")
        expect(result["@odata.etag"]).toBe("W/\"abc123\"")
        expect(result["@odata.id"]).toBe("Products(1)")
        expect(result["@odata.editLink"]).toBe("Products(1)")
        expect(result["@odata.readLink"]).toBe("Products(1)")
        expect(result["@odata.metadataEtag"]).toBe("W/\"meta123\"")
      }))

    it.effect("handles null values", () =>
      Effect.gen(function*() {
        const data = {
          "@odata.context": null,
          "@odata.etag": null
        }
        const result = yield* Schema.decodeUnknown(ODataV4Annotations)(data)
        expect(result["@odata.context"]).toBeUndefined()
        expect(result["@odata.etag"]).toBeUndefined()
      }))

    it.effect("handles partial annotations", () =>
      Effect.gen(function*() {
        const data = {
          "@odata.context": "$metadata#Products",
          "@odata.etag": "W/\"123\""
        }
        const result = yield* Schema.decodeUnknown(ODataV4Annotations)(data)
        expect(result["@odata.context"]).toBe("$metadata#Products")
        expect(result["@odata.etag"]).toBe("W/\"123\"")
        expect(result["@odata.type"]).toBeUndefined()
      }))
  })

  describe("ODataV4CollectionResponse", () => {
    const ProductSchema = Schema.Struct({
      id: Schema.Number,
      name: Schema.String
    })

    it.effect("decodes collection with value array", () =>
      Effect.gen(function*() {
        const data = {
          value: [
            { id: 1, name: "Product 1" },
            { id: 2, name: "Product 2" }
          ]
        }
        const ResponseSchema = ODataV4CollectionResponse(ProductSchema)
        const result = yield* Schema.decodeUnknown(ResponseSchema)(data)
        expect(result.value).toHaveLength(2)
        expect(result.value[0].id).toBe(1)
        expect(result.value[1].name).toBe("Product 2")
      }))

    it.effect("decodes collection with count", () =>
      Effect.gen(function*() {
        const data = {
          "@odata.count": 100,
          value: [{ id: 1, name: "Product 1" }]
        }
        const ResponseSchema = ODataV4CollectionResponse(ProductSchema)
        const result = yield* Schema.decodeUnknown(ResponseSchema)(data)
        expect(result["@odata.count"]).toBe(100)
      }))

    it.effect("decodes collection with nextLink", () =>
      Effect.gen(function*() {
        const data = {
          "@odata.nextLink": "Products?$skip=10&$top=10",
          value: [{ id: 1, name: "Product 1" }]
        }
        const ResponseSchema = ODataV4CollectionResponse(ProductSchema)
        const result = yield* Schema.decodeUnknown(ResponseSchema)(data)
        expect(result["@odata.nextLink"]).toBe("Products?$skip=10&$top=10")
      }))

    it.effect("decodes empty collection", () =>
      Effect.gen(function*() {
        const data = {
          "@odata.context": "$metadata#Products",
          value: []
        }
        const ResponseSchema = ODataV4CollectionResponse(ProductSchema)
        const result = yield* Schema.decodeUnknown(ResponseSchema)(data)
        expect(result.value).toHaveLength(0)
        expect(result["@odata.context"]).toBe("$metadata#Products")
      }))

    it.effect("decodes complete paged response", () =>
      Effect.gen(function*() {
        const data = {
          "@odata.context": "$metadata#Products",
          "@odata.count": 50,
          "@odata.nextLink": "Products?$skip=10",
          value: [
            { id: 1, name: "Product 1" },
            { id: 2, name: "Product 2" }
          ]
        }
        const ResponseSchema = ODataV4CollectionResponse(ProductSchema)
        const result = yield* Schema.decodeUnknown(ResponseSchema)(data)
        expect(result["@odata.context"]).toBe("$metadata#Products")
        expect(result["@odata.count"]).toBe(50)
        expect(result["@odata.nextLink"]).toBe("Products?$skip=10")
        expect(result.value).toHaveLength(2)
      }))
  })

  describe("ODataV4ValueResponse", () => {
    it.effect("decodes string value", () =>
      Effect.gen(function*() {
        const data = {
          "@odata.context": "$metadata#Products(1)/name",
          value: "Widget"
        }
        const ResponseSchema = ODataV4ValueResponse(Schema.String)
        const result = yield* Schema.decodeUnknown(ResponseSchema)(data)
        expect(result.value).toBe("Widget")
        expect(result["@odata.context"]).toBe("$metadata#Products(1)/name")
      }))

    it.effect("decodes number value", () =>
      Effect.gen(function*() {
        const data = {
          value: 42
        }
        const ResponseSchema = ODataV4ValueResponse(Schema.Number)
        const result = yield* Schema.decodeUnknown(ResponseSchema)(data)
        expect(result.value).toBe(42)
      }))

    it.effect("decodes boolean value", () =>
      Effect.gen(function*() {
        const data = {
          value: true
        }
        const ResponseSchema = ODataV4ValueResponse(Schema.Boolean)
        const result = yield* Schema.decodeUnknown(ResponseSchema)(data)
        expect(result.value).toBe(true)
      }))
  })

  describe("ODataV4ClientConfig", () => {
    it("is a Context.Tag", () => {
      expect(ODataV4ClientConfig.key).toBe("ODataV4ClientConfig")
    })
  })

  describe("buildEntityPathV4", () => {
    it("builds path with string ID", () => {
      const path = buildEntityPathV4("Products", "abc-123")
      expect(path).toBe("Products('abc-123')")
    })

    it("builds path with number ID", () => {
      const path = buildEntityPathV4("Products", 123)
      expect(path).toBe("Products(123)")
    })

    it("builds path with single key object (string value)", () => {
      const path = buildEntityPathV4("Products", { ProductID: "abc" })
      expect(path).toBe("Products('abc')")
    })

    it("builds path with single key object (number value)", () => {
      const path = buildEntityPathV4("Products", { ProductID: 123 })
      expect(path).toBe("Products(123)")
    })

    it("builds path with composite key (strings)", () => {
      const path = buildEntityPathV4("OrderItems", {
        OrderID: "ORD-001",
        ItemNumber: "001"
      })
      expect(path).toBe("OrderItems(OrderID='ORD-001',ItemNumber='001')")
    })

    it("builds path with composite key (numbers)", () => {
      const path = buildEntityPathV4("OrderItems", {
        OrderID: 1,
        ItemNumber: 10
      })
      expect(path).toBe("OrderItems(OrderID=1,ItemNumber=10)")
    })

    it("builds path with composite key (mixed types)", () => {
      const path = buildEntityPathV4("OrderItems", {
        OrderID: 1,
        ItemNumber: "A1"
      })
      expect(path).toBe("OrderItems(OrderID=1,ItemNumber='A1')")
    })

    it("handles UUID-style string IDs", () => {
      const path = buildEntityPathV4(
        "Products",
        "550e8400-e29b-41d4-a716-446655440000"
      )
      expect(path).toBe("Products('550e8400-e29b-41d4-a716-446655440000')")
    })

    it("handles zero as number ID", () => {
      const path = buildEntityPathV4("Products", 0)
      expect(path).toBe("Products(0)")
    })

    it("handles empty string ID", () => {
      const path = buildEntityPathV4("Products", "")
      expect(path).toBe("Products('')")
    })
  })
})
