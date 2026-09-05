import * as NodeHttpClient from "@effect/platform-node/NodeHttpClient"
import { Config } from "@odata-effect/odata-effect"
import * as Context from "effect/Context"
import * as Effect from "effect/Effect"
import * as HttpClient from "effect/unstable/http/HttpClient"
import { describe, expect, it } from "vitest"

describe("ODataEffectPromise", () => {
  describe("Runtime creation", () => {
    it("exports createODataRuntime", async () => {
      const { Runtime } = await import("../src/index.js")
      expect(typeof Runtime.createODataRuntime).toBe("function")
    })

    it("exports toPromise", async () => {
      const { Runtime } = await import("../src/index.js")
      expect(typeof Runtime.toPromise).toBe("function")
    })
  })

  describe("Direct exports", () => {
    it("exports createODataRuntime directly", async () => {
      const { createODataRuntime } = await import("../src/index.js")
      expect(typeof createODataRuntime).toBe("function")
    })

    it("exports toPromise directly", async () => {
      const { toPromise } = await import("../src/index.js")
      expect(typeof toPromise).toBe("function")
    })
  })

  describe("toPromise functionality", () => {
    it("accepts supported requirements and rejects unprovided services", async () => {
      const { createODataRuntime, toPromise } = await import("../src/index.js")
      const runtime = createODataRuntime(
        { baseUrl: "https://example.com", servicePath: "/odata/" },
        NodeHttpClient.layerUndici
      )
      const converter = toPromise(runtime)
      const Database = Context.Service<{ readonly query: () => number }>("Database")

      // This callback is intentionally never executed: tsc verifies rejection of
      // a missing service, without triggering a runtime missing-service defect.
      const unsupported = () => {
        // @ts-expect-error The OData runtime does not provide Database.
        return Database.pipe(converter)
      }
      expect(unsupported).toBeTypeOf("function")

      try {
        expect(await Effect.succeed(42).pipe(converter)).toBe(42)
        expect(await Config.ODataClientConfig.pipe(Effect.map((config) => config.baseUrl), converter))
          .toBe("https://example.com")
        expect(await HttpClient.HttpClient.pipe(Effect.map((client) => typeof client.execute), converter))
          .toBe("function")
        expect(
          await Effect.gen(function*() {
            const config = yield* Config.ODataClientConfig
            yield* HttpClient.HttpClient
            return config.servicePath
          }).pipe(converter)
        ).toBe("/odata/")
        expect(
          await Database.pipe(
            Effect.map((database) => database.query()),
            Effect.provideService(Database, { query: () => 7 }),
            converter
          )
        ).toBe(7)
      } finally {
        await runtime.dispose()
      }
    })

    it("toPromise returns a function that returns a Promise", async () => {
      const { createODataRuntime, toPromise } = await import("../src/index.js")

      const runtime = createODataRuntime(
        { baseUrl: "https://example.com", servicePath: "/odata/" },
        NodeHttpClient.layerUndici
      )

      const converter = toPromise(runtime)
      expect(typeof converter).toBe("function")

      await runtime.dispose()
    })
  })

  describe("Unified runtime for V2 and V4", () => {
    it("creates a single runtime that works with both V2 and V4", async () => {
      const { createODataRuntime } = await import("../src/index.js")

      const runtime = createODataRuntime(
        { baseUrl: "https://example.com", servicePath: "/odata/" },
        NodeHttpClient.layerUndici
      )

      // Runtime should be created successfully
      expect(runtime.config.baseUrl).toBe("https://example.com")
      expect(runtime.config.servicePath).toBe("/odata/")

      await runtime.dispose()
    })
  })
})
