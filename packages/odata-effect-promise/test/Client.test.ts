import { describe, expect, it } from "vitest"

describe("ODataEffectPromise", () => {
  describe("Runtime creation", () => {
    it("exports createODataRuntime", async () => {
      const { createODataRuntime } = await import("../src/index.js")
      expect(typeof createODataRuntime).toBe("function")
    })

    it("exports createODataV4Runtime", async () => {
      const { createODataV4Runtime } = await import("../src/index.js")
      expect(typeof createODataV4Runtime).toBe("function")
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
    it("exports OData namespace", async () => {
      const { OData } = await import("../src/index.js")
      expect(typeof OData.get).toBe("function")
      expect(typeof OData.getCollection).toBe("function")
      expect(typeof OData.post).toBe("function")
    })

    it("exports ODataV4 namespace", async () => {
      const { ODataV4 } = await import("../src/index.js")
      expect(typeof ODataV4.get).toBe("function")
      expect(typeof ODataV4.getCollection).toBe("function")
      expect(typeof ODataV4.post).toBe("function")
    })
  })
})
