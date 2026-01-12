import { describe, expect, it } from "@effect/vitest"
import {
  getClassNameWithOverrides,
  getPropertyName,
  getPropertyNameWithOverrides,
  toCamelCase
} from "../../src/generator/NamingHelper.js"
import type { NamingOverrides } from "../../src/model/GeneratorConfig.js"

describe("NamingHelper", () => {
  describe("toCamelCase", () => {
    it("converts PascalCase to camelCase", () => {
      expect(toCamelCase("HelloWorld")).toBe("helloWorld")
    })

    it("handles single letter at start", () => {
      expect(toCamelCase("ID")).toBe("iD")
    })

    it("handles snake_case", () => {
      expect(toCamelCase("hello_world")).toBe("helloWorld")
    })
  })

  describe("getPropertyName", () => {
    it("converts OData property names to camelCase", () => {
      expect(getPropertyName("ID")).toBe("iD")
      expect(getPropertyName("ReleaseDate")).toBe("releaseDate")
      expect(getPropertyName("ProductName")).toBe("productName")
    })
  })

  describe("getPropertyNameWithOverrides", () => {
    const overrides: NamingOverrides = {
      properties: {
        ID: "id",
        SKU: "sku"
      },
      entities: {
        Product: {
          properties: {
            ReleaseDate: "releaseDate",
            ProductID: "productId"
          }
        }
      },
      complexTypes: {
        Address: {
          properties: {
            ZIPCode: "zipCode"
          }
        }
      }
    }

    it("uses global property override", () => {
      expect(getPropertyNameWithOverrides("ID", "AnyType", "entity", overrides)).toBe("id")
      expect(getPropertyNameWithOverrides("SKU", "AnyType", "complex", overrides)).toBe("sku")
    })

    it("uses entity-specific property override", () => {
      expect(getPropertyNameWithOverrides("ReleaseDate", "Product", "entity", overrides)).toBe("releaseDate")
      expect(getPropertyNameWithOverrides("ProductID", "Product", "entity", overrides)).toBe("productId")
    })

    it("uses complex type-specific property override", () => {
      expect(getPropertyNameWithOverrides("ZIPCode", "Address", "complex", overrides)).toBe("zipCode")
    })

    it("falls back to default camelCase when no override", () => {
      expect(getPropertyNameWithOverrides("Name", "Product", "entity", overrides)).toBe("name")
    })

    it("entity-specific override takes precedence over global", () => {
      const overridesWithConflict: NamingOverrides = {
        properties: {
          ID: "globalId"
        },
        entities: {
          Product: {
            properties: {
              ID: "entityId"
            }
          }
        }
      }
      expect(getPropertyNameWithOverrides("ID", "Product", "entity", overridesWithConflict)).toBe("entityId")
      expect(getPropertyNameWithOverrides("ID", "Other", "entity", overridesWithConflict)).toBe("globalId")
    })

    it("works without overrides", () => {
      expect(getPropertyNameWithOverrides("ID", "Product", "entity", undefined)).toBe("iD")
    })
  })

  describe("getClassNameWithOverrides", () => {
    const overrides: NamingOverrides = {
      entities: {
        PRODUCT: {
          name: "Product"
        }
      },
      complexTypes: {
        ADDRESS_INFO: {
          name: "AddressInfo"
        }
      }
    }

    it("uses entity type override", () => {
      expect(getClassNameWithOverrides("PRODUCT", "entity", overrides)).toBe("Product")
    })

    it("uses complex type override", () => {
      expect(getClassNameWithOverrides("ADDRESS_INFO", "complex", overrides)).toBe("AddressInfo")
    })

    it("falls back to default PascalCase when no override", () => {
      expect(getClassNameWithOverrides("SomeType", "entity", overrides)).toBe("SomeType")
    })

    it("works without overrides", () => {
      expect(getClassNameWithOverrides("Product", "entity", undefined)).toBe("Product")
    })
  })
})
