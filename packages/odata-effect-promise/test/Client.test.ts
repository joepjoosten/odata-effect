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
      const OData = await import("../src/OData.js")
      expect(typeof OData.get).toBe("function")
    })

    it("exports getCollection function", async () => {
      const OData = await import("../src/OData.js")
      expect(typeof OData.getCollection).toBe("function")
    })

    it("exports getCollectionPaged function", async () => {
      const OData = await import("../src/OData.js")
      expect(typeof OData.getCollectionPaged).toBe("function")
    })

    it("exports post function", async () => {
      const OData = await import("../src/OData.js")
      expect(typeof OData.post).toBe("function")
    })

    it("exports patch function", async () => {
      const OData = await import("../src/OData.js")
      expect(typeof OData.patch).toBe("function")
    })

    it("exports del function", async () => {
      const OData = await import("../src/OData.js")
      expect(typeof OData.del).toBe("function")
    })

    it("exports delete alias", async () => {
      const OData = await import("../src/OData.js")
      expect(OData.delete).toBe(OData.del)
    })
  })

  describe("V4 functions", () => {
    it("exports get function", async () => {
      const ODataV4 = await import("../src/ODataV4.js")
      expect(typeof ODataV4.get).toBe("function")
    })

    it("exports getCollection function", async () => {
      const ODataV4 = await import("../src/ODataV4.js")
      expect(typeof ODataV4.getCollection).toBe("function")
    })

    it("exports getCollectionPaged function", async () => {
      const ODataV4 = await import("../src/ODataV4.js")
      expect(typeof ODataV4.getCollectionPaged).toBe("function")
    })

    it("exports getValue function", async () => {
      const ODataV4 = await import("../src/ODataV4.js")
      expect(typeof ODataV4.getValue).toBe("function")
    })

    it("exports post function", async () => {
      const ODataV4 = await import("../src/ODataV4.js")
      expect(typeof ODataV4.post).toBe("function")
    })

    it("exports patch function", async () => {
      const ODataV4 = await import("../src/ODataV4.js")
      expect(typeof ODataV4.patch).toBe("function")
    })

    it("exports put function", async () => {
      const ODataV4 = await import("../src/ODataV4.js")
      expect(typeof ODataV4.put).toBe("function")
    })

    it("exports del function", async () => {
      const ODataV4 = await import("../src/ODataV4.js")
      expect(typeof ODataV4.del).toBe("function")
    })

    it("exports delete alias", async () => {
      const ODataV4 = await import("../src/ODataV4.js")
      expect(ODataV4.delete).toBe(ODataV4.del)
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
