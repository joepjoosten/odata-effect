import { describe, expect, it } from "@effect/vitest"
import * as Effect from "effect/Effect"
import * as Schema from "effect/Schema"
import {
  BatchBuilder,
  type BatchChangeset,
  type BatchChangesetResponse,
  type BatchRequest,
  type BatchResponse,
  createBatchBuilder,
  extractResponseBody,
  extractResponseBodyV2,
  findResponseById,
  generateBoundary,
  getFailedResponses,
  isBatchSuccessful,
  parseBatchResponseV2,
  parseBatchResponseV4Json,
  serializeBatchV2,
  serializeBatchV4Json
} from "../src/Batch.js"

describe("Batch", () => {
  describe("createBatchBuilder", () => {
    it("creates a new BatchBuilder", () => {
      const builder = createBatchBuilder()
      expect(builder).toBeInstanceOf(BatchBuilder)
    })
  })

  describe("BatchBuilder", () => {
    describe("get", () => {
      it("adds a GET request", () => {
        const builder = createBatchBuilder()
        builder.get("Products")
        const ops = builder.build()

        expect(ops).toHaveLength(1)
        expect(ops[0]).toMatchObject({
          method: "GET",
          url: "Products"
        })
      })

      it("adds multiple GET requests", () => {
        const builder = createBatchBuilder()
        builder.get("Products").get("Categories")
        const ops = builder.build()

        expect(ops).toHaveLength(2)
      })

      it("adds GET request with headers", () => {
        const builder = createBatchBuilder()
        builder.get("Products", { "Custom-Header": "value" })
        const ops = builder.build()

        expect((ops[0] as BatchRequest).headers).toEqual({ "Custom-Header": "value" })
      })
    })

    describe("CUD operations auto-grouped into changeset", () => {
      it("groups POST into changeset", () => {
        const builder = createBatchBuilder()
        builder.post("Products", { name: "Test" })
        const ops = builder.build()

        expect(ops).toHaveLength(1)
        expect((ops[0] as BatchChangeset).type).toBe("changeset")
        expect((ops[0] as BatchChangeset).requests).toHaveLength(1)
        expect((ops[0] as BatchChangeset).requests[0].method).toBe("POST")
      })

      it("groups multiple CUD operations into same changeset", () => {
        const builder = createBatchBuilder()
        builder
          .post("Products", { name: "Test" })
          .patch("Products('1')", { name: "Updated" })
          .delete("Products('2')")
        const ops = builder.build()

        expect(ops).toHaveLength(1)
        expect((ops[0] as BatchChangeset).type).toBe("changeset")
        expect((ops[0] as BatchChangeset).requests).toHaveLength(3)
      })

      it("creates new changeset after GET", () => {
        const builder = createBatchBuilder()
        builder
          .post("Products", { name: "Test1" })
          .get("Categories")
          .post("Products", { name: "Test2" })
        const ops = builder.build()

        expect(ops).toHaveLength(3)
        expect((ops[0] as BatchChangeset).type).toBe("changeset")
        expect((ops[1] as BatchRequest).method).toBe("GET")
        expect((ops[2] as BatchChangeset).type).toBe("changeset")
      })
    })

    describe("merge", () => {
      it("adds MERGE request (V2)", () => {
        const builder = createBatchBuilder()
        builder.merge("Products('1')", { name: "Updated" })
        const ops = builder.build()

        expect((ops[0] as BatchChangeset).requests[0].method).toBe("MERGE")
      })
    })

    describe("put", () => {
      it("adds PUT request", () => {
        const builder = createBatchBuilder()
        builder.put("Products('1')", { name: "Replaced" })
        const ops = builder.build()

        expect((ops[0] as BatchChangeset).requests[0].method).toBe("PUT")
      })
    })

    describe("beginChangeset / endChangeset", () => {
      it("creates explicit changeset", () => {
        const builder = createBatchBuilder()
        builder
          .beginChangeset()
          .post("Products", { name: "A" })
          .post("Products", { name: "B" })
          .endChangeset()
        const ops = builder.build()

        expect(ops).toHaveLength(1)
        expect((ops[0] as BatchChangeset).type).toBe("changeset")
        expect((ops[0] as BatchChangeset).requests).toHaveLength(2)
      })

      it("returns to parent builder after endChangeset", () => {
        const builder = createBatchBuilder()
        const returned = builder
          .beginChangeset()
          .post("Products", { name: "A" })
          .endChangeset()

        expect(returned).toBe(builder)
      })
    })

    describe("addRequest / addChangeset", () => {
      it("adds raw request", () => {
        const builder = createBatchBuilder()
        builder.addRequest({
          id: "custom-1",
          method: "GET",
          url: "Custom",
          headers: undefined,
          body: undefined
        })
        const ops = builder.build()

        expect(ops).toHaveLength(1)
        expect((ops[0] as BatchRequest).id).toBe("custom-1")
      })

      it("adds raw changeset", () => {
        const builder = createBatchBuilder()
        builder.addChangeset({
          type: "changeset",
          id: "custom-changeset",
          requests: [
            { id: "r1", method: "POST", url: "Test", headers: undefined, body: {} }
          ]
        })
        const ops = builder.build()

        expect(ops).toHaveLength(1)
        expect((ops[0] as BatchChangeset).id).toBe("custom-changeset")
      })
    })
  })

  describe("ChangesetBuilder", () => {
    it("supports all CUD methods", () => {
      const builder = createBatchBuilder()
      builder
        .beginChangeset()
        .post("A", {})
        .patch("B", {})
        .merge("C", {})
        .put("D", {})
        .delete("E")
        .endChangeset()
      const ops = builder.build()

      const changeset = ops[0] as BatchChangeset
      expect(changeset.requests).toHaveLength(5)
      expect(changeset.requests.map((r) => r.method)).toEqual([
        "POST",
        "PATCH",
        "MERGE",
        "PUT",
        "DELETE"
      ])
    })
  })

  describe("generateBoundary", () => {
    it("generates a unique boundary string", () => {
      const b1 = generateBoundary("batch")
      const b2 = generateBoundary("batch")

      expect(b1).toContain("batch_")
      expect(b2).toContain("batch_")
      // Should be unique (highly unlikely to be the same)
      expect(b1).not.toBe(b2)
    })
  })

  describe("serializeBatchV2", () => {
    it("serializes GET requests", () => {
      const ops = createBatchBuilder().get("Products").build()
      const { body, boundary } = serializeBatchV2(ops, "/odata/")

      expect(body).toContain(`--${boundary}`)
      expect(body).toContain("GET /odata/Products HTTP/1.1")
      expect(body).toContain("Content-Type: application/http")
    })

    it("serializes changesets", () => {
      const ops = createBatchBuilder()
        .post("Products", { name: "Test" })
        .build()
      const { body, boundary } = serializeBatchV2(ops, "/odata/")

      expect(body).toContain(`--${boundary}`)
      expect(body).toContain("multipart/mixed; boundary=changeset_")
      expect(body).toContain("POST /odata/Products HTTP/1.1")
    })

    it("includes body for POST requests", () => {
      const ops = createBatchBuilder()
        .post("Products", { name: "Test", value: 123 })
        .build()
      const { body } = serializeBatchV2(ops, "/odata/")

      expect(body).toContain("{\"name\":\"Test\",\"value\":123}")
    })
  })

  describe("serializeBatchV4Json", () => {
    it("serializes requests to V4 JSON format", () => {
      const ops = createBatchBuilder()
        .get("Products")
        .post("Products", { name: "Test" })
        .build()
      const result = serializeBatchV4Json(ops)

      expect(result.requests).toHaveLength(2)
      expect(result.requests[0].method).toBe("GET")
      expect(result.requests[1].method).toBe("POST")
    })

    it("assigns atomicityGroup for changeset requests", () => {
      const ops = createBatchBuilder()
        .beginChangeset()
        .post("A", {})
        .post("B", {})
        .endChangeset()
        .build()
      const result = serializeBatchV4Json(ops)

      expect(result.requests[0].atomicityGroup).toBeDefined()
      expect(result.requests[0].atomicityGroup).toBe(result.requests[1].atomicityGroup)
    })

    it("does not assign atomicityGroup for standalone GET", () => {
      const ops = createBatchBuilder().get("Products").build()
      const result = serializeBatchV4Json(ops)

      expect(result.requests[0].atomicityGroup).toBeUndefined()
    })
  })

  describe("parseBatchResponseV2", () => {
    it("parses individual response", () => {
      // Use CRLF line endings as required by multipart/mixed format
      const responseText = "--batch_123\r\n" +
        "Content-Type: application/http\r\n" +
        "Content-Transfer-Encoding: binary\r\n" +
        "\r\n" +
        "HTTP/1.1 200 OK\r\n" +
        "Content-Type: application/json\r\n" +
        "\r\n" +
        "{\"d\":{\"id\":\"1\",\"name\":\"Test\"}}\r\n" +
        "--batch_123--"

      const responses = parseBatchResponseV2(responseText, "batch_123")

      expect(responses).toHaveLength(1)
      expect((responses[0] as BatchResponse).status).toBe(200)
      expect((responses[0] as BatchResponse).body).toEqual({ d: { id: "1", name: "Test" } })
    })

    it("parses changeset response", () => {
      const responseText = `--batch_123
Content-Type: multipart/mixed; boundary=changeset_456

--changeset_456
Content-Type: application/http
Content-Transfer-Encoding: binary

HTTP/1.1 201 Created
Content-Type: application/json

{"d":{"id":"new"}}
--changeset_456--
--batch_123--`

      const responses = parseBatchResponseV2(responseText, "batch_123")

      expect(responses).toHaveLength(1)
      expect((responses[0] as BatchChangesetResponse).type).toBe("changeset")
      expect((responses[0] as BatchChangesetResponse).responses).toHaveLength(1)
    })

    it("handles 204 No Content", () => {
      const responseText = `--batch_123
Content-Type: application/http
Content-Transfer-Encoding: binary

HTTP/1.1 204 No Content

--batch_123--`

      const responses = parseBatchResponseV2(responseText, "batch_123")

      expect((responses[0] as BatchResponse).status).toBe(204)
    })
  })

  describe("parseBatchResponseV4Json", () => {
    it("parses individual responses", () => {
      const response = {
        responses: [
          { id: "r1", status: 200, headers: undefined, body: { id: "1" }, atomicityGroup: undefined },
          { id: "r2", status: 204, headers: undefined, body: undefined, atomicityGroup: undefined }
        ]
      }

      const results = parseBatchResponseV4Json(response)

      expect(results).toHaveLength(2)
      expect((results[0] as BatchResponse).id).toBe("r1")
      expect((results[1] as BatchResponse).status).toBe(204)
    })

    it("groups atomicityGroup into changeset response", () => {
      const response = {
        responses: [
          { id: "r1", status: 201, headers: undefined, body: undefined, atomicityGroup: "group1" },
          { id: "r2", status: 201, headers: undefined, body: undefined, atomicityGroup: "group1" },
          { id: "r3", status: 200, headers: undefined, body: undefined, atomicityGroup: undefined }
        ]
      }

      const results = parseBatchResponseV4Json(response)

      // Should have 2 results: one changeset and one individual
      expect(results).toHaveLength(2)

      const changeset = results.find((r) => "type" in r && r.type === "changeset") as BatchChangesetResponse
      expect(changeset).toBeDefined()
      expect(changeset.responses).toHaveLength(2)
      expect(changeset.success).toBe(true)
    })
  })

  describe("Helper Functions", () => {
    describe("findResponseById", () => {
      it("finds response in flat list", () => {
        const responses: Array<BatchResponse> = [
          { id: "r1", status: 200, statusText: "OK", headers: {}, body: null },
          { id: "r2", status: 201, statusText: "Created", headers: {}, body: null }
        ]

        const found = findResponseById(responses, "r2")

        expect(found).toBeDefined()
        expect(found!.status).toBe(201)
      })

      it("finds response inside changeset", () => {
        const responses: Array<BatchResponse | BatchChangesetResponse> = [
          {
            type: "changeset",
            id: "cs1",
            success: true,
            responses: [
              { id: "nested", status: 201, statusText: "Created", headers: {}, body: null }
            ]
          }
        ]

        const found = findResponseById(responses, "nested")

        expect(found).toBeDefined()
        expect(found!.id).toBe("nested")
      })

      it("returns undefined for non-existent id", () => {
        const responses: Array<BatchResponse> = [
          { id: "r1", status: 200, statusText: "OK", headers: {}, body: null }
        ]

        const found = findResponseById(responses, "nonexistent")

        expect(found).toBeUndefined()
      })
    })

    describe("isBatchSuccessful", () => {
      it("returns true when all responses are successful", () => {
        const responses: Array<BatchResponse> = [
          { id: "r1", status: 200, statusText: "OK", headers: {}, body: null },
          { id: "r2", status: 201, statusText: "Created", headers: {}, body: null },
          { id: "r3", status: 204, statusText: "No Content", headers: {}, body: null }
        ]

        expect(isBatchSuccessful(responses)).toBe(true)
      })

      it("returns false when any response failed", () => {
        const responses: Array<BatchResponse> = [
          { id: "r1", status: 200, statusText: "OK", headers: {}, body: null },
          { id: "r2", status: 400, statusText: "Bad Request", headers: {}, body: null }
        ]

        expect(isBatchSuccessful(responses)).toBe(false)
      })

      it("returns false when changeset failed", () => {
        const responses: Array<BatchResponse | BatchChangesetResponse> = [
          {
            type: "changeset",
            id: "cs1",
            success: false,
            responses: [
              { id: "r1", status: 500, statusText: "Error", headers: {}, body: null }
            ]
          }
        ]

        expect(isBatchSuccessful(responses)).toBe(false)
      })
    })

    describe("getFailedResponses", () => {
      it("returns empty array when all successful", () => {
        const responses: Array<BatchResponse> = [
          { id: "r1", status: 200, statusText: "OK", headers: {}, body: null }
        ]

        expect(getFailedResponses(responses)).toHaveLength(0)
      })

      it("returns failed responses", () => {
        const responses: Array<BatchResponse> = [
          { id: "r1", status: 200, statusText: "OK", headers: {}, body: null },
          { id: "r2", status: 404, statusText: "Not Found", headers: {}, body: null },
          { id: "r3", status: 500, statusText: "Error", headers: {}, body: null }
        ]

        const failed = getFailedResponses(responses)

        expect(failed).toHaveLength(2)
        expect(failed.map((r) => r.id)).toEqual(["r2", "r3"])
      })

      it("extracts failed responses from changesets", () => {
        const responses: Array<BatchResponse | BatchChangesetResponse> = [
          {
            type: "changeset",
            id: "cs1",
            success: false,
            responses: [
              { id: "r1", status: 201, statusText: "Created", headers: {}, body: null },
              { id: "r2", status: 409, statusText: "Conflict", headers: {}, body: null }
            ]
          }
        ]

        const failed = getFailedResponses(responses)

        expect(failed).toHaveLength(1)
        expect(failed[0].id).toBe("r2")
      })
    })

    describe("extractResponseBody", () => {
      it.effect("extracts and validates response body", () =>
        Effect.gen(function*() {
          const TestSchema = Schema.Struct({
            id: Schema.String,
            value: Schema.Number
          })

          const response: BatchResponse = {
            id: "r1",
            status: 200,
            statusText: "OK",
            headers: {},
            body: { id: "123", value: 42 }
          }

          const result = yield* extractResponseBody(response, TestSchema)

          expect(result.id).toBe("123")
          expect(result.value).toBe(42)
        }))

      it.effect("fails on invalid body", () =>
        Effect.gen(function*() {
          const TestSchema = Schema.Struct({
            id: Schema.String,
            value: Schema.Number
          })

          const response: BatchResponse = {
            id: "r1",
            status: 200,
            statusText: "OK",
            headers: {},
            body: { id: "123", value: "not a number" }
          }

          const result = yield* extractResponseBody(response, TestSchema).pipe(Effect.flip)

          expect(result._tag).toBe("ParseError")
        }))
    })

    describe("extractResponseBodyV2", () => {
      it.effect("extracts and unwraps V2 response body", () =>
        Effect.gen(function*() {
          const TestSchema = Schema.Struct({
            id: Schema.String,
            name: Schema.String
          })

          const response: BatchResponse = {
            id: "r1",
            status: 200,
            statusText: "OK",
            headers: {},
            body: { d: { id: "123", name: "Test" } }
          }

          const result = yield* extractResponseBodyV2(response, TestSchema)

          expect(result.id).toBe("123")
          expect(result.name).toBe("Test")
        }))
    })
  })
})
