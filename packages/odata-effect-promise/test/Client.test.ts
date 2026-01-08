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
  })

  describe("V2 functions", () => {
    it("exports get function", async () => {
      const V2 = await import("../src/v2.js")
      expect(typeof V2.get).toBe("function")
    })

    it("exports getCollection function", async () => {
      const V2 = await import("../src/v2.js")
      expect(typeof V2.getCollection).toBe("function")
    })

    it("exports getCollectionPaged function", async () => {
      const V2 = await import("../src/v2.js")
      expect(typeof V2.getCollectionPaged).toBe("function")
    })

    it("exports post function", async () => {
      const V2 = await import("../src/v2.js")
      expect(typeof V2.post).toBe("function")
    })

    it("exports patch function", async () => {
      const V2 = await import("../src/v2.js")
      expect(typeof V2.patch).toBe("function")
    })

    it("exports del function", async () => {
      const V2 = await import("../src/v2.js")
      expect(typeof V2.del).toBe("function")
    })

    it("exports delete alias", async () => {
      const V2 = await import("../src/v2.js")
      expect(V2.delete).toBe(V2.del)
    })
  })

  describe("V4 functions", () => {
    it("exports get function", async () => {
      const V4 = await import("../src/v4.js")
      expect(typeof V4.get).toBe("function")
    })

    it("exports getCollection function", async () => {
      const V4 = await import("../src/v4.js")
      expect(typeof V4.getCollection).toBe("function")
    })

    it("exports getCollectionPaged function", async () => {
      const V4 = await import("../src/v4.js")
      expect(typeof V4.getCollectionPaged).toBe("function")
    })

    it("exports getValue function", async () => {
      const V4 = await import("../src/v4.js")
      expect(typeof V4.getValue).toBe("function")
    })

    it("exports post function", async () => {
      const V4 = await import("../src/v4.js")
      expect(typeof V4.post).toBe("function")
    })

    it("exports patch function", async () => {
      const V4 = await import("../src/v4.js")
      expect(typeof V4.patch).toBe("function")
    })

    it("exports put function", async () => {
      const V4 = await import("../src/v4.js")
      expect(typeof V4.put).toBe("function")
    })

    it("exports del function", async () => {
      const V4 = await import("../src/v4.js")
      expect(typeof V4.del).toBe("function")
    })

    it("exports delete alias", async () => {
      const V4 = await import("../src/v4.js")
      expect(V4.delete).toBe(V4.del)
    })
  })

  describe("Namespace exports", () => {
    it("exports v2 namespace", async () => {
      const { v2 } = await import("../src/index.js")
      expect(typeof v2.get).toBe("function")
      expect(typeof v2.getCollection).toBe("function")
      expect(typeof v2.post).toBe("function")
    })

    it("exports v4 namespace", async () => {
      const { v4 } = await import("../src/index.js")
      expect(typeof v4.get).toBe("function")
      expect(typeof v4.getCollection).toBe("function")
      expect(typeof v4.post).toBe("function")
    })
  })
})
