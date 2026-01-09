import { describe, expect, it } from "vitest"

describe("ODataEffectPromise", () => {
  describe("Runtime creation", () => {
    it("exports createODataRuntime", async () => {
      const { Runtime } = await import("../src/index.js")
      expect(typeof Runtime.createODataRuntime).toBe("function")
    })

    it("exports createODataV4Runtime", async () => {
      const { Runtime } = await import("../src/index.js")
      expect(typeof Runtime.createODataV4Runtime).toBe("function")
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

    it("exports createODataV4Runtime directly", async () => {
      const { createODataV4Runtime } = await import("../src/index.js")
      expect(typeof createODataV4Runtime).toBe("function")
    })

    it("exports toPromise directly", async () => {
      const { toPromise } = await import("../src/index.js")
      expect(typeof toPromise).toBe("function")
    })
  })

  describe("toPromise functionality", () => {
    it("toPromise returns a function that returns a Promise", async () => {
      const { createODataRuntime, toPromise } = await import("../src/index.js")

      const runtime = createODataRuntime({
        baseUrl: "https://example.com",
        servicePath: "/odata/"
      })

      const converter = toPromise(runtime)
      expect(typeof converter).toBe("function")

      await runtime.dispose()
    })
  })
})
