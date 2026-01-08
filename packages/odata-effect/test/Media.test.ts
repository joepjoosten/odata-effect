import { describe, expect, it } from "@effect/vitest"
import * as Effect from "effect/Effect"
import * as Schema from "effect/Schema"
import {
  HttpClient,
  HttpClientRequest,
  HttpClientResponse
} from "@effect/platform"
import {
  getMediaV2,
  getMediaStreamV2,
  uploadMediaV2,
  updateMediaV2,
  deleteMediaV2,
  getMediaV4,
  getMediaStreamV4,
  uploadMediaV4,
  updateMediaV4,
  deleteMediaV4,
  buildMediaValuePath,
  buildMediaPropertyPath,
  isBinaryContentType,
  getExtensionFromContentType,
  getContentTypeFromExtension
} from "../src/Media.js"

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

describe("Media", () => {
  describe("Helper Functions", () => {
    describe("buildMediaValuePath", () => {
      it("adds /$value suffix", () => {
        const path = buildMediaValuePath("Attachments('123')")
        expect(path).toBe("Attachments('123')/$value")
      })

      it("does not duplicate /$value suffix", () => {
        const path = buildMediaValuePath("Attachments('123')/$value")
        expect(path).toBe("Attachments('123')/$value")
      })
    })

    describe("buildMediaPropertyPath", () => {
      it("builds path for binary property", () => {
        const path = buildMediaPropertyPath("Products('1')", "Image")
        expect(path).toBe("Products('1')/Image/$value")
      })
    })

    describe("isBinaryContentType", () => {
      it("returns true for application/octet-stream", () => {
        expect(isBinaryContentType("application/octet-stream")).toBe(true)
      })

      it("returns true for application/pdf", () => {
        expect(isBinaryContentType("application/pdf")).toBe(true)
      })

      it("returns true for image types", () => {
        expect(isBinaryContentType("image/jpeg")).toBe(true)
        expect(isBinaryContentType("image/png")).toBe(true)
        expect(isBinaryContentType("image/gif")).toBe(true)
      })

      it("returns true for audio types", () => {
        expect(isBinaryContentType("audio/mpeg")).toBe(true)
      })

      it("returns true for video types", () => {
        expect(isBinaryContentType("video/mp4")).toBe(true)
      })

      it("returns true for MS Office types", () => {
        expect(isBinaryContentType("application/vnd.ms-excel")).toBe(true)
        expect(isBinaryContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")).toBe(true)
      })

      it("returns false for text/plain", () => {
        expect(isBinaryContentType("text/plain")).toBe(false)
      })

      it("returns false for application/json", () => {
        expect(isBinaryContentType("application/json")).toBe(false)
      })
    })

    describe("getExtensionFromContentType", () => {
      it("returns pdf for application/pdf", () => {
        expect(getExtensionFromContentType("application/pdf")).toBe("pdf")
      })

      it("returns json for application/json", () => {
        expect(getExtensionFromContentType("application/json")).toBe("json")
      })

      it("returns jpg for image/jpeg", () => {
        expect(getExtensionFromContentType("image/jpeg")).toBe("jpg")
      })

      it("returns xlsx for Excel OOXML", () => {
        expect(getExtensionFromContentType(
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )).toBe("xlsx")
      })

      it("returns undefined for unknown type", () => {
        expect(getExtensionFromContentType("application/unknown")).toBeUndefined()
      })

      it("handles content type with charset", () => {
        expect(getExtensionFromContentType("application/json; charset=utf-8")).toBe("json")
      })
    })

    describe("getContentTypeFromExtension", () => {
      it("returns application/pdf for pdf", () => {
        expect(getContentTypeFromExtension("pdf")).toBe("application/pdf")
      })

      it("returns image/jpeg for jpg", () => {
        expect(getContentTypeFromExtension("jpg")).toBe("image/jpeg")
      })

      it("returns image/jpeg for jpeg", () => {
        expect(getContentTypeFromExtension("jpeg")).toBe("image/jpeg")
      })

      it("handles extension with dot", () => {
        expect(getContentTypeFromExtension(".pdf")).toBe("application/pdf")
      })

      it("handles uppercase extension", () => {
        expect(getContentTypeFromExtension("PDF")).toBe("application/pdf")
      })

      it("returns application/octet-stream for unknown", () => {
        expect(getContentTypeFromExtension("xyz")).toBe("application/octet-stream")
      })
    })
  })

  describe("V2 Media Operations", () => {
    describe("getMediaV2", () => {
      it.effect("downloads binary content", () =>
        Effect.gen(function* () {
          const testData = new Uint8Array([1, 2, 3, 4, 5])

          const mockClient = createMockClient((request) =>
            Effect.succeed(
              HttpClientResponse.fromWeb(
                request,
                new Response(testData, {
                  status: 200,
                  headers: {
                    "Content-Type": "application/pdf",
                    "Content-Length": "5",
                    "ETag": 'W/"abc123"'
                  }
                })
              )
            )
          )

          const result = yield* getMediaV2(
            mockClient,
            v2Config,
            "Attachments('123')/$value"
          )

          expect(result.data).toEqual(testData)
          expect(result.contentType).toBe("application/pdf")
          expect(result.contentLength).toBe(5)
          expect(result.etag).toBe('W/"abc123"')
        })
      )

      it.effect("uses Accept header from options", () =>
        Effect.gen(function* () {
          let capturedRequest: HttpClientRequest.HttpClientRequest | null = null

          const mockClient = createMockClient((request) => {
            capturedRequest = request
            return Effect.succeed(
              HttpClientResponse.fromWeb(
                request,
                new Response(new Uint8Array([]), { status: 200 })
              )
            )
          })

          yield* getMediaV2(mockClient, v2Config, "Test", {
            contentType: "image/jpeg",
            headers: undefined
          })

          expect(capturedRequest!.headers["accept"]).toBe("image/jpeg")
        })
      )
    })

    describe("getMediaStreamV2", () => {
      it.effect("returns stream result", () =>
        Effect.gen(function* () {
          const mockClient = createMockClient((request) =>
            Effect.succeed(
              HttpClientResponse.fromWeb(
                request,
                new Response(new Uint8Array([1, 2, 3]), {
                  status: 200,
                  headers: { "Content-Type": "application/pdf" }
                })
              )
            )
          )

          const result = yield* getMediaStreamV2(
            mockClient,
            v2Config,
            "Documents('1')/$value"
          )

          expect(result.contentType).toBe("application/pdf")
          expect(result.stream).toBeDefined()
        })
      )
    })

    describe("uploadMediaV2", () => {
      it.effect("uploads binary content", () =>
        Effect.gen(function* () {
          let capturedRequest: HttpClientRequest.HttpClientRequest | null = null

          const mockClient = createMockClient((request) => {
            capturedRequest = request
            return Effect.succeed(
              HttpClientResponse.fromWeb(
                request,
                new Response(
                  JSON.stringify({ d: { id: "new-id" } }),
                  { status: 201, headers: { "Content-Type": "application/json" } }
                )
              )
            )
          })

          const data = new Uint8Array([1, 2, 3, 4, 5])
          const result = yield* uploadMediaV2(
            mockClient,
            v2Config,
            "Attachments",
            data,
            {
              contentType: "application/pdf",
              slug: "document.pdf",
              headers: undefined,
              contentId: undefined
            },
            Schema.Struct({ id: Schema.String })
          )

          expect(capturedRequest!.method).toBe("POST")
          expect(capturedRequest!.headers["content-type"]).toBe("application/pdf")
          expect(capturedRequest!.headers["slug"]).toBe("document.pdf")
          expect(result!.id).toBe("new-id")
        })
      )

      it.effect("returns void when no response schema", () =>
        Effect.gen(function* () {
          const mockClient = createMockClient((request) =>
            Effect.succeed(
              HttpClientResponse.fromWeb(
                request,
                new Response(null, { status: 204 })
              )
            )
          )

          const result = yield* uploadMediaV2<void, never, never>(
            mockClient,
            v2Config,
            "Attachments",
            new Uint8Array([1, 2, 3]),
            {
              contentType: "application/pdf",
              slug: undefined,
              headers: undefined,
              contentId: undefined
            }
          )

          expect(result).toBeUndefined()
        })
      )
    })

    describe("updateMediaV2", () => {
      it.effect("updates binary content with PUT", () =>
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

          yield* updateMediaV2(
            mockClient,
            v2Config,
            "Attachments('123')/$value",
            new Uint8Array([1, 2, 3]),
            {
              contentType: "application/pdf",
              etag: 'W/"old"',
              headers: undefined,
              slug: undefined,
              contentId: undefined
            }
          )

          expect(capturedRequest!.method).toBe("PUT")
          expect(capturedRequest!.headers["if-match"]).toBe('W/"old"')
        })
      )
    })

    describe("deleteMediaV2", () => {
      it.effect("deletes media content", () =>
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

          yield* deleteMediaV2(
            mockClient,
            v2Config,
            "Attachments('123')/$value",
            'W/"etag"'
          )

          expect(capturedRequest!.method).toBe("DELETE")
          expect(capturedRequest!.headers["if-match"]).toBe('W/"etag"')
        })
      )
    })
  })

  describe("V4 Media Operations", () => {
    describe("getMediaV4", () => {
      it.effect("downloads binary content with V4 headers", () =>
        Effect.gen(function* () {
          let capturedRequest: HttpClientRequest.HttpClientRequest | null = null
          const testData = new Uint8Array([1, 2, 3])

          const mockClient = createMockClient((request) => {
            capturedRequest = request
            return Effect.succeed(
              HttpClientResponse.fromWeb(
                request,
                new Response(testData, {
                  status: 200,
                  headers: { "Content-Type": "image/png" }
                })
              )
            )
          })

          const result = yield* getMediaV4(
            mockClient,
            v4Config,
            "Photos(1)/$value"
          )

          expect(capturedRequest!.headers["odata-version"]).toBe("4.0")
          expect(result.contentType).toBe("image/png")
        })
      )
    })

    describe("getMediaStreamV4", () => {
      it.effect("returns stream result with V4 headers", () =>
        Effect.gen(function* () {
          const mockClient = createMockClient((request) =>
            Effect.succeed(
              HttpClientResponse.fromWeb(
                request,
                new Response(new Uint8Array([1, 2, 3]), {
                  status: 200,
                  headers: { "Content-Type": "video/mp4" }
                })
              )
            )
          )

          const result = yield* getMediaStreamV4(
            mockClient,
            v4Config,
            "Videos(1)/$value"
          )

          expect(result.stream).toBeDefined()
        })
      )
    })

    describe("uploadMediaV4", () => {
      it.effect("uploads with Content-Disposition header", () =>
        Effect.gen(function* () {
          let capturedRequest: HttpClientRequest.HttpClientRequest | null = null

          const mockClient = createMockClient((request) => {
            capturedRequest = request
            return Effect.succeed(
              HttpClientResponse.fromWeb(
                request,
                new Response(
                  JSON.stringify({ id: 1 }),
                  { status: 201, headers: { "Content-Type": "application/json" } }
                )
              )
            )
          })

          yield* uploadMediaV4(
            mockClient,
            v4Config,
            "Photos",
            new Uint8Array([1, 2, 3]),
            {
              contentType: "image/jpeg",
              slug: "photo.jpg",
              headers: undefined,
              contentId: undefined
            },
            Schema.Struct({ id: Schema.Number })
          )

          expect(capturedRequest!.headers["content-disposition"]).toBe('attachment; filename="photo.jpg"')
          expect(capturedRequest!.headers["odata-version"]).toBe("4.0")
        })
      )
    })

    describe("updateMediaV4", () => {
      it.effect("updates with V4 headers", () =>
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

          yield* updateMediaV4(
            mockClient,
            v4Config,
            "Photos(1)/$value",
            new Uint8Array([1, 2, 3]),
            {
              contentType: "image/jpeg",
              headers: undefined,
              slug: undefined,
              contentId: undefined
            }
          )

          expect(capturedRequest!.headers["odata-version"]).toBe("4.0")
        })
      )
    })

    describe("deleteMediaV4", () => {
      it.effect("deletes with V4 headers", () =>
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

          yield* deleteMediaV4(mockClient, v4Config, "Photos(1)/$value")

          expect(capturedRequest!.headers["odata-version"]).toBe("4.0")
        })
      )
    })
  })
})
