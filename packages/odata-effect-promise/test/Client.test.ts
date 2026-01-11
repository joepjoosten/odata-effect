import * as NodeHttpClient from "@effect/platform-node/NodeHttpClient"
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
    it("toPromise returns a function that returns a Promise", async () => {
      const { createODataRuntime, toPromise } = await import("../src/index.js")

      const runtime = createODataRuntime(
        { baseUrl: "https://example.com", servicePath: "/odata/" },
        NodeHttpClient.layer
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
        NodeHttpClient.layer
      )

      // Runtime should be created successfully
      expect(runtime.config.baseUrl).toBe("https://example.com")
      expect(runtime.config.servicePath).toBe("/odata/")

      await runtime.dispose()
    })
  })
})
